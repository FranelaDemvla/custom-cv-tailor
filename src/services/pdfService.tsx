import { pdf } from "@react-pdf/renderer";
import type {
  OutputLanguage,
  ResumeData,
  ResumeStyleOptions,
} from "../types";
import ResumeTemplate from "../templates/ResumeTemplate";

export async function generatePDFBlob(
  data: ResumeData,
  style: ResumeStyleOptions,
  outputLanguage: OutputLanguage = "en",
): Promise<Blob> {
  if (!data) throw new Error("No resume data provided.");
  return pdf(
    <ResumeTemplate
      data={data}
      layout={style}
      outputLanguage={outputLanguage}
    />,
  ).toBlob();
}

export async function generatePDF(
  data: ResumeData,
  style: ResumeStyleOptions,
  outputLanguage: OutputLanguage = "en",
): Promise<void> {
  const blob = await generatePDFBlob(data, style, outputLanguage);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "resume-" + sanitizeFileName(data.contact?.name || "tailored") + ".pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function sanitizeFileName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "tailored"
  );
}
