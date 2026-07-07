"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type MensajeLibro = {
  id: string;
  codigo?: string;
  nombre?: string;
  mensaje?: string;
  timestamp?: Timestamp;
};

export default function MensajesLibroVisitas() {
  const [mensajes, setMensajes] = useState<MensajeLibro[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarMensajes = async () => {
    try {
      setCargando(true);

      const q = query(
        collection(db, "libroVisitas"),
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(q);

      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MensajeLibro[];

      setMensajes(datos);
    } catch (error) {
      console.error("Error cargando mensajes del libro de visitas:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMensajes();
  }, []);

  if (cargando) {
    return (
      <div className="mt-10 text-center text-gray-500">
        Cargando mensajes...
      </div>
    );
  }

  if (mensajes.length === 0) {
    return (
      <div className="mt-10 text-center text-gray-500">
        Todavía no hay mensajes en el libro de visitas.
      </div>
    );
  }

  return (
    <div className="mt-12 max-w-4xl mx-auto">
      <h3 className="text-2xl md:text-3xl font-bold text-[#7B4BA3] mb-6 text-center">
        Mensajes recibidos
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mensajes.map((item) => (
          <div
            key={item.id}
            className="bg-white/90 border border-purple-100 rounded-3xl shadow-md p-5"
          >
            <p className="text-lg font-bold text-[#7B4BA3] mb-2">
              {item.nombre || "Invitado especial"}
            </p>

            <p className="text-gray-700 italic leading-relaxed">
              “{item.mensaje}”
            </p>

            {item.timestamp?.toDate && (
              <p className="text-xs text-gray-400 mt-4">
                {item.timestamp.toDate().toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}