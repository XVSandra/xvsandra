"use client";

import { useEffect, useState } from "react";

const EVENT_DATE = new Date("2026-08-15T19:00:00");

function calcularTiempo() {
  const diff = EVENT_DATE.getTime() - Date.now();

  if (diff <= 0) {
    return {
      dias: 0,
      horas: 0,
      minutos: 0,
      segundos: 0,
    };
  }

  return {
    dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((diff / (1000 * 60)) % 60),
    segundos: Math.floor((diff / 1000) % 60),
  };
}

export default function ContadorElegante() {
  const [montado, setMontado] = useState(false);
  const [tiempo, setTiempo] = useState({
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
  });

  useEffect(() => {
    setMontado(true);
    setTiempo(calcularTiempo());

    const intervalo = setInterval(() => {
      setTiempo(calcularTiempo());
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  if (!montado) {
    return (
      <section className="py-12 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-[#FF3471] mb-8">
          Cuenta regresiva
        </h2>
      </section>
    );
  }

  const items = [
    { label: "Días", value: tiempo.dias },
    { label: "Horas", value: tiempo.horas },
    { label: "Minutos", value: tiempo.minutos },
    { label: "Segundos", value: tiempo.segundos },
  ];

  return (
    <section className="py-12 text-center relative z-10" data-aos="fade-up">
      <h2 className="text-3xl md:text-4xl font-bold text-[#FF3471] mb-8">
        Cuenta regresiva
      </h2>

      <div className="flex flex-wrap justify-center gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-2xl shadow-lg px-6 py-5 min-w-[110px]"
          >
            <p className="text-3xl font-bold text-[#FEA201]">
              {String(item.value).padStart(2, "0")}
            </p>
            <p className="text-sm text-gray-600">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}