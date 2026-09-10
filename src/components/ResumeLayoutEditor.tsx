import { useTranslation } from "react-i18next";
import { AlignJustify, RotateCcw, Space } from "lucide-react";
import type { ResumeStyleOptions } from "../types";
import { DEFAULT_RESUME_LAYOUT } from "../types";
import { RESUME_ACCENTS, RESUME_FONTS } from "../lib/resumeStyles";
import { SectionLabel } from "./FormField";

interface ResumeLayoutEditorProps {
  layout: ResumeStyleOptions;
  onChange: (layout: ResumeStyleOptions) => void;
}

export default function ResumeLayoutEditor({
  layout,
  onChange,
}: ResumeLayoutEditorProps) {
  const { t } = useTranslation();
  const textSize = Math.round(10 * layout.fontScale * 10) / 10;

  return (
    <div className="space-y-4 rounded-xl border border-(--ui-border) bg-(--ui-subtle) p-4">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>{t("editor:layout.label")}</SectionLabel>
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_RESUME_LAYOUT })}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-(--ui-muted) transition-colors hover:text-brand-600"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("workspace:style.reset")}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="flex items-center justify-between gap-2 text-xs font-medium text-(--ui-text-soft)">
            <span className="flex items-center gap-1.5">
              <Space className="h-3.5 w-3.5 text-(--ui-muted)" />
              {t("editor:layout.padding")}
            </span>
            <span className="tabular-nums text-(--ui-muted)">{layout.padding} pt</span>
          </span>
          <input
            type="range"
            min="18"
            max="52"
            step="2"
            value={layout.padding}
            onChange={(event) =>
              onChange({ ...layout, padding: Number(event.target.value) })
            }
            className="w-full accent-brand-600"
          />
        </label>

        <label className="space-y-2">
          <span className="flex items-center justify-between gap-2 text-xs font-medium text-(--ui-text-soft)">
            <span className="flex items-center gap-1.5">
              <AlignJustify className="h-3.5 w-3.5 text-(--ui-muted)" />
              {t("editor:layout.textSize")}
            </span>
            <span className="tabular-nums text-(--ui-muted)">{textSize} pt</span>
          </span>
          <input
            type="range"
            min="0.85"
            max="1.15"
            step="0.05"
            value={layout.fontScale}
            onChange={(event) =>
              onChange({ ...layout, fontScale: Number(event.target.value) })
            }
            className="w-full accent-brand-600"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-(--ui-text-soft)">
            {t("workspace:style.font")}
          </span>
          <select
            value={layout.fontId}
            onChange={(event) =>
              onChange({ ...layout, fontId: event.target.value as ResumeStyleOptions["fontId"] })
            }
            className="ui-control"
          >
            {Object.entries(RESUME_FONTS).map(([id, font]) => (
              <option key={id} value={id}>{font.label}</option>
            ))}
          </select>
        </label>

        <div className="space-y-1.5">
          <span className="text-xs font-medium text-(--ui-text-soft)">
            {t("workspace:style.accent")}
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(RESUME_ACCENTS).map(([id, accent]) => (
              <button
                key={id}
                type="button"
                title={accent.label}
                aria-label={accent.label}
                aria-pressed={layout.accentId === id}
                onClick={() =>
                  onChange({
                    ...layout,
                    accentId: id as ResumeStyleOptions["accentId"],
                  })
                }
                className="h-8 w-8 rounded-full border-2 border-(--ui-panel) shadow-sm ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                style={{
                  backgroundColor: accent.color,
                  boxShadow: layout.accentId === id
                    ? "0 0 0 2px var(--ui-focus)"
                    : undefined,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
