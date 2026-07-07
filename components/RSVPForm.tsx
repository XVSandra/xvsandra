"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

type RSVPFormProps = {
  nombreInvitado: string;
  pasesAsignados: number;
  codigoInvitado: string;
};

export default function RSVPForm({
  nombreInvitado,
  pasesAsignados,
  codigoInvitado,
}: RSVPFormProps) {
  const [asistencia, setAsistencia] = useState("Sí asistiré");
  const [cantidadConfirmada, setCantidadConfirmada] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [confirmacionExistente, setConfirmacionExistente] = useState(false);
  const [cargandoConfirmacion, setCargandoConfirmacion] = useState(true);

  useEffect(() => {
    const cargarConfirmacionExistente = async () => {
      if (!codigoInvitado) {
        setCargandoConfirmacion(false);
        return;
      }

      try {
        const refConfirmacion = doc(db, "confirmaciones", codigoInvitado);
        const snapshot = await getDoc(refConfirmacion);

        if (snapshot.exists()) {
          const data = snapshot.data();

          setConfirmacionExistente(true);
          setAsistencia(data.asistencia || "Sí asistiré");
          setCantidadConfirmada(Number(data.cantidadConfirmada || 1));
        }
      } catch (error) {
        console.error("Error cargando confirmación existente:", error);
      } finally {
        setCargandoConfirmacion(false);
      }
    };

    cargarConfirmacionExistente();
  }, [codigoInvitado]);

  const opcionesCantidad =
    asistencia === "Sí asistiré"
      ? Array.from({ length: pasesAsignados }, (_, i) => i + 1)
      : [0];

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!codigoInvitado) {
      toast.error("No se encontró el código de invitación.");
      return;
    }

    try {
      setEnviando(true);

      await setDoc(doc(db, "confirmaciones", codigoInvitado), {
        codigo: codigoInvitado,
        nombre: nombreInvitado,
        asistencia,
        pasesAsignados,
        cantidadConfirmada:
          asistencia === "No asistiré" ? 0 : cantidadConfirmada,
        fechaConfirmacion: new Date(),
      });

      toast.success(
        confirmacionExistente
          ? "Confirmación actualizada correctamente."
          : "Confirmación enviada correctamente."
      );

      setConfirmacionExistente(true);
    } catch (error) {
      console.error("Error enviando confirmación:", error);
      toast.error("Hubo un error al enviar la confirmación.");
    } finally {
      setEnviando(false);
    }
  };

  if (cargandoConfirmacion) {
    return (
      <div className="max-w-xl mx-auto section-card rounded-[28px] p-8 text-center">
        <p className="text-gray-500">Cargando confirmación...</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={manejarSubmit}
      className="max-w-xl mx-auto section-card rounded-[28px] p-8 space-y-5"
    >
      <div className="text-center bg-[#fff4f8] border border-pink-100 rounded-2xl p-5">
        <p className="text-sm text-gray-600">Invitación para</p>
        <p className="text-2xl font-bold text-[#FF3471]">
          {nombreInvitado}
        </p>
      </div>

      <div className="bg-[#fff4f8] border border-pink-100 rounded-2xl p-4 text-center">
        <p className="text-sm text-gray-600">Pases asignados</p>
        <p className="text-3xl font-bold text-[#FF3471]">
          {pasesAsignados}
        </p>
      </div>

      {confirmacionExistente && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 text-center">
          Tu confirmación ya fue registrada. Puedes actualizarla si necesitas
          hacer algún cambio.
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-[#9b355e] mb-2">
          Confirmación
        </label>

        <select
          value={asistencia}
          onChange={(e) => {
            setAsistencia(e.target.value);
            setCantidadConfirmada(e.target.value === "No asistiré" ? 0 : 1);
          }}
          className="w-full border border-pink-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF3471]/30"
        >
          <option>Sí asistiré</option>
          <option>No asistiré</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#9b355e] mb-2">
          Cantidad de asistentes confirmados
        </label>

        <select
          value={cantidadConfirmada}
          onChange={(e) => setCantidadConfirmada(Number(e.target.value))}
          disabled={asistencia === "No asistiré"}
          className="w-full border border-pink-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF3471]/30 disabled:bg-gray-100"
        >
          {opcionesCantidad.map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={enviando}
       // className="w-full luxury-button py-3 rounded-full font-semibold disabled:opacity-60"//
 className="mt-4 bg-[#7B4BA3] text-white px-8 py-3 rounded-full hover:bg-[#E8C45C] hover:text-[#4B3561] transition text-lg md:text-xl font-semibold"
      >
        {enviando
          ? "Guardando..."
          : confirmacionExistente
          ? "Actualizar confirmación"
          : "Enviar confirmación"}
      </button>
    </form>
  );
}