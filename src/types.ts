export interface Contact {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
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

export type Status = 'idle' | 'generating' | 'success' | 'error';
export type Model = 'local' | 'openai';