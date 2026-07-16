import { useTranslation } from "react-i18next";
import { SectionLabel } from "./FormField";
import type { ResumeData } from "../types";

export default function ResumeSummaryEditor({
  data,
  onChange,
}: {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <SectionLabel>{t("editor:summary.label")}</SectionLabel>
      <textarea
        value={data.summary || ""}
        onChange={(e) => onChange({ ...data, summary: e.target.value })}
        rows={4}
        className="w-full rounded-lg border border-surface-200 bg-surface-50 p-2.5 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
        placeholder={t("editor:summary.placeholder")}
      />
    </div>
  );
}