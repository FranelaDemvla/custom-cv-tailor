import type {
  Contact,
  EducationItem,
  ExperienceItem,
  ProfileLink,
  ResumeData,
} from "../types";

export class ResumeSchemaError extends Error {
  constructor(public readonly path: string) {
    super("Invalid resume data at " + path);
    this.name = "ResumeSchemaError";
  }
}

function objectValue(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ResumeSchemaError(path);
  }
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, path: string, optional = false): string {
  if (value === undefined || value === null) {
    if (optional) return "";
    throw new ResumeSchemaError(path);
  }
  if (typeof value !== "string") throw new ResumeSchemaError(path);
  return value;
}

function arrayValue(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new ResumeSchemaError(path);
  return value;
}

function parseProfile(value: unknown, path: string): ProfileLink {
  const record = objectValue(value, path);
  return {
    platform: stringValue(record.platform, path + ".platform", true),
    url: stringValue(record.url, path + ".url", true),
  };
}

function parseContact(value: unknown): Contact {
  const record = objectValue(value, "contact");
  const profiles =
    record.profiles === undefined
      ? []
      : arrayValue(record.profiles, "contact.profiles").map((item, index) =>
          parseProfile(item, "contact.profiles[" + index + "]"),
        );
  return {
    name: stringValue(record.name, "contact.name", true),
    email: stringValue(record.email, "contact.email", true),
    phone: stringValue(record.phone, "contact.phone", true),
    location: stringValue(record.location, "contact.location", true),
    profiles,
  };
}

function parseExperience(value: unknown): ExperienceItem[] {
  return arrayValue(value, "experience").map((item, index) => {
    const path = "experience[" + index + "]";
    const record = objectValue(item, path);
    const bullets =
      record.bullets === undefined
        ? []
        : arrayValue(record.bullets, path + ".bullets").map((bullet, bulletIndex) =>
            stringValue(bullet, path + ".bullets[" + bulletIndex + "]"),
          );
    return {
      role: stringValue(record.role, path + ".role", true),
      company: stringValue(record.company, path + ".company", true),
      dates: stringValue(record.dates, path + ".dates", true),
      bullets,
    };
  });
}

function parseEducation(value: unknown): EducationItem[] {
  return arrayValue(value, "education").map((item, index) => {
    const path = "education[" + index + "]";
    const record = objectValue(item, path);
    return {
      institution: stringValue(record.institution, path + ".institution", true),
      degree: stringValue(record.degree, path + ".degree", true),
      year: stringValue(record.year, path + ".year", true),
    };
  });
}

export function normalizeResumeData(value: unknown): ResumeData {
  const record = objectValue(value, "resume");
  if (!("contact" in record)) throw new ResumeSchemaError("contact");
  if (!("summary" in record)) throw new ResumeSchemaError("summary");
  if (!("experience" in record)) throw new ResumeSchemaError("experience");
  if (!("skills" in record)) throw new ResumeSchemaError("skills");
  if (!("education" in record)) throw new ResumeSchemaError("education");

  return {
    contact: parseContact(record.contact),
    summary: stringValue(record.summary, "summary"),
    experience: parseExperience(record.experience),
    skills: arrayValue(record.skills, "skills").map((skill, index) =>
      stringValue(skill, "skills[" + index + "]"),
    ),
    education: parseEducation(record.education),
  };
}
