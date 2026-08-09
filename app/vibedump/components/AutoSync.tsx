"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  isCloudEnabled,
  syncPendingVibes,
} from "@/lib/vibedump/syncQueue";

const SYNC_EVENT = "vibedump-sync-complete";
const REQUEST_EVENT = "vibedump-request-sync";

export default function AutoSync() {
  const runningRef = useRef(false);

  const runSync = useCallback(async () => {
    if (!isCloudEnabled()) return;
    if (!navigator.onLine) return;
    if (runningRef.current) return;

    runningRef.current = true;

    try {
      const result = await syncPendingVibes();

      window.dispatchEvent(
        new CustomEvent(SYNC_EVENT, {
          detail: result,
        })
      );
    } finally {
      runningRef.current = false;
    }
  }, []);

  useEffect(() => {
    const onOnline = () => runSync();
    const onRequest = () => runSync();

    window.addEventListener("online", onOnline);
    window.addEventListener(REQUEST_EVENT, onRequest);

    const timer = window.setTimeout(runSync, 1200);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener(REQUEST_EVENT, onRequest);
      window.clearTimeout(timer);
    };
  }, [runSync]);

  return null;
}

export function requestVibeDumpSync() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(REQUEST_EVENT)
  );
}
