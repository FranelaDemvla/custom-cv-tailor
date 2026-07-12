import { useState } from "react";
import { Download, ArrowLeft, Eye, Pencil } from "lucide-react";
import { clsx } from "clsx";
import type { ResumeData } from "../types";
import VisualPreview from "./VisualPreview";
import ResumeContactEditor from "./ResumeContactEditor";
import ResumeSummaryEditor from "./ResumeSummaryEditor";
import ResumeExperienceEditor from "./ResumeExperienceEditor";
import ResumeSkillsEditor from "./ResumeSkillsEditor";
import ResumeEducationEditor from "./ResumeEducationEditor";

interface EditableResumePreviewProps {
  resumeData: ResumeData;
  onDataChange: (data: ResumeData) => void;
  onDownload: () => void;
  onReset: () => void;
}

export default function EditableResumePreview({
  resumeData,
  onDataChange,
  onDownload,
  onReset,
}: EditableResumePreviewProps) {
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="lg:hidden flex gap-1 mb-3 bg-surface-100 rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => setMobileView("editor")}
          className={clsx(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors",
            mobileView === "editor"
              ? "bg-white text-surface-800 shadow-sm"
              : "text-surface-500 hover:text-surface-700",
          )}
        >
          <Pencil className="w-3.5 h-3.5" />
          Editor
        </button>
        <button
          type="button"
          onClick={() => setMobileView("preview")}
          className={clsx(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors",
            mobileView === "preview"
              ? "bg-white text-surface-800 shadow-sm"
              : "text-surface-500 hover:text-surface-700",
          )}
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>
      </div>

      <div className="flex-1 flex-col flex gap-6 overflow-hidden min-h-0">
        <div
          className={clsx(
            "flex-1 min-w-0",
            mobileView !== "preview"
              ? "hidden lg:flex lg:items-start lg:justify-center"
              : "flex items-start justify-center",
          )}
        >
          <div className="w-full max-w-sm sticky top-0 border border-gray-200 rounded-lg">
            <VisualPreview data={resumeData} />
          </div>
        </div>

        <div
          className={clsx(
            "overflow-y-auto flex-1 min-w-0 pr-1 space-y-5",
            mobileView !== "editor" ? "hidden lg:block" : "block",
          )}
        >
          <ResumeContactEditor data={resumeData} onChange={onDataChange} />
          <ResumeSummaryEditor data={resumeData} onChange={onDataChange} />
          <ResumeExperienceEditor data={resumeData} onChange={onDataChange} />
          <ResumeSkillsEditor data={resumeData} onChange={onDataChange} />
          <ResumeEducationEditor data={resumeData} onChange={onDataChange} />
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-4 border-t border-surface-100 mt-4 shrink-0">
        <button
          onClick={onDownload}
          className="w-full py-3 rounded-lg bg-brand-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>

        <button
          onClick={onReset}
          className="text-sm text-surface-500 hover:text-surface-700 flex items-center justify-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Tailor another CV
        </button>
      </div>
    </div>
  );
}