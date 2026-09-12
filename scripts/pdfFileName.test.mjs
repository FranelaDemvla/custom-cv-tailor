import test from "node:test";
import assert from "node:assert/strict";
import { pdfFileName } from "../src/lib/pdfFileName.ts";

test("uses the document title for downloaded PDFs", () => {
  assert.equal(pdfFileName("Senior engineer CV", "Jane Doe"), "senior-engineer-cv.pdf");
  assert.equal(pdfFileName("  Staff CV  ", "Jane Doe"), "staff-cv.pdf");
});

test("keeps the contact-name filename fallback without a document title", () => {
  assert.equal(pdfFileName("", "Jane Doe"), "resume-jane-doe.pdf");
  assert.equal(pdfFileName(undefined, undefined), "resume-tailored.pdf");
});
