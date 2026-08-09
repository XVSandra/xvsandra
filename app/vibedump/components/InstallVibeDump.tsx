"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

export default function InstallVibeDump() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsStandalone(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  if (isStandalone) {
    return (
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs text-white/45">
        VibeDump está abierto como app ✨
      </div>
    );
  }

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;

      if (choice.outcome === "accepted") {
        setInstallEvent(null);
      }
      return;
    }

    if (isIOS) {
      setShowIOSHelp((current) => !current);
    }
  };

  if (!installEvent && !isIOS) {
    return null;
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={install}
        className="w-full rounded-2xl border border-[#b995ff]/25 bg-[#b995ff]/10 px-4 py-3.5 text-sm font-medium text-[#dfd1ff] transition hover:bg-[#b995ff]/15"
      >
        Instalar VibeDump en mi celular
      </button>

      {showIOSHelp && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/60">
          En iPhone: abre VibeDump en Safari, toca <strong>Compartir</strong> y
          selecciona <strong>Agregar a pantalla de inicio</strong>.
        </div>
      )}
    </div>
  );
}
