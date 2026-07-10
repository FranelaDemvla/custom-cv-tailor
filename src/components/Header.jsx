import { FileText } from 'lucide-react'

export default function Header() {
  return (
    <header className="border-b border-surface-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
        <FileText className="w-6 h-6 text-brand-600" />
        <h1 className="text-xl font-semibold text-surface-900">ATS CV Tailor</h1>
        <span className="text-sm text-surface-400 ml-auto">AI-Powered Resume Optimization</span>
      </div>
    </header>
  )
}
