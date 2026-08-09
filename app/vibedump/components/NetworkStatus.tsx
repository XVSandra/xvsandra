"use client";

import { useEffect, useState } from "react";

export default function NetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <span
      aria-live="polite"
      className={`rounded-full border px-3 py-1.5 text-xs ${
        online
          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
          : "border-amber-300/20 bg-amber-300/10 text-amber-100"
      }`}
    >
      {online ? "En línea" : "Sin conexión"}
    </span>
  );
}
