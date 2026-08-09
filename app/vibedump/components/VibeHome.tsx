"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getStoredVibeCount,
  getStoredVibes,
} from "@/lib/vibedump/localAlbum";
import NetworkStatus from "./NetworkStatus";
import RetryPendingButton from "./RetryPendingButton";

const GUEST_NAME_KEY = "vibedump_guest_name";
const CONSENT_KEY = "vibedump_consent";

export default function VibeHome() {
  const [name, setName] = useState("");
  const [draftName, setDraftName] = useState("");
  const [consent, setConsent] = useState(false);
  const [ready, setReady] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [vibeCount, setVibeCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState("");

  const refreshCounts = async () => {
    try {
      const [count, vibes] = await Promise.all([
        getStoredVibeCount(),
        getStoredVibes(),
      ]);

      setVibeCount(count);
      setPendingCount(
        vibes.filter((vibe) => vibe.syncStatus !== "sent").length
      );
    } catch {
      setVibeCount(0);
      setPendingCount(0);
    }
  };

  useEffect(() => {
    const savedName =
      window.localStorage.getItem(GUEST_NAME_KEY) ?? "";
    const savedConsent =
      window.localStorage.getItem(CONSENT_KEY) === "yes";

    setName(savedName);
    setDraftName(savedName);
    setConsent(savedConsent);
    refreshCounts();
    setReady(true);
  }, []);

  const saveGuest = () => {
    const cleanName = draftName.trim().replace(/\s+/g, " ");

    if (cleanName.length < 2) {
      setError("Escribe tu nombre o apodo.");
      return;
    }

    if (!consent) {
      setError(
        "Necesitamos tu autorización para guardar las fotos que elijas compartir."
      );
      return;
    }

    window.localStorage.setItem(GUEST_NAME_KEY, cleanName);
    window.localStorage.setItem(CONSENT_KEY, "yes");

    setName(cleanName);
    setDraftName(cleanName);
    setEditingName(false);
    setError("");
  };

  const resetGuest = () => {
    const confirmed = window.confirm(
      "¿Cambiar de invitado? Las fotos de este dispositivo no se borrarán."
    );

    if (!confirmed) return;

    window.localStorage.removeItem(GUEST_NAME_KEY);
    window.localStorage.removeItem(CONSENT_KEY);

    setName("");
    setDraftName("");
    setConsent(false);
    setEditingName(false);
    setError("");
  };

  if (!ready) {
    return (
      <div className="mt-10 text-center text-sm text-white/45">
        Preparando VibeDump...
      </div>
    );
  }

  const registered = Boolean(name) && consent && !editingName;

  if (!registered) {
    return (
      <section className="mt-9 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <span className="inline-flex rounded-full border border-[#b995ff]/25 bg-[#b995ff]/10 px-3 py-1 text-xs text-[#dfd1ff]">
          Antes de empezar
        </span>

        <h2 className="mt-5 text-2xl font-medium leading-tight">
          ¿Cómo quieres aparecer en el dump?
        </h2>

        <p className="mt-3 text-sm leading-6 text-white/55">
          Usa tu nombre o un apodo para identificar las fotos que compartas.
        </p>

        <label
          htmlFor="vibedump-name"
          className="mt-6 block text-sm font-medium text-white/80"
        >
          Nombre o apodo
        </label>

        <input
          id="vibedump-name"
          value={draftName}
          maxLength={40}
          autoComplete="name"
          onChange={(event) => {
            setDraftName(event.target.value);
            setError("");
          }}
          placeholder="Ej. Sofi, Fer, Alex..."
          className="mt-2 w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3.5 text-base outline-none placeholder:text-white/25 focus:border-[#b995ff]"
        />

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked);
              setError("");
            }}
            className="mt-1 h-4 w-4 accent-[#b995ff]"
          />

          <span className="text-sm leading-6 text-white/60">
            Acepto compartir en el álbum privado del evento las fotografías
            que yo elija enviar mediante VibeDump.
          </span>
        </label>

        {error && (
          <p className="mt-4 text-sm text-[#ffb4b4]">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={saveGuest}
          className="mt-5 w-full rounded-2xl bg-[#b995ff] px-5 py-4 font-semibold text-[#160d24]"
        >
          Entrar a VibeDump
        </button>

        {name && editingName && (
          <button
            type="button"
            onClick={() => {
              setDraftName(name);
              setConsent(true);
              setEditingName(false);
              setError("");
            }}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm"
          >
            Cancelar
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/45">Esta noche eres</p>
          <h2 className="mt-1 text-2xl font-medium">{name}</h2>
        </div>

        <NetworkStatus />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-white/35">
            Mis vibes
          </p>
          <p className="mt-2 text-3xl font-semibold">{vibeCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-white/35">
            Por enviar
          </p>
          <p className="mt-2 text-3xl font-semibold">{pendingCount}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Link
          href="/vibedump/camera"
          className="flex w-full items-center justify-between rounded-[1.5rem] bg-[#b995ff] px-5 py-5 text-[#160d24]"
        >
          <span>
            <span className="block text-lg font-semibold">Abrir cámara</span>
            <span className="mt-1 block text-sm opacity-70">
              Captura y envía tu momento
            </span>
          </span>

          <span className="text-2xl" aria-hidden="true">📷</span>
        </Link>

        <Link
          href="/vibedump/gallery"
          className="flex w-full items-center justify-between rounded-[1.5rem] border border-[#b995ff]/25 bg-[#b995ff]/10 px-5 py-5"
        >
          <span>
            <span className="block text-lg font-medium text-[#dfd1ff]">
              Compartir varias
            </span>
            <span className="mt-1 block text-sm text-white/45">
              Elige hasta 20 fotos de tu galería
            </span>
          </span>

          <span className="text-2xl" aria-hidden="true">✦</span>
        </Link>

        <Link
          href="/vibedump/album"
          className="flex w-full items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-5"
        >
          <span>
            <span className="block text-lg font-medium">Ver mis vibes</span>
            <span className="mt-1 block text-sm text-white/45">
              Revisa lo que ya compartiste
            </span>
          </span>

          <span className="text-2xl" aria-hidden="true">▦</span>
        </Link>
      </div>

      {pendingCount > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200/15 bg-amber-200/5 px-4 py-4 text-center text-xs leading-5 text-amber-50/65">
          <p>
            {pendingCount === 1
              ? "Tienes 1 vibe pendiente de envío."
              : `Tienes ${pendingCount} vibes pendientes de envío.`}
          </p>

          <p className="mt-1 text-white/45">
            VibeDump seguirá intentando automáticamente. Si ya tienes conexión,
            también puedes forzar el envío ahora.
          </p>

          <RetryPendingButton
            pendingCount={pendingCount}
            onComplete={refreshCounts}
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm text-white/35">
        <button
          type="button"
          onClick={() => {
            setDraftName(name);
            setEditingName(true);
          }}
        >
          Editar nombre
        </button>

        <span aria-hidden="true">•</span>

        <button type="button" onClick={resetGuest}>
          Cambiar invitado
        </button>
      </div>
    </section>
  );
}
