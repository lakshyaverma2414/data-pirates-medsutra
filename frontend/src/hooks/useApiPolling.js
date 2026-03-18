import { useEffect, useRef } from "react";

const DEFAULT_INTERVAL_MS = 500;

export const useApiPolling = (
  callback,
  { enabled = true, intervalMs = DEFAULT_INTERVAL_MS } = {},
) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    let timerId = null;

    const scheduleNext = () => {
      if (cancelled) return;

      timerId = window.setTimeout(async () => {
        try {
          await callbackRef.current();
        } finally {
          scheduleNext();
        }
      }, intervalMs);
    };

    scheduleNext();

    return () => {
      cancelled = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [enabled, intervalMs]);
};
