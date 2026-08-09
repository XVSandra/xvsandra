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
  }, []);

  return (
    <main className="min-h-screen bg-[#09070d] text-white">
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-10 pt-6">
        <header className="flex items-center justify-between">
          <Link
            href="/vibedump/camera"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl"
            aria-label="Volver a cámara"
          >
            ←
          </Link>

          <div className="text-center">
            <p className="text-lg font-medium">Gallery dump</p>
            <p className="text-xs text-white/45">
              {guestName || "VibeDump"}
            </p>
          </div>

          <NetworkStatus />
        </header>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/55">
          Ya tienes{" "}
          <strong className="text-white">{vibeCount}</strong>{" "}
          {vibeCount === 1 ? "vibe" : "vibes"} guardadas.
        </div>

        <div className="mt-5">
          <BatchGalleryPicker
            guestName={guestName}
            onSaved={refreshCount}
          />
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
            className="rounded-2xl bg-[#b995ff] px-4 py-4 text-center font-semibold text-[#160d24]"
          >
            Ver mis vibes
          </Link>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-white/35">
          Las fotos siguen guardándose únicamente en este dispositivo hasta que
          activemos el álbum central.
        </p>
      </div>
    </main>
  );
}
