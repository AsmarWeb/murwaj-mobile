import { useEffect, useState } from 'react';
import { useApp } from './session-context';
export function usePublicQuery<T>(path: string) {
  const { api, locale } = useApp();
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([path, locale, revision]);
  const [outcome, setOutcome] = useState<{ key: string; data: T | null; error?: unknown } | null>(
    null,
  );
  useEffect(() => {
    const controller = new AbortController();
    void api
      .request<T>(path, null, locale, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setOutcome({ key, data });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setOutcome({ key, data: null, error });
      });
    return () => controller.abort();
  }, [api, path, locale, key]);
  const current = outcome?.key === key ? outcome : null;
  return {
    data: current?.data ?? null,
    error: current?.error,
    busy: !current,
    retry: () => setRevision((n) => n + 1),
  };
}
