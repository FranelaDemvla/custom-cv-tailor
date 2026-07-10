# AGENTS.md

## Commands

```sh
npm run dev      # start dev server (default http://localhost:5173)
npm run build    # production build → dist/
npm run lint     # oxlint (react + oxc plugins)
npm run preview  # preview production build locally
```

There is no test script, no typechecking, and no TypeScript in this repo — all source files are `.js` / `.jsx`.

## Environment

Copy `.env.example` to `.env` and configure:

- **Local LLM (default):** `VITE_LLM_BASE_URL` and `VITE_LLM_MODEL`. In dev, the Vite dev server proxies `/api/llm` → the local LLM URL (see `vite.config.js`). In production, `VITE_LLM_BASE_URL` is called directly.
- **OpenAI:** set `VITE_OPENAI_API_KEY` and switch the UI dropdown to "GPT-4o".

All `VITE_*` env vars are bundled client-side at build time — they are not secrets.

## Architecture

Single-page React app with no router:

```
src/
  main.jsx            # entry point
  App.jsx             # root component — holds all state, orchestrates generation flow
  components/
    Header.jsx        # model picker dropdown (local / GPT-4o)
    InputPanel.jsx    # CV & JD textareas, drag-and-drop .docx/.pdf upload
    PreviewPanel.jsx  # idle / loading / success / error states + PDF download button
  services/
    openaiService.js  # LLM call (OpenAI-compatible), JSON schema validation, response cleaning
    parserService.js  # mammoth (.docx) and pdfjs-dist (.pdf) → plain text
    pdfService.jsx    # @react-pdf/renderer blob generation + browser download trigger
  templates/
    ResumeTemplate.jsx # PDF layout: single-column A4, Helvetica, text-based (ATS-friendly)
```

## Key implementation notes

- **Two LLM backends** selected via the `model` state (`'local'` | `'openai'`). The OpenAI client always runs in the browser (`dangerouslyAllowBrowser: true`). In local mode, the Vite proxy rewrites `/api/llm` → the local base URL in dev; in prod it connects directly.
- **JSON schema enforcement:** `openaiService.js` validates the LLM response client-side (contact, summary, experience, skills, education). `cleanJSONResponse()` strips markdown fences because local models often wrap JSON in them.
- **PDF generation** uses `@react-pdf/renderer` — NOT html2canvas or image-based approaches. The PDF is text-selectable (required for ATS).
- **File upload** accepts `.docx` and `.pdf` only. `mammoth` extracts from docx; `pdfjs-dist` is lazy-loaded for PDFs with a Vite URL-based worker setup.
- **Tailwind CSS v4** with the `@tailwindcss/vite` plugin. Theme tokens (`brand-*`, `surface-*`) are defined via `@theme` in `src/index.css` — there is no `tailwind.config.js`.
- **`instructions.md`** is the original design/implementation plan document, not a living spec. The actual code may diverge.