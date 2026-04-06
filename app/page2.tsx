"use client";

import "@fontsource/playfair-display/900.css";
import "aos/dist/aos.css";

import AOS from "aos";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { Howl } from "howler";
import { addDoc, collection } from "firebase/firestore";

import { db } from "@/lib/firebase";
import RSVPForm from "@/components/RSVPForm";
import ContadorElegante from "@/components/ContadorElegante";

export default function Page() {
  const [nombreInvitado, setNombreInvitado] = useState("Invitado especial");
  const [audio, setAudio] = useState<Howl | null>(null);
  const [sonando, setSonando] = useState(false);
  const [mensajeLibro, setMensajeLibro] = useState("");
  const [mensajeEnviado, setMensajeEnviado] = useState("");

  const enviarMensajeLibro = async () => {
    if (!mensajeLibro.trim()) {
      setMensajeEnviado("Por favor escribe un mensaje antes de enviar.");
      return;
    }

    try {
      await addDoc(collection(db, "libroVisitas"), {
        nombre: nombreInvitado,
        mensaje: mensajeLibro,
        timestamp: new Date(),
      });
      setMensajeEnviado("¡Gracias por tu mensaje!");
      setMensajeLibro("");
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      setMensajeEnviado("Hubo un error al enviar tu mensaje. Intenta de nuevo.");
    }
  };

  useEffect(() => {
    AOS.init({
      duration: 1100,
      once: true,
      offset: 40,
      easing: "ease-out-cubic",
    });

    const params = new URLSearchParams(window.location.search);
    const idInvitado = params.get("idInvitado");
    if (idInvitado) {
      setNombreInvitado(`Invitado #${idInvitado}`);
    }

    const musica = new Howl({
      src: ["/musica.mp3"],
      html5: true,
      volume: 0.35,
      loop: true,
    });

    setAudio(musica);

    return () => {
      musica.unload();
    };
  }, []);

  const toggleMusica = () => {
    if (!audio) return;
    if (sonando) {
      audio.pause();
    } else {
      audio.play();
    }
    setSonando(!sonando);
  };

  return (
    <main className="relative text-gray-800 scroll-smooth bg-animate overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/images/flores-orilla.png"
          alt="Decoración floral"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      <Toaster position="top-center" reverseOrder={false} />

      <button
        className="fixed top-4 right-4 bg-white/80 backdrop-blur-md text-[#FF3471] rounded-full shadow-lg border border-white/70 p-3 z-50 hover:scale-105 transition"
        onClick={toggleMusica}
        aria-label="Control de música"
      >
        {sonando ? "⏸️" : "▶️"}
      </button>

      <section
        className="min-h-screen bg-cover bg-center flex flex-col justify-between items-center text-white p-6 relative"
        style={{ backgroundImage: "url('/images/portada.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-[#3d1f2d]/55"></div>

        <div className="relative w-full flex flex-col justify-between items-center min-h-screen py-10">
          <div className="text-center mt-10" data-aos="fade-down">
            <p className="uppercase tracking-[0.35em] text-xs md:text-sm text-white/90 mb-5">
              Una noche mágica para recordar
            </p>

            <h1
              className="text-5xl md:text-7xl drop-shadow-lg"
              style={{ fontFamily: "Playfair Display, serif", fontWeight: 900 }}
            >
              Mis XV Años
            </h1>
          </div>

          <div className="text-center mb-12" data-aos="fade-up">
            <h2
              className="text-5xl md:text-8xl drop-shadow-lg text-[#FFD44A]"
              style={{ fontFamily: "Playfair Display, serif", fontWeight: 900 }}
            >
              Sandra Alicia
            </h2>

            <p className="mt-4 text-sm md:text-base tracking-[0.25em] uppercase text-white/85">
              15 de agosto 2026
            </p>

            <div className="mt-5 elegant-divider mx-auto"></div>
          </div>
        </div>
      </section>

      <section
        className="section-card rounded-[28px] my-16 mx-4 md:mx-16 text-center py-16 px-6 relative z-10"
        data-aos="zoom-in"
      >
        <div className="flex justify-center mt-4 mb-2">
          <img
            src="/images/crown.png"
            alt="Corona"
            className="w-52 md:w-60 h-auto float-soft"
          />
        </div>
      </section>

      <section className="text-center py-8 md:py-10 relative z-10" data-aos="fade-up">
        <div className="flex flex-col items-center">
          <div className="w-24 h-1 bg-[#FFD44A] rounded-full"></div>

          <p
            className="text-[68px] md:text-[110px] text-[#FF3471] leading-none font-[900]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            15/AGO
          </p>
          <p
            className="text-[68px] md:text-[110px] text-[#FEA201] leading-none font-[900]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            2026
          </p>

          <div className="w-24 h-1 bg-[#FFD44A] rounded-full"></div>
        </div>
      </section>

      <ContadorElegante />

      <section className="relative py-20 bg-[#7C8C74] text-white text-center overflow-hidden z-10">
        <div className="absolute top-0 left-0 w-full z-20 pointer-events-none">
          <svg
            viewBox="0 0 1440 320"
            className="w-full h-[90px]"
            preserveAspectRatio="none"
          >
            <path
              fill="#6D8063"
              d="M0,64L48,74.7C96,85,192,107,288,122.7C384,139,480,149,576,138.7C672,128,768,96,864,85.3C960,75,1056,85,1152,106.7C1248,128,1344,160,1392,176L1440,192L1440,0L0,0Z"
            />
          </svg>
        </div>

        <div className="py-20 px-6">
          <h2
            className="text-3xl md:text-5xl font-bold text-white mb-8"
            data-aos="fade-up"
          >
            Con mucho amor me acompañan
          </h2>

          <div className="elegant-divider mx-auto mb-10"></div>

          <div className="max-w-2xl mx-auto text-lg md:text-xl space-y-12">
            <div data-aos="fade-up" data-aos-delay="100">
              <p className="font-semibold text-[#FFD44A] mb-2">Mis Padres:</p>
              <div className="w-40 h-0.5 bg-[#FFD44A] mx-auto my-4 rounded-full"></div>
              <p>María Elena Ruiz Paredes</p>
              <p>Salomón Cárdenas Fierro</p>
            </div>

            <div data-aos="fade-up" data-aos-delay="180" className="mt-8">
              <p className="font-semibold text-[#FFD44A] mb-2">Mis Padrinos:</p>
              <div className="w-40 h-0.5 bg-[#FFD44A] mx-auto my-4 rounded-full"></div>
              <p>Rocio Ruiz Paredes</p>
              <p>Lennin Hansmann Vázquez</p>
            </div>

            <div data-aos="fade-up" data-aos-delay="260" className="mt-10">
              <p className="text-[#FFD44A] font-semibold text-xl">
                ¡Acompáñame tú también a celebrar este momento tan especial lleno
                de amor, alegría y sueños cumplidos!
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none">
          <svg
            viewBox="0 0 1440 320"
            className="w-full h-[90px] rotate-180"
            preserveAspectRatio="none"
          >
            <path
              fill="#6D8063"
              d="M0,64L48,74.7C96,85,192,107,288,122.7C384,139,480,149,576,138.7C672,128,768,96,864,85.3C960,75,1056,85,1152,106.7C1248,128,1344,160,1392,176L1440,192L1440,0L0,0Z"
            />
          </svg>
        </div>
      </section>

      <section className="py-20 px-6 text-center relative z-10" data-aos="fade-up">
        <div className="max-w-5xl mx-auto section-soft rounded-[32px] px-6 md:px-10 py-12">
          <h2 className="text-3xl md:text-5xl font-bold text-[#FF3471] mb-8">
            Detalles del Evento
          </h2>

          <div className="elegant-divider mx-auto mb-10"></div>

          <div className="max-w-3xl mx-auto space-y-12 text-lg md:text-xl">
            <div
              className="flex flex-col items-center"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <img
                src="/icons/ubicacion.png"
                alt="Ubicación"
                className="w-10 h-10 mb-4"
              />
              <p className="font-semibold text-[#FEA201]">Jardín Magno</p>
              <p>Ruanda Pte. Oriente 1356, Villanova, 21307 Mexicali, B.C.</p>
            </div>

            <div
              className="flex flex-col items-center"
              data-aos="zoom-in"
              data-aos-delay="160"
            >
              <img
                src="/images/jardin-miniatura.jpg"
                alt="Jardín Magno"
                className="rounded-[24px] shadow-lg w-72 h-auto object-cover"
              />
              <a
                href="https://maps.app.goo.gl/oaYpVVSQjtdi7qzv5"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block bg-[#FEA201] text-white px-6 py-3 rounded-full shadow hover:bg-[#FF3471] transition"
              >
                Ver ubicación en Google Maps
              </a>
            </div>

            <div
              className="flex flex-col items-center"
              data-aos="fade-up"
              data-aos-delay="220"
            >
              <img
                src="/icons/vestimenta.png"
                alt="Código de vestimenta"
                className="w-10 h-10 mb-4"
              />
              <p className="font-semibold text-[#FEA201]">
                Código de vestimenta:
              </p>
              <p>Formal, colores primaverales 🌸 (Evitar negro)</p>
            </div>

            <div
              className="flex flex-col items-center"
              data-aos="fade-up"
              data-aos-delay="280"
            >
              <img
                src="/icons/obsequio.png"
                alt="Obsequios"
                className="w-10 h-10 mb-4"
              />
              <p className="font-semibold text-[#FEA201]">Obsequios:</p>
              <p>
                Tu presencia es mi mejor regalo, pero si deseas obsequiarme algo
                tendremos lluvia de sobres.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 text-center relative z-10" data-aos="fade-up">
        <div className="max-w-5xl mx-auto section-soft rounded-[32px] px-6 md:px-10 py-12">
          <h2 className="text-3xl font-bold text-[#FF3471] mb-8">Itinerario</h2>

          <div className="elegant-divider mx-auto mb-10"></div>

          <div className="relative w-full md:w-2/3 mx-auto section-card rounded-[30px] px-6 py-10">
            <div className="absolute left-1/2 top-10 bottom-10 transform -translate-x-1/2 border-l-2 border-[#FF3471]/50"></div>

            <div className="flex flex-col space-y-10 relative">
              {[
                ["7:00 PM", "Recepción"],
                ["7:45 PM", "Vals"],
                ["8:15 PM", "Brindis"],
                ["8:30 PM", "Cena"],
                ["9:00 PM", "Fotos"],
                ["Fiesta", "¡A bailar y disfrutar!"],
              ].map(([hora, evento], index) => (
                <div
                  key={index}
                  className="flex items-center"
                  data-aos="fade-up"
                  data-aos-delay={100 + index * 70}
                >
                  <div className="w-1/2 text-right pr-4 text-lg font-semibold text-[#9b355e]">
                    {hora}
                  </div>
                  <div className="w-1/2 text-left pl-4 text-lg text-gray-700">
                    {evento}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-20 px-6 text-center relative z-10"
        data-aos="fade-up"
      >
        <div className="max-w-5xl mx-auto section-soft rounded-[32px] px-6 md:px-10 py-12">
          <div className="flex flex-col items-center space-y-6">
            <img
              src="/icons/camara.png"
              alt="Comparte tus fotos"
              className="w-16 h-16"
              data-aos="zoom-in"
            />

            <h2 className="text-4xl md:text-5xl font-bold text-[#FF3471] animate-heartbeat">
              #XVSandraAlicia
            </h2>

            <div className="elegant-divider mx-auto"></div>

            <p className="max-w-2xl text-lg md:text-xl text-gray-700">
              Comparte con nosotros tus fotos del evento usando el hashtag{" "}
              <span className="font-semibold text-[#FEA201]">
                #XVSandraAlicia
              </span>{" "}
              en tus publicaciones.
            </p>
          </div>
        </div>
      </section>

      <section
        className="py-14 px-6 text-center relative z-10"
        data-aos="zoom-in-up"
      >
        <h2 className="text-4xl font-bold text-[#FF3471] mb-4">
          ¿Podrás acompañarme en este día tan especial?
        </h2>
      </section>

      <section className="py-10 relative z-10" data-aos="fade-up">
        <RSVPForm />
      </section>

      <section className="py-20 px-6 text-center relative z-10" data-aos="fade-up">
        <div className="max-w-5xl mx-auto section-soft rounded-[32px] px-6 md:px-10 py-12">
          <h2 className="text-3xl font-bold text-[#FEA201] mb-4">
            Libro de visitas
          </h2>

          <div className="elegant-divider mx-auto mb-8"></div>

          <p className="mb-6 text-lg">Déjame un mensajito bonito 🥰</p>

          <textarea
            value={mensajeLibro}
            onChange={(e) => setMensajeLibro(e.target.value)}
            className="w-full md:w-2/3 h-36 p-4 rounded-2xl border border-[#FE9BBA]/50 bg-white/85 shadow-md outline-none focus:ring-2 focus:ring-[#FF3471]/30"
            placeholder="Escribe tu mensaje aquí..."
          ></textarea>

          <br />

          <button
            onClick={enviarMensajeLibro}
            className="mt-6 bg-[#FF3471] text-white px-8 py-3 rounded-full hover:bg-[#FEA201] transition shadow-md"
          >
            Enviar mensaje
          </button>

          {mensajeEnviado && (
            <p className="mt-4 text-green-600 font-semibold">{mensajeEnviado}</p>
          )}
        </div>
      </section>
    </main>
  );
}