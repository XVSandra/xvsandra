"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

export default function RSVPForm() {
  const [nombre, setNombre] = useState("");
  const [asistencia, setAsistencia] = useState("Sí asistiré");

  const manejarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Confirmación enviada");
    setNombre("");
    setAsistencia("Sí asistiré");
  };

  return (
    <form
      onSubmit={manejarSubmit}
      className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-4"
    >
      <input
        type="text"
        placeholder="Tu nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-full border border-pink-200 rounded-lg px-4 py-3"
        required
      />

      <select
        value={asistencia}
        onChange={(e) => setAsistencia(e.target.value)}
        className="w-full border border-pink-200 rounded-lg px-4 py-3"
      >
        <option>Sí asistiré</option>
        <option>No podré asistir</option>
      </select>

      <button
        type="submit"
        className="w-full bg-[#FF3471] text-white py-3 rounded-full hover:bg-[#FEA201] transition"
      >
        Confirmar asistencia
      </button>
    </form>
  );
}