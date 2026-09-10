import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Loader2 } from "lucide-react";
import type { OutputLanguage, ResumeData, ResumeStyleOptions } from "../types";
import { generatePDFBlob } from "../services/pdfService";
import { useTranslation } from "react-i18next";

interface PdfDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
  destroy?: () => Promise<void>;
}

interface PdfPageProxy {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => PdfRenderTask;
}

interface PdfRenderTask {
  promise: Promise<void>;
  cancel?: () => void;
}

interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: { data: Uint8Array }) => { promise: Promise<PdfDocumentProxy> };
}

export default function VisualPreview({
  data,
  layout,
  outputLanguage = "en",
}: {
  data: ResumeData;
  layout: ResumeStyleOptions;
  outputLanguage?: OutputLanguage;
}) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let current = true;
    const timer = window.setTimeout(() => {
      setIsRendering(true);
      setError(null);
      generatePDFBlob(data, layout, outputLanguage)
        .then(async (blob) => {
          const bytes = new Uint8Array(await blob.arrayBuffer());
          if (!current) return;
          setPdfBytes(bytes);
          setPageNumber(1);
        })
        .catch((reason: unknown) => {
          if (!current) return;
          setError(reason instanceof Error ? reason.message : t("common:errors.pdfFailed"));
          setIsRendering(false);
        });
    }, 280);

    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [data, layout, outputLanguage, t]);

  useEffect(() => {
    if (!pdfBytes || !canvasRef.current || !containerWidth) return;
    let current = true;
    let renderTask: PdfRenderTask | undefined;
    let documentProxy: PdfDocumentProxy | undefined;
    setIsRendering(true);
    import("pdfjs-dist")
      .then(async (module) => {
        const pdfjsLib = module as unknown as PdfJsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        // pdf.js transfers the provided buffer to its worker. Keep the state-owned
        // bytes reusable when ResizeObserver or pagination causes another render.
        documentProxy = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
        if (!current) return;
        setPageCount(documentProxy.numPages);
        const safePage = Math.min(pageNumber, documentProxy.numPages);
        if (safePage !== pageNumber) setPageNumber(safePage);
        const page = await documentProxy.getPage(safePage);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.max(0.1, (containerWidth - 32) / baseViewport.width);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || !current) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas preview is unavailable.");
        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
        if (current) {
          setError(null);
          setIsRendering(false);
        }
      })
      .catch((reason: unknown) => {
        if (!current) return;
        setError(reason instanceof Error ? reason.message : t("common:errors.pdfFailed"));
        setIsRendering(false);
      })
      .finally(() => {
        void documentProxy?.destroy?.();
      });

    return () => {
      current = false;
      renderTask?.cancel?.();
    };
  }, [containerWidth, pageNumber, pdfBytes, t]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-(--ui-border) bg-(--ui-subtle) p-4 shadow-[0_18px_45px_rgba(22,34,51,0.14)]">
      <div ref={containerRef} className="relative min-h-125">
        {pdfBytes ? (
          <canvas
            ref={canvasRef}
            className="mx-auto block h-auto w-full max-w-149 bg-white shadow-[0_8px_24px_rgba(22,34,51,0.16)]"
            aria-label={t("workspace:preview.canvasLabel")}
          />
        ) : (
          <div className="flex min-h-125 flex-col items-center justify-center gap-3 text-(--ui-muted)">
            <FileText className="h-10 w-10 opacity-40" />
            <span className="text-sm">{error || t("workspace:preview.preparing")}</span>
          </div>
        )}
        {isRendering && pdfBytes && (
          <div className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" />
            {t("workspace:preview.updating")}
          </div>
        )}
        {error && pdfBytes && (
          <div className="absolute inset-x-3 bottom-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 shadow-sm" role="alert">
            {error}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-center gap-3 text-xs text-(--ui-text-soft)">
        <button
          type="button"
          onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
          disabled={pageNumber <= 1 || isRendering}
          className="rounded p-1.5 hover:bg-(--ui-panel) disabled:opacity-40"
          aria-label={t("workspace:preview.previous")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>{t("workspace:preview.page", { current: pageNumber, total: pageCount })}</span>
        <button
          type="button"
          onClick={() => setPageNumber((page) => Math.min(pageCount, page + 1))}
          disabled={pageNumber >= pageCount || isRendering}
          className="rounded p-1.5 hover:bg-(--ui-panel) disabled:opacity-40"
          aria-label={t("workspace:preview.next")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
