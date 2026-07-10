import OpenAI from 'openai'
import type { ResumeData, Model } from '../types'

const JSON_SCHEMA = {
  contact: { name: '', email: '', phone: '', location: '' },
  summary: '',
  experience: [] as unknown[],
  skills: [] as string[],
  education: [] as unknown[],
}

const SYSTEM_PROMPT = `You are an expert CV/resume tailoring assistant. Your task is to rewrite a candidate's CV to match a specific job description by highlighting relevant skills, experience, and keywords found in the JD.

CRITICAL RULES:
1. You must maintain 100% truthfulness. Never invent experience, skills, degrees, or achievements not present in the original CV.
2. Only reorder, rephrase, and emphasize existing content. Remove or de-emphasize irrelevant content.
3. Inject relevant keywords and phrases from the JD naturally into the existing experience and summary.
4. Output ONLY valid JSON — no markdown, no code fences, no explanatory text.

JSON SCHEMA (return exactly this structure):
${JSON.stringify(JSON_SCHEMA, null, 2)}`

function validateSchema(data: unknown): asserts data is ResumeData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response: not a JSON object')
  }

  const record = data as Record<string, unknown>

  const required = ['contact', 'summary', 'experience', 'skills', 'education']
  for (const key of required) {
    if (!(key in record)) {
      throw new Error(`Invalid response: missing required field "${key}"`)
    }
  }

  if (!record.contact || typeof record.contact !== 'object') {
    throw new Error('Invalid response: "contact" must be an object')
  }

  if (typeof record.summary !== 'string') {
    throw new Error('Invalid response: "summary" must be a string')
  }

  if (!Array.isArray(record.experience)) {
    throw new Error('Invalid response: "experience" must be an array')
  }

  if (!Array.isArray(record.skills)) {
    throw new Error('Invalid response: "skills" must be an array')
  }

  if (!Array.isArray(record.education)) {
    throw new Error('Invalid response: "education" must be an array')
  }
}

function cleanJSONResponse(text: string): string {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

const LOCAL_CONFIG = {
  get baseURL() {
    if (import.meta.env.PROD) {
      return import.meta.env.VITE_LLM_BASE_URL || 'http://127.0.0.1:1234/v1'
    }
    return window.location.origin + '/api/llm'
  },
  get apiKey() {
    return import.meta.env.VITE_LLM_API_KEY || 'lm-studio'
  },
  get model() {
    return import.meta.env.VITE_LLM_MODEL || ''
  },
}

const OPENAI_CONFIG = {
  baseURL: null as string | null,
  apiKey: import.meta.env.VITE_OPENAI_API_KEY as string | undefined,
  model: 'gpt-4o',
}

interface LLMConfig {
  baseURL: string | null;
  apiKey: string;
  model: string;
  isLocal: boolean;
}

function getLLMConfig(modelPreference: Model): LLMConfig {
  if (modelPreference === 'openai') {
    if (!OPENAI_CONFIG.apiKey) {
      throw new Error(
        'OpenAI API key not configured. Set VITE_OPENAI_API_KEY in your .env file.'
      )
    }
    return { ...OPENAI_CONFIG, apiKey: OPENAI_CONFIG.apiKey, isLocal: false }
  }

  return { ...LOCAL_CONFIG, isLocal: true }
}

interface ChatCompletionParams {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  response_format?: { type: string };
}

export async function tailorCV(cvText: string, jobDescription: string, modelPreference: Model = 'local'): Promise<ResumeData> {
  if (!cvText || !cvText.trim()) {
    throw new Error('CV text is required')
  }

  if (!jobDescription || !jobDescription.trim()) {
    throw new Error('Job description is required')
  }

  const { baseURL, apiKey, model, isLocal } = getLLMConfig(modelPreference)

  if (!apiKey) {
    throw new Error(
      'API key is required. Set VITE_OPENAI_API_KEY for OpenAI or configure VITE_LLM_BASE_URL for a local model.'
    )
  }

  const openai = new OpenAI({
    apiKey,
    baseURL: baseURL || undefined,
    dangerouslyAllowBrowser: true,
  })

  const params: ChatCompletionParams = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `CURRENT CV:\n"""\n${cvText.trim()}\n"""\n\nJOB DESCRIPTION:\n"""\n${jobDescription.trim()}\n"""\n\nTailor the CV to this job description. Return ONLY valid JSON following the schema exactly.`,
      },
    ],
    temperature: 0.3,
  }

  if (!isLocal) {
    params.response_format = { type: 'json_object' }
  }

  const response = await openai.chat.completions.create(params)

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from LLM')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(cleanJSONResponse(content))
  } catch {
    throw new Error('Failed to parse LLM response as JSON. The model may have returned an unexpected format.')
  }

  validateSchema(parsed)

  return parsed
}