
import { Loader2, CheckCircle2, AlertCircle, FileText, ArrowLeft } from 'lucide-react'
import { clsx } from 'clsx'
import EditableResumePreview from './EditableResumePreview'
import type { ResumeData, Status } from '../types'

interface LoadingStateProps {
  stepIndex: number;
  loadingSteps: string[];
}

function LoadingState({ stepIndex, loadingSteps }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-6" />
      <div className="space-y-3 w-full max-w-xs">
        {loadingSteps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={clsx(
                'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors',
                i < stepIndex
                  ? 'bg-brand-500 text-white'
                  : i === stepIndex
                    ? 'bg-brand-100 border-2 border-brand-500'
                    : 'bg-surface-100 border-2 border-surface-200'
              )}
            >
              {i < stepIndex ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : i === stepIndex ? (
                <Loader2 className="w-3 h-3 animate-spin text-brand-500" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-surface-300" />
              )}
            </div>
            <span
              className={clsx(
                'text-sm transition-colors',
                i <= stepIndex ? 'text-surface-700' : 'text-surface-400'
              )}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ErrorStateProps {
  error: string;
  onReset: () => void;
}

function ErrorState({ error, onReset }: ErrorStateProps) {
  const isKeyError = error?.toLowerCase().includes('api key')

  return (
    <div className="flex flex-col items-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-surface-900 mb-2">
        {isKeyError ? 'API Key Required' : 'Generation Failed'}
      </h3>
      <p className="text-sm text-surface-500 mb-6 max-w-sm">
        {isKeyError
          ? 'Set VITE_OPENAI_API_KEY in your .env file, or configure VITE_LLM_BASE_URL for a local model.'
          : error}
      </p>

      <button
        onClick={onReset}
        className="py-2.5 px-6 rounded-lg border border-surface-200 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors flex items-center gap-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Try Again
      </button>
    </div>
  )
}

function IdleState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-surface-300" />
      </div>
      <h3 className="text-lg font-semibold text-surface-900 mb-1">ATS-Optimized Resume</h3>
      <p className="text-sm text-surface-500 max-w-xs">
        Enter your CV and a job description on the left, then click Generate to create a tailored resume.
      </p>
    </div>
  )
}

interface PreviewPanelProps {
  status: Status;
  stepIndex: number;
  loadingSteps: string[];
  resumeData: ResumeData | null;
  error: string | null;
  onDownload: () => void;
  onReset: () => void;
  onDataChange: (data: ResumeData) => void;
}

export default function PreviewPanel({ status, stepIndex, loadingSteps, resumeData, error, onDownload, onReset, onDataChange }: PreviewPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6 flex flex-col">
      <h2 className="text-lg font-semibold text-surface-900 mb-4 shrink-0">Preview</h2>
      <div className="flex-1 flex flex-col min-h-0">
        {status === 'idle' && <IdleState />}
        {status === 'generating' && <LoadingState stepIndex={stepIndex} loadingSteps={loadingSteps} />}
        {status === 'success' && resumeData && (
          <EditableResumePreview
            resumeData={resumeData}
            onDataChange={onDataChange}
            onDownload={onDownload}
            onReset={onReset}
          />
        )}
        {status === 'error' && error && <ErrorState error={error} onReset={onReset} />}
      </div>
    </div>
  )
}