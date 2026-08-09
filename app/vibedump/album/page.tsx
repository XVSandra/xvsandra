"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  clearStoredVibes,
  deleteStoredVibe,
  getStoredVibes,
  type StoredVibe,
} from "@/lib/vibedump/localAlbum";
import NetworkStatus from "../components/NetworkStatus";
import StorageStatus from "../components/StorageStatus";
import RetryPendingButton from "../components/RetryPendingButton";
import BackupTools from "../components/BackupTools";

const GUEST_NAME_KEY = "vibedump_guest_name";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  return `${(kb / 1024).toFixed(2)} MB`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function statusLabel(status: StoredVibe["syncStatus"]) {
  if (status === "sent") return "Enviada ✓";
  if (status === "uploading") return "Enviando…";
  if (status === "error") return "Se enviará después";
  return "Esperando conexión";
}

export default function VibeDumpAlbumPage() {
  const [photos, setPhotos] = useState<StoredVibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [objectUrls, setObjectUrls] = useState<Record<string, string>>({});
  const [guestName, setGuestName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const urlsRef = useRef<Record<string, string>>({});

  const replaceUrls = (next: Record<string, string>) => {
    Object.values(urlsRef.current).forEach((url) =>
      URL.revokeObjectURL(url)
    );

    urlsRef.current = next;
    setObjectUrls(next);
  };

  const loadPhotos = async () => {
    setLoading(true);

    try {
      const stored = await getStoredVibes();
      setPhotos(stored);

      const next: Record<string, string> = {};

      stored.forEach((photo) => {
        next[photo.id] = URL.createObjectURL(photo.blob);
      });

      replaceUrls(next);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedName =
      window.localStorage.getItem(GUEST_NAME_KEY) ?? "";

    setGuestName(savedName);
    setDraftName(savedName);
    loadPhotos();

    return () => {
      Object.values(urlsRef.current).forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, []);

  const totalSize = useMemo(
    () => photos.reduce((sum, photo) => sum + photo.optimizedSize, 0),
    [photos]
  );

  const pendingCount = useMemo(
    () => photos.filter((photo) => photo.syncStatus !== "sent").length,
    [photos]
  );

  const downloadPhoto = (photo: StoredVibe) => {
    const url = objectUrls[photo.id];
    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = `vibedump-${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const removePhoto = async (photo: StoredVibe) => {
    const warning =
      photo.syncStatus === "sent"
        ? "¿Eliminar esta foto de este dispositivo?"
        : "Esta foto todavía está esperando enviarse. Si la eliminas ahora, no llegará al álbum del evento. ¿Continuar?";

    if (!window.confirm(warning)) return;

    await deleteStoredVibe(photo.id);

    const url = urlsRef.current[photo.id];
    if (url) URL.revokeObjectURL(url);

    const next = { ...urlsRef.current };
    delete next[photo.id];
    urlsRef.current = next;
    setObjectUrls(next);

    setPhotos((current) =>
      current.filter((item) => item.id !== photo.id)
    );
  };

  const clearAlbum = async () => {
    if (photos.length === 0) return;

    const confirmed = window.confirm(
      "Antes de vaciar el álbum recomendamos descargar un respaldo. ¿Seguro que quieres eliminar todas las fotos de este dispositivo?"
    );

    if (!confirmed) return;

    await clearStoredVibes();
    replaceUrls({});
    setPhotos([]);
  };

  const saveName = () => {
    const clean = draftName.trim().replace(/\s+/g, " ");

    if (clean.length < 2) return;

    window.localStorage.setItem(GUEST_NAME_KEY, clean);
    setGuestName(clean);
    setDraftName(clean);
    setEditingName(false);
  };

  return (
    <main className="min-h-screen bg-[#09070d] text-white">
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-10 pt-6">
        <header className="flex items-center justify-between">
          <Link
            href="/vibedump/camera"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl"
            aria-label="Volver a la cámara"
          >
            ←
          </Link>

          <div className="text-center">
            <p className="text-lg font-medium">Mis vibes</p>
            <p className="text-xs text-white/45">
              {guestName || "VibeDump"}
            </p>
          </div>

          <NetworkStatus />
        </header>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          {!editingName ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Invitado
                </p>
                <p className="mt-1 font-medium">
                  {guestName || "Sin nombre"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div>
              <label
                htmlFor="edit-guest-name"
                className="text-xs uppercase tracking-[0.16em] text-white/40"
              >
                Nombre o apodo
              </label>

              <input
                id="edit-guest-name"
                value={draftName}
                maxLength={40}
                onChange={(event) =>
                  setDraftName(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-3 outline-none"
              />

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraftName(guestName);
                    setEditingName(false);
                  }}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={saveName}
                  className="rounded-xl bg-[#b995ff] px-3 py-2 text-sm font-semibold text-[#160d24]"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.15em] text-white/40">
              Vibes
            </p>
            <p className="mt-2 text-xl font-semibold">{photos.length}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.15em] text-white/40">
              Por enviar
            </p>
            <p className="mt-2 text-xl font-semibold">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.15em] text-white/40">
              Guardado
            </p>
            <p className="mt-2 text-xl font-semibold">
              {formatBytes(totalSize)}
            </p>
          </div>
        </section>

        <div className="mt-5">
          <StorageStatus />
        </div>

        {pendingCount > 0 && (
          <div className="mt-4 rounded-2xl border border-amber-200/15 bg-amber-200/5 px-4 py-4 text-sm leading-6 text-amber-50/65">
            <p>
              {pendingCount === 1
                ? "Hay 1 vibe pendiente de envío."
                : `Hay ${pendingCount} vibes pendientes de envío.`}
            </p>

            <p className="mt-1 text-white/45">
              Si ya recuperaste internet, puedes reintentar ahora.
            </p>
<RetryPendingButton
  pendingCount={pendingCount}
  onComplete={loadPhotos}
/>
          </div>
        )}

        {loading ? (
          <div className="mt-16 text-center text-white/45">
            Cargando tus vibes...
          </div>
        ) : photos.length === 0 ? (
          <section className="mt-16 text-center">
            <p className="text-5xl">📸</p>

            <h1 className="mt-5 text-2xl font-medium">
              Tu dump está vacío
            </h1>

            <Link
              href="/vibedump/camera"
              className="mt-7 inline-flex rounded-2xl bg-[#b995ff] px-6 py-4 font-semibold text-[#160d24]"
            >
              Abrir cámara
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-6 space-y-5">
              {photos.map((photo) => (
                <article
                  key={photo.id}
                  className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5"
                >
                  {objectUrls[photo.id] && (
                    <img
                      src={objectUrls[photo.id]}
                      alt={`Foto de ${photo.guestName}`}
                      className="max-h-[58vh] w-full object-cover"
                    />
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{photo.guestName}</p>
                        <p className="mt-1 text-xs text-white/40">
                          {formatDate(photo.createdAt)}
                        </p>
                      </div>

                      <span className="rounded-full border border-[#b995ff]/20 bg-[#b995ff]/10 px-3 py-1 text-xs text-[#dfd1ff]">
                        {statusLabel(photo.syncStatus)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-white/40">
                      <span>
                        {photo.source === "camera"
                          ? "Cámara"
                          : "Galería"}
                      </span>

                      <span>{formatBytes(photo.optimizedSize)}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => downloadPhoto(photo)}
                        className="rounded-2xl bg-[#b995ff] px-4 py-3 font-semibold text-[#160d24]"
                      >
                        Descargar
                      </button>

                      <button
                        type="button"
                        onClick={() => removePhoto(photo)}
                        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <div className="mt-7">
              <BackupTools photoCount={photos.length} />
            </div>

            <button
              type="button"
              onClick={clearAlbum}
              className="mt-6 w-full rounded-2xl border border-red-300/15 bg-red-300/5 px-5 py-3 text-sm text-red-100/80"
            >
              Vaciar álbum local
            </button>
          </>
        )}
      </div>
    </main>
  );
}
