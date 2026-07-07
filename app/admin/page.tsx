
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminPasswordGate from "@/components/admin/AdminPasswordGate";

type Invitado = {
  id: string;
  nombre?: string;
  pases?: number;
  telefono?: string;
  grupo?: string;
  notas?: string;
  confirmado?: boolean;
};

type Confirmacion = {
  id: string;
  codigo?: string;
  nombre?: string;
  asistencia?: string;
  pasesAsignados?: number;
  cantidadConfirmada?: number;
  fechaConfirmacion?: Timestamp;
};

type RegistroAdmin = {
  codigo: string;
  nombre: string;
  pases: number;
  telefono: string;
  grupo: string;
  asistencia: string;
  cantidadConfirmada: number;
  fechaConfirmacion?: Timestamp;
  estado: "Confirmado" | "No asistirá" | "Pendiente";
};

export default function AdminPage() {
const urlBaseInvitacion =
  process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [confirmaciones, setConfirmaciones] = useState<Confirmacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
const [filtroEstado, setFiltroEstado] = useState<
  "Todos" | "Confirmado" | "Pendiente" | "No asistirá"
>("Todos");

const [busqueda, setBusqueda] = useState("");

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const invitadosSnapshot = await getDocs(collection(db, "invitados"));

      const invitadosData = invitadosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Invitado[];

      const confirmacionesQuery = query(
        collection(db, "confirmaciones"),
        orderBy("fechaConfirmacion", "desc")
      );

      const confirmacionesSnapshot = await getDocs(confirmacionesQuery);

      const confirmacionesData = confirmacionesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Confirmacion[];

      setInvitados(invitadosData);
      setConfirmaciones(confirmacionesData);
    } catch (err) {
      console.error("Error cargando panel:", err);
      setError("No se pudo cargar la información del panel.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const registros = useMemo<RegistroAdmin[]>(() => {
    return invitados
      .map((invitado) => {
        const confirmacion = confirmaciones.find(
          (c) => c.codigo === invitado.id
        );

        let estado: RegistroAdmin["estado"] = "Pendiente";

        if (confirmacion?.asistencia === "Sí asistiré") {
          estado = "Confirmado";
        }

        if (confirmacion?.asistencia === "No asistiré") {
          estado = "No asistirá";
        }

        return {
          codigo: invitado.id,
          nombre: invitado.nombre || "",
          pases: Number(invitado.pases || 0),
          telefono: invitado.telefono || "",
          grupo: invitado.grupo || "",
          asistencia: confirmacion?.asistencia || "Pendiente",
          cantidadConfirmada: Number(confirmacion?.cantidadConfirmada || 0),
          fechaConfirmacion: confirmacion?.fechaConfirmacion,
          estado,
        };
      })
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [invitados, confirmaciones]);

const registrosFiltrados = registros.filter((item) => {
  const coincideEstado =
    filtroEstado === "Todos" || item.estado === filtroEstado;

  const textoBusqueda = busqueda.toLowerCase().trim();

  const coincideBusqueda =
    !textoBusqueda ||
    item.codigo.toLowerCase().includes(textoBusqueda) ||
    item.nombre.toLowerCase().includes(textoBusqueda) ||
    item.telefono.toLowerCase().includes(textoBusqueda) ||
    item.grupo.toLowerCase().includes(textoBusqueda);

  return coincideEstado && coincideBusqueda;
});
 const totalInvitados = registros.length;

  const totalPasesAsignados = registros.reduce(
    (total, item) => total + Number(item.pases || 0),
    0
  );

  const totalConfirmados = registros.reduce(
    (total, item) => total + Number(item.cantidadConfirmada || 0),
    0
  );

  const totalSiAsisten = registros.filter(
    (item) => item.estado === "Confirmado"
  ).length;

  const totalNoAsisten = registros.filter(
    (item) => item.estado === "No asistirá"
  ).length;

  const totalPendientes = registros.filter(
    (item) => item.estado === "Pendiente"
  ).length;

  const porcentajeConfirmacion =
    totalInvitados > 0
      ? Math.round(((totalSiAsisten + totalNoAsisten) / totalInvitados) * 100)
      : 0;


const copiarLink = async (codigo: string) => {
  const link = `${urlBaseInvitacion}/?codigo=${codigo}`;

  try {
    await navigator.clipboard.writeText(link);
    alert(`Link copiado: ${link}`);
  } catch (error) {
    console.error("Error copiando link:", error);
    alert("No se pudo copiar el link.");
  }
};


const enviarWhatsApp = (telefono: string, codigo: string, nombre: string) => {
  const telefonoLimpio = telefono.replace(/\D/g, "");

  if (!telefonoLimpio) {
    alert("Este invitado no tiene teléfono registrado.");
    return;
  }

  const linkInvitacion = `${urlBaseInvitacion}/?codigo=${codigo}`;

  const mensaje = `Hola ${nombre}, te compartimos tu invitación para los XV años de Sandra Alicia 💖

Confirma tu asistencia en este link:
${linkInvitacion}

Código de invitación: ${codigo}`;

  const urlWhatsApp = `https://wa.me/52${telefonoLimpio}?text=${encodeURIComponent(
    mensaje
  )}`;

  window.open(urlWhatsApp, "_blank");
};




  const descargarCSV = () => {
const encabezados = [
  "Codigo",
  "Nombre",
  "Pases asignados",
  "Telefono",
  "Grupo",
  "Estado",
  "Asistencia",
  "Cantidad confirmada",
  "Fecha confirmacion",
  "Link personalizado",
  "Link WhatsApp",
];

 const filas = registros.map((item) => {
  const telefonoLimpio = item.telefono.replace(/\D/g, "");
  const linkInvitacion = `${urlBaseInvitacion}/?codigo=${item.codigo}`;
  const mensaje = `Hola ${item.nombre}, te compartimos tu invitación para los XV años de Sandra Alicia 💖

Confirma tu asistencia en este link:
${linkInvitacion}

Código de invitación: ${item.codigo}`;

  const linkWhatsApp = telefonoLimpio
    ? `https://wa.me/52${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`
    : "";

  return [
    item.codigo,
    item.nombre,
    item.pases,
    item.telefono,
    item.grupo,
    item.estado,
    item.asistencia,
    item.cantidadConfirmada,
    item.fechaConfirmacion?.toDate
      ? item.fechaConfirmacion.toDate().toLocaleString("es-MX")
      : "",
    linkInvitacion,
    linkWhatsApp,
  ];
});


    const csv = [encabezados, ...filas]
      .map((fila) =>
        fila
          .map((campo) => `"${String(campo).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "avance-confirmaciones-sandra-alicia.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
  <AdminPasswordGate>
    <main className="min-h-screen bg-[#fff8fb] text-[#4b2433] p-4 md:p-8">

      <div className="max-w-7xl mx-auto">
        <section className="bg-white rounded-[32px] shadow-lg p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="uppercase tracking-[0.3em] text-xs text-[#9b355e] mb-2">
                XV Sandra Alicia
              </p>

              <h1 className="text-3xl md:text-5xl font-bold text-[#FF3471]">
                Panel de confirmaciones
              </h1>

              <p className="mt-2 text-gray-600">
                Consulta invitados, pendientes, confirmaciones y descarga el reporte.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cargarDatos}
                className="px-5 py-3 rounded-full border border-[#FF3471] text-[#FF3471] font-semibold hover:bg-pink-50 transition"
              >
                Actualizar
              </button>

              <button
                onClick={descargarCSV}
                disabled={registros.length === 0}
                className="px-5 py-3 rounded-full bg-[#FF3471] text-white font-semibold hover:bg-[#FEA201] transition disabled:opacity-50"
              >
                Descargar CSV
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-3xl shadow p-5">
            <p className="text-sm text-gray-500">Invitados</p>
            <p className="text-3xl font-bold text-[#FF3471]">
              {totalInvitados}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow p-5">
            <p className="text-sm text-gray-500">Confirmados</p>
            <p className="text-3xl font-bold text-green-600">
              {totalSiAsisten}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow p-5">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-3xl font-bold text-yellow-600">
              {totalPendientes}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow p-5">
            <p className="text-sm text-gray-500">No asistirán</p>
            <p className="text-3xl font-bold text-red-600">
              {totalNoAsisten}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow p-5">
            <p className="text-sm text-gray-500">Pases asignados</p>
            <p className="text-3xl font-bold text-[#FEA201]">
              {totalPasesAsignados}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow p-5">
            <p className="text-sm text-gray-500">% avance</p>
            <p className="text-3xl font-bold text-[#9b355e]">
              {porcentajeConfirmacion}%
            </p>
          </div>
        </section>

        <section className="bg-white rounded-[32px] shadow-lg p-4 md:p-6 mb-6">
          <div className="mb-4">
            <div className="w-full bg-pink-100 rounded-full h-4 overflow-hidden">
              <div
                className="bg-[#FF3471] h-4 rounded-full transition-all"
                style={{ width: `${porcentajeConfirmacion}%` }}
              />
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Avance de confirmación: {porcentajeConfirmacion}%
            </p>
          </div>
        </section>

       <section className="bg-white rounded-[32px] shadow-lg p-4 md:p-6">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
    <h2 className="text-2xl font-bold text-[#9b355e]">
      Detalle por invitado
    </h2>


<input
  type="text"
  value={busqueda}
  onChange={(e) => setBusqueda(e.target.value)}
  placeholder="Buscar por nombre, código, teléfono o grupo..."
  className="w-full md:w-80 border border-pink-200 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-[#FF3471]/30 text-sm"
/>


    <div className="flex flex-wrap gap-2">
      {(["Todos", "Confirmado", "Pendiente", "No asistirá"] as const).map(
        (estado) => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filtroEstado === estado
                ? "bg-[#FF3471] text-white"
                : "bg-pink-50 text-[#9b355e] hover:bg-pink-100"
            }`}
          >
            {estado}
          </button>
        )
      )}
    </div>
  </div>


          {cargando ? (
            <p className="text-center py-10 text-gray-500">Cargando...</p>
          ) : registrosFiltrados.length === 0 ? (
            <p className="text-center py-10 text-gray-500">
              No hay invitados para este filtro.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FF3471] text-white">
                    <th className="p-3 text-left">Código</th>
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Pases</th>
                    <th className="p-3 text-left">Teléfono</th>
                    <th className="p-3 text-left">Grupo</th>
                    <th className="p-3 text-left">Estado</th>
                    <th className="p-3 text-left">Confirmados</th>
                    <th className="p-3 text-left">Fecha</th>
                    <th className="p-3 text-left">Link</th>
                    <th className="p-3 text-left">WhatsApp</th>
                  </tr>
                </thead>

                <tbody>
                  {registrosFiltrados.map((item) => (
                    <tr key={item.codigo} className="border-b hover:bg-pink-50">
                      <td className="p-3 font-semibold">{item.codigo}</td>
                      <td className="p-3">{item.nombre || "-"}</td>
                      <td className="p-3">{item.pases}</td>
                      <td className="p-3">{item.telefono || "-"}</td>
                      <td className="p-3">{item.grupo || "-"}</td>
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.estado === "Confirmado"
                              ? "bg-green-100 text-green-700"
                              : item.estado === "No asistirá"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {item.estado}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[#FF3471]">
                        {item.cantidadConfirmada}
                      </td>

 <td className="p-3">
  {item.fechaConfirmacion?.toDate
    ? item.fechaConfirmacion
        .toDate()
        .toLocaleString("es-MX")
    : "-"}
</td>

<td className="p-3">
  <button
    onClick={() => copiarLink(item.codigo)}
    className="px-3 py-2 rounded-full bg-pink-50 text-[#FF3471] text-xs font-semibold hover:bg-pink-100 transition"
  >
    Copiar link
  </button>
</td>

<td className="p-3">
  <button
    onClick={() => enviarWhatsApp(item.telefono, item.codigo, item.nombre)}
    disabled={!item.telefono}
    className="px-3 py-2 rounded-full bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
  >
    WhatsApp
  </button>
</td>

                    </tr>



                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
       </main>
  </AdminPasswordGate>
  );
}