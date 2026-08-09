"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  deleteAdminVibe,
  getAdminVibes,
  updateAdminVibeStatus,
  type AdminVibe,
} from "@/lib/vibedump/adminCloud";
import { downloadVibesAsZip } from "@/lib/vibedump/adminZip";

type Filter = "all" | "pending_review" | "approved" | "hidden";

function formatBytes(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  return `${(kb / 1024).toFixed(2)} MB`;
}

function formatDate(vibe: AdminVibe) {
  const value =
    vibe.uploadedAt ??
    (vibe.createdAtClient ? new Date(vibe.createdAtClient) : null);

  if (!value || Number.isNaN(value.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function statusLabel(status: AdminVibe["status"]) {
  if (status === "approved") return "Aprobada";
  if (status === "hidden") return "Oculta";
  return "Por revisar";
}

export default function VibeDumpAdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [vibes, setVibes] = useState<AdminVibe[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [zipProgress, setZipProgress] = useState("");
  const [sortNewest, setSortNewest] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  const loadVibes = async () => {
    setLoading(true);
    setLoadError("");

    try {
      setVibes(await getAdminVibes());
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar el álbum central."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !user.isAnonymous) {
      loadVibes();
    } else {
      setVibes([]);
      setSelected(new Set());
    }
  }, [user]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setLoginError("");
    setLoggingIn(true);

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      if (credential.user.isAnonymous) {
        throw new Error("La cuenta administrativa no puede ser anónima.");
      }
    } catch (error) {
      const raw =
        error instanceof Error ? error.message : "No fue posible iniciar sesión.";

      if (raw.includes("auth/invalid-credential")) {
        setLoginError("Correo o contraseña incorrectos.");
      } else if (raw.includes("auth/operation-not-allowed")) {
        setLoginError(
          "Debes habilitar Email/Password en Firebase Authentication."
        );
      } else {
        setLoginError(raw);
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const visibleVibes = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = vibes.filter((vibe) => {
      const matchesFilter = filter === "all" || vibe.status === filter;
      const matchesSearch =
        !term ||
        vibe.guestName.toLowerCase().includes(term) ||
        vibe.vibeId.toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      const aTime = a.uploadedAt?.getTime() ?? new Date(a.createdAtClient || 0).getTime();
      const bTime = b.uploadedAt?.getTime() ?? new Date(b.createdAtClient || 0).getTime();
      return sortNewest ? bTime - aTime : aTime - bTime;
    });
  }, [vibes, filter, search, sortNewest]);

  const counts = useMemo(
    () => ({
      all: vibes.length,
      pending: vibes.filter(
        (vibe) => vibe.status === "pending_review"
      ).length,
      approved: vibes.filter(
        (vibe) => vibe.status === "approved"
      ).length,
      hidden: vibes.filter(
        (vibe) => vibe.status === "hidden"
      ).length,
      guests: new Set(vibes.map((vibe) => vibe.guestName.trim().toLowerCase())).size,
      totalBytes: vibes.reduce((sum, vibe) => sum + (vibe.optimizedSize || 0), 0),
    }),
    [vibes]
  );

  const selectedVibes = useMemo(
    () => vibes.filter((vibe) => selected.has(vibe.id)),
    [vibes, selected]
  );

  const visibleIds = visibleVibes.map((vibe) => vibe.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const bulkStatus = async (status: "approved" | "hidden") => {
    if (!selectedVibes.length || bulkBusy) return;
    setBulkBusy(true);
    try {
      for (const vibe of selectedVibes) {
        await updateAdminVibeStatus(vibe, status);
      }
      setVibes((current) => current.map((vibe) =>
        selected.has(vibe.id) ? { ...vibe, status } : vibe
      ));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "No fue posible completar la acción masiva.");
    } finally {
      setBulkBusy(false);
    }
  };

  const downloadSelected = async () => {
    if (!selectedVibes.length || bulkBusy) return;
    setBulkBusy(true);
    setZipProgress("Preparando ZIP...");
    try {
      const total = await downloadVibesAsZip(selectedVibes, (done, count) => {
        setZipProgress(`Descargando ${done} de ${count}...`);
      });
      setZipProgress(`ZIP listo con ${total} fotos ✓`);
      window.setTimeout(() => setZipProgress(""), 3500);
    } catch (error) {
      setZipProgress("");
      window.alert(error instanceof Error ? error.message : "No fue posible crear el ZIP.");
    } finally {
      setBulkBusy(false);
    }
  };

  const changeStatus = async (
    vibe: AdminVibe,
    status: AdminVibe["status"]
  ) => {
    try {
      await updateAdminVibeStatus(vibe, status);

      setVibes((current) =>
        current.map((item) =>
          item.id === vibe.id ? { ...item, status } : item
        )
      );
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "No fue posible actualizar la fotografía."
      );
    }
  };

  const remove = async (vibe: AdminVibe) => {
    const confirmed = window.confirm(
      `¿Eliminar definitivamente esta foto de ${vibe.guestName}?`
    );

    if (!confirmed) return;

    try {
      await deleteAdminVibe(vibe);
      setVibes((current) =>
        current.filter((item) => item.id !== vibe.id)
      );
      setSelected((current) => {
        const next = new Set(current);
        next.delete(vibe.id);
        return next;
      });
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "No fue posible eliminar la fotografía."
      );
    }
  };

  const download = (vibe: AdminVibe) => {
    if (!vibe.downloadUrl) return;

    const link = document.createElement("a");
    link.href = vibe.downloadUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = `vibedump-${vibe.guestName}-${vibe.vibeId}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09070d] text-white">
        <p className="text-sm text-white/50">
          Verificando acceso...
        </p>
      </main>
    );
  }

  if (!user || user.isAnonymous) {
    return (
      <main className="min-h-screen bg-[#09070d] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
          <p className="text-center text-xs font-medium uppercase tracking-[0.3em] text-[#d6c4ff]">
            Administración
          </p>

          <h1 className="mt-4 text-center text-4xl font-semibold">
            Vibe<span className="text-[#b995ff]">Dump</span>
          </h1>

          <p className="mt-3 text-center text-sm text-white/45">
            XV Sandra Alicia · Álbum central privado
          </p>

          <form
            onSubmit={login}
            className="mt-9 rounded-[2rem] border border-white/10 bg-white/5 p-6"
          >
            <label
              htmlFor="admin-email"
              className="text-sm font-medium text-white/75"
            >
              Correo
            </label>

            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3.5 outline-none focus:border-[#b995ff]"
              required
            />

            <label
              htmlFor="admin-password"
              className="mt-5 block text-sm font-medium text-white/75"
            >
              Contraseña
            </label>

            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3.5 outline-none focus:border-[#b995ff]"
              required
            />

            {loginError && (
              <p className="mt-4 text-sm text-[#ffb4b4]">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="mt-6 w-full rounded-2xl bg-[#b995ff] px-5 py-4 font-semibold text-[#160d24] disabled:opacity-50"
            >
              {loggingIn ? "Entrando..." : "Entrar al álbum"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09070d] text-white">
      <div className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-12 pt-6 md:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#d6c4ff]">
              XV Sandra Alicia
            </p>
            <h1 className="mt-1 text-3xl font-semibold">
              VibeDump Admin
            </h1>
            <p className="mt-1 text-sm text-white/40">
              {user.email}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadVibes}
              disabled={loading}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm disabled:opacity-40"
            >
              {loading ? "Actualizando..." : "Actualizar"}
            </button>

            <button
              type="button"
              onClick={() => signOut(auth)}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm"
            >
              Salir
            </button>
          </div>
        </header>

        <section className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-white/35">
              Total
            </p>
            <p className="mt-2 text-3xl font-semibold">{counts.all}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-white/35">
              Por revisar
            </p>
            <p className="mt-2 text-3xl font-semibold">{counts.pending}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-white/35">
              Aprobadas
            </p>
            <p className="mt-2 text-3xl font-semibold">{counts.approved}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-white/35">Ocultas</p>
            <p className="mt-2 text-3xl font-semibold">{counts.hidden}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-white/35">Invitados</p>
            <p className="mt-2 text-3xl font-semibold">{counts.guests}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-white/35">Almacenado</p>
            <p className="mt-2 text-2xl font-semibold">{formatBytes(counts.totalBytes)}</p>
          </div>
        </section>

        <section className="mt-5 flex flex-col gap-3 lg:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar invitado..."
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-[#b995ff]"
          />

          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as Filter)
            }
            className="rounded-2xl border border-white/10 bg-[#15111d] px-4 py-3 outline-none"
          >
            <option value="all">Todas</option>
            <option value="pending_review">Por revisar</option>
            <option value="approved">Aprobadas</option>
            <option value="hidden">Ocultas</option>
          </select>

          <button
            type="button"
            onClick={() => setSortNewest((current) => !current)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
          >
            {sortNewest ? "Más nuevas primero" : "Más antiguas primero"}
          </button>
        </section>

        <section className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
          <button type="button" onClick={toggleAllVisible} className="rounded-xl border border-white/10 px-3 py-2 text-sm">
            {allVisibleSelected ? "Quitar selección visible" : `Seleccionar visibles (${visibleVibes.length})`}
          </button>
          {selected.size > 0 && (<>
            <span className="px-2 text-sm text-[#d6c4ff]">{selected.size} seleccionadas</span>
            <button type="button" onClick={downloadSelected} disabled={bulkBusy} className="rounded-xl bg-[#b995ff] px-3 py-2 text-sm font-semibold text-[#160d24] disabled:opacity-50">Descargar ZIP</button>
            <button type="button" onClick={() => bulkStatus("approved")} disabled={bulkBusy} className="rounded-xl border border-white/10 px-3 py-2 text-sm disabled:opacity-50">Aprobar selección</button>
            <button type="button" onClick={() => bulkStatus("hidden")} disabled={bulkBusy} className="rounded-xl border border-white/10 px-3 py-2 text-sm disabled:opacity-50">Ocultar selección</button>
            <button type="button" onClick={() => setSelected(new Set())} disabled={bulkBusy} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/55 disabled:opacity-50">Limpiar</button>
          </>)}
          {zipProgress && <span className="ml-auto text-xs text-white/55">{zipProgress}</span>}
        </section>

        {loadError && (
          <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">
            <p className="font-medium">
              No pudimos abrir el álbum central.
            </p>
            <p className="mt-2 break-words opacity-80">
              {loadError}
            </p>
            <p className="mt-2 text-xs opacity-60">
              Si el mensaje dice “Missing or insufficient permissions”, revisa
              que el UID de esta cuenta esté agregado a las reglas de Firestore
              y Storage.
            </p>
          </div>
        )}

        {!loading && !loadError && visibleVibes.length === 0 && (
          <div className="mt-16 text-center text-white/45">
            No hay fotografías que coincidan con este filtro.
          </div>
        )}

        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleVibes.map((vibe) => (
            <article
              key={vibe.id}
              className={`overflow-hidden rounded-[1.75rem] border bg-white/5 ${selected.has(vibe.id) ? "border-[#b995ff]" : "border-white/10"}`}
            >
              <div className="relative aspect-[3/4] bg-black/30">
                <button
                  type="button"
                  onClick={() => toggleSelected(vibe.id)}
                  className={`absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md ${selected.has(vibe.id) ? "border-[#b995ff] bg-[#b995ff] text-[#160d24]" : "border-white/20 bg-black/40 text-white"}`}
                  aria-label={selected.has(vibe.id) ? "Quitar selección" : "Seleccionar fotografía"}
                >
                  {selected.has(vibe.id) ? "✓" : ""}
                </button>
                {vibe.downloadUrl ? (
                  <img
                    src={vibe.downloadUrl}
                    alt={`Foto subida por ${vibe.guestName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/35">
                    No fue posible obtener la imagen.
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{vibe.guestName}</p>
                    <p className="mt-1 text-xs text-white/40">
                      {formatDate(vibe)}
                    </p>
                  </div>

                  <span className="rounded-full border border-[#b995ff]/20 bg-[#b995ff]/10 px-3 py-1 text-xs text-[#dfd1ff]">
                    {statusLabel(vibe.status)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-white/35">
                  <span>
                    {vibe.source === "camera" ? "Cámara" : "Galería"}
                  </span>
                  <span>{formatBytes(vibe.optimizedSize)}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => changeStatus(vibe, "approved")}
                    className="rounded-xl bg-[#b995ff] px-3 py-2.5 text-sm font-semibold text-[#160d24]"
                  >
                    Aprobar
                  </button>

                  <button
                    type="button"
                    onClick={() => changeStatus(vibe, "hidden")}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm"
                  >
                    Ocultar
                  </button>

                  <button
                    type="button"
                    onClick={() => download(vibe)}
                    disabled={!vibe.downloadUrl}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm disabled:opacity-30"
                  >
                    Descargar
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(vibe)}
                    className="rounded-xl border border-red-300/15 bg-red-300/5 px-3 py-2.5 text-sm text-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
