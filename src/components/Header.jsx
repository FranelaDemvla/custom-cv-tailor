import { FileText, Cpu } from 'lucide-react'

export default function Header({ model, onModelChange }) {
  return (
    <header className="border-b border-surface-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
        <FileText className="w-6 h-6 text-brand-600" />
        <h1 className="text-xl font-semibold text-surface-900">ATS CV Tailor</h1>
        <span className="text-sm text-surface-400">AI-Powered Resume Optimization</span>
        <div className="ml-auto flex items-center gap-2">
          <Cpu className="w-4 h-4 text-surface-400" />
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="text-sm border border-surface-200 rounded-lg px-3 py-1.5 bg-surface-50 text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="local">Local Model</option>
            <option value="openai">GPT-4o</option>
          </select>
        </div>
      </div>
    </header>
  )
}
