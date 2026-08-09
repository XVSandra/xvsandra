import { getStoredVibes } from "@/lib/vibedump/localAlbum";

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "invitado";
}

function formatDateForFile(date: string) {
  const value = new Date(date);

  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  const dd = String(value.getDate()).padStart(2, "0");
  const hh = String(value.getHours()).padStart(2, "0");
  const min = String(value.getMinutes()).padStart(2, "0");
  const ss = String(value.getSeconds()).padStart(2, "0");

  return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function downloadAllVibesIndividually() {
  const vibes = await getStoredVibes();

  if (vibes.length === 0) {
    throw new Error("No hay fotografías para descargar.");
  }

  for (let index = 0; index < vibes.length; index += 1) {
    const vibe = vibes[index];
    const guest = sanitizeFileName(vibe.guestName);
    const date = formatDateForFile(vibe.createdAt);

    downloadBlob(
      vibe.blob,
      `vibedump-${guest}-${date}-${String(index + 1).padStart(2, "0")}.jpg`
    );

    await new Promise((resolve) => window.setTimeout(resolve, 180));
  }

  return vibes.length;
}

export async function createMetadataBackup() {
  const vibes = await getStoredVibes();

  const metadata = vibes.map((vibe) => ({
    id: vibe.id,
    guestName: vibe.guestName,
    source: vibe.source,
    originalSize: vibe.originalSize,
    optimizedSize: vibe.optimizedSize,
    createdAt: vibe.createdAt,
    syncStatus: vibe.syncStatus,
    retryCount: vibe.retryCount,
    lastError: vibe.lastError ?? null,
  }));

  const blob = new Blob(
    [
      JSON.stringify(
        {
          app: "VibeDump",
          event: "XV Sandra Alicia",
          exportedAt: new Date().toISOString(),
          totalPhotos: vibes.length,
          photos: metadata,
        },
        null,
        2
      ),
    ],
    { type: "application/json" }
  );

  downloadBlob(
    blob,
    `vibedump-respaldo-${formatDateForFile(new Date().toISOString())}.json`
  );

  return vibes.length;
}
