import { FileInput, LayoutTemplate, PencilLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import InputPanel from "./InputPanel";
import ResumeContactEditor from "./ResumeContactEditor";
import ResumeEducationEditor from "./ResumeEducationEditor";
import ResumeExperienceEditor from "./ResumeExperienceEditor";
import ResumeLayoutEditor from "./ResumeLayoutEditor";
import ResumeSkillsEditor from "./ResumeSkillsEditor";
import ResumeSummaryEditor from "./ResumeSummaryEditor";
import type { CVDocument, ResumeData, ResumeStyleOptions } from "../types";

export type EditorTab = "source" | "content" | "style";

interface DocumentEditorProps {
  document: CVDocument;
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  onUpdate: (update: (document: CVDocument) => CVDocument) => void;
  onGenerate: () => void;
  canGenerate: boolean;
  isGenerating: boolean;
  providerConfigured: boolean;
  providerLabel: string;
  onOpenSettings: () => void;
  generationError: string | null;
}

const TABS: Array<{ id: EditorTab; icon: typeof FileInput; key: string }> = [
  { id: "source", icon: FileInput, key: "workspace:tabs.source" },
  { id: "content", icon: PencilLine, key: "workspace:tabs.content" },
  { id: "style", icon: LayoutTemplate, key: "workspace:tabs.style" },
];

export default function DocumentEditor({
  document,
  activeTab,
  onTabChange,
  onUpdate,
  onGenerate,
  canGenerate,
  isGenerating,
  providerConfigured,
  providerLabel,
  onOpenSettings,
  generationError,
}: DocumentEditorProps) {
  const { t } = useTranslation();
  const updateData = (data: ResumeData) => onUpdate((current) => ({ ...current, data }));
  const updateStyle = (style: ResumeStyleOptions) => onUpdate((current) => ({ ...current, style }));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-(--ui-workspace)">
      <div className="border-b border-(--ui-border) bg-(--ui-panel) px-4 sm:px-6">
        <nav className="flex gap-5" aria-label={t("workspace:document.navigation")}>
          {TABS.map(({ id, icon: Icon, key }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={
                activeTab === id
                  ? "flex items-center gap-2 border-b-2 border-(--ui-focus) px-1 py-3 text-sm font-semibold text-(--ui-focus)"
                  : "flex items-center gap-2 border-b-2 border-transparent px-1 py-3 text-sm font-medium text-(--ui-muted) hover:text-(--ui-text)"
              }
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              {t(key)}
            </button>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        {activeTab === "source" && (
          <div className="ui-panel p-4 sm:p-6">
            <InputPanel
              cvText={document.source.cvText}
              jdText={document.source.jdText}
              cvFileName={document.source.cvFileName}
              outputLanguage={document.outputLanguage}
              onCvChange={(cvText) => onUpdate((current) => ({
                ...current,
                source: { ...current.source, cvText },
              }))}
              onJdChange={(jdText) => onUpdate((current) => ({
                ...current,
                source: { ...current.source, jdText },
              }))}
              onCvFileNameChange={(cvFileName) => onUpdate((current) => ({
                ...current,
                source: { ...current.source, cvFileName },
              }))}
              onOutputLanguageChange={(outputLanguage) => onUpdate((current) => ({
                ...current,
                outputLanguage,
              }))}
              onGenerate={onGenerate}
              canGenerate={canGenerate}
              isGenerating={isGenerating}
              mode={document.mode}
              onModeChange={(mode) => onUpdate((current) => ({ ...current, mode }))}
              providerLabel={providerLabel}
              providerConfigured={providerConfigured}
              onOpenSettings={onOpenSettings}
            />
            {generationError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-700" role="alert">
                {generationError}
              </div>
            )}
          </div>
        )}

        {activeTab === "content" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-(--ui-text)">
                {t("workspace:content.title")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-(--ui-muted)">
                {t("workspace:content.description")}
              </p>
            </div>
            <div className="ui-panel space-y-5 p-4 sm:p-6">
              <ResumeContactEditor data={document.data} onChange={updateData} />
              <ResumeSummaryEditor data={document.data} onChange={updateData} />
              <ResumeExperienceEditor data={document.data} onChange={updateData} />
              <ResumeSkillsEditor key={document.id} data={document.data} onChange={updateData} />
              <ResumeEducationEditor data={document.data} onChange={updateData} />
            </div>
          </div>
        )}

        {activeTab === "style" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-(--ui-text)">
                {t("workspace:style.title")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-(--ui-muted)">
                {t("workspace:style.description")}
              </p>
            </div>
            <ResumeLayoutEditor layout={document.style} onChange={updateStyle} />
          </div>
        )}
      </div>
    </div>
  );
}
