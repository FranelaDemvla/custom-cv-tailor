import { useCallback, useEffect, useRef, useState } from "react";
import {
  createId,
  type CVDocument,
  type ResumeData,
  type ResumeStyleOptions,
  type DocumentSource,
  type Mode,
  type OutputLanguage,
  type ProviderSettings,
} from "../types";
import {
  deleteDocument,
  listDocuments,
  putDocument,
  getDocument,
} from "../services/documentRepository";

import { DocumentSaveQueue, type SaveState } from "../lib/documentSaveQueue";
export type { SaveState } from "../lib/documentSaveQueue";

function sortDocuments(documents: CVDocument[]) {
  return [...documents].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function useDocuments() {
  const [documents, setDocuments] = useState<CVDocument[]>([]);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [isReady, setIsReady] = useState(false);
  const documentsRef = useRef<CVDocument[]>([]);
  const [queue] = useState(() => new DocumentSaveQueue<CVDocument>(putDocument, (id, state) => {
    setSaveStates((states) => ({ ...states, [id]: state }));
  }));
  const timersRef = useRef(new Map<string, number>());
  const publish = useCallback((next: CVDocument[]) => {
    documentsRef.current = sortDocuments(next);
    setDocuments(documentsRef.current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listDocuments()
      .then((loaded) => {
        if (cancelled) return;
        loaded.forEach((document) => queue.seed(document));
        publish(loaded);
        setSaveStates(
          Object.fromEntries(loaded.map((document) => [document.id, "saved"])),
        );
        setIsReady(true);
      })
      .catch(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [publish, queue]);

  const queueSave = useCallback(
    (document: CVDocument) => {
      queue.enqueue(document);
      const previousTimer = timersRef.current.get(document.id);
      if (previousTimer) window.clearTimeout(previousTimer);
      const timer = window.setTimeout(() => {
        timersRef.current.delete(document.id);
        void queue.flush(document.id).catch(() => undefined);
      }, 500);
      timersRef.current.set(document.id, timer);
    },
    [queue],
  );

  const updateDocument = useCallback(
    (id: string, update: (document: CVDocument) => CVDocument) => {
      const current = documentsRef.current;
      const document = current.find((item) => item.id === id);
      if (!document) return;
      const next = update({
        ...document,
        source: { ...document.source },
        style: { ...document.style },
        provider: { ...document.provider },
      });
      const updated: CVDocument = {
        ...next,
        id: document.id,
        schemaVersion: 1,
        revision: document.revision + 1,
        updatedAt: new Date().toISOString(),
      };
      queueSave(updated);
      publish(current.map((item) => (item.id === id ? updated : item)));
    },
    [publish, queueSave],
  );

  const createDocument = useCallback(
    async (document: CVDocument) => {
      await putDocument(document, null);
      queue.seed(document);
      publish([...documentsRef.current, document]);
      setSaveStates((states) => ({ ...states, [document.id]: "saved" }));
      return document;
    },
    [publish, queue],
  );

  const duplicateDocument = useCallback(
    async (source: CVDocument) => {
      const now = new Date().toISOString();
      const duplicate: CVDocument = {
        ...source,
        id: createId(),
        title: source.title + " copy",
        createdAt: now,
        updatedAt: now,
        revision: 0,
        source: { ...source.source },
        style: { ...source.style },
        provider: { ...source.provider },
      };
      return createDocument(duplicate);
    },
    [createDocument],
  );

  const restoreDocument = useCallback(async (document: CVDocument) => {
    await putDocument(document, null);
    queue.seed(document);
    publish([...documentsRef.current, document]);
    setSaveStates((states) => ({ ...states, [document.id]: "saved" }));
  }, [publish, queue]);

  const flushPendingDocuments = useCallback(async () => {
    for (const timer of timersRef.current.values()) window.clearTimeout(timer);
    timersRef.current.clear();
    await queue.flushAll();
  }, [queue]);

  const reloadDocument = useCallback(async (id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) window.clearTimeout(timer);
    timersRef.current.delete(id);
    // Read before discarding so a failed read preserves the local edits.
    const stored = await getDocument(id);
    await queue.discard(id);
    if (stored) queue.seed(stored);
    publish([...documentsRef.current.filter((item) => item.id !== id), ...(stored ? [stored] : [])]);
    setSaveStates((states) => ({ ...states, [id]: "saved" }));
    return stored;
  }, [publish, queue]);

  const removeDocument = useCallback(async (document: CVDocument) => {
    await flushPendingDocuments();
    await deleteDocument(document.id);
    await queue.discard(document.id);
    publish(documentsRef.current.filter((item) => item.id !== document.id));
    setSaveStates((states) => {
      const next = { ...states };
      delete next[document.id];
      return next;
    });
  }, [flushPendingDocuments, publish, queue]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) window.clearTimeout(timer);
    };
  }, []);

  return {
    documents,
    hasPendingWrites: () => queue.hasPending(),
    reloadDocument,
    isReady,
    saveStates,
    updateDocument,
    createDocument,
    duplicateDocument,
    removeDocument,
    restoreDocument,
    flushPendingDocuments,
  };
}

export type DocumentUpdate = {
  source?: Partial<DocumentSource>;
  mode?: Mode;
  outputLanguage?: OutputLanguage;
  data?: ResumeData;
  style?: ResumeStyleOptions;
  provider?: ProviderSettings;
};
