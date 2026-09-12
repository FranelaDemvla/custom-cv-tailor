function sanitizeFileName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "tailored"
  );
}

export function pdfFileName(documentTitle?: string, contactName?: string): string {
  const title = documentTitle?.trim();
  if (title) return `${sanitizeFileName(title)}.pdf`;
  return `resume-${sanitizeFileName(contactName || "tailored")}.pdf`;
}
