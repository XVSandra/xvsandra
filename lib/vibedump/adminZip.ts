import { getBytes, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";
import type { AdminVibe } from "@/lib/vibedump/adminCloud";

const enc = new TextEncoder();

function clean(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "invitado"
  );
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n += 1) {
    let c = n;

    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }

    table[n] = c >>> 0;
  }

  return table;
})();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 255] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function u16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function u32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true);
}

function dos(date: Date) {
  const year = Math.max(1980, date.getFullYear());

  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date:
      ((year - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
  };
}

function stamp(date: Date) {
  const p = (n: number) => String(n).padStart(2, "0");

  return (
    `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-` +
    `${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
  );
}

function vibeDate(vibe: AdminVibe) {
  if (vibe.uploadedAt instanceof Date) {
    return vibe.uploadedAt;
  }

  const parsed = new Date(vibe.createdAtClient || Date.now());

  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

type Entry = {
  name: string;
  data: Uint8Array;
  crc: number;
  date: Date;
};

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function makeZip(entries: Entry[]) {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = enc.encode(entry.name);
    const dt = dos(entry.date);

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);

    u32(lv, 0, 0x04034b50);
    u16(lv, 4, 20);
    u16(lv, 6, 0);
    u16(lv, 8, 0);
    u16(lv, 10, dt.time);
    u16(lv, 12, dt.date);
    u32(lv, 14, entry.crc);
    u32(lv, 18, entry.data.length);
    u32(lv, 22, entry.data.length);
    u16(lv, 26, name.length);
    u16(lv, 28, 0);
    local.set(name, 30);

    locals.push(local, entry.data);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);

    u32(cv, 0, 0x02014b50);
    u16(cv, 4, 20);
    u16(cv, 6, 20);
    u16(cv, 8, 0);
    u16(cv, 10, 0);
    u16(cv, 12, dt.time);
    u16(cv, 14, dt.date);
    u32(cv, 16, entry.crc);
    u32(cv, 20, entry.data.length);
    u32(cv, 24, entry.data.length);
    u16(cv, 28, name.length);
    u16(cv, 30, 0);
    u16(cv, 32, 0);
    u16(cv, 34, 0);
    u16(cv, 36, 0);
    u32(cv, 38, 0);
    u32(cv, 42, offset);
    central.set(name, 46);

    centrals.push(central);
    offset += local.length + entry.data.length;
  }

  const centralSize = centrals.reduce(
    (sum, part) => sum + part.length,
    0
  );

  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);

  u32(ev, 0, 0x06054b50);
  u16(ev, 4, 0);
  u16(ev, 6, 0);
  u16(ev, 8, entries.length);
  u16(ev, 10, entries.length);
  u32(ev, 12, centralSize);
  u32(ev, 16, offset);
  u16(ev, 20, 0);

  const blobParts: BlobPart[] = [
    ...locals.map(toArrayBuffer),
    ...centrals.map(toArrayBuffer),
    toArrayBuffer(end),
  ];

  return new Blob(blobParts, {
    type: "application/zip",
  });
}

export async function downloadVibesAsZip(
  vibes: AdminVibe[],
  onProgress?: (done: number, total: number) => void
) {
  const usable = vibes.filter((vibe) => vibe.storagePath);

  if (!usable.length) {
    throw new Error(
      "Las fotos seleccionadas no tienen una ruta válida en Firebase Storage."
    );
  }

  const entries: Entry[] = [];

  for (let i = 0; i < usable.length; i += 1) {
    const vibe = usable[i];

    try {
      const buffer = await getBytes(
        ref(storage, vibe.storagePath),
        8 * 1024 * 1024
      );

      const data = new Uint8Array(buffer);
      const date = vibeDate(vibe);

      entries.push({
        name:
          `${String(i + 1).padStart(3, "0")}_` +
          `${clean(vibe.guestName)}_` +
          `${stamp(date)}_` +
          `${vibe.vibeId.slice(0, 8)}.jpg`,
        data,
        crc: crc32(data),
        date,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error desconocido de Firebase Storage";

      throw new Error(
        `No se pudo descargar una foto de ${vibe.guestName}: ${message}`
      );
    }

    onProgress?.(i + 1, usable.length);
  }

  const blob = makeZip(entries);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    `VibeDump-XV-Sandra-Alicia-${stamp(new Date())}.zip`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 2000);

  return entries.length;
}
