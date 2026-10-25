// Pure model-fallback helper (no server imports, so `node --test` can run it). From Goukaku.

export type Failure = { model: string; error: string };

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

export class AllFailedError extends Error {
  failed: Failure[];
  constructor(failed: Failure[]) {
    super(failed.map((f) => `${f.model}: ${f.error}`).join("; ") || "Belum ada model yang diatur");
    this.failed = failed;
  }
}

/** Tries models in order (main first, then backups) until one succeeds. A fatal error (bad key, quota) stops immediately. */
export async function firstSuccess<T>(models: string[], run: (model: string) => Promise<T>, isFatal: (e: unknown) => boolean) {
  const failed: Failure[] = [];
  for (const model of models) {
    try {
      return { model, value: await run(model), failed };
    } catch (e) {
      if (isFatal(e)) throw e;
      failed.push({ model, error: message(e) });
    }
  }
  throw new AllFailedError(failed);
}
