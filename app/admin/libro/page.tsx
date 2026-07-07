"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import AdminPasswordGate from "@/components/admin/AdminPasswordGate";

type MensajeLibro = {
  id: string;
  codigo?: string;
  nombre?: string;
  mensaje?: string;
  timestamp?: Timestamp;
};

export default function AdminLibroPage() {
  const [mensajes, setMensajes] = useState<MensajeLibro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarMensajes = async () => {
    try {
      setCargando(true);
      setError("");

      const q = query(
        collection(db, "libroVisitas"),
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(q);

      const datos = snapshot.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
      })) as MensajeLibro[];

      setMensajes(datos);
    } catch (error) {
      console.error("Error cargando mensajes:", error);
      setError("No se pudieron cargar los mensajes.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMensajes();
  }, []);

  const eliminarMensaje = async (mensaje: MensajeLibro) => {
    const confirmar = confirm(
      `¿Seguro que deseas eliminar este mensaje de ${mensaje.nombre || "Invitado"}?`
    );

    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "libroVisitas", mensaje.id));
      await cargarMensajes();
      alert("Mensaje eliminado correctamente.");
    } catch (error) {
      console.error("Error eliminando mensaje:", error);
      alert("No se pudo eliminar el mensaje.");
    }
  };

  const descargarCSV = () => {
    const encabezados = ["Nombre", "Codigo", "Mensaje", "Fecha"];

    const filas = mensajes.map((item) => [
      item.nombre || "",
      item.codigo || "",
      item.mensaje || "",
      item.timestamp?.toDate
        ? item.timestamp.toDate().toLocaleString("es-MX")
        : "",
    ]);

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
    link.download = "libro-visitas-sandra-alicia.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <AdminPasswordGate>
      <main className="min-h-screen bg-[#fff8fb] text-[#4b2433] p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <section className="bg-white rounded-[32px] shadow-lg p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="uppercase tracking-[0.3em] text-xs text-[#9b355e] mb-2">
                  XV Sandra Alicia
                </p>

                <h1 className="text-3xl md:text-5xl font-bold text-[#7B4BA3]">
                  Libro de visitas
                </h1>

                <p className="mt-2 text-gray-600">
                  Consulta los mensajes que dejaron los invitados.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={cargarMensajes}
                  className="px-5 py-3 rounded-full border border-[#7B4BA3] text-[#7B4BA3] font-semibold hover:bg-purple-50 transition"
                >
                  Actualizar
                </button>

                <button
                  onClick={descargarCSV}
                  disabled={mensajes.length === 0}
                  className="px-5 py-3 rounded-full bg-[#7B4BA3] text-white font-semibold hover:bg-[#B78A25] transition disabled:opacity-50"
                >
                  Descargar CSV
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-3xl shadow p-5">
              <p className="text-sm text-gray-500">Mensajes recibidos</p>
              <p className="text-3xl font-bold text-[#7B4BA3]">
                {mensajes.length}
              </p>
            </div>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6">
              {error}
            </div>
          )}

          <section className="bg-white rounded-[32px] shadow-lg p-4 md:p-6">
            <h2 className="text-2xl font-bold text-[#9b355e] mb-4">
              Mensajes
            </h2>

            {cargando ? (
              <p className="text-center py-10 text-gray-500">
                Cargando mensajes...
              </p>
            ) : mensajes.length === 0 ? (
              <p className="text-center py-10 text-gray-500">
                Todavía no hay mensajes en el libro de visitas.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {mensajes.map((item) => (
                  <div
                    key={item.id}
                    className="bg-pink-50 border border-pink-100 rounded-3xl p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-lg font-bold text-[#7B4BA3]">
                          {item.nombre || "Invitado especial"}
                        </p>

                        <p className="text-xs text-gray-500">
                          Código: {item.codigo || "sin código"}
                        </p>
                      </div>

                      <button
                        onClick={() => eliminarMensaje(item)}
                        className="px-3 py-2 rounded-full bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition"
                      >
                        Eliminar
                      </button>
                    </div>

                    <p className="text-gray-700 italic leading-relaxed">
                      “{item.mensaje || ""}”
                    </p>

                    <p className="text-xs text-gray-400 mt-4">
                      {item.timestamp?.toDate
                        ? item.timestamp.toDate().toLocaleString("es-MX")
                        : "Sin fecha"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </AdminPasswordGate>
  );
}