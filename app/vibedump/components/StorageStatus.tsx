"use client";

import { useEffect, useState } from "react";

type StorageInfo = {
  used: number;
  quota: number;
};

function formatMB(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

export default function StorageStatus() {
  const [info, setInfo] = useState<StorageInfo | null>(null);

  useEffect(() => {
    const readStorage = async () => {
      try {
        if (!navigator.storage?.estimate) return;

        const estimate = await navigator.storage.estimate();

        setInfo({
          used: estimate.usage ?? 0,
          quota: estimate.quota ?? 0,
        });
      } catch {
        // El navegador puede no soportar esta API.
      }
    };

    readStorage();
  }, []);

  if (!info || !info.quota) return null;

  const percentage = Math.min(
    100,
    Math.round((info.used / info.quota) * 100)
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/45">Espacio usado por el navegador</span>
        <span className="text-white/70">{percentage}%</span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#b995ff]"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-white/35">
        {formatMB(info.used)} de aproximadamente {formatMB(info.quota)}
      </p>
    </div>
  );
}
