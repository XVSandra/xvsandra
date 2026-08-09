"use client";

import { ChangeEvent, useRef, useState } from "react";
import { saveStoredVibe } from "@/lib/vibedump/localAlbum";
import { syncVibeById } from "@/lib/vibedump/syncQueue";

type Props = {
  guestName: string;
  onSaved: (count: number) => Promise<void> | void;
};

type BatchItem = {
  id: string;
  file: File;
  status: "waiting" | "processing" | "sending" | "sent" | "saved" | "error";
  message?: string;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

async function optimizeImage(
  source: Blob,
  maxDimension = 2200,
  quality = 0.84
): Promise<Blob> {
  const bitmap = await createImageBitmap(source);

  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height)
  );

  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("No fue posible preparar la imagen.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });

  if (!blob) {
    throw new Error("No fue posible preparar la imagen.");
  }

  return blob;
}

export default function BatchGalleryPicker({
  guestName,
  onSaved,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);

  const selectPhotos = () => {
    if (!processing) inputRef.current?.click();
  };

  const onFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 20);

    setItems(
      files.map((file) => ({
        id: createId(),
        file,
        status: "waiting",
      }))
    );

    setComplete(false);
    event.target.value = "";
  };

  const processBatch = async () => {
    if (!guestName || items.length === 0 || processing) return;

    setProcessing(true);
    setComplete(false);

    let saved = 0;

    for (const item of items) {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: "processing", message: undefined }
            : entry
        )
      );

      try {
        if (item.file.size > 20 * 1024 * 1024) {
          throw new Error("Archivo mayor de 20 MB");
        }

        const optimizedBlob = await optimizeImage(item.file);
        const vibeId = createId();

        await saveStoredVibe({
          id: vibeId,
          guestName,
          blob: optimizedBlob,
          source: "gallery",
          originalSize: item.file.size,
          optimizedSize: optimizedBlob.size,
          createdAt: new Date().toISOString(),
          syncStatus: "pending",
          retryCount: 0,
        });

        saved += 1;

        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: "sending",
                  message: formatBytes(optimizedBlob.size),
                }
              : entry
          )
        );

        const result = await syncVibeById(vibeId);

        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: result.sent ? "sent" : "saved",
                  message: result.sent
                    ? "Enviada"
                    : "Guardada para enviar después",
                }
              : entry
          )
        );
      } catch (error) {
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: "error",
                  message:
                    error instanceof Error
                      ? error.message
                      : "No se pudo preparar",
                }
              : entry
          )
        );
      }
    }

    await onSaved(saved);
    setProcessing(false);
    setComplete(true);
  };

  const sent = items.filter((item) => item.status === "sent").length;
  const waiting = items.filter((item) => item.status === "saved").length;
  const failed = items.filter((item) => item.status === "error").length;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#d6c4ff]">
            Desde tu galería
          </p>

          <h2 className="mt-2 text-xl font-medium">
            Comparte varias fotos
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/50">
            Selecciona hasta 20. VibeDump las prepara y envía automáticamente.
          </p>
        </div>

        <span className="text-2xl" aria-hidden="true">
          ✦
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFilesSelected}
      />

      <button
        type="button"
        onClick={selectPhotos}
        disabled={processing}
        className="mt-5 w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 font-medium disabled:opacity-50"
      >
        {items.length > 0
          ? `Cambiar selección (${items.length})`
          : "Elegir fotos"}
      </button>

      {items.length > 0 && (
        <>
          <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate">
                    {index + 1}. {item.file.name}
                  </p>
                  <p className="mt-0.5 text-xs text-white/35">
                    {formatBytes(item.file.size)}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-white/55">
                  {item.status === "waiting" && "Lista"}
                  {item.status === "processing" && "Preparando…"}
                  {item.status === "sending" && "Enviando…"}
                  {item.status === "sent" && "Enviada ✓"}
                  {item.status === "saved" && "Se enviará después"}
                  {item.status === "error" && `Error · ${item.message ?? ""}`}
                </span>
              </div>
            ))}
          </div>

          {!complete && (
            <button
              type="button"
              onClick={processBatch}
              disabled={processing}
              className="mt-4 w-full rounded-2xl bg-[#b995ff] px-5 py-4 font-semibold text-[#160d24] disabled:opacity-60"
            >
              {processing
                ? "Enviando tus vibes..."
                : `Enviar ${items.length} ${items.length === 1 ? "foto" : "fotos"}`}
            </button>
          )}

          {complete && (
            <div className="mt-4 rounded-2xl border border-[#b995ff]/20 bg-[#b995ff]/10 p-4 text-sm">
              <p className="font-medium text-[#dfd1ff]">
                ¡Listo! ✨
              </p>

              <p className="mt-1 leading-5 text-white/55">
                {sent > 0 && `${sent} ${sent === 1 ? "enviada" : "enviadas"}. `}
                {waiting > 0 &&
                  `${waiting} ${waiting === 1 ? "quedó guardada" : "quedaron guardadas"} para enviarse automáticamente. `}
                {failed > 0 &&
                  `${failed} ${failed === 1 ? "no pudo prepararse" : "no pudieron prepararse"}.`}
              </p>

              <button
                type="button"
                onClick={() => {
                  setItems([]);
                  setComplete(false);
                }}
                className="mt-3 text-sm font-medium text-[#d6c4ff]"
              >
                Compartir más fotos
              </button>
            </div>
          )}
        </>
      )}

      <p className="mt-4 text-xs leading-5 text-white/35">
        Si la conexión falla, las fotos quedan protegidas en tu dispositivo y
        VibeDump vuelve a intentar el envío automáticamente.
      </p>
    </section>
  );
}
