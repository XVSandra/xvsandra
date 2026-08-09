export type SyncStatus = "pending" | "uploading" | "sent" | "error";

export type StoredVibe = {
  id: string;
  guestName: string;
  blob: Blob;
  source: "camera" | "gallery";
  originalSize: number;
  optimizedSize: number;
  createdAt: string;
  syncStatus: SyncStatus;
  retryCount: number;
  lastError?: string;
};

const DB_NAME = "vibedump-local";
const DB_VERSION = 3;
const STORE_NAME = "photos";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      let store: IDBObjectStore;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
      } else {
        store = request.transaction!.objectStore(STORE_NAME);
      }

      if (!store.indexNames.contains("createdAt")) {
        store.createIndex("createdAt", "createdAt");
      }

      if (!store.indexNames.contains("guestName")) {
        store.createIndex("guestName", "guestName");
      }

      if (!store.indexNames.contains("syncStatus")) {
        store.createIndex("syncStatus", "syncStatus");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("No fue posible abrir IndexedDB."));
  });
}

function normalizeVibe(vibe: StoredVibe): StoredVibe {
  return {
    ...vibe,
    syncStatus: vibe.syncStatus ?? "pending",
    retryCount: vibe.retryCount ?? 0,
  };
}

export async function saveStoredVibe(vibe: StoredVibe) {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(vibe);

    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("No fue posible guardar la foto."));
  });

  db.close();
}

export async function getStoredVibes(): Promise<StoredVibe[]> {
  const db = await openDatabase();

  const result = await new Promise<StoredVibe[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();

    request.onsuccess = () =>
      resolve((request.result as StoredVibe[]).map(normalizeVibe));

    request.onerror = () =>
      reject(request.error ?? new Error("No fue posible leer las fotos."));
  });

  db.close();

  return result.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getStoredVibeCount() {
  const db = await openDatabase();

  const count = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("No fue posible contar las fotos."));
  });

  db.close();
  return count;
}

export async function updateStoredVibe(
  id: string,
  changes: Partial<Omit<StoredVibe, "id" | "blob">>
) {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const current = request.result as StoredVibe | undefined;
      if (!current) return;

      store.put({
        ...normalizeVibe(current),
        ...changes,
        id: current.id,
        blob: current.blob,
      });
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("No fue posible actualizar la foto."));
  });

  db.close();
}

export async function deleteStoredVibe(id: string) {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("No fue posible eliminar la foto."));
  });

  db.close();
}

export async function clearStoredVibes() {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("No fue posible limpiar el álbum."));
  });

  db.close();
}
