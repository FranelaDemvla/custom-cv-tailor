
---

# Implementation Plan: AI-Driven ATS CV Tailor

## 1. Project Overview
*   **Objective:** An application that takes a raw CV and a Job Description (JD) and generates a tailored, single-page, ATS-friendly PDF.
*   **Tech Stack:** 
    *   **Frontend:** React (Vite), Tailwind CSS.
    *   **AI Integration:** OpenAI API (GPT-4o recommended for high-reasoning tasks).
    *   **PDF Generation:** `@react-pdf/renderer` (essential for text-searchable, ATS-friendly PDFs).
    *   **File Parsing:** `mammoth` (for .docx) and `pdf-parse` (for .pdf).
*   **Design Philosophy:** Minimalist, single-page dashboard, high whitespace, standard fonts (Arial/Helvetica).

---

## 2. Phase-by-Phase Execution

### Phase 1: Environment & Architecture Setup

**Agent Task:** Initialize the project structure and install dependencies.

- Initialize React app using Vite.
- Install dependencies: `tailwindcss`, `lucide-react` (icons), `@react-pdf/renderer`, `openai`, `mammoth`, `clsx`, `tailwind-merge`.
- Configure Tailwind CSS for a clean, professional "SaaS" look.
- **Structure:**
  - `/components`: `InputPanel.jsx`, `PreviewPanel.jsx`, `Header.jsx`.
  - `/services`: `openaiService.js`, `pdfService.js`, `parserService.js`.
  - `/templates`: `ResumeTemplate.jsx` (The actual PDF definition).

### Phase 2: Input & Parsing Engine

**Agent Task:** Create the mechanism to ingest raw data.

- Build an `InputPanel` component with:
  - A Textarea for "Current CV" (manual paste).
  - A Textarea for "Job Description" (manual paste).
  - A File Upload zone (supporting `.docx` and `.pdf`).
- Implement `parserService.js`:
  - Use `mammoth` to extract text from `.docx`.
  - Implement logic to strip unnecessary formatting to send clean text to the AI.

### Phase 3: The AI Orchestrator (The "Brain")

**Agent Task:** Develop the prompt engineering and data transformation logic.

- **Crucial Step:** The AI must NOT return a raw string. It must return a **structured JSON object** to ensure the PDF template doesn't break.
- **Prompt Engineering Strategy:**
  - Instruct the AI to: "Analyze the provided CV and Job Description. Rewrite the CV content to highlight relevant skills and keywords found in the JD while maintaining 100% truthfulness. Output **only** valid JSON."
  - **Expected JSON Schema:**
    ```json
    {
      "contact": { "name": "", "email": "", "phone": "", "location": "" },
      "summary": "Professional summary tailored to the JD...",
      "experience": [
        { "company": "", "role": "", "dates": "", "bullets": ["...", "..."] }
      ],
      "skills": ["skill1", "skill2", "skill3"],
      "education": [{ "institution": "", "degree": "", "year": "" }]
    }
    ```
- Implement `openaiService.js` to handle the API call and error handling.

### Phase 4: ATS-Optimized PDF Rendering

**Agent Task:** Convert JSON to a professional, single-page PDF.

- **Constraint:** Avoid using `html2canvas` or "screenshots" of HTML, as these are invisible to ATS parsers.
- Implement `templates/ResumeTemplate.jsx` using `@react-pdf/renderer`.
- **Formatting Rules:**
  - Use standard fonts (Helvetica/Courier).
  - Strict single-column layout (preferred by older ATS).
  - Standardized section headers: "Experience", "Education", "Skills".
  - Logic to ensure content fits on exactly one page (handle overflows).

### Phase 5: UI Integration & UX Polish

**Agent Task:** Connect the components into a cohesive workflow.

- Create a loading state (e.g., "Analyzing Job Description...", "Optimizing Keywords...").
- Implement a "Split Screen" view:
  - **Left Side:** Input fields.
  - **Right Side:** A live preview or a "Download PDF" action button.
- Add error handling (e.g., "Invalid PDF format," "API Key missing").

---

## 3. Detailed Prompt for the Agent (The "System Instruction")

_If you are handing this to an AI Agent (like AutoGPT or a developer), use this instruction:_

> "Build a React application using Vite and Tailwind CSS. The app's purpose is to take a user's CV text and a Job Description and return a tailored, ATS-optimized PDF.
>
> **Workflow Requirements:**
>
> 1. **Parsing:** Allow users to paste text or upload .docx files. Extract plain text.
> 2. **Intelligence:** Use the OpenAI API. The prompt must demand a strictly structured JSON response following a specific schema (Summary, Experience, Skills, Education). The AI must focus on keyword injection from the JD into the CV context.
> 3. **Output:** Use `@react-pdf/renderer` to generate the PDF. The PDF must be text-based (not an image) to ensure it is readable by ATS. Use a clean, single-column, professional layout.
> 4. **UI:** The interface should be minimal. A dashboard with two input columns and a clear 'Generate & Download' action.
> 5. **Strict Rule:** Do not use heavy libraries. Keep the footprint small. Ensure the AI output is validated against the JSON schema before attempting to render the PDF."

---

## 4. Success Metrics for the Agent

1.  **ATS Test:** The output PDF must allow the user to select/copy text in a PDF viewer.
2.  **Data Integrity:** The AI must not hallucinate experience or degrees not present in the original CV.
3.  **Format Test:** The generated PDF must be exactly one page and fit standard margins.
