import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { SectionLabel } from "./FormField";
import type { ResumeData } from "../types";

export default function ResumeSkillsEditor({
  data,
  onChange,
}: {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}) {
  const { t } = useTranslation();
  const [newSkill, setNewSkill] = useState("");

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    onChange({ ...data, skills: [...(data.skills || []), trimmed] });
    setNewSkill("");
  };

  const removeSkill = (index: number) => {
    const skills = (data.skills || []).filter((_, i) => i !== index);
    onChange({ ...data, skills });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="space-y-2">
      <SectionLabel>{t("editor:skills.label")}</SectionLabel>
      <div className="flex flex-wrap gap-1.5">
        {(data.skills || []).map((skill, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs px-2 py-1 rounded-md border border-brand-100"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(i)}
              className="text-brand-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("editor:skills.placeholder")}
          className="flex-1 rounded-lg border border-surface-200 bg-surface-50 px-2.5 py-1.5 text-xs text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={addSkill}
          disabled={!newSkill.trim()}
          className={clsx(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            newSkill.trim()
              ? "bg-brand-600 text-white hover:bg-brand-700"
              : "bg-surface-200 text-surface-400 cursor-not-allowed",
          )}
        >
          {t("editor:skills.add")}
        </button>
      </div>
    </div>
  );
}