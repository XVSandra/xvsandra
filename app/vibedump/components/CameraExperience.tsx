"use client";

import Link from "next/link";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getStoredVibeCount,
  saveStoredVibe,
} from "@/lib/vibedump/localAlbum";
import NetworkStatus from "./NetworkStatus";
import { requestVibeDumpSync } from "./AutoSync";

const GUEST_NAME_KEY = "vibedump_guest_name";

type CameraFacingMode = "user" | "environment";
type PhotoSource = "camera" | "gallery";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  return `${(kb / 1024).toFixed(2)} MB`;
}

async function optimizeImage(
  source: Blob,
  maxDimension = 2200,
  quality = 0.84
): Promise<Blob> {
  const bitmap = await createImageBitmap(source);

  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height)
  );

  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("No fue posible optimizar la imagen.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });

  if (!blob) {
    throw new Error("No fue posible generar la versión optimizada.");
  }

  return blob;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function CameraExperience() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [guestName, setGuestName] = useState("");
  const [facingMode, setFacingMode] =
    useState<CameraFacingMode>("environment");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewOriginalSize, setPreviewOriginalSize] = useState(0);
  const [photoSource, setPhotoSource] = useState<PhotoSource>("camera");
  const [isStarting, setIsStarting] = useState(true);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [vibeCount, setVibeCount] = useState(0);
  const [savedMessage, setSavedMessage] = useState("");
  const [showSavedActions, setShowSavedActions] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
    setIsTorchSupported(false);
    setTorchEnabled(false);
  }, []);

  const refreshCount = useCallback(async () => {
    try {
      setVibeCount(await getStoredVibeCount());
    } catch {
      setVibeCount(0);
    }
  }, []);

  const startCamera = useCallback(
    async (mode: CameraFacingMode) => {
      stopCamera();
      setIsStarting(true);
      setCameraError("");

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setCameraError(
          "Este navegador no permite abrir la cámara. También puedes subir fotos desde tu galería."
        );
        setIsStarting(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 2560 },
          },
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const track = stream.getVideoTracks()[0];
        const capabilities =
          typeof track.getCapabilities === "function"
            ? track.getCapabilities()
            : {};

        setIsTorchSupported("torch" in capabilities);
        setCameraReady(true);
      } catch (error) {
        setCameraError(
          error instanceof DOMException &&
            error.name === "NotAllowedError"
            ? "No se concedió permiso para usar la cámara."
            : "No fue posible abrir la cámara."
        );
      } finally {
        setIsStarting(false);
      }
    },
    [stopCamera]
  );

  useEffect(() => {
    const savedName =
      window.localStorage.getItem(GUEST_NAME_KEY) ?? "";

    setGuestName(savedName);

    if (!savedName) {
      window.location.href = "/vibedump";
      return;
    }

    refreshCount();
    startCamera("environment");

    return () => stopCamera();
  }, [refreshCount, startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !cameraReady) return;

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return;

    if (facingMode === "user") {
      context.translate(width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, width, height);

    setFlashEffect(true);
    window.setTimeout(() => setFlashEffect(false), 180);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        setPhotoSource("camera");
        setPreviewOriginalSize(blob.size);
        setPreviewBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  const handleGalleryPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    stopCamera();
    setPhotoSource("gallery");
    setPreviewOriginalSize(file.size);
    setPreviewBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
    event.target.value = "";
  };

  const retakePhoto = async () => {
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
    setPreviewBlob(null);
    setPreviewOriginalSize(0);
    await startCamera(facingMode);
  };

  const saveLocally = async () => {
    if (!previewBlob || !guestName || isOptimizing) return;

    setIsOptimizing(true);

    try {
      const optimizedBlob = await optimizeImage(previewBlob);

      await saveStoredVibe({
        id: createId(),
        guestName,
        blob: optimizedBlob,
        source: photoSource,
        originalSize: previewOriginalSize || previewBlob.size,
        optimizedSize: optimizedBlob.size,
        createdAt: new Date().toISOString(),
        syncStatus: "pending",
        retryCount: 0,
      });

      await refreshCount();
      requestVibeDumpSync();

      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl("");
      setPreviewBlob(null);
      setPreviewOriginalSize(0);
      setSavedMessage("Vibe guardada ✨");
      setShowSavedActions(true);
      stopCamera();
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : "No fue posible guardar la fotografía."
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  const continueCapturing = async () => {
    setSavedMessage("");
    setShowSavedActions(false);
    await startCamera(facingMode);
  };

  if (showSavedActions) {
    return (
      <main className="min-h-screen bg-[#09070d] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl">✨</div>

          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-[#d6c4ff]">
            {savedMessage}
          </p>

          <h1 className="mt-4 text-3xl font-semibold">
            Ya está en tu dump
          </h1>

          <div className="mt-8 grid w-full gap-3">
            <button
              type="button"
              onClick={continueCapturing}
              className="rounded-2xl bg-[#b995ff] px-5 py-4 font-semibold text-[#160d24]"
            >
              Tomar otra foto
            </button>

            <Link
              href="/vibedump/gallery"
              className="rounded-2xl border border-[#b995ff]/25 bg-[#b995ff]/10 px-5 py-4 font-medium text-[#dfd1ff]"
            >
              Armar un dump desde mi galería
            </Link>

            <Link
              href="/vibedump/album"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 font-medium"
            >
              Ver mis vibes ({vibeCount})
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (previewUrl) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-7 pt-6">
          <header className="flex items-center justify-between">
            <button
              type="button"
              onClick={retakePhoto}
              disabled={isOptimizing}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl"
            >
              ←
            </button>

            <div className="text-center">
              <p className="text-lg font-medium">¿La guardamos?</p>
              <p className="text-xs text-white/45">
                {formatBytes(previewOriginalSize)}
              </p>
            </div>

            <div className="h-11 w-11" />
          </header>

          <section className="mt-7 flex flex-1 flex-col">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111]">
              <img
                src={previewUrl}
                alt="Vista previa"
                className="max-h-[64vh] w-full object-contain"
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={retakePhoto}
                disabled={isOptimizing}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4 font-medium"
              >
                Repetir
              </button>

              <button
                type="button"
                onClick={saveLocally}
                disabled={isOptimizing}
                className="rounded-2xl bg-[#b995ff] px-4 py-4 font-semibold text-[#160d24]"
              >
                {isOptimizing ? "Guardando..." : "Guardar vibe"}
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        className={`pointer-events-none absolute inset-0 z-50 bg-white transition-opacity duration-150 ${
          flashEffect ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-6 pt-5">
        <header className="flex items-center justify-between px-1">
          <Link
            href="/vibedump"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-2xl"
          >
            ←
          </Link>

          <div className="text-center">
            <p className="text-lg font-medium">XV Sandra Alicia</p>
            <p className="text-xs text-white/45">
              {guestName ? `Vibe de ${guestName}` : "VibeDump"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-xl"
            aria-label="Elegir una foto"
          >
            ＋
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGalleryPhoto}
          />
        </header>

        <div className="mt-3 flex items-center justify-between px-1">
          <NetworkStatus />

          <div className="flex gap-2">
            <Link
              href="/vibedump/gallery"
              onClick={stopCamera}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70"
            >
              + varias
            </Link>

            <Link
              href="/vibedump/album"
              onClick={stopCamera}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70"
            >
              {vibeCount} vibes
            </Link>
          </div>
        </div>

        <section className="mt-4 flex flex-1 flex-col">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border border-white/10 bg-[#111]">
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className={`h-full w-full object-cover ${
                facingMode === "user" ? "-scale-x-100" : ""
              }`}
            />

            {isStarting && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#120f17]">
                <p className="text-sm text-white/50">
                  Preparando cámara...
                </p>
              </div>
            )}

            {cameraReady && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs text-white/75 backdrop-blur-md">
                Sin poses. Solo tu vibe.
              </div>
            )}
          </div>

          {cameraError && (
            <p className="mt-3 text-center text-sm text-[#ffb4b4]">
              {cameraError}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between px-6">
            <button
              type="button"
              onClick={async () => {
                const track = streamRef.current?.getVideoTracks()[0];
                if (!track || !isTorchSupported) return;

                try {
                  await track.applyConstraints({
                    advanced: [
                      { torch: !torchEnabled } as MediaTrackConstraintSet,
                    ],
                  });
                  setTorchEnabled((current) => !current);
                } catch {}
              }}
              disabled={!cameraReady || !isTorchSupported}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                torchEnabled
                  ? "bg-[#b995ff] text-[#160d24]"
                  : "bg-white/5"
              } disabled:opacity-25`}
            >
              ⚡
            </button>

            <button
              type="button"
              onClick={capturePhoto}
              disabled={!cameraReady}
              className="flex h-24 w-24 items-center justify-center rounded-full border-[7px] border-white/30 disabled:opacity-30"
            >
              <span className="h-16 w-16 rounded-full bg-white" />
            </button>

            <button
              type="button"
              onClick={async () => {
                const next =
                  facingMode === "environment" ? "user" : "environment";
                setFacingMode(next);
                await startCamera(next);
              }}
              disabled={!cameraReady}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-2xl disabled:opacity-25"
            >
              ↻
            </button>
          </div>
        </section>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  );
}
