import InstallVibeDump from "./components/InstallVibeDump";
import VibeHome from "./components/VibeHome";

export default function VibeDumpPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09070d] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#9d6cff]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[#f1c76e]/10 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-8 pt-10">
        <header className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-[#d6c4ff]">
            XV Sandra Alicia
          </p>

          <h1 className="mt-5 text-5xl font-semibold tracking-tight">
            Vibe<span className="text-[#b995ff]">Dump</span>
          </h1>

          <p className="mt-3 text-sm text-white/60">
            Drop your vibe. Keep the memory.
          </p>
        </header>

        <VibeHome />

        <div className="mt-5">
          <InstallVibeDump />
        </div>

        <footer className="mt-auto pt-10 text-center text-xs leading-5 text-white/35">
          Sin poses perfectas. Solo comparte cómo viviste la noche.
        </footer>
      </div>
    </main>
  );
}
