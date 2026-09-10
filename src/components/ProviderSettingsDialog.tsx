import { useEffect, useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  Settings2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type {
  LLMTransport,
  ProviderCredentials,
  ProviderSettings,
} from "../types";
import {
  listProviderModels,
  normalizeBaseUrl,
  type ModelInfo,
} from "../services/llmService";

interface ProviderSettingsDialogProps {
  open: boolean;
  settings: ProviderSettings;
  credentials: ProviderCredentials;
  onClose: () => void;
  onSave: (settings: ProviderSettings, credentials: ProviderCredentials) => void;
}

type CheckState = "idle" | "loading" | "success" | "error";

export default function ProviderSettingsDialog({
  open,
  settings,
  credentials,
  onClose,
  onSave,
}: ProviderSettingsDialogProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(settings);
  const [draftCredentials, setDraftCredentials] = useState(credentials);
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelSearch, setModelSearch] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [checkMessage, setCheckMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraft(settings);
    setDraftCredentials(credentials);
    setModels([]);
    setModelSearch("");
    setCheckState("idle");
    setCheckMessage("");
  }, [open, settings, credentials]);

  if (!open) return null;

  const activeKey = draft.provider === "openai"
    ? draftCredentials.openai
    : draftCredentials.local;
  const filteredModels = models.filter((model) =>
    model.id.toLowerCase().includes(modelSearch.trim().toLowerCase()),
  );
  const updateCredentials = (value: string) => {
    setDraftCredentials((current) => ({
      ...current,
      [draft.provider]: value,
    }));
  };
  const testConnection = async () => {
    setCheckState("loading");
    setCheckMessage("");
    try {
      const normalized = {
        ...draft,
        baseUrl: normalizeBaseUrl(draft.baseUrl, draft.provider),
      };
      const discovered = await listProviderModels(normalized, draftCredentials);
      setModels(discovered);
      setCheckState("success");
      setCheckMessage(
        discovered.length
          ? t("workspace:settings.connectionModels", { count: discovered.length })
          : t("workspace:settings.connectionOk"),
      );
    } catch (error) {
      setCheckState("error");
      setCheckMessage(error instanceof Error ? error.message : t("workspace:settings.connectionFailed"));
    }
  };
  const refreshModels = async () => {
    setCheckState("loading");
    setCheckMessage("");
    try {
      const normalized = {
        ...draft,
        baseUrl: normalizeBaseUrl(draft.baseUrl, draft.provider),
      };
      const discovered = await listProviderModels(normalized, draftCredentials);
      setModels(discovered);
      setCheckState("success");
      setCheckMessage(t("workspace:settings.modelsRefreshed"));
    } catch (error) {
      setCheckState("error");
      setCheckMessage(error instanceof Error ? error.message : t("workspace:settings.connectionFailed"));
    }
  };
  const save = () => {
    onSave(
      {
        ...draft,
        baseUrl: draft.provider === "openai"
          ? (draft.baseUrl.trim() || "https://api.openai.com/v1")
          : draft.baseUrl.trim(),
      },
      draftCredentials,
    );
  };
  const switchProvider = (provider: ProviderSettings["provider"]) => {
    setDraft((current) => ({
      ...current,
      provider,
      baseUrl: provider === "openai"
        ? current.provider === "openai"
          ? current.baseUrl
          : "https://api.openai.com/v1"
        : current.provider === "local"
          ? current.baseUrl
          : "http://127.0.0.1:1234/v1",
      transport: provider === "openai" ? current.transport : "chat",
    }));
    setCheckState("idle");
    setCheckMessage("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="provider-settings-title"
        className="ui-dialog flex max-h-[calc(100vh-32px)] w-full max-w-xl flex-col overflow-hidden lg:max-h-190"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-(--ui-border) px-6 py-5">
          <div>
            <p className="eyebrow">{t("workspace:settings.eyebrow")}</p>
            <h2 id="provider-settings-title" className="mt-1 text-xl font-semibold text-(--ui-text)">
              {t("workspace:settings.title")}
            </h2>
            <p className="mt-1 text-sm text-(--ui-muted)">
              {t("workspace:settings.description")}
            </p>
          </div>
          <button type="button" onClick={onClose} className="ui-icon-button" aria-label={t("workspace:actions.close")}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-(--ui-subtle) p-1">
            {(["local", "openai"] as const).map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => switchProvider(provider)}
                className={
                  draft.provider === provider
                    ? "rounded-md bg-(--ui-panel) px-3 py-2 text-sm font-semibold text-(--ui-text) shadow-sm"
                    : "rounded-md px-3 py-2 text-sm font-medium text-(--ui-muted) hover:text-(--ui-text)"
                }
              >
                {provider === "local"
                  ? t("workspace:settings.local")
                  : t("workspace:settings.openai")}
              </button>
            ))}
          </div>

          {draft.provider === "local" && (
            <label className="block space-y-1.5">
              <span className="field-label">{t("workspace:settings.baseUrl")}</span>
              <input
                className="ui-control"
                value={draft.baseUrl}
                onChange={(event) => setDraft((current) => ({ ...current, baseUrl: event.target.value }))}
                placeholder="http://127.0.0.1:1234/v1"
                inputMode="url"
              />
              <span className="field-help">{t("workspace:settings.baseUrlHelp")}</span>
            </label>
          )}

          {draft.provider === "openai" && (
            <label className="block space-y-1.5">
              <span className="field-label">{t("workspace:settings.endpointOverride")}</span>
              <input
                className="ui-control"
                value={draft.baseUrl}
                onChange={(event) => setDraft((current) => ({ ...current, baseUrl: event.target.value }))}
                placeholder="https://api.openai.com/v1"
                inputMode="url"
              />
              <span className="field-help">{t("workspace:settings.endpointHelp")}</span>
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="field-label">{t("workspace:settings.apiKey")}</span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--ui-muted)" />
              <input
                className="ui-control pr-10 pl-9"
                type={showKey ? "text" : "password"}
                value={activeKey}
                onChange={(event) => updateCredentials(event.target.value)}
                placeholder={draft.provider === "openai" ? "sk-..." : t("workspace:settings.optional")}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey((visible) => !visible)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-(--ui-muted) hover:text-(--ui-text)"
                aria-label={showKey ? t("workspace:settings.hideKey") : t("workspace:settings.showKey")}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <span className="field-help">{t("workspace:settings.keyHelp")}</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <label className="block space-y-1.5">
              <span className="field-label">{t("workspace:settings.modelId")}</span>
              <input
                className="ui-control"
                list="discovered-models"
                value={draft.model}
                onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))}
                placeholder={t("workspace:settings.modelPlaceholder")}
              />
              {models.length > 0 && (
                <input
                  className="ui-control py-1.5 text-xs"
                  value={modelSearch}
                  onChange={(event) => setModelSearch(event.target.value)}
                  placeholder={t("workspace:settings.filterModels")}
                  aria-label={t("workspace:settings.filterModels")}
                />
              )}
              <datalist id="discovered-models">
                {filteredModels.map((model) => <option key={model.id} value={model.id} />)}
              </datalist>
            </label>
            <label className="block space-y-1.5">
              <span className="field-label">{t("workspace:settings.transport")}</span>
              <select
                className="ui-control"
                value={draft.transport}
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  transport: event.target.value as LLMTransport,
                }))}
              >
                <option value="chat">{t("workspace:settings.chat")}</option>
                <option value="responses" disabled={draft.provider !== "openai"}>
                  {t("workspace:settings.responses")}
                </option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={testConnection} disabled={checkState === "loading"} className="ui-secondary-button">
              {checkState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}
              {t("workspace:settings.test")}
            </button>
            <button type="button" onClick={refreshModels} disabled={checkState === "loading"} className="ui-secondary-button">
              <RefreshCw className="h-4 w-4" />
              {t("workspace:settings.refresh")}
            </button>
            {checkState === "success" && <Check className="h-4 w-4 text-emerald-600" aria-label={t("workspace:settings.success")} />}
            {checkMessage && (
              <span className={checkState === "error" ? "text-xs text-red-600" : "text-xs text-emerald-700"}>
                {checkMessage}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-(--ui-border) bg-(--ui-panel) px-6 py-4">
          <button type="button" onClick={onClose} className="ui-secondary-button">{t("workspace:actions.cancel")}</button>
          <button type="button" onClick={save} className="ui-primary-button">{t("workspace:actions.saveSettings")}</button>
        </div>
      </div>
    </div>
  );
}
