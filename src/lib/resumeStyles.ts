import type {
  OutputLanguage,
  ResumeAccentId,
  ResumeFontId,
  ResumeStyleOptions,
} from "../types";

export const RESUME_ACCENTS: Record<
  ResumeAccentId,
  { label: string; color: string; soft: string }
> = {
  charcoal: { label: "Charcoal", color: "#27272A", soft: "#F4F4F5" },
  navy: { label: "Navy", color: "#243B53", soft: "#EEF3F8" },
  teal: { label: "Dark teal", color: "#245B59", soft: "#EDF6F5" },
  burgundy: { label: "Burgundy", color: "#653747", soft: "#F7F0F2" },
};

export const RESUME_FONTS: Record<
  ResumeFontId,
  { label: string; regular: string; bold: string }
> = {
  helvetica: {
    label: "Helvetica",
    regular: "Helvetica",
    bold: "Helvetica-Bold",
  },
  times: { label: "Times-Roman", regular: "Times-Roman", bold: "Times-Bold" },
};

export const PDF_LABELS: Record<OutputLanguage, Record<string, string>> = {
  en: {
    summary: "Professional Summary",
    experience: "Experience",
    skills: "Skills",
    education: "Education",
  },
  es: {
    summary: "Resumen Profesional",
    experience: "Experiencia",
    skills: "Habilidades",
    education: "Formación",
  },
};

export function getResumeAccent(style: ResumeStyleOptions) {
  return RESUME_ACCENTS[style.accentId] || RESUME_ACCENTS.navy;
}

export function getResumeFont(style: ResumeStyleOptions) {
  return RESUME_FONTS[style.fontId] || RESUME_FONTS.helvetica;
}
