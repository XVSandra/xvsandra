"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register("/vibedump/sw.js", {
          scope: "/vibedump/",
        });
      } catch (error) {
        console.warn("VibeDump service worker no pudo registrarse:", error);
      }
    };

    registerServiceWorker();
  }, []);

  return null;
}
