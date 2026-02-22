import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-300 text-pink-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white/70 backdrop-blur shadow-xl p-8 text-center">
        <p className="text-sm tracking-widest uppercase">Mis XV Años</p>
        <h1 className="text-4xl font-semibold mt-2">Marysol</h1>

        <div className="mt-6 rounded-2xl bg-white/80 p-4">
          <p className="text-lg">Sábado</p>
          <p className="text-2xl font-semibold">19 de Julio 2025</p>
          <p className="text-sm mt-1">7:00 PM</p>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-sm">Con la bendición de Dios y de mis padres</p>
          <p className="font-medium">Sandra & Ángel</p>
        </div>

        <div className="mt-8 flex gap-3 justify-center">
          <a
            className="px-5 py-3 rounded-full bg-pink-600 text-white font-medium hover:bg-pink-700 transition"
            href="#detalles"
          >
            Ver detalles
          </a>
          <a
            className="px-5 py-3 rounded-full bg-white text-pink-700 font-medium border border-pink-300 hover:bg-pink-50 transition"
            href="https://wa.me/52TU_NUMERO?text=Confirmo%20asistencia%20a%20los%20XV%20de%20Marysol"
            target="_blank"
          >
            Confirmar
          </a>
        </div>

        <section id="detalles" className="mt-10 text-left">
          <h2 className="text-xl font-semibold">Recepción</h2>
          <p className="mt-2 text-sm">
            Salón: <span className="font-medium">[Nombre del salón]</span>
            <br />
            Dirección: <span className="font-medium">[Dirección]</span>
          </p>
        </section>
      </div>
    </main>
  );
}