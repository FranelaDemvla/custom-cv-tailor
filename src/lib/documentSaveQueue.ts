export type SaveState = "saved" | "saving" | "error" | "conflict";

type RecordVersion = { id: string; revision: number };

/** One writer per document. Pending values always represent the latest edit. */
export class DocumentSaveQueue<T extends RecordVersion> {
  private pending = new Map<string, T>();
  private revisions = new Map<string, number>();
  private running = new Map<string, Promise<void>>();
  private write: (value: T, expected: number | null) => Promise<T>;
  private report: (id: string, state: SaveState) => void;

  constructor(write: (value: T, expected: number | null) => Promise<T>, report: (id: string, state: SaveState) => void) {
    this.write = write;
    this.report = report;
  }

  seed(value: T) { this.revisions.set(value.id, value.revision); }
  enqueue(value: T) {
    this.pending.set(value.id, value);
    this.report(value.id, "saving");
  }
  hasPending() { return this.pending.size > 0 || this.running.size > 0; }

  flush(id: string): Promise<void> {
    const existing = this.running.get(id);
    if (existing) return existing;
    const task = this.drain(id).finally(() => { this.running.delete(id); });
    this.running.set(id, task);
    return task;
  }

  private async drain(id: string) {
    try {
      while (this.pending.has(id)) {
        const value = this.pending.get(id)!;
        const saved = await this.write(value, this.revisions.get(id) ?? null);
        this.revisions.set(id, saved.revision);
        if (this.pending.get(id) === value) this.pending.delete(id);
      }
      this.report(id, "saved");
    } catch (error) {
      this.report(id, error instanceof Error && error.name === "StaleRevisionError" ? "conflict" : "error");
      throw error;
    }
  }

  async flushAll() {
    const ids = new Set([...this.pending.keys(), ...this.running.keys()]);
    const results = await Promise.allSettled([...ids].map((id) => this.flush(id)));
    const failed = results.find((result) => result.status === "rejected");
    if (failed?.status === "rejected") throw failed.reason;
  }

  async discard(id: string) {
    await this.running.get(id)?.catch(() => undefined);
    this.pending.delete(id);
    this.revisions.delete(id);
  }
}

export function selectionAfterGeneration(activeId: string | null, sourceId: string, copyId: string) {
  return activeId === sourceId ? copyId : activeId;
}
