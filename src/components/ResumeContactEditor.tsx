import { SectionLabel, Field } from "./FormField";
import type { ResumeData, ProfileLink } from "../types";
import { Plus, X } from "lucide-react";

export default function ResumeContactEditor({
  data,
  onChange,
}: {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}) {
  const update = (field: keyof ResumeData["contact"], value: string) => {
    onChange({ ...data, contact: { ...data.contact, [field]: value } });
  };

  const profiles = data.contact?.profiles || [];

  const updateProfile = (index: number, field: keyof ProfileLink, value: string) => {
    const updated = profiles.map((p, i) =>
      i === index ? { ...p, [field]: value } : p,
    );
    onChange({ ...data, contact: { ...data.contact, profiles: updated } });
  };

  const addProfile = () => {
    onChange({
      ...data,
      contact: {
        ...data.contact,
        profiles: [...profiles, { platform: "", url: "" }],
      },
    });
  };

  const removeProfile = (index: number) => {
    const updated = profiles.filter((_, i) => i !== index);
    onChange({ ...data, contact: { ...data.contact, profiles: updated } });
  };

  return (
    <div className="space-y-2">
      <SectionLabel>Contact</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <Field
          label="Name"
          value={data.contact?.name || ""}
          onChange={(v) => update("name", v)}
          placeholder="Full name"
        />
        <Field
          label="Email"
          value={data.contact?.email || ""}
          onChange={(v) => update("email", v)}
          placeholder="email@example.com"
        />
        <Field
          label="Phone"
          value={data.contact?.phone || ""}
          onChange={(v) => update("phone", v)}
          placeholder="+1 (555) 000-0000"
        />
        <Field
          label="Location"
          value={data.contact?.location || ""}
          onChange={(v) => update("location", v)}
          placeholder="City, State"
        />
      </div>

      <div className="space-y-2">
        <SectionLabel>Social Profiles</SectionLabel>
        {profiles.map((p, i) => (
          <div key={i} className="grid grid-cols-12 gap-2">
            <div className="col-span-5">
              <Field
                label={i === 0 ? "Platform" : undefined}
                value={p.platform || ""}
                onChange={(v) => updateProfile(i, "platform", v)}
                placeholder="LinkedIn"
              />
            </div>
            <div className="col-span-6">
              <Field
                label={i === 0 ? "URL" : undefined}
                value={p.url || ""}
                onChange={(v) => updateProfile(i, "url", v)}
                placeholder="https://..."
              />
            </div>
            <div className="col-span-1 flex items-end pb-2">
              <button
                type="button"
                onClick={() => removeProfile(i)}
                className="p-1 text-surface-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addProfile}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add profile
        </button>
      </div>
    </div>
  );
}