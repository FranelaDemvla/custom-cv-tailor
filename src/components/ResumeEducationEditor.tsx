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
  return (
    <div className="border border-surface-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-surface-400">School</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-surface-400 hover:text-red-500 transition-colors"
            title="Remove education"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field
          label="Institution"
          value={item.institution || ""}
          onChange={(v) => onChange({ ...item, institution: v })}
          placeholder="University name"
        />
        <Field
          label="Degree"
          value={item.degree || ""}
          onChange={(v) => onChange({ ...item, degree: v })}
          placeholder="B.S. Computer Science"
        />
      </div>
      <div className="w-1/2 pr-1">
        <Field
          label="Year"
          value={item.year || ""}
          onChange={(v) => onChange({ ...item, year: v })}
          placeholder="2020"
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
      <SectionLabel>Education</SectionLabel>
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
        Add Education
      </button>
    </div>
  );
}