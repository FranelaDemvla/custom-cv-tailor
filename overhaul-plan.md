# CV workspace overhaul

Status: planned, not implemented. Written 2026-09-07 following repository inspection.

Scope update: previous-content restoration was removed at the user's request. Regeneration still preserves current content until a valid result is ready.

## Outcome and scope

Turn the current generation screen into a workspace for maintaining several CVs. Users can create a draft, configure an LLM, generate content, edit it, customize its appearance, export a PDF, and return later to continue.

Locked decision, user, 2026-09-07: save CVs on the current browser/device. Accounts and cross-device synchronization are outside this iteration.

The other requested outcomes are UI configuration for OpenAI and local LLMs, a history sidebar and New button, a revised editing flow, professional CV styling, and light/dark UI themes. The implementation choices below are proposals, not additional user decisions.

## Verified findings

| Area | Current implementation | Consequence for this work |
| --- | --- | --- |
| Application | `src/App.tsx` owns one set of inputs, generated content, layout, and request status in memory. | Refresh loses the CV. State must move into individually identified documents. |
| Editing | `src/components/Resume*Editor.tsx` already supports contact, summary, experience, skills, education, padding, and font scale. | Reuse these editors inside the new workspace. |
| Models | `src/services/openaiService.ts` reads build-time settings, fixes OpenAI to `gpt-4o`, and uses Chat Completions with a fixed temperature. | A dynamic model picker requires runtime configuration and compatible request parameters. |
| Local endpoint | `vite.config.ts` hardcodes the development proxy target to `http://127.0.0.1:1234/v1`. Production calls the configured URL directly. | Changing a field in the UI would currently have no effect on the development proxy. |
| Validation | `validateSchema` checks required top-level fields and arrays, but does not validate their nested contents. | Saved records and responses from different models need deeper validation. |
| PDF | `src/templates/ResumeTemplate.tsx` and `src/components/VisualPreview.tsx` independently implement layout and cap experience, bullets, education, and summary length. | Customization would drift between renderers; long CVs silently lose visible/exported content. |
| Language | English and Spanish resources exist. Generation and PDF labels read global UI language. | A saved CV needs its own output language so reopening it under another UI language does not change its PDF. |
| Tooling | Source uses TypeScript, with `tsconfig.json`; package scripts expose build and lint, but no tests or typecheck command. | Preserve TypeScript and correct the stale JavaScript description in AGENTS.md during implementation. |

These are code inspection findings. No runtime, build, or test results are claimed for this planning task. `instructions.md` remains the historical design document.

## Proposed user experience

Use a document workspace with a narrow history sidebar, a focused editor, and a persistent preview. Keep one visible editor while retaining independent drafts and edits for every CV. Switching documents does not reset either one.

```text
+----------------------+---------------------------------------------------+
| Custom CV            | Frontend engineer CV   Saved        Download PDF |
| [ + New CV ]         | Local / selected model                Settings   |
| Search CVs           +--------------------------+------------------------+
|                      | Source | Content | Style | PDF preview            |
| Frontend engineer    |                          |                        |
|   Edited today       | Fields for selected tab  | White A4 pages         |
| Product engineer     |                          |                        |
|   Draft              |                          | Page 1 of 2, zoom      |
| General CV           |                          |                        |
|                      | Generate / Regenerate    |                        |
| Theme / Language     |                          |                        |
+----------------------+--------------------------+------------------------+
```

1. On first use, show an empty library with New CV. On return, reopen the last active document when it still exists.
2. New CV creates and saves an independent draft immediately. Source contains CV upload/paste, optional job description, output language, and the existing Tailor/Format mode.
3. Provider settings are available without leaving the draft. A missing configuration links directly to the relevant settings panel. Manual editing and PDF export remain usable without an LLM connection.
4. Successful generation opens Content. Existing section editors update the document and preview. Style contains only CV appearance settings.
5. Selecting a sidebar item restores its inputs, edited content, style, and selected editor tab. Rows show title, last edit time, and draft/generation state. Opening a CV alone does not reorder the history.
6. Add rename, duplicate, and delete actions. Duplicate supports tailoring the same starting CV to another job. Delete offers undo. Regenerate preserves the current content until a valid result is ready.
7. Download PDF exports the current document. The history stores editable CV documents, with PDFs recreated from them on demand. An archive of every exported binary is outside this iteration.
8. On smaller screens, collapse history into a drawer and switch between editor and preview. Do not squeeze all three panes into a phone viewport.

The visual direction is a practical document desk. The white A4 preview is the main visual element; the surrounding controls stay compact. A section navigator mirrors the CV's actual sections, so navigation serves editing rather than decoration. Avoid a dashboard of large cards.

Proposed starting tokens: paper `#FFFFFF`, light workspace `#F3F5F8`, light text `#202938`, dark workspace `#171C25`, dark panel `#232B38`, action blue `#315DA8`. Use system sans for controls and document titles, with restrained Georgia serif typography for the empty-library heading. Final contrast and responsive sizing need visual verification during implementation.

## Architecture and data boundaries

Keep React, TypeScript, Vite, Tailwind v4, the existing import parsers, and `@react-pdf/renderer`. Introduce focused hooks and a document repository rather than adding a framework rewrite or a global state dependency by default.

| State | Proposed contents | Storage |
| --- | --- | --- |
| CV document | ID, schema version, title, created/updated timestamps, revision, source text and filenames, job description, mode, output language, editable `ResumeData`, style, provider/model preference, last export metadata | IndexedDB |
| App preferences | Default provider/model, local endpoint, UI theme, UI language, last active ID | Small versioned preferences record; localStorage for theme bootstrapping |
| Credentials | Separate OpenAI and optional local API keys | Memory for the current page session by default |
| Runtime | Active tab, saving/error state, request IDs, abort controllers, generated preview URLs | Memory; never serialize controllers or object URLs |

IndexedDB supports structured browser storage and fits a library of independently updated documents. Keep it behind `src/services/documentRepository.ts` with explicit schema upgrades and record validation. Browser storage belongs to an origin, so changing the app's host or port can make the existing library appear absent. [IndexedDB documentation](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).

Persist extracted source text and filenames, not uploaded PDF/DOCX binaries by default. Add a versioned JSON backup/export and import for editable documents, excluding credentials. This gives users a way to recover or transfer work if browser data is cleared. Treat backup import as untrusted input and import into new IDs rather than silently overwriting matching records.

## Phase 1: document persistence and request ownership

Locations: `src/types.ts`, `src/App.tsx`; new `src/services/documentRepository.ts`, `src/hooks/useDocuments.ts`, and `src/hooks/useGeneration.ts`.

- Define `CVDocument`, `ProviderSettings`, `ResumeStyleOptions`, and versioned preferences. Separate document content, request status, and export errors. An export failure must not hide the editor.
- Implement create/read/update/list/duplicate/delete/restore. Sort by meaningful edits. Validate nested CV data and style values on read and import; isolate a malformed record without discarding the rest of the library.
- Update in-memory document state immediately; debounce serialized saves per document. Flush pending saves before in-app switching, exports, or destructive actions. Show Saving, Saved, or Save failed based on actual persistence results. Preserve unsaved data for retry/backup on storage failure; warn before leaving with pending writes.
- Use document revision checks to detect writes from another browser tab and offer reload or save-as-copy rather than silently overwriting them.
- Capture document ID, input revision, output language, and provider configuration when generation starts. Apply results only to that request's document. A response for a deleted document must not recreate it.
- Allow browsing and editing other documents during generation. Start with one active generation at a time, with Cancel; this avoids overloading the local model. If the original document changes during the request, retain its edits and offer the generated result as a separate copy.
- Keep the last valid CV through failures and cancellations. On reload, mark interrupted requests as interrupted; never automatically resubmit them.

Definition of done: create two CVs, edit both, switch repeatedly, reload, and recover both exactly. A delayed response for CV A never changes CV B. Storage failure and stale revisions never display a false Saved state. Deletion, cancellation, and failed regeneration preserve the intended document state.

## Phase 2: provider settings and dynamic model selection

Locations: `src/services/openaiService.ts`, `src/components/Header.tsx`, `src/env.d.ts`, `.env.example`, `vite.config.ts`; new `src/components/ProviderSettingsDialog.tsx`, `src/services/llmService.ts`, and provider adapters under `src/services/providers/`.

OpenAI settings:

- Provide a masked API-key field with reveal, replace, and clear controls. Test connection and Refresh models use the entered key. Changing credentials invalidates the old model-list cache and connection result.
- Populate a searchable picker using the account's available models. Also accept an explicit model ID so new or restricted models are not blocked by a hardcoded list. Model discovery returns basic metadata, not a complete capability description. [OpenAI model listing](https://developers.openai.com/api/reference/resources/models/methods/list).
- Interpret model support as models capable of generating the required text/JSON CV. Known image, audio, and embedding-only models should be explained as incompatible. Unknown model IDs remain selectable with compatibility unverified.
- Use an adapter that chooses Responses or Chat Completions through an explicit capability policy, with an advanced endpoint override for unknown IDs. OpenAI recommends Responses for new integrations while continuing to support Chat Completions. Do not assume every model accepts the current fixed temperature or JSON settings. [OpenAI migration guidance](https://developers.openai.com/api/docs/guides/migrate-to-responses).
- Use structured output where supported, with prompt-based JSON plus strict client validation for other text models. Handle refusal, incomplete output, inaccessible models, and invalid nested data without replacing the last valid document. Set `store: false` for OpenAI requests; this is not a claim of zero provider retention. [OpenAI storage setting](https://developers.openai.com/api/docs/guides/migrate-to-responses).

Local settings:

- Provide base URL, model ID, optional API key, Test connection, and Refresh models. Retain manual entry when the server does not implement model listing. Target OpenAI-compatible local servers in this iteration.
- Make the entered endpoint authoritative immediately. Proposed transport is direct browser requests in both development and production; remove the fixed development proxy from this path. Normalize trailing slashes and document the expected API base path rather than blindly appending duplicate `/v1` segments.
- Validate HTTP/HTTPS URLs, reject embedded credentials, and show useful connection diagnostics. Browser CORS rules and, depending on origin/target, mixed-content or local-network restrictions still apply. A static page cannot bypass those restrictions. [Browser mixed-content rules](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content).
- Keep a same-origin backend bridge as a separate follow-up if unrestricted endpoint access or managed key storage is required. Do not introduce a development-only workaround that fails after building.

Shared behavior:

- Separate provider identity from model ID. Keep credentials scoped to their provider; an OpenAI key must never be reused for a user-entered local URL. Settings changes affect future requests, not the request already running.
- Connection tests should identify what was checked. Successful model listing is not proof that generation works. Do not run billed generation automatically just to populate a dropdown, and do not silently change the selected model after an error.
- Propose memory-only keys for this iteration, with clear copy that reload requires re-entry. Save non-secret configuration. Remove `VITE_OPENAI_API_KEY` and local key build-time usage; retain non-secret endpoint/model variables only as initial defaults.
- This browser BYOK approach preserves the app's personal-use architecture, but keys remain accessible to code running in that page. OpenAI recommends server-side key handling. A hosted multi-user product should use that architecture; memory-only storage is not a secret vault. [OpenAI authentication guidance](https://developers.openai.com/api/reference/overview).

Definition of done: configure both providers entirely in the UI, select a discovered or manually entered compatible model, and generate without editing `.env`. Test invalid keys, restricted model listing, unavailable models, incompatible parameters, local connection failures, and configuration changes mid-request. CV backups, saved records, logs, and build output contain no provisioned keys.

## Phase 3: workspace shell and history

Locations: `src/App.tsx`, `src/components/Header.tsx`, `src/components/InputPanel.tsx`, `src/components/PreviewPanel.tsx`, existing section editors; new `WorkspaceSidebar.tsx`, `DocumentToolbar.tsx`, and `DocumentEditor.tsx` under `src/components/`.

- Implement the proposed sidebar, title editing, search, document actions, and Source/Content/Style editor tabs against the repository from phase 1.
- Move the current below-the-preview editor into the main editing pane. Keep generation, saving, and export states visible without displacing valid content.
- Open new documents in Source and generated documents in Content. Make a blank structured editor available for manual entry as well.
- Show the selected provider/model near Generate, with detailed configuration in Settings. New documents inherit defaults; existing documents retain their selected provider/model and style.
- Preserve file drag-and-drop and both Tailor/Format modes. Missing provider setup should not block importing, reopening, or editing.
- Replace timer-based claims of completed generation stages with honest pending status and cancellation.
- Implement keyboard access, focus restoration after dialogs, labeled icon buttons, responsive history drawer, and mobile editor/preview switching.

Definition of done: a user can create, name, generate, edit, duplicate, reopen, and export several CVs without losing context. The same flow works with keyboard navigation and on a phone-sized viewport.

## Phase 4: professional CV styling and accurate preview

Locations: `src/types.ts`, `src/components/ResumeLayoutEditor.tsx`, `src/components/VisualPreview.tsx`, `src/templates/ResumeTemplate.tsx`, `src/services/pdfService.tsx`; new `src/lib/resumeStyles.ts`.

- Extend the existing layout model with curated font and accent IDs. Start with Helvetica and Times-Roman, including their correct bold variants. Both are built-in renderer fonts; verify English/Spanish accents and representative names in exported text. [React PDF fonts](https://react-pdf.org/docs/v4/fonts).
- Offer charcoal `#27272A`, navy `#243B53`, dark teal `#245B59`, and burgundy `#653747`. Apply accents to the name, headings, and rules. Keep body text dark on white paper and preserve a single-column reading order with standard section labels.
- Retain bounded padding and size controls, but revise ranges around readable printed text. Provide Reset style. Avoid decorative fonts, photos, skill meters, arbitrary positioning, and color-only meaning.
- Remove silent slices of summary, experience, bullets, and education. Allow page wrapping and additional pages rather than shrinking text indefinitely or deleting content. Prefer keeping headings with the following content while allowing long sections to wrap. [React PDF advanced layout](https://react-pdf.org/docs/v4/advanced).
- Refactor PDF generation into a blob-producing function shared by preview and download. Replace the duplicate HTML approximation with a preview of the actual generated PDF; use the existing PDF.js dependency for page rendering where native viewing is unsuitable. Preview rendering does not change the text-based PDF export.
- Debounce preview generation, keep the last good preview while updating, discard stale render results by document/revision, and release replaced object URLs and render tasks. Export waits for the current revision rather than downloading a stale preview.
- Pass the document's output language explicitly to generation and PDF section labels. Changing the UI language must not translate an existing CV or change its export.

Definition of done: every preset produces readable, selectable text. A long fixture includes its final role, bullet, education entry, and full summary in extracted PDF text. Preview and download use the same content/style revision and show the same page count. Changing a CV's style does not affect another CV.

## Phase 5: UI themes and localization

Locations: `src/index.css`, `index.html`, app shell and all editor/settings components, `src/i18n/resources/en.json`, `src/i18n/resources/es.json`; new `src/hooks/useTheme.ts`.

- Add Light, Dark, and System preferences. Default to System until the user chooses. Persist the choice and apply it before initial paint to avoid a light flash.
- Introduce semantic UI colors for workspace, panel, text, muted text, borders, controls, focus, and status. Replace hardcoded white/gray UI classes across the existing editors and upload/error states.
- Scope theme tokens to the interface. Keep the CV page background explicitly white and its PDF colors independent of UI preferences.
- Translate new settings, document actions, save states, and errors into English and Spanish. Use typed error categories rather than detecting API-key failures from English message text.
- Check contrast, focus visibility, reduced motion, long translated labels, and system theme changes while the app is open.

Definition of done: all workspace/settings states work in both themes and languages. Theme changes leave CV styling and exported content unchanged, and the preference survives reload.

## Phase 6: regression checks and documentation

Locations: `package.json`, a small new test suite, `README.md`, `AGENTS.md`, `.env.example`.

- Add a minimal test setup for persistence, stale generation responses, schema validation, and provider requests. Use synthetic CVs and mocked providers, with browser storage exercised in a real browser for persistence checks. Avoid live API calls in automated checks.
- Add a typecheck script using the installed TypeScript compiler. Keep the existing lint/build commands. Record any pre-existing failures separately before implementation.
- Add focused browser coverage for create A/create B/switch/reload, regeneration failure, delete during generation, settings changes, and switching theme while exporting.
- Use a short and a long CV fixture in English and Spanish for PDF text extraction and visual inspection. Cover long URLs, missing optional fields, and all font/accent presets. Text extraction verifies preservation and reading order; it does not guarantee a particular ATS score.
- Update setup instructions for UI configuration, memory-only keys, local endpoint requirements, browser-local history, backups, and new commands. Correct stale source extensions and proxy behavior in AGENTS.md. Link this plan from README when implementation begins.

Definition of done: the core multi-document flow has deterministic regression coverage, PDF content is complete, both providers have bounded smoke-check results, and setup docs match the shipped behavior.

## Delivery order and verification

Implement phases 1 through 6 as separate reviewable changes. The document model comes first because history, generation ownership, and styling depend on it. Start semantic theme tokens with the workspace shell to avoid styling the new UI twice; finish the theme audit in phase 5.

Run the current checks from the repository root:

```sh
npm run lint
npm run build
```

After adding the planned scripts, also run `npm run typecheck` and `npm run test`. Test the built app with `npm run preview`, including direct local endpoint configuration, so the development proxy cannot hide a production failure.

Final acceptance walkthrough:

1. Configure a local endpoint and an OpenAI key in the UI. Discover models and use manual model entry. Verify provider-specific error recovery.
2. Create three CVs, generate at least two, edit their content and styles independently, switch between them, and reload. Confirm all saved values return.
3. Start generation in A, edit B, cancel or finish A, and confirm B is untouched. Repeat with A deleted and with A edited while its request is pending.
4. Verify duplicate, rename, delete/undo, JSON backup/import, storage failure, and a conflicting update from a second browser tab.
5. Export long and short CVs under light and dark UI themes. Inspect page layout and extract text to verify completeness and ordering.
6. Repeat the main workflow in Spanish, with keyboard navigation and narrow screens. Confirm changing UI language does not change a saved CV's language.

Out of scope for this iteration: accounts, sync, cloud document storage, collaboration, simultaneous visible editors, batch LLM generation, a full revision timeline, Word export, custom template builders, arbitrary font uploads, and a public deployment. The existing LLM provider still receives the source text needed for generation; browser-local history does not imply offline generation when OpenAI is selected.
