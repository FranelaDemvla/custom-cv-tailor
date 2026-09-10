import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("translations expose the workspace vocabulary", async () => {
  const [english, spanish] = await Promise.all([
    read("../src/i18n/resources/en.json"),
    read("../src/i18n/resources/es.json"),
  ]);
  for (const source of [english, spanish]) {
    const resource = JSON.parse(source);
    assert.equal(typeof resource.workspace.actions.newCV, "string");
    assert.equal(typeof resource.workspace.settings.title, "string");
    assert.equal(typeof resource.workspace.tabs.style, "string");
  }
});

test("provider configuration does not provision credentials at build time", async () => {
  const envExample = await read("../.env.example");
  const viteConfig = await read("../vite.config.ts");
  const service = await read("../src/services/llmService.ts");
  assert.doesNotMatch(envExample, /API_KEY/);
  assert.doesNotMatch(viteConfig, /proxy/);
  assert.match(service, /normalizeBaseUrl/);
  assert.match(service, /chat\/completions/);
});

test("Tailwind utilities use canonical variable and spacing syntax", async () => {
  const paths = [
    "../src/App.tsx",
    "../src/components/DocumentEditor.tsx",
    "../src/components/DocumentToolbar.tsx",
    "../src/components/FormField.tsx",
    "../src/components/Header.tsx",
    "../src/components/InputPanel.tsx",
    "../src/components/ProviderSettingsDialog.tsx",
    "../src/components/ResumeLayoutEditor.tsx",
    "../src/components/VisualPreview.tsx",
    "../src/components/WorkspaceSidebar.tsx",
  ];
  const source = (await Promise.all(paths.map(read))).join("\n");
  assert.doesNotMatch(source, /[A-Za-z0-9:/-]+-\[var\(--ui-/);
  assert.match(source, /w-65/);
  assert.match(source, /min-w-45/);
  assert.match(source, /min-h-125/);
  assert.match(source, /max-w-149/);
  assert.match(source, /max-w-400/);
  assert.match(source, /max-h-190/);
});

test("the PDF template keeps full collections instead of display caps", async () => {
  const template = await read("../src/templates/ResumeTemplate.tsx");
  assert.doesNotMatch(template, /\.slice\(/);
  assert.match(template, /minPresenceAhead/);
  assert.match(template, /outputLanguage/);
});

test("nested schema validation is present for every resume collection", async () => {
  const schema = await read("../src/lib/resumeSchema.ts");
  for (const field of ["contact", "summary", "experience", "skills", "education"]) {
    assert.match(schema, new RegExp(field));
  }
  assert.match(schema, /bullets/);
  assert.match(schema, /profiles/);
});
