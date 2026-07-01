import { useState, useEffect, useRef } from 'react';

/**
 * Persist a piece of state in sessionStorage so it survives page navigations
 * (e.g. switching tabs in the app) without leaking across browser sessions.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T | (() => T),
  options: { storage?: 'session' | 'local' } = {}
) {
  const storage =
    typeof window === 'undefined'
      ? null
      : options.storage === 'local'
      ? window.localStorage
      : window.sessionStorage;

  const [value, setValue] = useState<T>(() => {
    if (!storage) {
      return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
    }
    try {
      const raw = storage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      /* ignore */
    }
    return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
  });

  const keyRef = useRef(key);
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  useEffect(() => {
    if (!storage) return;
    try {
      storage.setItem(keyRef.current, JSON.stringify(value));
    } catch {
      /* ignore quota errors */
    }
  }, [value, storage]);

  return [value, setValue] as const;
}

/**
 * Same as usePersistedState but stores Date objects safely by serialising to ISO.
 */
export function usePersistedDate(
  key: string,
  defaultValue?: Date
): [Date | undefined, (d: Date | undefined) => void] {
  const [iso, setIso] = usePersistedState<string | null>(
    key,
    defaultValue ? defaultValue.toISOString() : null
  );
  const value = iso ? new Date(iso) : undefined;
  const set = (d: Date | undefined) => setIso(d ? d.toISOString() : null);
  return [value, set];
}
