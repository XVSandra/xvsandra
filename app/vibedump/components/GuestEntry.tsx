"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const GUEST_NAME_KEY = "vibedump_guest_name";

export default function GuestEntry() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedName = window.localStorage.getItem(GUEST_NAME_KEY);

    if (savedName) {
      setName(savedName);
    }

    setIsReady(true);
  }, []);

  const enterVibeDump = () => {
    const cleanName = name.trim().replace(/\s+/g, " ");

    if (cleanName.length < 2) {
      setError("Escribe tu nombre o apodo para continuar.");
      return;
    }

    if (cleanName.length > 40) {
      setError("Usa un nombre de máximo 40 caracteres.");
      return;
    }

    window.localStorage.setItem(GUEST_NAME_KEY, cleanName);
    setError("");
    router.push("/vibedump/camera");
  };

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
      <div className="mb-7">
        <span className="inline-flex rounded-full border border-[#b995ff]/30 bg-[#b995ff]/10 px-3 py-1 text-xs text-[#ddceff]">
          Álbum colaborativo
        </span>

        <h2 className="mt-5 text-2xl font-medium leading-tight">
          Sin poses perfectas.
          <br />
          Solo cómo viviste la noche.
        </h2>

        <p className="mt-3 text-sm leading-6 text-white/60">
          Toma fotos, sube las que ya tienes y comparte tu propio dump del XV.
        </p>
      </div>

      <label
        htmlFor="guest-name"
        className="mb-2 block text-sm font-medium text-white/80"
      >
        Tu nombre o apodo
      </label>

      <input
        id="guest-name"
        name="guestName"
        type="text"
        autoComplete="name"
        inputMode="text"
        maxLength={40}
        value={name}
        disabled={!isReady}
        onChange={(event) => {
          setName(event.target.value);
          if (error) setError("");
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            enterVibeDump();
          }
        }}
        placeholder="Ej. Fer, Sofi, Alex..."
        className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3.5 text-base text-white outline-none transition placeholder:text-white/25 focus:border-[#b995ff] focus:ring-4 focus:ring-[#b995ff]/10 disabled:opacity-50"
      />

      <p
        className={`mt-2 min-h-5 text-sm ${
          error ? "text-[#ffb4b4]" : "text-white/35"
        }`}
        aria-live="polite"
      >
        {error || "Así podremos saber quién compartió cada recuerdo."}
      </p>

      <button
        type="button"
        disabled={!isReady}
        onClick={enterVibeDump}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b995ff] px-5 py-4 text-base font-semibold text-[#160d24] transition hover:bg-[#c8adff] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Entrar a la cámara
        <span aria-hidden="true">→</span>
      </button>

      <p className="mt-4 text-center text-xs leading-5 text-white/35">
        Al continuar aceptas compartir las fotos que elijas subir al álbum del
        evento.
      </p>
    </div>
  );
}
