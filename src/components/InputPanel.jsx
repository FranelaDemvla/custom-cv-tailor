import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { parseCVFile } from '../services/parserService'

export default function InputPanel({ cvText, jdText, onCvChange, onJdChange, onGenerate, canGenerate, isGenerating }) {
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleFile = useCallback(async (file) => {
    setIsParsing(true)
    setParseError(null)
    try {
      const text = await parseCVFile(file)
      onCvChange(text)
    } catch (err) {
      setParseError(err.message || 'Failed to parse file')
    } finally {
      setIsParsing(false)
    }
  }, [onCvChange])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
    e.target.value = ''
  }, [handleFile])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (canGenerate) onGenerate()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-surface-200 p-6 space-y-6">
      <h2 className="text-lg font-semibold text-surface-900">Your CV & Job Description</h2>

      <div className="space-y-2">
        <label className="text-sm font-medium text-surface-700">Upload CV (.docx / .pdf)</label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={clsx(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-brand-500 bg-brand-50'
              : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50'
          )}
        >
          {isParsing ? (
            <div className="flex flex-col items-center gap-2 text-surface-500">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Parsing file...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-surface-400" />
              <span className="text-sm text-surface-500">
                Drop your CV here or <span className="text-brand-600 font-medium">browse</span>
              </span>
              <span className="text-xs text-surface-400">Supports .docx and .pdf</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        {parseError && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {parseError}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-surface-700 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Current CV Text
        </label>
        <textarea
          value={cvText}
          onChange={(e) => onCvChange(e.target.value)}
          placeholder="Paste your CV here, or upload a file above..."
          rows={10}
          className="w-full rounded-lg border border-surface-200 bg-surface-50 p-3 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-surface-700 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Job Description
        </label>
        <textarea
          value={jdText}
          onChange={(e) => onJdChange(e.target.value)}
          placeholder="Paste the job description here..."
          rows={10}
          className="w-full rounded-lg border border-surface-200 bg-surface-50 p-3 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={!canGenerate}
        className={clsx(
          'w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors',
          canGenerate
            ? 'bg-brand-600 text-white hover:bg-brand-700 cursor-pointer'
            : 'bg-surface-200 text-surface-400 cursor-not-allowed'
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Tailored CV
          </>
        )}
      </button>
    </form>
  )
}
