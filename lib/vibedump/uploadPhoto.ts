import { signInAnonymously } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";

type UploadVibeDumpPhotoParams = {
  file: Blob;
  guestName: string;
  source: "camera" | "gallery";
  onProgress?: (progress: number) => void;
};

export type UploadedVibeDumpPhoto = {
  documentId: string;
  downloadUrl: string;
  storagePath: string;
};

function createPhotoId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function extensionFromMimeType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadVibeDumpPhoto({
  file,
  guestName,
  source,
  onProgress,
}: UploadVibeDumpPhotoParams): Promise<UploadedVibeDumpPhoto> {
  const cleanGuestName = guestName.trim().replace(/\s+/g, " ");

  if (!cleanGuestName) {
    throw new Error("No encontramos el nombre del invitado.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo seleccionado no es una imagen válida.");
  }

  const maxSize = 15 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error("La imagen supera el límite de 15 MB.");
  }

  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  const user = auth.currentUser;

  if (!user) {
    throw new Error("No fue posible iniciar la sesión temporal.");
  }

  const photoId = createPhotoId();
  const extension = extensionFromMimeType(file.type);
  const storagePath = `vibedump/2026/${user.uid}/${photoId}.${extension}`;
  const photoRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(photoRef, file, {
    contentType: file.type || "image/jpeg",
    customMetadata: {
      guestName: cleanGuestName,
      event: "xv-sandra-alicia-2026",
      source,
    },
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          snapshot.totalBytes > 0
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0;

        onProgress?.(progress);
      },
      reject,
      resolve
    );
  });

  const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

  const document = await addDoc(collection(db, "vibedumpPhotos"), {
    photoId,
    guestName: cleanGuestName,
    ownerUid: user.uid,
    storagePath,
    downloadUrl,
    source,
    status: "pending",
    eventId: "xv-sandra-alicia-2026",
    createdAt: serverTimestamp(),
    uploadedAtClient: new Date().toISOString(),
    contentType: file.type || "image/jpeg",
    sizeBytes: file.size,
  });

  return {
    documentId: document.id,
    downloadUrl,
    storagePath,
  };
}
