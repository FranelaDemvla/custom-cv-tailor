import { useState, useRef, useCallback } from "react";
import type { ChangeEvent, DragEvent, FormEvent, KeyboardEvent } from "react";
import {
  AlertCircle,
  FileText,
  Loader2,
  Settings2,
  Sparkles,
  Upload,
} from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { parseCVFile } from "../services/parserService";
import type { Mode, OutputLanguage } from "../types";

interface InputPanelProps {
  cvText: string;
  jdText: string;
  cvFileName?: string;
  outputLanguage: OutputLanguage;
  onCvChange: (text: string) => void;
  onJdChange: (text: string) => void;
  onCvFileNameChange: (name: string | undefined) => void;
  onOutputLanguageChange: (language: OutputLanguage) => void;
  onGenerate: () => void;
  canGenerate: boolean;
  isGenerating: boolean;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  providerLabel: string;
  providerConfigured: boolean;
  onOpenSettings: () => void;
}

export default function InputPanel({
  cvText,
  jdText,
  cvFileName,
  outputLanguage,
  onCvChange,
  onJdChange,
  onCvFileNameChange,
  onOutputLanguageChange,
  onGenerate,
  canGenerate,
  isGenerating,
  mode,
  onModeChange,
  providerLabel,
  providerConfigured,
  onOpenSettings,
}: InputPanelProps) {
  const { t } = useTranslation();
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsParsing(true);
      setParseError(null);
      try {
        const text = await parseCVFile(file);
        onCvChange(text);
        onCvFileNameChange(file.name);
      } catch (error) {
        setParseError(
          error instanceof Error
            ? error.message
            : t("common:errors.fileParseFailed"),
        );
      } finally {
        setIsParsing(false);
      }
    },
    [onCvChange, onCvFileNameChange, t],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleDropKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canGenerate) onGenerate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{t("workspace:source.eyebrow")}</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-(--ui-text)">
            {t("common:inputPanel.heading")}
          </h2>
        </div>
        <label className="space-y-1.5">
          <span className="field-label">{t("workspace:source.outputLanguage")}</span>
          <select
            value={outputLanguage}
            onChange={(event) => onOutputLanguageChange(event.target.value as OutputLanguage)}
            className="ui-control min-w-32"
          >
            <option value="en">{t("common:language.en")}</option>
            <option value="es">{t("common:language.es")}</option>
          </select>
        </label>
      </div>

      <div className="ui-inset space-y-2">
        <label className="field-label flex items-center gap-1.5">
          <Settings2 className="h-3.5 w-3.5" />
          {t("common:mode.label")}
        </label>
        <div className="flex rounded-lg border border-(--ui-border) bg-(--ui-panel) p-0.5">
          {(["tailor", "format"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onModeChange(item)}
              className={clsx(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition",
                mode === item
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-(--ui-muted) hover:text-(--ui-text)",
              )}
            >
              {item === "tailor" ? t("common:mode.tailor") : t("common:mode.format")}
            </button>
          ))}
        </div>
        <p className="text-xs leading-5 text-(--ui-muted)">
          {mode === "tailor"
            ? t("common:mode.tailorDescription")
            : t("common:mode.formatDescription")}
        </p>
      </div>

      <div className="space-y-2">
        <label className="field-label">{t("common:inputPanel.uploadLabel")}</label>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={handleDropKeyDown}
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={clsx(
            "cursor-pointer rounded-xl border border-dashed p-5 text-center transition",
            isDragging
              ? "border-(--ui-focus) bg-(--ui-subtle)"
              : "border-(--ui-border-strong) hover:border-brand-400 hover:bg-(--ui-subtle)",
          )}
        >
          {isParsing ? (
            <div className="flex flex-col items-center gap-2 text-(--ui-muted)">
              <Loader2 className="h-7 w-7 animate-spin" />
              <span className="text-sm">{t("common:inputPanel.parsingFile")}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-7 w-7 text-(--ui-focus)" />
              <span className="text-sm text-(--ui-text-soft)">
                {t("common:inputPanel.dropHere")}
                <span className="font-semibold text-(--ui-focus)">{t("common:inputPanel.browse")}</span>
              </span>
              <span className="text-xs text-(--ui-muted)">
                {cvFileName || t("common:inputPanel.supportsFormats")}
              </span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.pdf"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
            className="hidden"
          />
        </div>
        {parseError && (
          <div className="flex items-center gap-2 text-sm text-red-600" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {parseError}
          </div>
        )}
      </div>

      <label className="block space-y-2">
        <span className="field-label flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          {t("common:inputPanel.cvLabel")}
        </span>
        <textarea
          value={cvText}
          onChange={(event) => onCvChange(event.target.value)}
          placeholder={t("common:inputPanel.cvPlaceholder")}
          rows={11}
          className="ui-textarea"
        />
      </label>

      {mode === "tailor" && (
        <label className="block space-y-2">
          <span className="field-label flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            {t("common:inputPanel.jdLabel")}
          </span>
          <textarea
            value={jdText}
            onChange={(event) => onJdChange(event.target.value)}
            placeholder={t("common:inputPanel.jdPlaceholder")}
            rows={9}
            className="ui-textarea"
          />
        </label>
      )}

      <div className="border-t border-(--ui-border) pt-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs">
          <span className="text-(--ui-muted)">
            {t("workspace:source.using")} <span className="font-medium text-(--ui-text-soft)">{providerLabel}</span>
          </span>
          <button type="button" onClick={onOpenSettings} className="font-semibold text-(--ui-focus) hover:text-(--ui-text)">
            {t("workspace:actions.configure")}
          </button>
        </div>
        {!providerConfigured && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            {t("workspace:source.providerMissing")}
          </div>
        )}
        <button
          type="submit"
          disabled={!canGenerate}
          className={clsx(
            "flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition",
            canGenerate
              ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
              : "cursor-not-allowed bg-(--ui-border) text-(--ui-muted)",
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("common:inputPanel.generating")}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {mode === "format"
                ? t("common:inputPanel.formatCV")
                : t("common:inputPanel.generate")}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
