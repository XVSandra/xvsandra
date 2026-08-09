import {
  getStoredVibes,
  updateStoredVibe,
  type StoredVibe,
} from "@/lib/vibedump/localAlbum";
import { uploadVibeToCloud } from "@/lib/vibedump/cloudUpload";

export type SyncSummary = {
  total: number;
  pending: number;
  uploading: number;
  sent: number;
  error: number;
};

export type SyncEvent = {
  vibeId: string;
  status: StoredVibe["syncStatus"];
  progress?: number;
  error?: string;
};

export function isCloudEnabled() {
  return process.env.NEXT_PUBLIC_VIBEDUMP_CLOUD_ENABLED === "true";
}

export async function getSyncSummary(): Promise<SyncSummary> {
  const vibes = await getStoredVibes();

  return {
    total: vibes.length,
    pending: vibes.filter((vibe) => vibe.syncStatus === "pending").length,
    uploading: vibes.filter((vibe) => vibe.syncStatus === "uploading").length,
    sent: vibes.filter((vibe) => vibe.syncStatus === "sent").length,
    error: vibes.filter((vibe) => vibe.syncStatus === "error").length,
  };
}

export async function syncPendingVibes(
  onEvent?: (event: SyncEvent) => void
) {
  if (!isCloudEnabled()) {
    return {
      enabled: false,
      attempted: 0,
      sent: 0,
      failed: 0,
    };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      enabled: true,
      attempted: 0,
      sent: 0,
      failed: 0,
    };
  }

  const vibes = await getStoredVibes();

  // If the browser closed while a previous upload was marked "uploading",
  // treat it as pending and retry safely. Uploading the same object path
  // overwrites that object rather than creating a duplicate.
  const candidates = vibes.filter(
    (vibe) =>
      vibe.syncStatus === "pending" ||
      vibe.syncStatus === "error" ||
      vibe.syncStatus === "uploading"
  );

  let sent = 0;
  let failed = 0;

  for (const vibe of candidates) {
    await updateStoredVibe(vibe.id, {
      syncStatus: "uploading",
      lastError: undefined,
    });

    onEvent?.({
      vibeId: vibe.id,
      status: "uploading",
      progress: 0,
    });

    try {
      await uploadVibeToCloud(vibe, (progress) => {
        onEvent?.({
          vibeId: vibe.id,
          status: "uploading",
          progress: progress.percent,
        });
      });

      await updateStoredVibe(vibe.id, {
        syncStatus: "sent",
        lastError: undefined,
      });

      sent += 1;

      onEvent?.({
        vibeId: vibe.id,
        status: "sent",
        progress: 100,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error de sincronización";

      await updateStoredVibe(vibe.id, {
        syncStatus: "error",
        retryCount: (vibe.retryCount ?? 0) + 1,
        lastError: message,
      });

      failed += 1;

      onEvent?.({
        vibeId: vibe.id,
        status: "error",
        error: message,
      });
    }
  }

  return {
    enabled: true,
    attempted: candidates.length,
    sent,
    failed,
  };
}
