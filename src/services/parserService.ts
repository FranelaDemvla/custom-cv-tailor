import i18next from "i18next";
import mammoth from 'mammoth'

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .trim()
}

export async function parseDocx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return cleanText(result.value)
}

export async function parsePdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()

  interface PDFJSLib {
    GlobalWorkerOptions: { workerSrc: string };
    getDocument: (options: { data: Uint8Array }) => { promise: Promise<PDFDocumentProxy> };
  }

  interface PDFDocumentProxy {
    numPages: number;
    getPage: (pageNumber: number) => Promise<PDFPageProxy>;
  }

  interface PDFPageProxy {
    getTextContent: () => Promise<{ items: Array<{ str: string }> }>;
  }

  const pdfjsLib = await import('pdfjs-dist') as unknown as PDFJSLib

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => item.str).join(' ')
    pages.push(text)
  }

  return cleanText(pages.join('\n\n'))
}

export async function parseCVFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'docx') return parseDocx(file)
  if (ext === 'pdf') return parsePdf(file)
  throw new Error(i18next.t("common:errors.unsupportedFile", { ext }))
}