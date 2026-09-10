import type {
  LLMTransport,
  Mode,
  OutputLanguage,
  ProviderCredentials,
  ProviderSettings,
  ResumeData,
} from "../types";
import { normalizeResumeData } from "../lib/resumeSchema";

const OPENAI_BASE_URL = "https://api.openai.com/v1";

const JSON_SCHEMA = {
  contact: { name: "", email: "", phone: "", location: "", profiles: [{ platform: "", url: "" }] },
  summary: "",
  experience: [{ role: "", company: "", dates: "", bullets: [""] }],
  skills: [""],
  education: [{ institution: "", degree: "", year: "" }],
};

export type LLMErrorCode =
  | "missing-config"
  | "invalid-url"
  | "auth"
  | "connection"
  | "model"
  | "empty-response"
  | "invalid-json"
  | "invalid-schema"
  | "cancelled";

export class LLMServiceError extends Error {
  constructor(
    public readonly code: LLMErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LLMServiceError";
  }
}

export interface ModelInfo {
  id: string;
  ownedBy?: string;
}

export function normalizeBaseUrl(value: string, provider: ProviderSettings["provider"]): string {
  const raw = value.trim() || (provider === "openai" ? OPENAI_BASE_URL : "");
  if (!raw) throw new LLMServiceError("missing-config", "Enter a local model base URL.");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new LLMServiceError("invalid-url", "Enter a complete HTTP or HTTPS URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new LLMServiceError("invalid-url", "The model endpoint must use HTTP or HTTPS.");
  }
  if (url.username || url.password) {
    throw new LLMServiceError("invalid-url", "Usernames and passwords are not allowed in endpoint URLs.");
  }
  return url.toString().replace(/\/+$/, "");
}

function endpoint(settings: ProviderSettings, path: string) {
  return normalizeBaseUrl(settings.baseUrl, settings.provider) + "/" + path;
}

function credentialsFor(settings: ProviderSettings, credentials: ProviderCredentials) {
  return settings.provider === "openai" ? credentials.openai.trim() : credentials.local.trim();
}

function requestHeaders(settings: ProviderSettings, credentials: ProviderCredentials) {
  const key = credentialsFor(settings, credentials);
  return {
    "Content-Type": "application/json",
    ...(key ? { Authorization: "Bearer " + key } : {}),
  };
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function errorFromResponse(response: Response, body: unknown): LLMServiceError {
  const message =
    body && typeof body === "object"
      ? String(
          (body as Record<string, unknown>).error ||
            (body as Record<string, unknown>).message ||
            "",
        )
      : typeof body === "string"
        ? body
        : "";
  if (response.status === 401 || response.status === 403) {
    return new LLMServiceError(
      "auth",
      message || "The provider rejected these credentials.",
    );
  }
  if (response.status === 404) {
    return new LLMServiceError(
      "model",
      message || "The endpoint or model was not found.",
    );
  }
  return new LLMServiceError(
    "connection",
    message || "The provider returned HTTP " + response.status + ".",
  );
}

export async function listProviderModels(
  settings: ProviderSettings,
  credentials: ProviderCredentials,
  signal?: AbortSignal,
): Promise<ModelInfo[]> {
  try {
    const response = await fetch(endpoint(settings, "models"), {
      method: "GET",
      headers: requestHeaders(settings, credentials),
      signal,
    });
    const body = await readResponse(response);
    if (!response.ok) throw errorFromResponse(response, body);
    const data: unknown[] =
      body &&
      typeof body === "object" &&
      Array.isArray((body as Record<string, unknown>).data)
        ? (body as Record<string, unknown>).data as unknown[]
        : [];
    return data
      .flatMap((item) => {
        if (
          !item ||
          typeof item !== "object" ||
          typeof (item as Record<string, unknown>).id !== "string"
        ) {
          return [];
        }
        const record = item as Record<string, unknown>;
        const id = record.id as string;
        return [
          {
            id,
            ownedBy:
              typeof record.owned_by === "string" ? record.owned_by : undefined,
          },
        ];
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new LLMServiceError("cancelled", "The model request was cancelled.");
    }
    if (error instanceof LLMServiceError) throw error;
    throw new LLMServiceError(
      "connection",
      error instanceof Error
        ? error.message
        : "Could not reach the model endpoint.",
    );
  }
}

function languageName(language: OutputLanguage) {
  return language === "es" ? "Spanish" : "English";
}

function buildSystemPrompt(
  jobDescription: string,
  mode: Mode,
  outputLanguage: OutputLanguage,
) {
  const tailoring = mode === "tailor" && jobDescription.trim();
  return [
    "You are an expert CV assistant. Return one structured resume in valid JSON.",
    "Keep every claim truthful. Do not invent experience, skills, education, dates, metrics, or employers.",
    "You may reorder, shorten, or rephrase existing facts. Keep all useful source content.",
    "Write every value in " + languageName(outputLanguage) + ". Keep object keys in English.",
    "Use exactly this JSON structure: " + JSON.stringify(JSON_SCHEMA),
    tailoring
      ? "Tailor the resume to the job description by emphasizing matching facts and keywords."
      : "Format and clarify the CV without changing its meaning.",
    "Return JSON only. Do not wrap it in markdown.",
  ].join("\n");
}

function cleanJSONResponse(text: string) {
  const cleaned = text
    .replace(/^\x60\x60\x60json\s*/i, "")
    .replace(/^\x60\x60\x60\s*/i, "")
    .replace(/\s*\x60\x60\x60$/i, "")
    .trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  return firstBrace >= 0 && lastBrace > firstBrace
    ? cleaned.slice(firstBrace, lastBrace + 1)
    : cleaned;
}

function textFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .flatMap((part) => {
      if (!part || typeof part !== "object") return [];
      const record = part as Record<string, unknown>;
      return typeof record.text === "string" ? [record.text] : [];
    })
    .join("");
}

function responseText(body: unknown, transport: LLMTransport): string {
  if (!body || typeof body !== "object") return "";
  const record = body as Record<string, unknown>;
  if (transport === "responses") {
    if (typeof record.output_text === "string") return record.output_text;
    const output = Array.isArray(record.output) ? record.output : [];
    return output
      .flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        return [textFromContent((item as Record<string, unknown>).content)];
      })
      .join("");
  }
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const message =
    choices[0] && typeof choices[0] === "object"
      ? (choices[0] as Record<string, unknown>).message
      : null;
  return message && typeof message === "object"
    ? textFromContent((message as Record<string, unknown>).content)
    : "";
}

export async function generateResume(
  cvText: string,
  jobDescription: string,
  settings: ProviderSettings,
  credentials: ProviderCredentials,
  mode: Mode,
  outputLanguage: OutputLanguage,
  signal?: AbortSignal,
): Promise<ResumeData> {
  if (!cvText.trim()) {
    throw new LLMServiceError("missing-config", "CV text is required.");
  }
  if (!settings.model.trim()) {
    throw new LLMServiceError("missing-config", "Choose or enter a model ID.");
  }

  const transport: LLMTransport =
    settings.provider === "openai" ? settings.transport : "chat";
  const system = buildSystemPrompt(jobDescription, mode, outputLanguage);
  const user =
    jobDescription.trim() && mode === "tailor"
      ? "CURRENT CV:\n\"\"\"\n" +
        cvText.trim() +
        "\n\"\"\"\n\nJOB DESCRIPTION:\n\"\"\"\n" +
        jobDescription.trim() +
        "\n\"\"\""
      : "CURRENT CV:\n\"\"\"\n" + cvText.trim() + "\n\"\"\"";
  const payload =
    transport === "responses"
      ? {
          model: settings.model.trim(),
          input: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          text: { format: { type: "json_object" } },
          store: false,
        }
      : {
          model: settings.model.trim(),
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.3,
          ...(settings.provider === "openai"
            ? { response_format: { type: "json_object" } }
            : {}),
        };

  try {
    const response = await fetch(
      endpoint(
        settings,
        transport === "responses" ? "responses" : "chat/completions",
      ),
      {
        method: "POST",
        headers: requestHeaders(settings, credentials),
        body: JSON.stringify(payload),
        signal,
      },
    );
    const body = await readResponse(response);
    if (!response.ok) throw errorFromResponse(response, body);
    const content = responseText(body, transport);
    if (!content) {
      throw new LLMServiceError(
        "empty-response",
        "The model returned no resume content.",
      );
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanJSONResponse(content));
    } catch {
      throw new LLMServiceError(
        "invalid-json",
        "The model returned text that was not valid JSON.",
      );
    }
    try {
      return normalizeResumeData(parsed);
    } catch {
      throw new LLMServiceError(
        "invalid-schema",
        "The model returned an incomplete resume structure.",
      );
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new LLMServiceError("cancelled", "Generation cancelled.");
    }
    if (error instanceof LLMServiceError) throw error;
    throw new LLMServiceError(
      "connection",
      error instanceof Error
        ? error.message
        : "Could not reach the model endpoint.",
    );
  }
}
