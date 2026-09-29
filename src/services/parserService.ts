import i18next from "i18next";

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/^\s+|\s+$/gm, "")
    .trim();
}

export async function parseDocx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const { default: mammoth } = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return cleanText(result.value);
}

export async function parsePdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();

  const pdfjsLib = await import("pdfjs-dist");

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  try {
    const pdf = await loadingTask.promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      pages.push(text);
    }
    return cleanText(pages.join("\n\n"));
  } finally {
    await loadingTask.destroy();
  }
}

export async function parseCVFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "docx") return parseDocx(file);
  if (ext === "pdf") return parsePdf(file);
  throw new Error(i18next.t("common:errors.unsupportedFile", { ext }));
}
