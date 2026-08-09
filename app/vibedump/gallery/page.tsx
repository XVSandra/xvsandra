"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BatchGalleryPicker from "../components/BatchGalleryPicker";
import NetworkStatus from "../components/NetworkStatus";
import { getStoredVibeCount } from "@/lib/vibedump/localAlbum";

const GUEST_NAME_KEY = "vibedump_guest_name";

export default function VibeDumpGalleryPage() {
  const [guestName, setGuestName] = useState("");
  const [vibeCount, setVibeCount] = useState(0);
  const [ready, setReady] = useState(false);

  const refreshCount = async () => {
    try {
      setVibeCount(await getStoredVibeCount());
    } catch {
      setVibeCount(0);
    }
  };

  useEffect(() => {
    const savedName =
      window.localStorage.getItem(GUEST_NAME_KEY) ?? "";

    if (!savedName) {
      window.location.href = "/vibedump";
      return;
    }

    setGuestName(savedName);
    refreshCount();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#09070d] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6">
          <p className="text-sm text-white/45">
            Preparando tu galería...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09070d] text-white">
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-10 pt-6">
        <header className="flex items-center justify-between">
          <Link
            href="/vibedump"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl"
            aria-label="Volver a VibeDump"
          >
            ←
          </Link>

          <div className="text-center">
            <p className="text-lg font-medium">Compartir varias</p>
            <p className="text-xs text-white/45">
              {guestName}
            </p>
          </div>

          <NetworkStatus />
        </header>

        <section className="mt-6 rounded-[1.75rem] border border-[#b995ff]/20 bg-[#b995ff]/10 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#d6c4ff]">
            Gallery dump
          </p>

          <h1 className="mt-2 text-2xl font-semibold">
            Elige tus mejores momentos
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/55">
            Puedes seleccionar hasta 20 fotos de tu galería y enviarlas juntas.
          </p>
        </section>

        <div className="mt-5">
          <BatchGalleryPicker
            guestName={guestName}
            onSaved={refreshCount}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/55">
          Ya tienes{" "}
          <strong className="text-white">{vibeCount}</strong>{" "}
          {vibeCount === 1 ? "vibe" : "vibes"} en este dispositivo.
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/vibedump/camera"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center font-medium"
          >
            Ir a cámara
          </Link>

          <Link
            href="/vibedump/album"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center font-medium"
          >
            Ver mis vibes
          </Link>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-white/35">
          VibeDump intenta enviar tus fotos automáticamente. Si pierdes conexión,
          quedan guardadas y se enviarán cuando vuelva internet.
        </p>
      </div>
    </main>
  );
}
