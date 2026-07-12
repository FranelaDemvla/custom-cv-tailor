import OpenAI from "openai";
import type { ResumeData, Model } from "../types";

const JSON_SCHEMA = {
  contact: { name: "", email: "", phone: "", location: "" },
  summary: "",
  experience: [{ role: "", company: "", dates: "", bullets: [""] }],
  skills: [""],
  education: [{ institution: "", degree: "", year: "" }],
};

const SYSTEM_PROMPT_BASE = `You are an expert CV/resume assistant. Your task is to process a candidate's CV into a clean, structured format.

CRITICAL RULES:
1. You must maintain 100% truthfulness. Never invent experience, skills, degrees, or achievements not present in the original CV.
2. Only reorder, rephrase, and emphasize existing content. Remove or de-emphasize irrelevant content.
3. Output ONLY valid JSON — no markdown, no code fences, no explanatory text.

JSON SCHEMA (return exactly this structure):
${JSON.stringify(JSON_SCHEMA, null, 2)}`;

function buildSystemPrompt(jobDescription: string): string {
  if (jobDescription) {
    return `${SYSTEM_PROMPT_BASE}

TAILORING: Rewrite the CV to match the job description below by highlighting relevant skills, experience, and keywords found in the JD. Inject relevant keywords and phrases from the JD naturally into the existing experience and summary.`;
  }
  return `${SYSTEM_PROMPT_BASE}

REFORMATTING: Clean up and restructure the CV into a professional format. Improve clarity, grammar, and flow without adding any fabricated information.`;
}

function validateSchema(data: unknown): asserts data is ResumeData {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response: not a JSON object");
  }

  const record = data as Record<string, unknown>;

  const required = ["contact", "summary", "experience", "skills", "education"];
  for (const key of required) {
    if (!(key in record)) {
      throw new Error(`Invalid response: missing required field "${key}"`);
    }
  }

  if (!record.contact || typeof record.contact !== "object") {
    throw new Error('Invalid response: "contact" must be an object');
  }

  if (typeof record.summary !== "string") {
    throw new Error('Invalid response: "summary" must be a string');
  }

  if (!Array.isArray(record.experience)) {
    throw new Error('Invalid response: "experience" must be an array');
  }

  if (!Array.isArray(record.skills)) {
    throw new Error('Invalid response: "skills" must be an array');
  }

  if (!Array.isArray(record.education)) {
    throw new Error('Invalid response: "education" must be an array');
  }
}

function cleanJSONResponse(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

const LOCAL_CONFIG = {
  get baseURL() {
    if (import.meta.env.PROD) {
      return import.meta.env.VITE_LLM_BASE_URL || "http://127.0.0.1:1234/v1";
    }
    return window.location.origin + "/api/llm";
  },
  get apiKey() {
    return import.meta.env.VITE_LLM_API_KEY || "lm-studio";
  },
  get model() {
    return import.meta.env.VITE_LLM_MODEL || "";
  },
};

const OPENAI_CONFIG = {
  baseURL: null as string | null,
  apiKey: import.meta.env.VITE_OPENAI_API_KEY as string | undefined,
  model: "gpt-4o",
};

interface LLMConfig {
  baseURL: string | null;
  apiKey: string;
  model: string;
  isLocal: boolean;
}

function getLLMConfig(modelPreference: Model): LLMConfig {
  if (modelPreference === "openai") {
    if (!OPENAI_CONFIG.apiKey) {
      throw new Error(
        "OpenAI API key not configured. Set VITE_OPENAI_API_KEY in your .env file.",
      );
    }
    return { ...OPENAI_CONFIG, apiKey: OPENAI_CONFIG.apiKey, isLocal: false };
  }

  return { ...LOCAL_CONFIG, isLocal: true };
}

interface ChatCompletionParams {
  model: string;
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  temperature: number;
  response_format?: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming["response_format"];
}

export async function tailorCV(
  cvText: string,
  jobDescription: string,
  modelPreference: Model = "local",
): Promise<ResumeData> {
  if (!cvText || !cvText.trim()) {
    throw new Error("CV text is required");
  }

  const { baseURL, apiKey, model, isLocal } = getLLMConfig(modelPreference);

  if (!apiKey) {
    throw new Error(
      "API key is required. Set VITE_OPENAI_API_KEY for OpenAI or configure VITE_LLM_BASE_URL for a local model.",
    );
  }

  const openai = new OpenAI({
    apiKey,
    baseURL: baseURL || undefined,
    dangerouslyAllowBrowser: true,
  });

  const hasJD = jobDescription && jobDescription.trim();

  const params: ChatCompletionParams = {
    model,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(hasJD ? jobDescription.trim() : ""),
      },
      {
        role: "user",
        content: hasJD
          ? `CURRENT CV:\n"""\n${cvText.trim()}\n"""\n\nJOB DESCRIPTION:\n"""\n${jobDescription.trim()}\n"""\n\nTailor the CV to this job description. Return ONLY valid JSON following the schema exactly.`
          : `CURRENT CV:\n"""\n${cvText.trim()}\n"""\n\nClean up and restructure this CV into the JSON format. Return ONLY valid JSON following the schema exactly.`,
      },
    ],
    temperature: 0.3,
  };

  if (!isLocal) {
    params.response_format = { type: "json_object" };
  }

  const response = await openai.chat.completions.create(params);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from LLM");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJSONResponse(content));
  } catch {
    throw new Error(
      "Failed to parse LLM response as JSON. The model may have returned an unexpected format.",
    );
  }

  validateSchema(parsed);

  return parsed;
}
