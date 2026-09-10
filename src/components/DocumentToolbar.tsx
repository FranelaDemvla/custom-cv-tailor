import {
  Check,
  Copy,
  Download,
  Loader2,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ProviderSettings } from "../types";
import type { SaveState } from "../hooks/useDocuments";

interface DocumentToolbarProps {
  title: string;
  provider: ProviderSettings;
  saveState: SaveState;
  isGenerating: boolean;
  onTitleChange: (title: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onCancelGeneration: () => void;
}

export default function DocumentToolbar({
  title,
  provider,
  saveState,
  isGenerating,
  onTitleChange,
  onDuplicate,
  onDelete,
  onDownload,
  onCancelGeneration,
}: DocumentToolbarProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-(--ui-border) bg-(--ui-panel) px-4 py-3 sm:px-6">
      <input
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        className="min-w-45 flex-1 bg-transparent text-base font-semibold tracking-tight text-(--ui-text) outline-none placeholder:text-(--ui-muted)"
        aria-label={t("workspace:document.title")}
        placeholder={t("workspace:document.titlePlaceholder")}
      />
      <div className="order-3 flex w-full items-center gap-2 text-xs text-(--ui-muted) sm:order-none sm:w-auto">
        {saveState === "saving" ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" />{t("workspace:save.saving")}</>
        ) : saveState === "error" || saveState === "conflict" ? (
          <><span className="h-2 w-2 rounded-full bg-red-500" />{t("workspace:save.failed")}</>
        ) : (
          <><Check className="h-3.5 w-3.5 text-emerald-600" />{t("workspace:save.saved")}</>
        )}
        <span className="hidden h-3.5 w-px bg-(--ui-border) sm:block" />
        <span>{provider.provider === "openai" ? "OpenAI" : t("workspace:settings.local")} · {provider.model || t("workspace:settings.noModel")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={onDownload} className="ui-primary-button">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{t("workspace:actions.download")}</span>
        </button>
        {isGenerating && (
          <button type="button" onClick={onCancelGeneration} className="ui-secondary-button text-red-600 hover:border-red-200 hover:text-red-700">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">{t("workspace:actions.cancelGeneration")}</span>
          </button>
        )}
        <button type="button" onClick={onDuplicate} className="ui-icon-button" aria-label={t("workspace:actions.duplicate")} title={t("workspace:actions.duplicate")}>
          <Copy className="h-4 w-4" />
        </button>
        <button type="button" onClick={onDelete} className="ui-icon-button text-red-500 hover:bg-red-50 hover:text-red-700" aria-label={t("workspace:actions.delete")} title={t("workspace:actions.delete")}>
          <Trash2 className="h-4 w-4" />
        </button>
        <button type="button" className="ui-icon-button hidden sm:inline-flex" aria-label={t("workspace:actions.more")} title={t("workspace:actions.more")}>
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
