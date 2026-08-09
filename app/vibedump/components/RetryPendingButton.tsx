"use client";

import { useState } from "react";
import { syncPendingVibes } from "@/lib/vibedump/syncQueue";

type Props = {
  pendingCount: number;
  onComplete?: () => Promise<void> | void;
  compact?: boolean;
};

export default function RetryPendingButton({
  pendingCount,
  onComplete,
  compact = false,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (pendingCount <= 0) return null;

  const retry = async () => {
    if (busy) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setMessage("Todavía no hay conexión. Intenta de nuevo cuando vuelva internet.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const result = await syncPendingVibes();

      if (!result.enabled) {
        setMessage("El envío en la nube no está disponible.");
      } else if (result.sent > 0 && result.failed === 0) {
        setMessage(
          result.sent === 1
            ? "¡Vibe enviada! ✓"
            : `¡${result.sent} vibes enviadas! ✓`
        );
      } else if (result.sent > 0 && result.failed > 0) {
        setMessage(
          `${result.sent} enviadas · ${result.failed} aún pendientes`
        );
      } else if (result.failed > 0) {
        setMessage(
          "No se pudo enviar todavía. Revisa tu conexión e inténtalo otra vez."
        );
      } else {
        setMessage("No había fotos nuevas por enviar.");
      }

      await onComplete?.();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `No se pudo enviar: ${error.message}`
          : "No se pudo enviar. Intenta nuevamente."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={compact ? "" : "mt-3"}>
      <button
        type="button"
        onClick={retry}
        disabled={busy}
        className={
          compact
            ? "rounded-xl border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-medium text-amber-50 disabled:opacity-50"
            : "w-full rounded-xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-sm font-semibold text-amber-50 disabled:opacity-50"
        }
      >
        {busy ? "Enviando..." : "Reintentar envío"}
      </button>

      {message && (
        <p className="mt-2 text-center text-xs leading-5 text-white/55">
          {message}
        </p>
      )}
    </div>
  );
}
