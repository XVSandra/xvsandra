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

export type SingleSyncResult = {
  enabled: boolean;
  online: boolean;
  sent: boolean;
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

async function sendOne(
  vibe: StoredVibe,
  onEvent?: (event: SyncEvent) => void
): Promise<boolean> {
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

    onEvent?.({
      vibeId: vibe.id,
      status: "sent",
      progress: 100,
    });

    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error de envío";

    await updateStoredVibe(vibe.id, {
      syncStatus: "error",
      retryCount: (vibe.retryCount ?? 0) + 1,
      lastError: message,
    });

    onEvent?.({
      vibeId: vibe.id,
      status: "error",
      error: message,
    });

    return false;
  }
}

/**
 * Intenta enviar inmediatamente UNA vibe recién creada.
 * Si no hay internet o Cloud está apagado, la foto permanece local
 * y AutoSync podrá reintentarlo después.
 */
export async function syncVibeById(
  vibeId: string,
  onEvent?: (event: SyncEvent) => void
): Promise<SingleSyncResult> {
  if (!isCloudEnabled()) {
    return {
      enabled: false,
      online: typeof navigator === "undefined" ? true : navigator.onLine,
      sent: false,
    };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      enabled: true,
      online: false,
      sent: false,
    };
  }

  const vibes = await getStoredVibes();
  const vibe = vibes.find((item) => item.id === vibeId);

  if (!vibe) {
    return {
      enabled: true,
      online: true,
      sent: false,
      error: "No se encontró la fotografía local.",
    };
  }

  if (vibe.syncStatus === "sent") {
    return {
      enabled: true,
      online: true,
      sent: true,
    };
  }

  const sent = await sendOne(vibe, onEvent);

  return {
    enabled: true,
    online: true,
    sent,
    error: sent ? undefined : "No se pudo enviar en este momento.",
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

  const candidates = vibes.filter(
    (vibe) =>
      vibe.syncStatus === "pending" ||
      vibe.syncStatus === "error" ||
      vibe.syncStatus === "uploading"
  );

  let sent = 0;
  let failed = 0;

  for (const vibe of candidates) {
    const ok = await sendOne(vibe, onEvent);

    if (ok) {
      sent += 1;
    } else {
      failed += 1;
    }
  }

  return {
    enabled: true,
    attempted: candidates.length,
    sent,
    failed,
  };
}
