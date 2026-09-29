# Deployment readiness review

Reviewed on September 29, 2026.

The project is ready for a personal static deployment after the host and provider checks below. Offline saving and editing passed in Chromium against the production build. This review did not publish the app or call a live AI provider.

## Gaps fixed

| Finding                                                                                                       | Change                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Locally saved documents could not be reopened reliably without internet because the app had no offline shell. | The production build now emits a versioned service worker that precaches every app asset, including lazy modules and the PDF worker. The UI reports when offline access is ready.                 |
| Backup import reloaded the app and could discard pending edits.                                               | Import flushes pending edits, adds imported documents to the current workspace, and keeps the page open. A single storage transaction commits the whole import or rolls it back.                  |
| Failed library reads could appear as an empty library.                                                        | Storage read failures show an error with Retry. The app does not expose an empty, writable library until storage loads successfully.                                                              |
| Mobile backgrounding could leave edits in the debounce window.                                                | Visibility and page-hide events start flushing pending writes. The existing unload warning still protects unsaved or conflicting edits.                                                           |
| Four dependencies had high-severity security advisories.                                                      | Updated PDF.js, xmldom, nanoid, and PostCSS through compatible patches in the npm lockfile. PDF.js now requires at least the patched installed release. Final audit reports zero vulnerabilities. |
| Several editor labels had no association with their fields, and the mobile PDF button had no accessible name. | Labels now target unique input IDs. The PDF button has an accessible name. Removed a nonfunctional More actions button.                                                                           |
| The initial application bundle eagerly included PDF rendering and DOCX parsing.                               | These libraries load when needed. Initial JavaScript dropped from about 2.13 MB to 395 KB, or 122 KB gzipped. The offline cache includes their deferred chunks.                                   |
| PDF workers were not consistently released after use.                                                         | Import and preview release the PDF loading task with the installed library's typed API.                                                                                                           |
| Build and release checks were manual.                                                                         | Added GitHub CI for npm install, lint, types, tests, production dependency audit, and build. Added reproducible browser checks and deployment instructions.                                       |

## Verification

| Check                                       | Result                                                                                                                                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clean `npm ci` using the committed lockfile | Passed with Node.js 24                                                                                                                                                                                |
| `npm run lint`                              | Passed without warnings                                                                                                                                                                               |
| `npm run typecheck`                         | Passed                                                                                                                                                                                                |
| `npm run test`                              | All five test files passed                                                                                                                                                                            |
| `npm run build`                             | Passed and emitted `sw.js`; a size warning remains for the deferred PDF renderer                                                                                                                      |
| `npm audit`                                 | Zero vulnerabilities, including development dependencies                                                                                                                                              |
| Offline browser regression                  | Passed with the browser context disconnected before the first CV was created                                                                                                                          |
| Offline document operations                 | Create, rename, edit source and structured content, persist style, switch independent CVs, refresh, close and reopen a tab, duplicate, delete, and undo passed                                        |
| Offline file operations                     | DOCX import, PDF import, JSON backup export/import, and PDF download passed                                                                                                                           |
| PDF preservation                            | A two-page fixture retained the accented name and final role marker in extracted text. Inspected the rendered preview.                                                                                |
| Storage failures                            | Failed writes retained local edits for backup and retry. Retry and background flush persisted edits. A failed backup import left no partial records. Failed initial reads showed a recoverable error. |
| Cross-tab conflicts                         | Unload warning, save as copy, reload saved version, and subsequent editing passed                                                                                                                     |
| Narrow screen                               | Editing, saving, reload, and accessible PDF action passed at 390 px width                                                                                                                             |

The browser regressions are `scripts/browser-offline-check.js`, `scripts/browser-storage-check.js`, and `scripts/browser-recovery-check.js`. They use isolated contexts and synthetic data. Browser checks are available to run manually; the GitHub workflow currently runs the command-line checks only.

The offline cache unit tests verify the generated asset list, content-based release versions, subdirectory navigation, cache cleanup restricted to the app's scope, and exclusion of provider requests and writes.

## Remaining release checks

1. Choose the permanent HTTPS origin and publish the complete `dist/` directory. Serve HTML and `sw.js` with revalidation, hashed assets with long-lived caching, and `.mjs` files with the correct MIME type. Use atomic releases or publish assets before HTML and the worker. Service workers require HTTPS or localhost. [Browser service worker requirements](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).
2. Repeat offline reload and reopen on the actual production URL after the app reports readiness. Verify that host redirects and caching headers preserve the worker scope. The build plugin supports a Vite base path; subdirectory behavior has unit coverage but has not been checked against a hosted subdirectory.
3. Test the intended local/OpenAI provider from that production origin, including connection failure and successful generation. No live provider credentials were supplied for this review. Local-provider CORS and browser local-network permissions remain specific to the deployment and server.
4. Repeat the core workflow on Safari/iOS and Firefox if those browsers are part of the release target. This review used Chromium, including a narrow viewport. It did not run a full screen-reader, keyboard, or bilingual acceptance audit.
5. If the release is a managed multi-user product with shared provider credentials, add a backend for those credentials first. The current app is a personal browser workspace with user-supplied, memory-only credentials.

## Operating limits and follow-ups

- A first online visit must finish caching before offline reopening is available. The status banner reports readiness or a failure. Development mode intentionally does not install a service worker.
- AI generation requires a reachable provider. Editing, saving, file imports, and exports do not require AI access.
- Documents live in browser storage, scoped to the app origin. Clearing browser data, private browsing, and storage eviction can remove them. JSON backups are the recovery and transfer path; there is no cloud sync.
- Uploaded DOCX/PDF binaries are not retained or edited in place. The app saves extracted text and structured CV data. PDF extraction requires text in the PDF; there is no OCR for scanned images.
- Wait for Saved before closing. Background flushing and unload warnings reduce the risk of losing pending edits, but they cannot guarantee a commit during a browser crash or forced process termination.
- New app releases activate after existing app tabs close. There is no forced refresh while editing. [Service worker update lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).
- The deferred PDF renderer remains large. Further splitting or reducing it is a performance follow-up, not an offline persistence blocker.
- The existing `overhaul-plan.md` records the earlier design and acceptance scope. This review does not claim every item in that plan has received browser acceptance coverage.
- The existing untracked `pnpm-lock.yaml` was left unchanged. Deployment instructions and CI use the tracked npm lockfile. Align the lockfiles before changing the deployment package manager.

For exact deployment commands and browser-regression commands, see [README.md](README.md).
