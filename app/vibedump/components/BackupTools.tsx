"use client";

import { useState } from "react";
import {
  createMetadataBackup,
  downloadAllVibesIndividually,
} from "@/lib/vibedump/exportAlbum";

type Props = {
  photoCount: number;
};

export default function BackupTools({ photoCount }: Props) {
  const [busy, setBusy] = useState<"photos" | "metadata" | null>(null);
  const [message, setMessage] = useState("");

  const exportPhotos = async () => {
    if (photoCount === 0 || busy) return;

    setBusy("photos");
    setMessage("");

    try {
      const total = await downloadAllVibesIndividually();
      setMessage(
        `${total} ${total === 1 ? "foto descargada" : "fotos enviadas a descargas"}.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible descargar las fotografías."
      );
    } finally {
      setBusy(null);
    }
  };

  const exportMetadata = async () => {
    if (busy) return;

    setBusy("metadata");
    setMessage("");

    try {
      const total = await createMetadataBackup();
      setMessage(
        `Respaldo creado con información de ${total} ${
          total === 1 ? "foto" : "fotos"
        }.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible crear el respaldo."
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-[#d6c4ff]">
        Respaldo del dispositivo
      </p>

      <h2 className="mt-2 text-xl font-medium">
        Guarda una copia antes de borrar
      </h2>

      <p className="mt-2 text-sm leading-6 text-white/50">
        Mientras VibeDump siga en modo local, puedes descargar las fotos de
        este teléfono y conservar un respaldo independiente.
      </p>

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          onClick={exportPhotos}
          disabled={photoCount === 0 || busy !== null}
          className="rounded-2xl bg-[#b995ff] px-5 py-4 font-semibold text-[#160d24] disabled:opacity-40"
        >
          {busy === "photos"
            ? "Preparando descargas..."
            : `Descargar todas (${photoCount})`}
        </button>

        <button
          type="button"
          onClick={exportMetadata}
          disabled={busy !== null}
          className="rounded-2xl border border-white/15 bg-black/20 px-5 py-4 font-medium disabled:opacity-40"
        >
          {busy === "metadata"
            ? "Creando respaldo..."
            : "Descargar respaldo de datos"}
        </button>
      </div>

      {message && (
        <p
          className="mt-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/60"
          aria-live="polite"
        >
          {message}
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-white/35">
        Algunos navegadores pueden pedir permiso para permitir varias
        descargas consecutivas.
      </p>
    </section>
  );
}
