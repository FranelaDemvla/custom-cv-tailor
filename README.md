# Custom CV Tailor

A single-page React app that tailors your CV to a job description using an LLM (local or OpenAI) and generates an ATS-friendly PDF.

> I made this project mainly for myself with the goal of testing **DeepSeek v4** with agent workflows using **OpenCode** as my harness. It has the option of using OpenAI models to generate the CV but I'm using it mainly with local models. My setup for local LLMs is **LM Studio** running **google/gemma-4-26b-a4b-qat** on an M4 Macbook Pro with 24GB of RAM. Testing the ouput on ATS analyzers such as Toptal I'm getting 80%-90% with this setup, your mileage may vary

> It needs more polish and feature work before deploying it, but if all you need is running this locally (which is the use case this project was designed for, hence the option for local LLMs being the default) it should to the trick.

> BTW DeepSeek is kinda underrated, I enjoy not being a slave of Claude rate limits.

## How to run locally

```sh
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## LLM setup

Copy `.env.example` to `.env` and configure:

| Variable              | Description                                    |
| --------------------- | ---------------------------------------------- |
| `VITE_LLM_BASE_URL`   | Local LLM endpoint (e.g. LM Studio, Ollama)    |
| `VITE_LLM_MODEL`      | Model name for the local endpoint              |
| `VITE_OPENAI_API_KEY` | OpenAI API key (only needed when using GPT-4o) |

In dev mode, the Vite proxy rewrites `/api/llm` to your local LLM URL.

## Commands

| Command           | Description                 |
| ----------------- | --------------------------- |
| `npm run dev`     | Start dev server            |
| `npm run build`   | Production build to `dist/` |
| `npm run preview` | Preview production build    |
| `npm run lint`    | Run oxlint                  |

## Usage

1. Paste your CV and a job description into the input panel (or upload `.docx`/`.pdf` files).
2. Select a model (Local or GPT-4o) in the header.
3. Click generate — the app calls the LLM to rewrite your CV to match the job.
4. Review the result and download it as a PDF.
