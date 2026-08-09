"use client";

import { useEffect, useState } from "react";
import {
  getSyncSummary,
  isCloudEnabled,
  syncPendingVibes,
  type SyncSummary,
} from "@/lib/vibedump/syncQueue";

const EMPTY: SyncSummary = {
  total: 0,
  pending: 0,
  uploading: 0,
  sent: 0,
  error: 0,
};

export default function CloudStatus() {
  const [summary, setSummary] = useState<SyncSummary>(EMPTY);
  const [syncing, setSyncing] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const refresh = async () => {
    setEnabled(isCloudEnabled());

    try {
      setSummary(await getSyncSummary());
    } catch {
      setSummary(EMPTY);
    }
  };

  useEffect(() => {
    refresh();

    const onComplete = () => refresh();
    window.addEventListener("vibedump-sync-complete", onComplete);

    return () => {
      window.removeEventListener("vibedump-sync-complete", onComplete);
    };
  }, []);

  const syncNow = async () => {
    if (!enabled || syncing) return;

    setSyncing(true);

    try {
      await syncPendingVibes();
      await refresh();
    } finally {
      setSyncing(false);
    }
  };

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
        <p className="font-medium">Nube preparada, todavía apagada</p>
        <p className="mt-1 leading-5 opacity-75">
          Activa NEXT_PUBLIC_VIBEDUMP_CLOUD_ENABLED=true cuando Storage y las
          reglas estén listos.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#b995ff]/20 bg-[#b995ff]/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#dfd1ff]">
            VibeDump Cloud
          </p>
          <p className="mt-1 text-xs text-white/50">
            {summary.sent} enviadas ·{" "}
            {summary.pending + summary.uploading + summary.error} pendientes
          </p>
        </div>

        <button
          type="button"
          onClick={syncNow}
          disabled={
            syncing ||
            summary.pending + summary.uploading + summary.error === 0
          }
          className="rounded-xl border border-[#b995ff]/25 px-3 py-2 text-xs font-medium text-[#dfd1ff] disabled:opacity-35"
        >
          {syncing ? "Enviando..." : "Sincronizar"}
        </button>
      </div>

      {summary.error > 0 && (
        <p className="mt-3 text-xs text-amber-100">
          {summary.error} {summary.error === 1 ? "foto necesita" : "fotos necesitan"} reintento.
        </p>
      )}
    </div>
  );
}
