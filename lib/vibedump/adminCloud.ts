import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getBytes,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";

const EVENT_ID = "xv-sandra-alicia-2026";

export type AdminVibe = {
  id: string;
  vibeId: string;
  guestName: string;
  ownerUid: string;
  storagePath: string;
  source: "camera" | "gallery";
  status: "pending_review" | "approved" | "hidden";
  originalSize: number;
  optimizedSize: number;
  createdAtClient: string;
  uploadedAt?: Date | null;
  downloadUrl?: string;
};

function publicStoragePath(vibeId: string) {
  return `vibedump-public/${EVENT_ID}/${vibeId}.jpg`;
}

async function safeDeleteStorage(path: string) {
  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("storage/object-not-found")) throw error;
  }
}

async function unpublishVibe(vibeId: string) {
  await safeDeleteStorage(publicStoragePath(vibeId));
  try {
    await deleteDoc(doc(db, "vibedumpWall", vibeId));
  } catch {}
}

async function publishVibe(vibe: AdminVibe) {
  if (!vibe.storagePath) throw new Error("Esta fotografía no tiene una ruta válida en Storage.");

  const original = await getBytes(ref(storage, vibe.storagePath), 8 * 1024 * 1024);
  const destinationPath = publicStoragePath(vibe.vibeId);

  await uploadBytes(ref(storage, destinationPath), new Uint8Array(original), {
    contentType: "image/jpeg",
    customMetadata: {
      eventId: EVENT_ID,
      vibeId: vibe.vibeId,
      guestName: vibe.guestName,
      source: vibe.source,
    },
  });

  await setDoc(doc(db, "vibedumpWall", vibe.vibeId), {
    vibeId: vibe.vibeId,
    eventId: EVENT_ID,
    guestName: vibe.guestName,
    source: vibe.source,
    publicStoragePath: destinationPath,
    createdAtClient: vibe.createdAtClient,
    approvedAt: serverTimestamp(),
  });
}

export async function getAdminVibes(): Promise<AdminVibe[]> {
  const snapshot = await getDocs(query(collection(db, "vibedumpPhotos"), orderBy("uploadedAt", "desc")));

  return Promise.all(
    snapshot.docs.map(async (item) => {
      const data = item.data();
      const vibe: AdminVibe = {
        id: item.id,
        vibeId: data.vibeId ?? item.id,
        guestName: data.guestName ?? "Invitado",
        ownerUid: data.ownerUid ?? "",
        storagePath: data.storagePath ?? "",
        source: data.source === "gallery" ? "gallery" : "camera",
        status: data.status === "approved" || data.status === "hidden" ? data.status : "pending_review",
        originalSize: Number(data.originalSize ?? 0),
        optimizedSize: Number(data.optimizedSize ?? 0),
        createdAtClient: data.createdAtClient ?? "",
        uploadedAt: data.uploadedAt?.toDate?.() ?? null,
      };

      if (vibe.storagePath) {
        try {
          vibe.downloadUrl = await getDownloadURL(ref(storage, vibe.storagePath));
        } catch {
          vibe.downloadUrl = undefined;
        }
      }
      return vibe;
    })
  );
}

export async function updateAdminVibeStatus(
  vibeOrId: AdminVibe | string,
  status: "pending_review" | "approved" | "hidden"
) {
  if (typeof vibeOrId === "string") {
    await updateDoc(doc(db, "vibedumpPhotos", vibeOrId), { status });
    return;
  }

  const vibe = vibeOrId;

  if (status === "approved") {
    await publishVibe(vibe);
  } else {
    await unpublishVibe(vibe.vibeId);
  }

  await updateDoc(doc(db, "vibedumpPhotos", vibe.id), { status });
}

export async function deleteAdminVibe(vibe: AdminVibe) {
  await unpublishVibe(vibe.vibeId);
  if (vibe.storagePath) await safeDeleteStorage(vibe.storagePath);
  await deleteDoc(doc(db, "vibedumpPhotos", vibe.id));
}
