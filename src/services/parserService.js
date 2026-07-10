import mammoth from 'mammoth'

function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .trim()
}

export async function parseDocx(file) {
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return cleanText(result.value)
}

export async function parsePdf(file) {
  const buffer = await file.arrayBuffer()
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(Buffer.from(buffer))
  return cleanText(data.text)
}

export async function parseCVFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'docx') return parseDocx(file)
  if (ext === 'pdf') return parsePdf(file)
  throw new Error(`Unsupported file type: .${ext}. Please upload a .docx or .pdf file.`)
}
