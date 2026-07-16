import { useTranslation } from "react-i18next";
import { Plus, Trash2, X } from "lucide-react";
import { SectionLabel, Field } from "./FormField";
import type { ResumeData, ExperienceItem } from "../types";

function ExperienceItemEditor({
  item,
  onChange,
  onRemove,
  canRemove,
}: {
  item: ExperienceItem;
  onChange: (item: ExperienceItem) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { t } = useTranslation();

  const updateField = (field: keyof ExperienceItem, value: string) => {
    onChange({ ...item, [field]: value });
  };

  const updateBullet = (index: number, value: string) => {
    const bullets = [...(item.bullets || [])];
    bullets[index] = value;
    onChange({ ...item, bullets });
  };

  const addBullet = () => {
    onChange({ ...item, bullets: [...(item.bullets || []), ""] });
  };

  const removeBullet = (index: number) => {
    const bullets = (item.bullets || []).filter((_, i) => i !== index);
    onChange({ ...item, bullets: bullets.length ? bullets : [""] });
  };

  return (
    <div className="border border-surface-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-surface-400">{t("editor:experience.position")}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-surface-400 hover:text-red-500 transition-colors"
            title={t("editor:experience.removeTooltip")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field
          label={t("editor:experience.role")}
          value={item.role || ""}
          onChange={(v) => updateField("role", v)}
          placeholder={t("editor:experience.rolePlaceholder")}
        />
        <Field
          label={t("editor:experience.company")}
          value={item.company || ""}
          onChange={(v) => updateField("company", v)}
          placeholder={t("editor:experience.companyPlaceholder")}
        />
        <Field
          label={t("editor:experience.dates")}
          value={item.dates || ""}
          onChange={(v) => updateField("dates", v)}
          placeholder={t("editor:experience.datesPlaceholder")}
        />
      </div>
      <div className="space-y-1.5">
        <span className="text-[10px] text-surface-400 font-medium">
          {t("editor:experience.bulletPoints")}
        </span>
        {(item.bullets || []).map((bullet, j) => (
          <div key={j} className="flex items-center gap-1">
            <span className="text-surface-400 text-sm shrink-0">{'\u2022'}</span>
            <input
              type="text"
              value={bullet}
              onChange={(e) => updateBullet(j, e.target.value)}
              placeholder={t("editor:experience.bulletPlaceholder")}
              className="flex-1 rounded border border-surface-200 bg-surface-50 px-2 py-1 text-xs text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => removeBullet(j)}
              className="text-surface-400 hover:text-red-500 transition-colors shrink-0"
              title={t("editor:experience.removeBulletTooltip")}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addBullet}
          className="flex items-center gap-1 text-[10px] text-brand-600 hover:text-brand-700 transition-colors"
        >
          <Plus className="w-3 h-3" />
          {t("editor:experience.addBullet")}
        </button>
      </div>
    </div>
  );
}

export default function ResumeExperienceEditor({
  data,
  onChange,
}: {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}) {
  const { t } = useTranslation();

  const addExperience = () => {
    onChange({
      ...data,
      experience: [
        ...(data.experience || []),
        { role: "", company: "", dates: "", bullets: [""] },
      ],
    });
  };

  const removeExperience = (index: number) => {
    const exp = [...(data.experience || [])];
    exp.splice(index, 1);
    onChange({
      ...data,
      experience: exp.length
        ? exp
        : [{ role: "", company: "", dates: "", bullets: [""] }],
    });
  };

  const updateItem = (index: number, item: ExperienceItem) => {
    const exp = [...(data.experience || [])];
    exp[index] = item;
    onChange({ ...data, experience: exp });
  };

  return (
    <div className="space-y-2">
      <SectionLabel>{t("editor:experience.label")}</SectionLabel>
      <div className="space-y-4">
        {(data.experience || []).map((exp, i) => (
          <ExperienceItemEditor
            key={i}
            item={exp}
            onChange={(item) => updateItem(i, item)}
            onRemove={() => removeExperience(i)}
            canRemove={(data.experience || []).length > 1}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={addExperience}
        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {t("editor:experience.addExperience")}
      </button>
    </div>
  );
}