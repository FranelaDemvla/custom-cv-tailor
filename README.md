# Custom CV Tailor

Custom CV Tailor is a browser-local workspace for keeping several CV versions, tailoring them with a local or OpenAI-compatible model, editing the structured result, styling the page, and exporting a text-based PDF.

The library lives on the current browser and device. There are no accounts or cross-device sync in this iteration.

## Run locally

    npm ci
    npm run dev

Open http://localhost:5173.

Use Node.js 24 and npm. The committed `package-lock.json` is the deployment lockfile.

## Provider setup

Copy .env.example to .env when you want initial defaults for a local server:

    VITE_LLM_BASE_URL=http://127.0.0.1:1234/v1
    VITE_LLM_MODEL=your-local-model-id

Then open Settings in the app. Local and OpenAI credentials are entered there, used only for the current page session, and excluded from JSON backups.

The local provider expects an OpenAI-compatible HTTP API with browser CORS enabled. The URL is used directly in development and production. OpenAI model discovery uses the account API key and does not run a billed generation request.

## Workspace behavior

- New CV creates an independent draft immediately.
- Source, Content, and Style tabs keep the source text, structured edits, and page styling together.
- Switching documents restores each document's source, content, style, provider choice, and saved edits.
- Delete has an undo action. Duplicate creates a new editable document.
- Export backup writes editable documents to JSON without credentials. Import validates the input and creates new IDs.
- The preview uses the same PDF blob generator as Download PDF, so the visible page and export share content and style.
- The CV language is stored per document. Changing the interface language does not change an existing export.

## Offline use

Open the production app online once and wait for "Ready for offline use". After that, you can reopen or refresh the same URL without a connection, create and edit CVs, switch documents, import DOCX/PDF files or JSON backups, and export PDFs or backups. The production service worker caches all built assets, including the PDF worker and lazy chunks. Development mode does not install that cache. Test offline behavior with `npm run build` followed by `npm run preview`.

Edits save to IndexedDB on this browser and device after a short debounce. "Saved" means the storage transaction completed. The app also starts flushing pending edits when a tab is hidden and warns before leaving with unsaved changes. Wait for "Saved" before closing. A forced browser shutdown can interrupt a pending write.

Your library contains extracted source text and editable CV data. Uploaded DOCX/PDF binaries are not retained or modified. JSON backups preserve editable documents; exported PDFs contain the rendered CV. Browser data clearing, private browsing, or storage eviction can remove the library and offline cache. Keep JSON backups, especially before changing the app's domain or port. Documents belong to the original browser origin.

AI generation requires a reachable provider. OpenAI requires an internet connection; a local model can work without internet if its server is reachable and permits browser requests. Offline saving and editing require no provider or API key.

App updates download in the background and activate after all tabs for the app close. An update does not force a reload while editing. Reopen while online to receive a new release. The service worker caches only app files, never provider responses, API keys, or CV documents.

## Deploy

This app deploys as static files. No application server or cloud document database is required for the current personal browser workspace.

1. Use Node.js 24. Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm audit --omit=dev --audit-level=high`, and `npm run build`.
2. Publish the complete `dist/` directory, including `sw.js` and `assets/*.mjs`, at an HTTPS origin. HTTPS or localhost is required for service workers. Choose the permanent origin before importing an existing library.
3. Serve `index.html` and `sw.js` with `Cache-Control: no-cache`; hashed `assets/*` can use `Cache-Control: public, max-age=31536000, immutable`. Serve JavaScript and `.mjs` with a JavaScript MIME type. Serve missing assets as 404 rather than rewriting them to HTML. Upload assets before the new HTML/service worker, or use an atomic release.
4. For a subdirectory deployment, build with `npm run build -- --base=/your-path/` and serve that directory. The worker and cache follow that scope.
5. Run the browser checks against the production URL. Verify offline reload after "Ready for offline use", then test the intended local/OpenAI providers from that origin. Local-server CORS and browser local-network permissions must allow the deployed origin.

Do not provision a shared API key in a `VITE_*` variable. Those values enter the public bundle. The current Settings panel accepts each user's credentials in memory. A managed multi-user service with centrally held provider credentials needs a backend before release.

See [deployment-readiness.md](deployment-readiness.md) for the review findings, verification results, and remaining release checks.

## Commands

    npm run dev
    npm run build
    npm run lint
    npm run typecheck
    npm run test
    npm run preview

The test script covers document save ordering and recovery, resume schema behavior, skill ordering, filenames, and the production offline cache. CI runs the checks, audit, and build on pushes and pull requests.

To run browser regressions with the Playwright CLI, open the production preview first, then run:

    playwright-cli open http://localhost:4173
    playwright-cli run-code --filename=scripts/browser-offline-check.js
    playwright-cli run-code --filename=scripts/browser-storage-check.js
    playwright-cli run-code --filename=scripts/browser-recovery-check.js

These scripts use isolated contexts and synthetic CVs. The offline script disconnects its context and verifies offline editing, reopening, imports, PDF rendering, and downloads. The storage script simulates failed storage reads/writes and retries. The recovery script checks conflicting edits across tabs. Live provider CORS and browser differences still need checks against the selected host.

See overhaul-plan.md for the full implementation and acceptance checklist.
