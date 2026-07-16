import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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
      <SectionLabel>{t("editor:contact.label")}</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <Field
          label={t("editor:contact.name")}
          value={data.contact?.name || ""}
          onChange={(v) => update("name", v)}
          placeholder={t("editor:contact.namePlaceholder")}
        />
        <Field
          label={t("editor:contact.email")}
          value={data.contact?.email || ""}
          onChange={(v) => update("email", v)}
          placeholder={t("editor:contact.emailPlaceholder")}
        />
        <Field
          label={t("editor:contact.phone")}
          value={data.contact?.phone || ""}
          onChange={(v) => update("phone", v)}
          placeholder={t("editor:contact.phonePlaceholder")}
        />
        <Field
          label={t("editor:contact.location")}
          value={data.contact?.location || ""}
          onChange={(v) => update("location", v)}
          placeholder={t("editor:contact.locationPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <SectionLabel>{t("editor:contact.socialProfiles")}</SectionLabel>
        {profiles.map((p, i) => (
          <div key={i} className="grid grid-cols-12 gap-2">
            <div className="col-span-5">
              <Field
                label={i === 0 ? t("editor:contact.platform") : undefined}
                value={p.platform || ""}
                onChange={(v) => updateProfile(i, "platform", v)}
                placeholder={t("editor:contact.platformPlaceholder")}
              />
            </div>
            <div className="col-span-6">
              <Field
                label={i === 0 ? t("editor:contact.url") : undefined}
                value={p.url || ""}
                onChange={(v) => updateProfile(i, "url", v)}
                placeholder={t("editor:contact.urlPlaceholder")}
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
          {t("editor:contact.addProfile")}
        </button>
      </div>
    </div>
  );
}