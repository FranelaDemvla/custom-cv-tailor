import { SectionLabel, Field } from "./FormField";
import type { ResumeData } from "../types";

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
    </div>
  );
}