import { useState } from "react";
import { useTranslation } from "react-i18next";
import { clsx } from "clsx";

export default function AddSkillInput({
  onAdd,
}: {
  onAdd: (skill: string) => void;
}) {
  const { t } = useTranslation();
  const [newSkill, setNewSkill] = useState("");

  const addSkill = () => {
    const skill = newSkill.trim();
    if (!skill) return;
    onAdd(skill);
    setNewSkill("");
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={newSkill}
        onChange={(event) => setNewSkill(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addSkill();
          }
        }}
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
  );
}
