import {
  createId,
  DEFAULT_RESUME_LAYOUT,
  type BackupFile,
  type CVDocument,
  type DocumentContentStatus,
  type Mode,
  type OutputLanguage,
  type ProviderKind,
  type ProviderSettings,
  type ResumeAccentId,
  type ResumeFontId,
  type ResumeStyleOptions,
} from "../types";
import { normalizeResumeData } from "../lib/resumeSchema";

const DB_NAME = "custom-cv-library";
const DB_VERSION = 1;
const STORE_NAME = "documents";
const FALLBACK_KEY = "custom-cv.documents.v1";

export class StaleRevisionError extends Error {
  constructor() {
    super("This CV changed in another browser tab.");
    this.name = "StaleRevisionError";
  }
}

function hasIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function safeStyle(value: unknown): ResumeStyleOptions {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const fontId: ResumeFontId = record.fontId === "times" ? "times" : "helvetica";
  const accentId: ResumeAccentId =
    record.accentId === "charcoal" ||
    record.accentId === "teal" ||
    record.accentId === "burgundy"
      ? record.accentId
      : "navy";
  const padding = typeof record.padding === "number" && Number.isFinite(record.padding)
    ? Math.min(52, Math.max(18, record.padding))
    : DEFAULT_RESUME_LAYOUT.padding;
  const fontScale = typeof record.fontScale === "number" && Number.isFinite(record.fontScale)
    ? Math.min(1.15, Math.max(0.85, record.fontScale))
    : DEFAULT_RESUME_LAYOUT.fontScale;
  return { padding, fontScale, fontId, accentId };
}

function safeProvider(value: unknown): ProviderSettings {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const provider: ProviderKind = record.provider === "openai" ? "openai" : "local";
  const transport = record.transport === "responses" ? "responses" : "chat";
  return {
    provider,
    model: typeof record.model === "string" ? record.model : "",
    baseUrl: typeof record.baseUrl === "string" ? record.baseUrl : "",
    transport,
  };
}

function normalizeDocument(value: unknown, rekey = false): CVDocument {
  if (!value || typeof value !== "object") throw new Error("Document is not an object");
  const record = value as Record<string, unknown>;
  const source = record.source && typeof record.source === "object"
    ? record.source as Record<string, unknown>
    : {};
  const now = new Date().toISOString();
  const contentStatus: DocumentContentStatus =
    record.contentStatus === "generated" || record.contentStatus === "interrupted"
      ? record.contentStatus
      : "draft";
  const outputLanguage: OutputLanguage = record.outputLanguage === "es" ? "es" : "en";
  const mode: Mode = record.mode === "format" ? "format" : "tailor";
  return {
    id: rekey || typeof record.id !== "string" ? createId() : record.id,
    schemaVersion: 1,
    title: typeof record.title === "string" && record.title.trim()
      ? record.title.trim().slice(0, 120)
      : "Untitled CV",
    createdAt: typeof record.createdAt === "string" ? record.createdAt : now,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : now,
    revision: typeof record.revision === "number" && Number.isInteger(record.revision)
      ? Math.max(0, record.revision)
      : 0,
    source: {
      cvText: typeof source.cvText === "string" ? source.cvText : "",
      jdText: typeof source.jdText === "string" ? source.jdText : "",
      cvFileName: typeof source.cvFileName === "string" ? source.cvFileName : undefined,
    },
    mode,
    outputLanguage,
    data: normalizeResumeData(record.data),
    style: safeStyle(record.style),
    provider: safeProvider(record.provider),
    contentStatus,
    lastExportedAt: typeof record.lastExportedAt === "string" ? record.lastExportedAt : undefined,
  };
}

function readFallback(): CVDocument[] {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      try {
        return [normalizeDocument(item)];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

function writeFallback(documents: CVDocument[]) {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(documents));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error || new Error("Unable to open CV storage"));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error || new Error("CV storage request failed"));
    request.onsuccess = () => resolve(request.result);
  });
}

export async function listDocuments(): Promise<CVDocument[]> {
  if (!hasIndexedDb()) return readFallback().sort(sortByUpdated);
  try {
    const db = await openDatabase();
    const records = await requestValue(db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll());
    db.close();
    return records.flatMap((record) => {
      try {
        return [normalizeDocument(record)];
      } catch {
        return [];
      }
    }).sort(sortByUpdated);
  } catch {
    return readFallback().sort(sortByUpdated);
  }
}

export async function getDocument(id: string): Promise<CVDocument | null> {
  if (!hasIndexedDb()) return readFallback().find((item) => item.id === id) ?? null;
  const db = await openDatabase();
  try {
    const value = await requestValue(db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id));
    return value ? normalizeDocument(value) : null;
  } finally {
    db.close();
  }
}

function sortByUpdated(a: CVDocument, b: CVDocument) {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export async function putDocument(
  document: CVDocument,
  expectedRevision: number | null,
): Promise<CVDocument> {
  const normalized = normalizeDocument(document);
  if (!hasIndexedDb()) {
    const documents = readFallback();
    const index = documents.findIndex((item) => item.id === normalized.id);
    const current = index >= 0 ? documents[index] : null;
    if (expectedRevision !== null && current?.revision !== expectedRevision) {
      throw new StaleRevisionError();
    }
    if (expectedRevision === null && current) throw new StaleRevisionError();
    if (index >= 0) documents[index] = normalized;
    else documents.push(normalized);
    writeFallback(documents);
    return normalized;
  }

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(normalized.id);
    let finished = false;
    const fail = (error: Error) => {
      if (!finished) {
        finished = true;
        try { transaction.abort(); } catch { /* transaction already closed */ }
        db.close();
        reject(error);
      }
    };
    getRequest.onerror = () => fail(getRequest.error || new Error("CV storage request failed"));
    getRequest.onsuccess = () => {
      const current = getRequest.result as CVDocument | undefined;
      if (expectedRevision !== null && current?.revision !== expectedRevision) {
        fail(new StaleRevisionError());
        return;
      }
      if (expectedRevision === null && current) {
        fail(new StaleRevisionError());
        return;
      }
      store.put(normalized);
    };
    transaction.oncomplete = () => {
      if (!finished) {
        finished = true;
        db.close();
        resolve(normalized);
      }
    };
    transaction.onerror = () => fail(transaction.error || new Error("CV storage write failed"));
    transaction.onabort = () => fail(transaction.error || new Error("CV storage write aborted"));
  });
}

export async function deleteDocument(id: string): Promise<void> {
  if (!hasIndexedDb()) {
    writeFallback(readFallback().filter((document) => document.id !== id));
    return;
  }
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const request = transaction.objectStore(STORE_NAME).delete(id);
      request.onerror = () => reject(request.error || new Error("CV storage delete failed"));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("CV storage delete failed"));
      transaction.onabort = () => reject(transaction.error || new Error("CV storage delete aborted"));
    });
  } finally {
    db.close();
  }
}

export function makeBackup(documents: CVDocument[]): BackupFile {
  return {
    format: "custom-cv-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    documents: clone(documents),
  };
}

export function parseBackup(value: unknown): CVDocument[] {
  if (!value || typeof value !== "object") throw new Error("Backup is not an object");
  const record = value as Record<string, unknown>;
  if (record.format !== "custom-cv-backup" || record.version !== 1 || !Array.isArray(record.documents)) {
    throw new Error("Unsupported backup format");
  }
  return record.documents.map((document) => normalizeDocument(document, true));
}

export async function importDocuments(documents: CVDocument[]): Promise<CVDocument[]> {
  const imported = documents.map((document) => normalizeDocument(document, true));
  for (const document of imported) {
    await putDocument(document, null);
  }
  return imported;
}
