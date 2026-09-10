# Custom CV Tailor

Custom CV Tailor is a browser-local workspace for keeping several CV versions, tailoring them with a local or OpenAI-compatible model, editing the structured result, styling the page, and exporting a text-based PDF.

The library lives on the current browser and device. There are no accounts or cross-device sync in this iteration.

## Run locally

    npm install
    npm run dev

Open http://localhost:5173.

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

## Commands

    npm run dev
    npm run build
    npm run lint
    npm run typecheck
    npm run test
    npm run preview

The test script covers pure provider URL and nested resume schema behavior. Browser checks remain important for IndexedDB persistence, provider CORS, PDF viewing, keyboard navigation, and narrow screens.

See overhaul-plan.md for the full implementation and acceptance checklist.
