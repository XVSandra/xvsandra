"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type InvitadoExcel = {
  codigo: string;
  nombre: string;
  pases: number;
  telefono?: string;
  grupo?: string;
  notas?: string;
};

export default function ImportarInvitadosPage() {
  const [archivoNombre, setArchivoNombre] = useState("");
  const [invitados, setInvitados] = useState<InvitadoExcel[]>([]);
  const [importando, setImportando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const leerExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    setArchivoNombre(archivo.name);
    setMensaje("");

    const data = await archivo.arrayBuffer();
    const workbook = XLSX.read(data);
    const hoja = workbook.Sheets["Plantilla Invitados"] || workbook.Sheets[workbook.SheetNames[0]];

    const registros = XLSX.utils.sheet_to_json<Record<string, any>>(hoja, {
      defval: "",
    });

    const invitadosLimpios: InvitadoExcel[] = registros
      .map((fila) => ({
        codigo: String(fila.codigo || "").trim(),
        nombre: String(fila.nombre || "").trim(),
        pases: Number(fila.pases || 0),
        telefono: String(fila.telefono || "").trim(),
        grupo: String(fila.grupo || "").trim(),
        notas: String(fila.notas || "").trim(),
      }))
      .filter((invitado) => invitado.codigo && invitado.nombre && invitado.pases > 0);

    setInvitados(invitadosLimpios);
  };

  const importarAFirebase = async () => {
    if (invitados.length === 0) {
      setMensaje("No hay invitados válidos para importar.");
      return;
    }

    try {
      setImportando(true);
      setMensaje("");

      for (const invitado of invitados) {
        await setDoc(doc(db, "invitados", invitado.codigo), {
          nombre: invitado.nombre,
          pases: invitado.pases,
          telefono: invitado.telefono || "",
          grupo: invitado.grupo || "",
          notas: invitado.notas || "",
          confirmado: false,
          actualizadoEn: new Date(),
        });
      }

      setMensaje(`Importación completada: ${invitados.length} invitados agregados.`);
    } catch (error) {
      console.error("Error importando invitados:", error);
      setMensaje("Hubo un error al importar invitados.");
    } finally {
      setImportando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fff8fb] text-[#4b2433] p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-[32px] shadow-lg p-6 md:p-8">
        <p className="uppercase tracking-[0.3em] text-xs text-[#9b355e] mb-2">
          XV Sandra Alicia
        </p>

        <h1 className="text-3xl md:text-5xl font-bold text-[#FF3471] mb-4">
          Importar invitados
        </h1>

        <p className="text-gray-600 mb-8">
          Sube la plantilla Excel para crear automáticamente los invitados en Firebase.
        </p>

        <div className="border-2 border-dashed border-pink-200 rounded-3xl p-6 text-center mb-6">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={leerExcel}
            className="block w-full text-sm text-gray-600"
          />

          {archivoNombre && (
            <p className="mt-4 text-sm text-gray-500">
              Archivo seleccionado: <strong>{archivoNombre}</strong>
            </p>
          )}
        </div>

        {invitados.length > 0 && (
          <>
            <div className="bg-pink-50 rounded-2xl p-4 mb-6">
              <p className="font-semibold text-[#FF3471]">
                Invitados detectados: {invitados.length}
              </p>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FF3471] text-white">
                    <th className="p-3 text-left">Código</th>
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Pases</th>
                    <th className="p-3 text-left">Teléfono</th>
                    <th className="p-3 text-left">Grupo</th>
                  </tr>
                </thead>

                <tbody>
                  {invitados.map((invitado) => (
                    <tr key={invitado.codigo} className="border-b">
                      <td className="p-3 font-semibold">{invitado.codigo}</td>
                      <td className="p-3">{invitado.nombre}</td>
                      <td className="p-3">{invitado.pases}</td>
                      <td className="p-3">{invitado.telefono || "-"}</td>
                      <td className="p-3">{invitado.grupo || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={importarAFirebase}
              disabled={importando}
              className="bg-[#FF3471] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#FEA201] transition disabled:opacity-60"
            >
              {importando ? "Importando..." : "Importar a Firebase"}
            </button>
          </>
        )}

        {mensaje && (
          <div className="mt-6 bg-pink-50 border border-pink-200 rounded-2xl p-4">
            {mensaje}
          </div>
        )}
      </div>
    </main>
  );
}