import { useTranslation } from "react-i18next";
import { AlignJustify, Space } from "lucide-react";
import type { ResumeLayoutOptions } from "../types";
import { SectionLabel } from "./FormField";

interface ResumeLayoutEditorProps {
  layout: ResumeLayoutOptions;
  onChange: (layout: ResumeLayoutOptions) => void;
}

export default function ResumeLayoutEditor({
  layout,
  onChange,
}: ResumeLayoutEditorProps) {
  const { t } = useTranslation();
  const textSize = Math.round(10 * layout.fontScale * 10) / 10;

  return (
    <div className="space-y-3 rounded-lg border border-surface-200 bg-surface-50 p-3">
      <SectionLabel>{t("editor:layout.label")}</SectionLabel>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="flex items-center justify-between gap-2 text-xs font-medium text-surface-600">
            <span className="flex items-center gap-1.5">
              <Space className="h-3.5 w-3.5 text-surface-400" />
              {t("editor:layout.padding")}
            </span>
            <span className="tabular-nums text-surface-500">{layout.padding} pt</span>
          </span>
          <input
            type="range"
            min="16"
            max="56"
            step="2"
            value={layout.padding}
            onChange={(event) =>
              onChange({ ...layout, padding: Number(event.target.value) })
            }
            className="w-full accent-brand-600"
          />
        </label>

        <label className="space-y-2">
          <span className="flex items-center justify-between gap-2 text-xs font-medium text-surface-600">
            <span className="flex items-center gap-1.5">
              <AlignJustify className="h-3.5 w-3.5 text-surface-400" />
              {t("editor:layout.textSize")}
            </span>
            <span className="tabular-nums text-surface-500">{textSize} pt</span>
          </span>
          <input
            type="range"
            min="0.8"
            max="1.2"
            step="0.05"
            value={layout.fontScale}
            onChange={(event) =>
              onChange({ ...layout, fontScale: Number(event.target.value) })
            }
            className="w-full accent-brand-600"
          />
        </label>
      </div>
    </div>
  );
}
