import { useRef, useState } from "react";
import { Archive, FilePlus2, FolderOpen, Search, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import type { CVDocument } from "../types";

interface WorkspaceSidebarProps {
  documents: CVDocument[];
  activeId: string | null;
  generatingId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
}

function formatEditedAt(value: string) {
  const date = new Date(value);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? new Intl.DateTimeFormat(i18next.language.slice(0, 2), {
        hour: "numeric",
        minute: "2-digit",
      }).format(date)
    : new Intl.DateTimeFormat(i18next.language.slice(0, 2), {
        month: "short",
        day: "numeric",
      }).format(date);
}

export default function WorkspaceSidebar({
  documents,
  activeId,
  generatingId,
  onSelect,
  onCreate,
  onExportBackup,
  onImportBackup,
}: WorkspaceSidebarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const filtered = documents.filter((document) =>
    document.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-(--ui-panel)">
      <div className="space-y-4 border-b border-(--ui-border) p-4">
        <button type="button" onClick={onCreate} className="ui-primary-button w-full justify-center">
          <FilePlus2 className="h-4 w-4" />
          {t("workspace:actions.newCV")}
        </button>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--ui-muted)" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="ui-control pl-9"
            placeholder={t("workspace:sidebar.search")}
            aria-label={t("workspace:sidebar.search")}
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <FolderOpen className="mx-auto h-8 w-8 text-(--ui-muted) opacity-40" />
            <p className="mt-3 text-sm font-medium text-(--ui-text-soft)">
              {documents.length ? t("workspace:sidebar.noMatches") : t("workspace:sidebar.emptyTitle")}
            </p>
            <p className="mt-1 text-xs leading-5 text-(--ui-muted)">
              {documents.length ? t("workspace:sidebar.noMatchesHelp") : t("workspace:sidebar.emptyHelp")}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((document) => {
              const selected = document.id === activeId;
              const generating = document.id === generatingId;
              return (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => onSelect(document.id)}
                  aria-current={selected ? "page" : undefined}
                  className={
                    selected
                      ? "w-full rounded-lg border border-(--ui-focus) bg-(--ui-subtle) px-3 py-3 text-left shadow-sm"
                      : "w-full rounded-lg border border-transparent px-3 py-3 text-left transition hover:border-(--ui-border) hover:bg-(--ui-subtle)"
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-(--ui-text)">
                      {document.title}
                    </span>
                    {generating && <span className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-brand-600" />}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-(--ui-muted)">
                    <span>
                      {generating
                        ? t("workspace:sidebar.generating")
                        : document.contentStatus === "generated"
                          ? t("workspace:sidebar.generated")
                          : document.contentStatus === "interrupted"
                            ? t("workspace:sidebar.interrupted")
                            : t("workspace:sidebar.draft")}
                    </span>
                    <span>{formatEditedAt(document.updatedAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-1 border-t border-(--ui-border) p-3">
        <button type="button" onClick={onExportBackup} className="ui-quiet-button w-full justify-start">
          <Archive className="h-4 w-4" />
          {t("workspace:actions.exportBackup")}
        </button>
        <button type="button" onClick={() => importRef.current?.click()} className="ui-quiet-button w-full justify-start">
          <Upload className="h-4 w-4" />
          {t("workspace:actions.importBackup")}
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImportBackup(file);
            event.target.value = "";
          }}
        />
      </div>
    </aside>
  );
}
