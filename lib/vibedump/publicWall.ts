import { collection, onSnapshot, orderBy, query, type Unsubscribe } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export type WallVibe = {
  id: string;
  vibeId: string;
  guestName: string;
  source: "camera" | "gallery";
  publicStoragePath: string;
  createdAtClient: string;
  approvedAt?: Date | null;
  downloadUrl?: string;
};

export function subscribeToVibeWall(
  onChange: (vibes: WallVibe[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const wallQuery = query(collection(db, "vibedumpWall"), orderBy("approvedAt", "desc"));

  return onSnapshot(
    wallQuery,
    async (snapshot) => {
      const vibes = await Promise.all(
        snapshot.docs.map(async (item) => {
          const data = item.data();
          const vibe: WallVibe = {
            id: item.id,
            vibeId: data.vibeId ?? item.id,
            guestName: data.guestName ?? "Invitado",
            source: data.source === "gallery" ? "gallery" : "camera",
            publicStoragePath: data.publicStoragePath ?? "",
            createdAtClient: data.createdAtClient ?? "",
            approvedAt: data.approvedAt?.toDate?.() ?? null,
          };

          if (vibe.publicStoragePath) {
            try {
              vibe.downloadUrl = await getDownloadURL(ref(storage, vibe.publicStoragePath));
            } catch {
              vibe.downloadUrl = undefined;
            }
          }

          return vibe;
        })
      );

      onChange(vibes.filter((vibe) => vibe.downloadUrl));
    },
    (error) => onError?.(error)
  );
}
