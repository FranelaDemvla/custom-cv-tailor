import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { Menu, PanelLeftOpen, X } from "lucide-react";
import Header from "./components/Header";
import WorkspaceSidebar from "./components/WorkspaceSidebar";
import DocumentToolbar from "./components/DocumentToolbar";
import DocumentEditor, { type EditorTab } from "./components/DocumentEditor";
import ProviderSettingsDialog from "./components/ProviderSettingsDialog";
import VisualPreview from "./components/VisualPreview";
import { selectionAfterGeneration } from "./lib/documentSaveQueue";
import { useDocuments } from "./hooks/useDocuments";
import { useTheme } from "./hooks/useTheme";
import { generateResume, LLMServiceError } from "./services/llmService";
import {
  importDocuments,
  makeBackup,
  parseBackup,
} from "./services/documentRepository";
import { generatePDF } from "./services/pdfService";
import {
  createEmptyDocument,
  createId,
  type CVDocument,
  type ProviderCredentials,
  type ProviderSettings,
} from "./types";
import { readPreferences, savePreferences } from "./services/preferencesRepository";

function initialProvider(): ProviderSettings {
  return {
    provider: "local",
    model: import.meta.env.VITE_LLM_MODEL || "",
    baseUrl: import.meta.env.VITE_LLM_BASE_URL || "http://127.0.0.1:1234/v1",
    transport: "chat",
  };
}

function copyValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export default function App() {
  const { t } = useTranslation();
  const uiLanguage = i18next.language.slice(0, 2) === "es" ? "es" : "en";
  const { preference: themePreference, setPreference: setThemePreference } = useTheme();
  const defaults = useMemo(() => readPreferences(initialProvider()), []);
  const {
    documents,
    isReady,
    saveStates,
    updateDocument,
    createDocument,
    duplicateDocument,
    removeDocument,
    restoreDocument,
    flushPendingDocuments,
    hasPendingWrites,
    reloadDocument,
  } = useDocuments();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [defaultProvider, setDefaultProvider] = useState<ProviderSettings>(defaults.defaultProvider);
  const [credentials, setCredentials] = useState<ProviderCredentials>({
    openai: "",
    local: "",
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<"editor" | "preview">("editor");
  const [activeTabs, setActiveTabs] = useState<Record<string, EditorTab>>({});
  const [generation, setGeneration] = useState<{ documentId: string; requestId: string } | null>(null);
  const [generationErrors, setGenerationErrors] = useState<Record<string, string>>({});
  const [deletedDocument, setDeletedDocument] = useState<CVDocument | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const documentsRef = useRef(documents);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  useEffect(() => {
    if (!isReady || activeId) return;
    const preferred = defaults.lastActiveId && documents.some((document) => document.id === defaults.lastActiveId)
      ? defaults.lastActiveId
      : documents[0]?.id || null;
    setActiveId(preferred);
  }, [activeId, defaults.lastActiveId, documents, isReady]);

  useEffect(() => {
    savePreferences(
      {
        lastActiveId: activeId,
        theme: themePreference,
        language: uiLanguage,
        defaultProvider,
      },
      defaults,
    );
  }, [activeId, defaultProvider, defaults, themePreference, uiLanguage]);

  useEffect(() => {
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      if (!hasPendingWrites()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [hasPendingWrites]);

  const activeDocument = documents.find((document) => document.id === activeId) || null;
  const activeProvider = activeDocument?.provider || defaultProvider;
  const currentTab = activeDocument
    ? activeTabs[activeDocument.id] || (activeDocument.contentStatus === "generated" ? "content" : "source")
    : "source";
  const currentGeneration = generation?.documentId === activeDocument?.id;
  const providerKey = activeProvider.provider === "openai" ? credentials.openai : credentials.local;
  const providerConfigured = Boolean(activeProvider.model.trim() && (
    activeProvider.provider === "openai" ? providerKey.trim() : activeProvider.baseUrl.trim()
  ));
  const providerLabel = activeProvider.provider === "openai"
    ? "OpenAI · " + (activeProvider.model || t("workspace:settings.noModel"))
    : t("workspace:settings.local") + " · " + (activeProvider.model || t("workspace:settings.noModel"));

  const setTab = useCallback((tab: EditorTab) => {
    if (!activeId) return;
    setActiveTabs((tabs) => ({ ...tabs, [activeId]: tab }));
  }, [activeId]);

  const handleCreate = useCallback(async () => {
    await flushPendingDocuments();
    const document: CVDocument = {
      ...createEmptyDocument(defaultProvider),
      outputLanguage: uiLanguage,
    };
    const created = await createDocument(document);
    setActiveId(created.id);
    setActiveTabs((tabs) => ({ ...tabs, [created.id]: "source" }));
    setMobilePane("editor");
    setSidebarOpen(false);
  }, [createDocument, defaultProvider, flushPendingDocuments, uiLanguage]);

  const handleSelect = useCallback(async (id: string) => {
    await flushPendingDocuments().catch(() => undefined);
    setActiveId(id);
    setMobilePane("editor");
    setSidebarOpen(false);
  }, [flushPendingDocuments]);

  const handleUpdate = useCallback((update: (document: CVDocument) => CVDocument) => {
    if (!activeDocument) return;
    updateDocument(activeDocument.id, update);
  }, [activeDocument, updateDocument]);

  const handleGenerate = useCallback(async () => {
    const document = documentsRef.current.find((item) => item.id === activeId);
    if (!document || generation) return;
    if (!providerConfigured) {
      setSettingsOpen(true);
      return;
    }
    const requestId = createId();
    const snapshot = copyValue(document);
    const controller = new AbortController();
    abortRef.current = controller;
    setGeneration({ documentId: document.id, requestId });
    setGenerationErrors((errors) => {
      const next = { ...errors };
      delete next[document.id];
      return next;
    });
    try {
      const data = await generateResume(
        snapshot.source.cvText,
        snapshot.source.jdText,
        snapshot.provider,
        credentials,
        snapshot.mode,
        snapshot.outputLanguage,
        controller.signal,
      );
      const current = documentsRef.current.find((item) => item.id === snapshot.id);
      if (!current) return;
      if (current.revision !== snapshot.revision) {
        const now = new Date().toISOString();
        const generatedCopy: CVDocument = {
          ...snapshot,
          id: createId(),
          title: snapshot.title + " · generated",
          createdAt: now,
          updatedAt: now,
          revision: 0,
          data,
          contentStatus: "generated",
        };
        const created = await createDocument(generatedCopy);
        setActiveId((selected) => selectionAfterGeneration(selected, snapshot.id, created.id));
        setActiveTabs((tabs) => ({ ...tabs, [created.id]: "content" }));
      } else {
        updateDocument(snapshot.id, (currentDocument) => ({
          ...currentDocument,
          data,
          contentStatus: "generated",
        }));
        setActiveTabs((tabs) => ({ ...tabs, [snapshot.id]: "content" }));
      }
    } catch (error) {
      if (error instanceof LLMServiceError && error.code === "cancelled") {
        return;
      }
      setGenerationErrors((errors) => ({
        ...errors,
        [snapshot.id]: error instanceof Error ? error.message : t("common:errors.generic"),
      }));
    } finally {
      if (abortRef.current === controller) {
        setGeneration(null);
        abortRef.current = null;
      }
    }
  }, [activeId, credentials, generation, providerConfigured, t, updateDocument, createDocument]);

  const handleCancelGeneration = useCallback(() => {
    if (!generation) return;
    abortRef.current?.abort();
    updateDocument(generation.documentId, (document) => ({
      ...document,
      contentStatus: "interrupted",
    }));
    setGeneration(null);
    abortRef.current = null;
  }, [generation, updateDocument]);

  const handleDownload = useCallback(async () => {
    if (!activeDocument) return;
    setExportError(null);
    await flushPendingDocuments();
    try {
      await generatePDF(
        activeDocument.data,
        activeDocument.style,
        activeDocument.outputLanguage,
        activeDocument.title,
      );
      updateDocument(activeDocument.id, (document) => ({
        ...document,
        lastExportedAt: new Date().toISOString(),
      }));
    } catch (error) {
      setExportError(error instanceof Error ? error.message : t("common:errors.pdfFailed"));
    }
  }, [activeDocument, flushPendingDocuments, t, updateDocument]);

  const handleDelete = useCallback(async () => {
    if (!activeDocument) return;
    if (generation?.documentId === activeDocument.id) {
      abortRef.current?.abort();
      setGeneration(null);
      abortRef.current = null;
    }
    const deleted = activeDocument;
    const remaining = documents.filter((document) => document.id !== deleted.id);
    await removeDocument(deleted);
    setDeletedDocument(deleted);
    setActiveId(remaining[0]?.id || null);
  }, [activeDocument, documents, generation, removeDocument]);

  const handleUndoDelete = useCallback(async () => {
    if (!deletedDocument) return;
    await restoreDocument(deletedDocument);
    setActiveId(deletedDocument.id);
    setDeletedDocument(null);
  }, [deletedDocument, restoreDocument]);

  const handleDuplicate = useCallback(async () => {
    if (!activeDocument) return;
    await flushPendingDocuments();
    const duplicate = await duplicateDocument(activeDocument);
    setActiveId(duplicate.id);
    setActiveTabs((tabs) => ({ ...tabs, [duplicate.id]: "source" }));
    setMobilePane("editor");
  }, [activeDocument, duplicateDocument, flushPendingDocuments]);

  const handleExportBackup = useCallback(() => {
    const blob = new Blob([JSON.stringify(makeBackup(documents), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "custom-cv-backup.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [documents]);

  const handleImportBackup = useCallback(async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const candidates = parseBackup(parsed);
      const imported = await importDocuments(candidates);
      const first = imported[0];
      if (first) {
        setActiveId(first.id);
        savePreferences({ lastActiveId: first.id }, defaults);
      }
      window.location.reload();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : t("workspace:backup.importFailed"));
    }
  }, [defaults, t]);

  const handleProviderSave = useCallback((settings: ProviderSettings, nextCredentials: ProviderCredentials) => {
    setCredentials(nextCredentials);
    setDefaultProvider(settings);
    if (activeDocument) {
      updateDocument(activeDocument.id, (document) => ({ ...document, provider: settings }));
    }
    setSettingsOpen(false);
  }, [activeDocument, updateDocument]);

  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const runAction = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try { await action(); }
    catch (error) { setActionError(error instanceof Error ? error.message : t("common:errors.generic")); }
  };
  const recover = async (id: string, asCopy: boolean) => {
    setRecoveryBusy(true);
    try {
      const local = documentsRef.current.find((item) => item.id === id);
      if (asCopy && local) {
        const copy = await duplicateDocument(local);
        setActiveId(copy.id);
      }
      const stored = await reloadDocument(id);
      if (!stored) setActiveId((selected) => selected === id ? null : selected);
    } finally { setRecoveryBusy(false); }
  };

  if (!isReady) {
    return <div className="flex min-h-screen items-center justify-center bg-(--ui-workspace) text-sm text-(--ui-muted)">{t("workspace:loading")}</div>;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-(--ui-workspace) lg:h-dvh lg:overflow-hidden">
      <Header
        themePreference={themePreference}
        onThemeChange={setThemePreference}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      {actionError && <p role="alert" className="px-4 py-2 text-sm text-red-600">{actionError}</p>}
      {documents.filter((document) => saveStates[document.id] === "conflict" || saveStates[document.id] === "error").map((document) => (
        <div key={document.id} role="alert" className="flex flex-wrap items-center gap-3 border-b border-(--ui-border) bg-(--ui-panel) px-4 py-3 text-sm text-(--ui-text)">
          <span>{document.title}: {t(saveStates[document.id] === "conflict" ? "workspace:save.conflict" : "workspace:save.failed")}</span>
          <button disabled={recoveryBusy} className="ui-secondary-button" onClick={() => { void runAction(() => recover(document.id, true)); }}>{t("workspace:save.asCopy")}</button>
          <button disabled={recoveryBusy} className="ui-secondary-button" onClick={() => { void runAction(() => recover(document.id, false)); }}>{t("workspace:save.reload")}</button>
          {saveStates[document.id] === "error" && <button className="ui-secondary-button" onClick={() => { void runAction(flushPendingDocuments); }}>{t("workspace:save.retry")}</button>}
        </div>
      ))}
      <div className="flex min-h-0 flex-1 lg:overflow-hidden">
        <div className="hidden w-65 shrink-0 border-r border-(--ui-border) lg:block">
          <WorkspaceSidebar
            documents={documents}
            activeId={activeId}
            generatingId={generation?.documentId || null}
            onSelect={(id) => { void runAction(() => handleSelect(id)); }}
            onCreate={() => { void runAction(handleCreate); }}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button className="absolute inset-0 bg-slate-950/40" onClick={() => setSidebarOpen(false)} aria-label={t("workspace:actions.close")} />
            <div className="relative h-full w-[min(86vw,320px)] shadow-2xl">
              <WorkspaceSidebar
                documents={documents}
                activeId={activeId}
                generatingId={generation?.documentId || null}
                onSelect={(id) => { void runAction(() => handleSelect(id)); }}
                onCreate={() => { void runAction(handleCreate); }}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
              />
            </div>
          </div>
        )}

        <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-hidden">
          {activeDocument ? (
            <>
              <div className="flex items-center gap-2 border-b border-(--ui-border) bg-(--ui-panel) px-4 py-2 lg:hidden">
                <button type="button" onClick={() => setSidebarOpen(true)} className="ui-icon-button" aria-label={t("workspace:actions.openLibrary")}>
                  <Menu className="h-4 w-4" />
                </button>
                <span className="truncate text-sm font-medium text-(--ui-text)">{activeDocument.title}</span>
              </div>
              <DocumentToolbar
                title={activeDocument.title}
                provider={activeProvider}
                saveState={saveStates[activeDocument.id] || "saved"}
                isGenerating={currentGeneration}
                onTitleChange={(title) => handleUpdate((document) => ({ ...document, title }))}
                onDuplicate={() => { void runAction(handleDuplicate); }}
                onDelete={() => { void runAction(handleDelete); }}
                onDownload={() => { void runAction(handleDownload); }}
                onCancelGeneration={handleCancelGeneration}
              />
              <div className="flex border-b border-(--ui-border) bg-(--ui-panel) px-4 py-2 xl:hidden">
                <div className="grid w-full grid-cols-2 gap-1 rounded-lg bg-(--ui-subtle) p-1">
                  <button
                    type="button"
                    onClick={() => setMobilePane("editor")}
                    className={mobilePane === "editor" ? "rounded-md bg-(--ui-panel) px-3 py-2 text-xs font-semibold text-(--ui-text) shadow-sm" : "rounded-md px-3 py-2 text-xs font-medium text-(--ui-muted)"}
                  >
                    {t("workspace:preview.editor")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobilePane("preview")}
                    className={mobilePane === "preview" ? "rounded-md bg-(--ui-panel) px-3 py-2 text-xs font-semibold text-(--ui-text) shadow-sm" : "rounded-md px-3 py-2 text-xs font-medium text-(--ui-muted)"}
                  >
                    {t("workspace:preview.preview")}
                  </button>
                </div>
              </div>
              <div className="grid min-h-0 flex-1 lg:overflow-hidden xl:grid-cols-[minmax(420px,0.88fr)_minmax(420px,1.12fr)]">
                <div className={mobilePane === "editor" ? "flex min-h-0 flex-col" : "hidden min-h-0 xl:flex xl:flex-col"}>
                  <DocumentEditor
                    document={activeDocument}
                    activeTab={currentTab}
                    onTabChange={setTab}
                    onUpdate={handleUpdate}
                    onGenerate={handleGenerate}
                    canGenerate={Boolean(activeDocument.source.cvText.trim() && providerConfigured && !generation)}
                    isGenerating={currentGeneration}
                    providerConfigured={providerConfigured}
                    providerLabel={providerLabel}
                    onOpenSettings={() => setSettingsOpen(true)}
                    generationError={generationErrors[activeDocument.id] || exportError}
                  />
                </div>
                <section className={mobilePane === "preview" ? "block min-h-0 border-l border-(--ui-border) bg-(--ui-workspace) p-4 lg:overflow-y-auto lg:overscroll-y-contain xl:p-6" : "hidden min-h-0 border-l border-(--ui-border) bg-(--ui-workspace) p-4 xl:block xl:overflow-y-auto xl:overscroll-y-contain xl:p-6"}>
                  <div className="mx-auto max-w-2xl">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="text-sm font-semibold text-(--ui-text)">{t("common:preview.heading")}</h2>
                    </div>
                    <VisualPreview
                      data={activeDocument.data}
                      layout={activeDocument.style}
                      outputLanguage={activeDocument.outputLanguage}
                    />
                  </div>
                </section>
              </div>
            </>
          ) : (
            <div className="flex min-h-full flex-1 items-center justify-center p-6">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <PanelLeftOpen className="h-6 w-6" />
                </div>
                <h2 className="mt-6 font-serif text-3xl tracking-tight text-(--ui-text)">{t("workspace:empty.title")}</h2>
                <p className="mt-3 text-sm leading-6 text-(--ui-muted)">{t("workspace:empty.description")}</p>
                <button type="button" onClick={() => { void runAction(handleCreate); }} className="ui-primary-button mt-6">
                  {t("workspace:actions.newCV")}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {deletedDocument && (
        <div className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-xl">
          <span>{t("workspace:backup.deleted")}</span>
          <button type="button" onClick={() => { void runAction(handleUndoDelete); }} className="font-semibold text-blue-200 hover:text-white">{t("workspace:actions.undo")}</button>
          <button type="button" onClick={() => setDeletedDocument(null)} className="text-slate-300 hover:text-white" aria-label={t("workspace:actions.close")}><X className="h-4 w-4" /></button>
        </div>
      )}

      <ProviderSettingsDialog
        open={settingsOpen}
        settings={activeProvider}
        credentials={credentials}
        onClose={() => setSettingsOpen(false)}
        onSave={handleProviderSave}
      />
    </div>
  );
}
