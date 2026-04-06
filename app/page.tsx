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
    AOS.init({ duration: 1200, once: true });

    const params = new URLSearchParams(window.location.search);
    const idInvitado = params.get("idInvitado");
    if (idInvitado) {
      setNombreInvitado(`Invitado #${idInvitado}`);
    }

    const musica = new Howl({
      src: ["/musica.mp3"],
      html5: true,
      volume: 0.4,
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
    <div className="relative text-gray-800 font-sans scroll-smooth bg-animate overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/images/flores-orilla.png"
          alt="Decoración floral"
          className="w-full h-full object-cover opacity-10"
        />
      </div>

      <Toaster position="top-center" reverseOrder={false} />

      <button
        className="fixed top-4 right-4 bg-[#FFD44A] text-white rounded-full shadow p-3 z-50 hover:bg-[#FEA201] transition"
        onClick={toggleMusica}
      >
        {sonando ? "⏸️" : "▶️"}
      </button>

      <section
  className="min-h-screen bg-cover bg-[center_top] justify-between items-center text-white p-6 relative"
  style={{ backgroundImage: "url('/images/portada.jpg')" }}
>
  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50"></div>

        <div className="relative w-full flex flex-col justify-between items-center min-h-screen py-10">
          <div className="text-center mt-10" data-aos="fade-down">
            <h1 className="text-5xl md:text-7xl font-bold drop-shadow-lg">
              Mis XV Años
            </h1>
          </div>
<div className="text-center mb-12" data-aos="fade-up">
  <p className="uppercase tracking-[0.35em] text-sm md:text-base text-white/90 mb-4">
    15 de agosto 2026
  </p>

  <h2
    className="text-5xl md:text-8xl drop-shadow-lg text-[#FFD44A]"
    style={{ fontFamily: "Playfair Display, serif", fontWeight: 900 }}
  >
    Sandra Alicia
  </h2>

  <div className="mt-4 w-24 h-1 mx-auto rounded-full bg-[#FFD44A]"></div>
</div>
        </div>
      </section>

      <section
        className="bg-white shadow-lg rounded-2xl ring-1 ring-gray-200 my-16 mx-4 md:mx-16 text-center py-16 px-6 relative z-10"
        data-aos="zoom-in"
      >
        <div className="flex justify-center mt-4 mb-2">
          <img
            src="/images/crown.png"
            alt="Corona"
            className="w-52 md:w-60 h-auto"
          />
        </div>
      </section>

      <section className="text-center py-10 relative z-10" data-aos="fade-up">
        <div className="flex flex-col items-center">
          <div className="w-24 h-1 bg-[#FFD44A] rounded-full"></div>

          <p
            className="text-[70px] md:text-[110px] text-[#FF3471] leading-none font-[900]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            15/AGO
          </p>
          <p
            className="text-[70px] md:text-[110px] text-[#FEA201] leading-none font-[900]"
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
            className="w-full h-[80px]"
            preserveAspectRatio="none"
          >
            <path
              fill="#6D8063"
              d="M0,64L48,74.7C96,85,192,107,288,122.7C384,139,480,149,576,138.7C672,128,768,96,864,85.3C960,75,1056,85,1152,106.7C1248,128,1344,160,1392,176L1440,192L1440,0L0,0Z"
            />
          </svg>
        </div>

        <div className="py-20 px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
            Con mucho amor me acompañan
          </h2>

          <div className="max-w-2xl mx-auto text-lg md:text-xl space-y-12">
            <div data-aos="fade-up" data-aos-delay="100">
              <p className="font-semibold text-[#FFD44A] mb-2">Mis Padres:</p>
              <div className="w-40 h-0.5 bg-[#FFD44A] mx-auto my-4 rounded-full"></div>
              <p>Sandra Angelina Ruiz Paredes</p>
              <p>Adrián Valenzuela Barajas</p>
            </div>

            <div data-aos="fade-up" data-aos-delay="200" className="mt-8">
              <p className="font-semibold text-[#FFD44A] mb-2">Mis Padrinos:</p>
              <div className="w-40 h-0.5 bg-[#FFD44A] mx-auto my-4 rounded-full"></div>
              <p>Rocio Ruiz Paredes</p>
              <p>Rogelio Ruiz Paredes</p>
            </div>

            <div data-aos="fade-up" data-aos-delay="300" className="mt-10">
              <p className="text-[#FFD44A] font-semibold text-xl">
                ¡Acompáñame tú también a celebrar este momento tan especial lleno de amor, alegría y sueños cumplidos!
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none">
          <svg
            viewBox="0 0 1440 320"
            className="w-full h-[80px] rotate-180"
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
        <h2 className="text-3xl md:text-5xl font-bold text-[#FF3471] mb-8">
          Detalles del Evento
        </h2>

        <div className="max-w-3xl mx-auto space-y-10 text-lg md:text-xl">
          <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="100">
            <img src="/icons/ubicacion.png" alt="Ubicación" className="w-10 h-10 mb-4" />
            <p className="font-semibold text-[#FEA201]">Salón Palladium</p>
            <p>RBlvd. Lázaro Cárdenas 1085, Las Flores, 21330 Mexicali, B.C.</p>
          </div>

          <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="200">
            <img
              src="/images/jardin-miniatura.jpg"
              alt="Jardín Magno"
              className="rounded-lg shadow-lg w-72 h-auto object-cover"
            />
            <a
              href="https://maps.app.goo.gl/4cgn53V6EUYMUF6E9"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block bg-[#FEA201] text-white px-6 py-2 rounded-full shadow hover:bg-[#FF3471] transition"
            >
              Ver ubicación en Google Maps
            </a>
          </div>

          <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="300">
            <img src="/icons/vestimenta.png" alt="Código de vestimenta" className="w-10 h-10 mb-4" />
            <p className="font-semibold text-[#FEA201]">Código de vestimenta:</p>
            <p>Formal</p>
          </div>

          <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="400">
            <img src="/icons/obsequio.png" alt="Obsequios" className="w-10 h-10 mb-4" />
            <p className="font-semibold text-[#FEA201]">Obsequios:</p>
            <p>Tu presencia es mi mejor regalo, pero si deseas obsequiarme algo, tendremos lluvia de sobres.</p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 text-center relative z-10" data-aos="fade-up">
        <h2 className="text-3xl font-bold text-[#FF3471] mb-10">Itinerario</h2>

        <div className="relative w-3/4 md:w-1/2 mx-auto">
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full border-l-2 border-[#FF3471]"></div>

          <div className="flex flex-col space-y-10">
            <div className="flex items-center">
              <div className="w-1/2 text-right pr-4 text-lg font-semibold">7:00 PM</div>
              <div className="w-1/2 text-left pl-4 text-lg">Recepción</div>
            </div>

            <div className="flex items-center">
              <div className="w-1/2 text-right pr-4 text-lg font-semibold">7:45 PM</div>
              <div className="w-1/2 text-left pl-4 text-lg">Vals</div>
            </div>

            <div className="flex items-center">
              <div className="w-1/2 text-right pr-4 text-lg font-semibold">8:15 PM</div>
              <div className="w-1/2 text-left pl-4 text-lg">Brindis</div>
            </div>

            <div className="flex items-center">
              <div className="w-1/2 text-right pr-4 text-lg font-semibold">8:30 PM</div>
              <div className="w-1/2 text-left pl-4 text-lg">Cena</div>
            </div>

            <div className="flex items-center">
              <div className="w-1/2 text-right pr-4 text-lg font-semibold">9:00 PM</div>
              <div className="w-1/2 text-left pl-4 text-lg">Fotos</div>
            </div>

            <div className="flex items-center">
              <div className="w-1/2 text-right pr-4 text-lg font-semibold">Fiesta</div>
              <div className="w-1/2 text-left pl-4 text-lg">¡A bailar y disfrutar!</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 text-center bg-white relative z-10" data-aos="fade-up">
        <div className="flex flex-col items-center space-y-6">
          <img src="/icons/camara.png" alt="Comparte tus fotos" className="w-16 h-16" />

          <h2 className="text-4xl md:text-5xl font-bold text-[#FF3471] animate-heartbeat">
            #XVSandraAlicia
          </h2>

          <p className="max-w-2xl text-lg md:text-xl text-gray-700">
            Comparte con nosotros tus fotos del evento usando el hashtag{" "}
            <span className="font-semibold text-[#FEA201]">#XVSandraAlicia</span>.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 text-center relative z-10" data-aos="zoom-in-up">
        <h2 className="text-4xl font-bold text-[#FF3471] mb-4">
          ¿Podrás acompañarme en este día tan especial?
        </h2>
      </section>

      <section className="py-16 relative z-10" data-aos="fade-up">
        <RSVPForm />
      </section>

      <section className="py-16 text-center relative z-10" data-aos="fade-up">
        <h2 className="text-3xl font-bold text-[#FEA201] mb-4">Libro de visitas</h2>

        <p className="mb-4">Déjame un mensajito bonito 🥰</p>

        <textarea
          value={mensajeLibro}
          onChange={(e) => setMensajeLibro(e.target.value)}
          className="w-3/4 md:w-1/2 h-32 p-4 rounded border-2 border-[#FE9BBA] bg-white"
          placeholder="Escribe tu mensaje aquí..."
        ></textarea>

        <br />

        <button
          onClick={enviarMensajeLibro}
          className="mt-4 bg-[#FF3471] text-white px-6 py-2 rounded-full hover:bg-[#FEA201]"
        >
          Enviar mensaje
        </button>

        {mensajeEnviado && (
          <p className="mt-4 text-green-600 font-semibold">{mensajeEnviado}</p>
        )}
      </section>
    </div>
  );
}