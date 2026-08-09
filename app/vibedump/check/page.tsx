"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CheckStatus = "checking" | "ok" | "warning" | "error";

type CheckResult = {
  id: string;
  label: string;
  detail: string;
  status: CheckStatus;
};

function statusIcon(status: CheckStatus) {
  if (status === "ok") return "✓";
  if (status === "warning") return "!";
  if (status === "error") return "×";
  return "…";
}

function statusClasses(status: CheckStatus) {
  if (status === "ok") {
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  }

  if (status === "warning") {
    return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  }

  if (status === "error") {
    return "border-red-300/20 bg-red-300/10 text-red-100";
  }

  return "border-white/10 bg-white/5 text-white/60";
}

async function testIndexedDB() {
  return new Promise<boolean>((resolve) => {
    try {
      const request = indexedDB.open("vibedump-diagnostic", 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("test")) {
          db.createObjectStore("test");
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("test", "readwrite");
        tx.objectStore("test").put("ok", "status");

        tx.oncomplete = () => {
          db.close();
          resolve(true);
        };

        tx.onerror = () => {
          db.close();
          resolve(false);
        };
      };

      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export default function VibeDumpCheckPage() {
  const [results, setResults] = useState<CheckResult[]>([
    {
      id: "secure",
      label: "Conexión segura",
      detail: "Revisando HTTPS...",
      status: "checking",
    },
    {
      id: "camera",
      label: "Acceso a cámara",
      detail: "Revisando API de cámara...",
      status: "checking",
    },
    {
      id: "indexeddb",
      label: "Álbum local",
      detail: "Revisando IndexedDB...",
      status: "checking",
    },
    {
      id: "storage",
      label: "Espacio disponible",
      detail: "Consultando almacenamiento...",
      status: "checking",
    },
    {
      id: "network",
      label: "Conexión a internet",
      detail: "Revisando estado de red...",
      status: "checking",
    },
    {
      id: "pwa",
      label: "Modo aplicación",
      detail: "Revisando instalación...",
      status: "checking",
    },
  ]);

  const [cameraPermission, setCameraPermission] = useState<
    "idle" | "testing" | "granted" | "denied"
  >("idle");

  const update = (
    id: string,
    status: CheckStatus,
    detail: string
  ) => {
    setResults((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status, detail } : item
      )
    );
  };

  useEffect(() => {
    const secure =
      window.isSecureContext ||
      window.location.hostname === "localhost";

    update(
      "secure",
      secure ? "ok" : "error",
      secure
        ? "Contexto seguro disponible."
        : "La cámara requiere HTTPS o localhost."
    );

    const cameraAvailable =
      Boolean(navigator.mediaDevices?.getUserMedia);

    update(
      "camera",
      cameraAvailable ? "ok" : "error",
      cameraAvailable
        ? "El navegador soporta acceso a cámara."
        : "Este navegador no expone getUserMedia."
    );

    testIndexedDB().then((ok) => {
      update(
        "indexeddb",
        ok ? "ok" : "error",
        ok
          ? "El dispositivo puede guardar fotos localmente."
          : "No fue posible escribir en IndexedDB."
      );
    });

    const checkStorage = async () => {
      try {
        if (!navigator.storage?.estimate) {
          update(
            "storage",
            "warning",
            "El navegador no informa su cuota de almacenamiento."
          );
          return;
        }

        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota ?? 0;
        const usage = estimate.usage ?? 0;
        const free = Math.max(0, quota - usage);
        const freeMB = Math.round(free / 1024 / 1024);

        update(
          "storage",
          freeMB >= 100 ? "ok" : "warning",
          freeMB > 0
            ? `Aproximadamente ${freeMB} MB disponibles para datos del navegador.`
            : "No se pudo estimar espacio libre."
        );
      } catch {
        update(
          "storage",
          "warning",
          "No se pudo estimar el espacio disponible."
        );
      }
    };

    checkStorage();

    update(
      "network",
      navigator.onLine ? "ok" : "warning",
      navigator.onLine
        ? "El navegador reporta conexión."
        : "Estás sin conexión; VibeDump puede seguir guardando localmente."
    );

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    update(
      "pwa",
      standalone ? "ok" : "warning",
      standalone
        ? "VibeDump está abierto como aplicación instalada."
        : "Funciona en navegador; instalarlo es opcional."
    );
  }, []);

  const testCameraPermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraPermission("denied");
      return;
    }

    setCameraPermission("testing");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
        },
      });

      stream.getTracks().forEach((track) => track.stop());

      setCameraPermission("granted");
      update(
        "camera",
        "ok",
        "Cámara detectada y permiso concedido."
      );
    } catch {
      setCameraPermission("denied");
      update(
        "camera",
        "error",
        "La cámara existe, pero el permiso fue rechazado o no está disponible."
      );
    }
  };

  const okCount = results.filter(
    (item) => item.status === "ok"
  ).length;

  const errorCount = results.filter(
    (item) => item.status === "error"
  ).length;

  const readiness =
    errorCount > 0
      ? "Necesita revisión"
      : okCount >= 4
        ? "Listo para VibeDump"
        : "Casi listo";

  return (
    <main className="min-h-screen bg-[#09070d] text-white">
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-10 pt-6">
        <header className="flex items-center justify-between">
          <Link
            href="/vibedump"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl"
            aria-label="Volver"
          >
            ←
          </Link>

          <div className="text-center">
            <p className="text-lg font-medium">Device Check</p>
            <p className="text-xs text-white/45">
              VibeDump · XV Sandra Alicia
            </p>
          </div>

          <div className="h-11 w-11" aria-hidden="true" />
        </header>

        <section className="mt-7 rounded-[1.75rem] border border-[#b995ff]/20 bg-[#b995ff]/10 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#d6c4ff]">
            Estado
          </p>

          <h1 className="mt-2 text-2xl font-semibold">
            {readiness}
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/55">
            Esta prueba revisa las funciones que VibeDump necesita en este
            teléfono. No sube ni elimina fotografías.
          </p>
        </section>

        <section className="mt-5 space-y-3">
          {results.map((item) => (
            <article
              key={item.id}
              className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-semibold ${statusClasses(
                  item.status
                )}`}
              >
                {statusIcon(item.status)}
              </div>

              <div>
                <p className="font-medium">{item.label}</p>
                <p className="mt-1 text-sm leading-5 text-white/45">
                  {item.detail}
                </p>
              </div>
            </article>
          ))}
        </section>

        <button
          type="button"
          onClick={testCameraPermission}
          disabled={cameraPermission === "testing"}
          className="mt-6 w-full rounded-2xl bg-[#b995ff] px-5 py-4 font-semibold text-[#160d24] disabled:opacity-50"
        >
          {cameraPermission === "testing"
            ? "Probando cámara..."
            : cameraPermission === "granted"
              ? "Cámara comprobada ✓"
              : "Probar permiso de cámara"}
        </button>

        {cameraPermission === "denied" && (
          <p className="mt-3 rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm leading-6 text-red-100">
            Revisa los permisos de cámara del navegador y vuelve a ejecutar la
            prueba.
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/vibedump/camera"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center font-medium"
          >
            Abrir cámara
          </Link>

          <Link
            href="/vibedump/album"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center font-medium"
          >
            Mis vibes
          </Link>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-white/35">
          Para la prueba real en celular usa la versión HTTPS desplegada en
          Vercel. localhost solo sirve para probar desde la computadora.
        </p>
      </div>
    </main>
  );
}
