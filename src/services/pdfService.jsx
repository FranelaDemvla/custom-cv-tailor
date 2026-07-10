import { pdf } from '@react-pdf/renderer'
import ResumeTemplate from '../templates/ResumeTemplate'

export async function generatePDF(data) {
  if (!data) {
    throw new Error('No resume data provided')
  }

  const blob = await pdf(<ResumeTemplate data={data} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `resume-${sanitizeFileName(data.contact?.name || 'tailored')}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'tailored'
}
