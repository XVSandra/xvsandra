"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  getSyncSummary,
  isCloudEnabled,
  syncPendingVibes,
} from "@/lib/vibedump/syncQueue";

const SYNC_EVENT = "vibedump-sync-complete";
const REQUEST_EVENT = "vibedump-request-sync";
const RETRY_INTERVAL_MS = 30000;

export default function AutoSync() {
  const runningRef = useRef(false);
  const queuedRef = useRef(false);

  const runSync = useCallback(async () => {
    if (!isCloudEnabled()) return;

    if (runningRef.current) {
      queuedRef.current = true;
      return;
    }

    runningRef.current = true;
    queuedRef.current = false;

    try {
      const summary = await getSyncSummary();
      const needsSync =
        summary.pending + summary.uploading + summary.error > 0;

      if (!needsSync) return;

      const result = await syncPendingVibes();

      window.dispatchEvent(
        new CustomEvent(SYNC_EVENT, {
          detail: result,
        })
      );
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent(SYNC_EVENT, {
          detail: {
            enabled: true,
            attempted: 0,
            sent: 0,
            failed: 1,
            error:
              error instanceof Error
                ? error.message
                : "Error de envío automático",
          },
        })
      );
    } finally {
      runningRef.current = false;

      if (queuedRef.current) {
        queuedRef.current = false;
        window.setTimeout(runSync, 500);
      }
    }
  }, []);

  useEffect(() => {
    const onOnline = () => {
      window.setTimeout(runSync, 300);
    };

    const onFocus = () => {
      runSync();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        runSync();
      }
    };

    const onPageShow = () => {
      runSync();
    };

    const onRequest = () => {
      runSync();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener(REQUEST_EVENT, onRequest);
    document.addEventListener("visibilitychange", onVisible);

    // Primera comprobación al entrar/reabrir VibeDump.
    const initialTimer = window.setTimeout(runSync, 800);

    // Respaldo para móviles que no disparan correctamente el evento "online".
    const retryTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        runSync();
      }
    }, RETRY_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener(REQUEST_EVENT, onRequest);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearTimeout(initialTimer);
      window.clearInterval(retryTimer);
    };
  }, [runSync]);

  return null;
}

export function requestVibeDumpSync() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(REQUEST_EVENT));
}
