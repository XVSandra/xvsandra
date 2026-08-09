"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { subscribeToVibeWall, type WallVibe } from "@/lib/vibedump/publicWall";

const ROTATION_MS = 6500;

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function VibeWallPage() {
  const [vibes, setVibes] = useState<WallVibe[]>([]);
  const [playlist, setPlaylist] = useState<WallVibe[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState("");
  const [showControls, setShowControls] = useState(true);
  const idleTimer = useRef<number | null>(null);

  useEffect(() => {
    return subscribeToVibeWall(
      (next) => {
        setVibes(next);
        setError("");

        setPlaylist((old) => {
          if (old.length === 0) return shuffled(next);

          const nextIds = new Set(next.map((v) => v.id));
          const retained = old.filter((v) => nextIds.has(v.id));
          const retainedIds = new Set(retained.map((v) => v.id));
          const additions = next.filter((v) => !retainedIds.has(v.id));

          return additions.length
            ? [...retained, ...shuffled(additions)]
            : retained;
        });
      },
      (err) => setError(err.message)
    );
  }, []);

  useEffect(() => {
    if (current >= playlist.length && playlist.length > 0) {
      setCurrent(0);
    }
  }, [playlist.length, current]);

  useEffect(() => {
    if (paused || playlist.length <= 1) return;

    const timer = window.setInterval(() => {
      setCurrent((value) => {
        const nextIndex = value + 1;

        if (nextIndex >= playlist.length) {
          setPlaylist((items) => shuffled(items));
          return 0;
        }

        return nextIndex;
      });
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [paused, playlist.length]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
      if (event.key === " ") {
        event.preventDefault();
        setPaused((value) => !value);
      }
      if (event.key.toLowerCase() === "f") void fullscreen();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const active = playlist[current];

  const upcoming = useMemo(() => {
    if (playlist.length <= 1) return [];
    return Array.from({ length: Math.min(4, playlist.length - 1) }, (_, i) =>
      playlist[(current + i + 1) % playlist.length]
    );
  }, [playlist, current]);

  function revealControls() {
    setShowControls(true);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setShowControls(false), 3500);
  }

  function next() {
    if (!playlist.length) return;
    setCurrent((value) => (value + 1) % playlist.length);
  }

  function previous() {
    if (!playlist.length) return;
    setCurrent((value) => (value - 1 + playlist.length) % playlist.length);
  }

  async function fullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09070d] px-8 text-center text-white">
        <div>
          <p className="text-5xl">✦</p>
          <h1 className="mt-5 text-4xl font-semibold">VibeWall</h1>
          <p className="mt-4 text-white/50">No fue posible cargar las fotos aprobadas.</p>
          <p className="mt-3 max-w-xl break-words text-xs text-red-200/70">{error}</p>
        </div>
      </main>
    );
  }

  const QrBadge = () => (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-black/55 p-2.5 pr-4 shadow-2xl backdrop-blur-xl">
      <div className="rounded-xl bg-white p-1.5">
        <img
          src="/vibedump/qr-vibedump.png"
          alt="QR para abrir VibeDump"
          className="h-20 w-20"
        />
      </div>

      <div className="max-w-40">
        <p className="text-xs uppercase tracking-[0.2em] text-[#d8c8ff]">
          Sube tu vibe
        </p>
        <p className="mt-1 text-sm font-medium leading-5 text-white">
          Escanea y comparte tus fotos
        </p>
      </div>
    </div>
  );

  if (!active) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09070d] px-8 text-center text-white">
        <div className="absolute left-[15%] top-[12%] h-80 w-80 rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute bottom-[8%] right-[12%] h-72 w-72 rounded-full bg-amber-300/5 blur-[100px]" />

        <div className="relative">
          <p className="text-xs uppercase tracking-[0.55em] text-[#d8c8ff]">
            XV Sandra Alicia
          </p>
          <h1 className="mt-7 text-6xl font-semibold tracking-tight md:text-8xl lg:text-9xl">
            Vibe<span className="text-[#b28cff]">Wall</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/40 md:text-2xl">
            Las mejores vibes de la noche aparecerán aquí ✨
          </p>

          <div className="mx-auto mt-10 flex justify-center">
            <QrBadge />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative h-screen w-screen cursor-none overflow-hidden bg-black text-white"
      onMouseMove={revealControls}
      onTouchStart={revealControls}
    >
      <div
        key={`bg-${active.id}`}
        className="absolute inset-0 scale-110 animate-[wallFade_1s_ease-out] bg-cover bg-center opacity-45 blur-[55px]"
        style={{ backgroundImage: `url("${active.downloadUrl}")` }}
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,.48)_100%)]" />

      <section className="relative z-10 flex h-full items-center justify-center p-4 md:p-8">
        <div className="relative flex h-full max-h-[94vh] w-full max-w-[1600px] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 shadow-2xl">
          <img
            key={active.id}
            src={active.downloadUrl}
            alt={`Foto compartida por ${active.guestName}`}
            className="h-full w-full animate-[photoEnter_.9s_cubic-bezier(.2,.8,.2,1)] object-contain"
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/70 via-black/25 to-transparent px-6 pb-20 pt-6 md:px-10 md:pt-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.5em] text-[#d8c8ff] md:text-xs">
                XV Sandra Alicia
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight md:text-4xl">
                Vibe<span className="text-[#b28cff]">Wall</span>
              </p>
            </div>

            <p className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs text-white/60 backdrop-blur-lg">
              {vibes.length} {vibes.length === 1 ? "vibe" : "vibes"}
            </p>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-6 pb-6 pt-24 md:px-10 md:pb-9">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/35">
                compartida por
              </p>
              <p className="mt-2 text-xl font-medium md:text-3xl">{active.guestName}</p>
            </div>

            {upcoming.length > 0 && (
              <div className="hidden items-end gap-2 xl:flex">
                {upcoming.map((vibe) => (
                  <div
                    key={vibe.id}
                    className="h-16 w-12 overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-lg"
                  >
                    <img
                      src={vibe.downloadUrl}
                      alt=""
                      className="h-full w-full object-cover opacity-60"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="absolute bottom-6 right-6 z-20 hidden lg:block">
        <QrBadge />
      </div>

      <div
        className={`absolute inset-x-0 bottom-5 z-30 flex justify-center transition-opacity duration-300 ${
          showControls ? "cursor-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/65 p-2 shadow-2xl backdrop-blur-xl">
          <button onClick={previous} className="h-11 w-11 rounded-full hover:bg-white/10" aria-label="Anterior">
            ←
          </button>

          <button
            onClick={() => setPaused((value) => !value)}
            className="min-w-28 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
          >
            {paused ? "Continuar" : "Pausar"}
          </button>

          <button onClick={next} className="h-11 w-11 rounded-full hover:bg-white/10" aria-label="Siguiente">
            →
          </button>

          <button onClick={fullscreen} className="h-11 w-11 rounded-full hover:bg-white/10" aria-label="Pantalla completa">
            ⛶
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes photoEnter {
          from { opacity: 0; transform: scale(.975); filter: blur(5px); }
          to { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes wallFade {
          from { opacity: 0; }
          to { opacity: .45; }
        }
      `}</style>
    </main>
  );
}
