export interface ProfileLink {
  platform?: string;
  url?: string;
}

export interface Contact {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  profiles?: ProfileLink[];
}

export interface ExperienceItem {
  role?: string;
  company?: string;
  dates?: string;
  bullets?: string[];
}

export interface EducationItem {
  institution?: string;
  degree?: string;
  year?: string;
}

export interface ResumeData {
  contact: Contact;
  summary: string;
  experience: ExperienceItem[];
  skills: string[];
  education: EducationItem[];
}

export type ResumeFontId = "helvetica" | "times";
export type ResumeAccentId = "charcoal" | "navy" | "teal" | "burgundy";

export interface ResumeStyleOptions {
  padding: number;
  fontScale: number;
  fontId: ResumeFontId;
  accentId: ResumeAccentId;
}

export type ResumeLayoutOptions = ResumeStyleOptions;

export const DEFAULT_RESUME_LAYOUT: ResumeLayoutOptions = {
  padding: 28,
  fontScale: 1,
  fontId: "helvetica",
  accentId: "navy",
};

export type Status = "idle" | "generating" | "success" | "error";
export type Model = "local" | "openai";
export type Mode = "tailor" | "format";
export type ProviderKind = Model;
export type LLMTransport = "chat" | "responses";
export type OutputLanguage = "en" | "es";
export type ThemePreference = "light" | "dark" | "system";

export interface ProviderSettings {
  provider: ProviderKind;
  model: string;
  baseUrl: string;
  transport: LLMTransport;
}

export interface ProviderCredentials {
  openai: string;
  local: string;
}

export interface DocumentSource {
  cvText: string;
  jdText: string;
  cvFileName?: string;
}

export type DocumentContentStatus = "draft" | "generated" | "interrupted";

export interface CVDocument {
  id: string;
  schemaVersion: 1;
  title: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  source: DocumentSource;
  mode: Mode;
  outputLanguage: OutputLanguage;
  data: ResumeData;
  style: ResumeStyleOptions;
  provider: ProviderSettings;
  contentStatus: DocumentContentStatus;
  lastExportedAt?: string;
}

export interface AppPreferences {
  schemaVersion: 1;
  defaultProvider: ProviderSettings;
  theme: ThemePreference;
  language: OutputLanguage;
  lastActiveId: string | null;
}

export interface BackupFile {
  format: "custom-cv-backup";
  version: 1;
  exportedAt: string;
  documents: CVDocument[];
}

export function createEmptyResumeData(): ResumeData {
  return {
    contact: { profiles: [] },
    summary: "",
    experience: [{ role: "", company: "", dates: "", bullets: [""] }],
    skills: [],
    education: [{ institution: "", degree: "", year: "" }],
  };
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "cv-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
}

export function createEmptyDocument(provider: ProviderSettings): CVDocument {
  const now = new Date().toISOString();
  return {
    id: createId(),
    schemaVersion: 1,
    title: "",
    createdAt: now,
    updatedAt: now,
    revision: 0,
    source: { cvText: "", jdText: "" },
    mode: "tailor",
    outputLanguage: "en",
    data: createEmptyResumeData(),
    style: { ...DEFAULT_RESUME_LAYOUT },
    provider: { ...provider },
    contentStatus: "draft",
  };
}
