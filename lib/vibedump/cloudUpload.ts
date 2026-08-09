import {
  signInAnonymously,
  signOut,
  type User,
} from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import type { StoredVibe } from "@/lib/vibedump/localAlbum";

const EVENT_ID = "xv-sandra-alicia-2026";

export type CloudUploadProgress = {
  transferred: number;
  total: number;
  percent: number;
};

async function refreshAnonymousSession(user: User) {
  try {
    // Fuerza renovación real del token después de recuperar internet.
    await user.getIdToken(true);
    return user;
  } catch (error) {
    // Si la sesión anónima quedó dañada durante el corte, creamos una nueva.
    // Solo hacemos este fallback para usuarios anónimos; nunca cerramos
    // automáticamente una cuenta administrativa Email/Password.
    if (!user.isAnonymous) {
      throw error;
    }

    await signOut(auth);
    const credential = await signInAnonymously(auth);
    await credential.user.getIdToken(true);

    return credential.user;
  }
}

export async function ensureFreshFirebaseUser() {
  if (auth.currentUser) {
    return refreshAnonymousSession(auth.currentUser);
  }

  const credential = await signInAnonymously(auth);
  await credential.user.getIdToken(true);

  return credential.user;
}

export async function uploadVibeToCloud(
  vibe: StoredVibe,
  onProgress?: (progress: CloudUploadProgress) => void
) {
  const user = await ensureFreshFirebaseUser();

  const storagePath =
    `vibedump/${EVENT_ID}/${user.uid}/${vibe.id}.jpg`;

  const storageRef = ref(storage, storagePath);

  const task = uploadBytesResumable(storageRef, vibe.blob, {
    contentType: "image/jpeg",
    customMetadata: {
      eventId: EVENT_ID,
      ownerUid: user.uid,
      guestName: vibe.guestName,
      source: vibe.source,
      vibeId: vibe.id,
    },
  });

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const percent =
          snapshot.totalBytes > 0
            ? Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              )
            : 0;

        onProgress?.({
          transferred: snapshot.bytesTransferred,
          total: snapshot.totalBytes,
          percent,
        });
      },
      reject,
      resolve
    );
  });

  await setDoc(doc(db, "vibedumpPhotos", vibe.id), {
    vibeId: vibe.id,
    eventId: EVENT_ID,
    guestName: vibe.guestName,
    ownerUid: user.uid,
    storagePath,
    source: vibe.source,
    status: "pending_review",
    originalSize: vibe.originalSize,
    optimizedSize: vibe.optimizedSize,
    createdAtClient: vibe.createdAt,
    uploadedAt: serverTimestamp(),
    contentType: "image/jpeg",
  });

  return {
    vibeId: vibe.id,
    storagePath,
    ownerUid: user.uid,
  };
}
