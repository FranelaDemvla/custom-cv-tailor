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
  const pdfjsLib = await import('pdfjs-dist')

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => item.str).join(' ')
    pages.push(text)
  }

  return cleanText(pages.join('\n\n'))
}

export async function parseCVFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'docx') return parseDocx(file)
  if (ext === 'pdf') return parsePdf(file)
  throw new Error(`Unsupported file type: .${ext}. Please upload a .docx or .pdf file.`)
}
