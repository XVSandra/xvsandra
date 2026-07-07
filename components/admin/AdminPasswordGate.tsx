"use client";

import { useState } from "react";

type AdminPasswordGateProps = {
  children: React.ReactNode;
};

export default function AdminPasswordGate({ children }: AdminPasswordGateProps) {
  const [password, setPassword] = useState("");
  const [autorizado, setAutorizado] = useState(false);
  const [error, setError] = useState("");

  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

  const validarPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminPassword) {
      setError("No se configuró la contraseña del panel.");
      return;
    }

    if (password === adminPassword) {
      setAutorizado(true);
      setError("");
    } else {
      setError("Contraseña incorrecta.");
    }
  };

  if (autorizado) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-[#fff8fb] flex items-center justify-center p-6">
      <form
        onSubmit={validarPassword}
        className="bg-white rounded-[32px] shadow-lg p-8 max-w-md w-full text-center"
      >
        <p className="uppercase tracking-[0.3em] text-xs text-[#9b355e] mb-2">
          XV Sandra Alicia
        </p>

        <h1 className="text-3xl font-bold text-[#FF3471] mb-4">
          Panel privado
        </h1>

        <p className="text-gray-600 mb-6">
          Ingresa la contraseña para continuar.
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-full border border-pink-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF3471]/30 mb-4"
        />

        {error && (
          <p className="text-red-600 text-sm mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-[#FF3471] text-white py-3 rounded-full font-semibold hover:bg-[#FEA201] transition"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}