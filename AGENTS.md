# AGENTS.md instructions for /Users/josefran/custom-cv

## Commands

    npm run dev       # start dev server (default http://localhost:5173)
    npm run build     # production build -> dist/
    npm run lint      # oxlint
    npm run typecheck # TypeScript validation
    npm run test      # focused pure-function regression checks
    npm run preview   # preview production build locally

The source is TypeScript in src/. Browser persistence and PDF rendering still need browser verification in addition to these checks.

## Environment

Copy .env.example to .env for non-secret local provider defaults. Configure provider keys in the Settings panel. Keys stay in memory for the current page session and are not included in backups.

The local endpoint is called directly in development and production. A local server must allow browser CORS. The app no longer uses a fixed development proxy.

## Architecture

This is a single-page React app with a browser-local document workspace:

    src/
      main.tsx
      App.tsx
      components/
        Header.tsx
        WorkspaceSidebar.tsx
        DocumentToolbar.tsx
        DocumentEditor.tsx
        ProviderSettingsDialog.tsx
        InputPanel.tsx
        Resume*Editor.tsx
        VisualPreview.tsx
      hooks/
        useDocuments.ts
        useTheme.ts
      services/
        documentRepository.ts
        llmService.ts
        parserService.ts
        pdfService.tsx
      templates/
        ResumeTemplate.tsx

## Key implementation notes

- CV documents live in IndexedDB and use schema validation plus revision checks. A small JSON backup path is available from the library sidebar.
- Provider configuration is runtime state. OpenAI and local credentials are provider-scoped, memory-only, and never serialized.
- The local provider uses a user-entered OpenAI-compatible base URL directly. The OpenAI provider supports Chat Completions and Responses transport selection.
- Generated resume data is validated deeply before it can replace the current document.
- PDF export uses text-based @react-pdf/renderer. The visible PDF preview and download share the same blob-producing function.
- PDF page layout does not silently slice sections. It wraps to additional pages, with built-in Helvetica or Times-Roman fonts and four curated accents.
- Tailwind CSS v4 is configured through the @tailwindcss/vite plugin. Semantic UI tokens support light, dark, and system themes; CV page colors remain independent.
- File upload accepts DOCX and PDF. mammoth extracts DOCX text and pdfjs-dist extracts PDF text.
