// What this browser keeps for the reader: their theme, where they put a window, what they folded.
// Read back with care — what is there may be from an older page, edited by hand, or not there at
// all (a private window, storage blocked) — so every read takes a check that says what is valid, and
// falls back to the default. A write that fails leaves the choice in force for this page only.

export interface Kept<T> {
  get(): T;
  set(v: T): void;
  /** forget it: the default again, and a later change of the default reaches this reader */
  clear(): void;
}

/** A value kept under `key`: `valid` says whether what is read back is one. */
export function kept<T>(key: string, fallback: T, valid: (v: unknown) => v is T): Kept<T> {
  return {
    get() {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        const v: unknown = JSON.parse(raw);
        return valid(v) ? v : fallback;
      } catch {
        return fallback;
      }
    },
    set(v) {
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        // not kept
      }
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch {
        // nothing kept to forget
      }
    },
  };
}

export const isBool = (v: unknown): v is boolean => typeof v === "boolean";
export const isString = (v: unknown): v is string => typeof v === "string";
export const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
export const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);
/** one of a few words */
export const oneOf =
  <T extends string>(...words: T[]) =>
  (v: unknown): v is T =>
    typeof v === "string" && (words as string[]).includes(v);
