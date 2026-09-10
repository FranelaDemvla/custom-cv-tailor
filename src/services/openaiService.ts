import type {
  Mode,
  OutputLanguage,
  ProviderCredentials,
  ProviderSettings,
} from "../types";
import {
  generateResume,
  listProviderModels,
  type ModelInfo,
} from "./llmService";

export { LLMServiceError, normalizeBaseUrl } from "./llmService";
export type { ModelInfo } from "./llmService";

export function tailorCV(
  cvText: string,
  jobDescription: string,
  settings: ProviderSettings,
  credentials: ProviderCredentials,
  mode: Mode,
  outputLanguage: OutputLanguage,
  signal?: AbortSignal,
) {
  return generateResume(
    cvText,
    jobDescription,
    settings,
    credentials,
    mode,
    outputLanguage,
    signal,
  );
}

export function listModels(
  settings: ProviderSettings,
  credentials: ProviderCredentials,
  signal?: AbortSignal,
): Promise<ModelInfo[]> {
  return listProviderModels(settings, credentials, signal);
}
