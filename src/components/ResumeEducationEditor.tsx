import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { SectionLabel, Field } from "./FormField";
import type { ResumeData, EducationItem } from "../types";

function EducationItemEditor({
  item,
  onChange,
  onRemove,
  canRemove,
}: {
  item: EducationItem;
  onChange: (item: EducationItem) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="border border-surface-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-surface-400">{t("editor:education.school")}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-surface-400 hover:text-red-500 transition-colors"
            title={t("editor:education.removeTooltip")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field
          label={t("editor:education.institution")}
          value={item.institution || ""}
          onChange={(v) => onChange({ ...item, institution: v })}
          placeholder={t("editor:education.institutionPlaceholder")}
        />
        <Field
          label={t("editor:education.degree")}
          value={item.degree || ""}
          onChange={(v) => onChange({ ...item, degree: v })}
          placeholder={t("editor:education.degreePlaceholder")}
        />
      </div>
      <div className="w-1/2 pr-1">
        <Field
          label={t("editor:education.year")}
          value={item.year || ""}
          onChange={(v) => onChange({ ...item, year: v })}
          placeholder={t("editor:education.yearPlaceholder")}
        />
      </div>
    </div>
  );
}

export default function ResumeEducationEditor({
  data,
  onChange,
}: {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}) {
  const { t } = useTranslation();

  const addEducation = () => {
    onChange({
      ...data,
      education: [
        ...(data.education || []),
        { institution: "", degree: "", year: "" },
      ],
    });
  };

  const removeEducation = (index: number) => {
    const edu = [...(data.education || [])];
    edu.splice(index, 1);
    onChange({
      ...data,
      education: edu.length ? edu : [{ institution: "", degree: "", year: "" }],
    });
  };

  const updateItem = (index: number, item: EducationItem) => {
    const edu = [...(data.education || [])];
    edu[index] = item;
    onChange({ ...data, education: edu });
  };

  return (
    <div className="space-y-2">
      <SectionLabel>{t("editor:education.label")}</SectionLabel>
      <div className="space-y-3">
        {(data.education || []).map((edu, i) => (
          <EducationItemEditor
            key={i}
            item={edu}
            onChange={(item) => updateItem(i, item)}
            onRemove={() => removeEducation(i)}
            canRemove={(data.education || []).length > 1}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={addEducation}
        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {t("editor:education.addEducation")}
      </button>
    </div>
  );
}