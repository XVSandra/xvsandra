"use client";

import Link from "next/link";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { uploadVibeDumpPhoto } from "@/lib/vibedump/uploadPhoto";

const GUEST_NAME_KEY = "vibedump_guest_name";

type CameraFacingMode = "user" | "environment";
type PhotoSource = "camera" | "gallery";

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
  const [photoSource, setPhotoSource] = useState<PhotoSource>("camera");
  const [isStarting, setIsStarting] = useState(true);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadComplete, setUploadComplete] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
    setIsTorchSupported(false);
    setTorchEnabled(false);
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
          "Este navegador no permite abrir la cámara. Prueba desde Chrome, Safari o Samsung Internet."
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
        const message =
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "No se concedió permiso para usar la cámara. Revisa los permisos del navegador."
            : "No fue posible abrir la cámara. También puedes elegir una foto desde tu galería.";

        setCameraError(message);
      } finally {
        setIsStarting(false);
      }
    },
    [stopCamera]
  );

  useEffect(() => {
    const savedName = window.localStorage.getItem(GUEST_NAME_KEY) ?? "";
    setGuestName(savedName);

    if (!savedName) {
      window.location.href = "/vibedump";
      return;
    }

    startCamera("environment");

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearPreview = () => {
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
    setPreviewBlob(null);
    setUploadProgress(0);
    setUploadError("");
    setUploadComplete(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !cameraReady) return;

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setCameraError("La cámara todavía se está preparando. Intenta de nuevo.");
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("No fue posible procesar la fotografía.");
      return;
    }

    if (facingMode === "user") {
      context.translate(width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, width, height);

    setFlashEffect(true);
    window.setTimeout(() => setFlashEffect(false), 180);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("No fue posible crear la fotografía.");
          return;
        }

        if (previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }

        const url = URL.createObjectURL(blob);
        setPhotoSource("camera");
        setPreviewBlob(blob);
        setPreviewUrl(url);
        stopCamera();
      },
      "image/jpeg",
      0.88
    );
  };

  const switchCamera = async () => {
    const nextMode: CameraFacingMode =
      facingMode === "environment" ? "user" : "environment";

    setFacingMode(nextMode);
    await startCamera(nextMode);
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];

    if (!track || !isTorchSupported) return;

    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled } as MediaTrackConstraintSet],
      });
      setTorchEnabled((current) => !current);
    } catch {
      setCameraError(
        "El flash no está disponible en este teléfono o navegador."
      );
    }
  };

  const chooseFromGallery = () => {
    fileInputRef.current?.click();
  };

  const handleGalleryPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCameraError("Selecciona un archivo de imagen.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setCameraError("La imagen supera el límite de 15 MB.");
      return;
    }

    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    stopCamera();
    setPhotoSource("gallery");
    setPreviewBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCameraError("");
    event.target.value = "";
  };

  const retakePhoto = async () => {
    clearPreview();
    await startCamera(facingMode);
  };

  const sharePhoto = async () => {
    if (!previewBlob || !guestName || isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");

    try {
      await uploadVibeDumpPhoto({
        file: previewBlob,
        guestName,
        source: photoSource,
        onProgress: setUploadProgress,
      });

      setUploadProgress(100);
      setUploadComplete(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible subir la fotografía. Intenta nuevamente.";

      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const takeAnotherPhoto = async () => {
    clearPreview();
    await startCamera(facingMode);
  };

  if (uploadComplete) {
    return (
      <main className="min-h-screen bg-[#09070d] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#b995ff]/15 text-4xl">
            ✨
          </div>

          <p className="mt-7 text-xs font-medium uppercase tracking-[0.3em] text-[#d6c4ff]">
            Vibe guardada
          </p>

          <h1 className="mt-4 text-3xl font-semibold">
            ¡Ya es parte del dump!
          </h1>

          <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">
            Gracias, {guestName}. Tu foto se subió correctamente al álbum del XV
            de Sandra Alicia.
          </p>

          <button
            type="button"
            onClick={takeAnotherPhoto}
            className="mt-8 w-full rounded-2xl bg-[#b995ff] px-5 py-4 font-semibold text-[#160d24]"
          >
            Tomar otra foto
          </button>

          <Link
            href="/vibedump"
            className="mt-3 w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-4 font-medium"
          >
            Volver al inicio
          </Link>
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
              disabled={isUploading}
              aria-label="Regresar a la cámara"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl disabled:opacity-40"
            >
              ←
            </button>

            <div className="text-center">
              <p className="text-lg font-medium">¿La subimos?</p>
              <p className="text-xs text-white/45">
                Revisa tu foto antes de compartirla
              </p>
            </div>

            <div className="h-11 w-11" aria-hidden="true" />
          </header>

          <section className="mt-7 flex flex-1 flex-col">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#111]">
              <img
                src={previewUrl}
                alt="Vista previa de la fotografía"
                className="max-h-[62vh] w-full object-contain"
              />

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-4 py-2 text-xs backdrop-blur-md">
                VibeDump · XV Sandra Alicia
              </div>
            </div>

            {(isUploading || uploadProgress > 0) && (
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Subiendo tu vibe...</span>
                  <span>{uploadProgress}%</span>
                </div>

                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#b995ff] transition-[width] duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadError && (
              <p
                className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-100"
                aria-live="polite"
              >
                {uploadError}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={retakePhoto}
                disabled={isUploading}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4 font-medium transition hover:bg-white/10 disabled:opacity-40"
              >
                Repetir
              </button>

              <button
                type="button"
                onClick={sharePhoto}
                disabled={isUploading}
                className="rounded-2xl bg-[#b995ff] px-4 py-4 font-semibold text-[#160d24] transition hover:bg-[#c7abff] disabled:cursor-wait disabled:opacity-60"
              >
                {isUploading ? "Subiendo..." : "Compartir foto"}
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
            aria-label="Regresar"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-2xl transition hover:bg-white/10"
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
            onClick={chooseFromGallery}
            aria-label="Elegir foto de la galería"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-xl transition hover:bg-white/10"
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

        <section className="mt-6 flex flex-1 flex-col">
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
                <div className="text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-[#b995ff]" />
                  <p className="mt-4 text-sm text-white/50">
                    Preparando la cámara...
                  </p>
                </div>
              </div>
            )}

            {cameraError && !cameraReady && !isStarting && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#120f17] px-8 text-center">
                <div>
                  <p className="text-3xl">📷</p>
                  <h1 className="mt-4 text-xl font-medium">
                    No pudimos abrir la cámara
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    {cameraError}
                  </p>

                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="rounded-2xl bg-[#b995ff] px-4 py-3 font-semibold text-[#160d24]"
                    >
                      Intentar de nuevo
                    </button>

                    <button
                      type="button"
                      onClick={chooseFromGallery}
                      className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3"
                    >
                      Elegir de la galería
                    </button>
                  </div>
                </div>
              </div>
            )}

            {cameraReady && (
              <>
                <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs backdrop-blur-md">
                  LIVE
                </div>

                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs text-white/75 backdrop-blur-md">
                  Sin poses. Solo tu vibe.
                </div>
              </>
            )}
          </div>

          {cameraError && cameraReady && (
            <p
              className="mt-3 text-center text-sm text-[#ffb4b4]"
              aria-live="polite"
            >
              {cameraError}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between px-6">
            <button
              type="button"
              onClick={toggleTorch}
              disabled={!cameraReady || !isTorchSupported}
              aria-label={torchEnabled ? "Apagar flash" : "Encender flash"}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl transition ${
                torchEnabled
                  ? "bg-[#b995ff] text-[#160d24]"
                  : "bg-white/5 text-white"
              } disabled:cursor-not-allowed disabled:opacity-25`}
            >
              ⚡
            </button>

            <button
              type="button"
              onClick={capturePhoto}
              disabled={!cameraReady}
              aria-label="Tomar fotografía"
              className="flex h-24 w-24 items-center justify-center rounded-full border-[7px] border-white/30 bg-transparent transition active:scale-95 disabled:opacity-30"
            >
              <span className="h-16 w-16 rounded-full bg-white" />
            </button>

            <button
              type="button"
              onClick={switchCamera}
              disabled={!cameraReady}
              aria-label="Cambiar entre cámara frontal y trasera"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-2xl transition hover:bg-white/10 disabled:opacity-25"
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
