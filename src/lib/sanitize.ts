export function sanitize(str: unknown): string {
  if (!str) return "";
  return String(str)
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/[\u200B\u00A0]/g, " ");
}