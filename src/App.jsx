import { useState, useCallback } from 'react'
import Header from './components/Header'
import InputPanel from './components/InputPanel'
import PreviewPanel from './components/PreviewPanel'
import { tailorCV } from './services/openaiService'
import { generatePDF } from './services/pdfService'

const LOADING_STEPS = [
  'Analyzing job description...',
  'Matching keywords and skills...',
  'Optimizing experience bullet points...',
  'Structuring tailored resume...',
]

export default function App() {
  const [cvText, setCvText] = useState('')
  const [jdText, setJdText] = useState('')
  const [status, setStatus] = useState('idle')
  const [stepIndex, setStepIndex] = useState(0)
  const [resumeData, setResumeData] = useState(null)
  const [error, setError] = useState(null)

  const handleGenerate = useCallback(async () => {
    setError(null)
    setResumeData(null)
    setStatus('generating')
    setStepIndex(0)

    const stepTimer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1
        return prev
      })
    }, 1500)

    try {
      const data = await tailorCV(cvText, jdText)
      clearInterval(stepTimer)
      setStepIndex(LOADING_STEPS.length)
      setResumeData(data)
      setStatus('success')
    } catch (err) {
      clearInterval(stepTimer)
      setError(err.message || 'An unexpected error occurred')
      setStatus('error')
    }
  }, [cvText, jdText])

  const handleDownload = useCallback(async () => {
    if (!resumeData) return
    try {
      await generatePDF(resumeData)
    } catch (err) {
      setError(err.message || 'Failed to generate PDF')
      setStatus('error')
    }
  }, [resumeData])

  const handleReset = useCallback(() => {
    setStatus('idle')
    setResumeData(null)
    setError(null)
    setStepIndex(0)
  }, [])

  const canGenerate = cvText.trim() && jdText.trim() && status !== 'generating'

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
        <div className="flex-1 min-w-0">
          <InputPanel
            cvText={cvText}
            jdText={jdText}
            onCvChange={setCvText}
            onJdChange={setJdText}
            onGenerate={handleGenerate}
            canGenerate={canGenerate}
            isGenerating={status === 'generating'}
          />
        </div>
        <div className="flex-1 min-w-0">
          <PreviewPanel
            status={status}
            stepIndex={stepIndex}
            loadingSteps={LOADING_STEPS}
            resumeData={resumeData}
            error={error}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        </div>
      </main>
    </div>
  )
}
