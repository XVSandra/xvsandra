"use client";

import "@fontsource/great-vibes";
import "@fontsource/quicksand/400.css";
import "@fontsource/quicksand/500.css";
import "@fontsource/quicksand/600.css";
import "@fontsource/quicksand/700.css";
import "aos/dist/aos.css";

import AOS from "aos";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { Howl } from "howler";
import { addDoc, collection } from "firebase/firestore";
import { obtenerInvitado } from "@/lib/firestoreRest";

import { db } from "@/lib/firebase";
import RSVPForm from "@/components/RSVPForm";
import ContadorElegante from "@/components/ContadorElegante";


export default function Page() {
  const [nombreInvitado, setNombreInvitado] = useState("Invitado especial");
const [pasesAsignados, setPasesAsignados] = useState(1);
const [codigoInvitado, setCodigoInvitado] = useState("");
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
  codigo: codigoInvitado || "sin-codigo",
  nombre: nombreInvitado,
  mensaje: mensajeLibro.trim(),
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

  const cargarInvitado = async () => {
    const params = new URLSearchParams(window.location.search);
    const codigoUrl = params.get("codigo");

    if (!codigoUrl) {
      setNombreInvitado("Invitado especial");
      setPasesAsignados(1);
      setCodigoInvitado("");
      return;
    }

    try {
      setCodigoInvitado(codigoUrl);

     const invitado = await obtenerInvitado(codigoUrl);

console.log("Código recibido:", codigoUrl);
console.log("Datos invitado:", invitado);

if (invitado) {
  setNombreInvitado(invitado.nombre);
  setPasesAsignados(invitado.pases);
} else {
  setNombreInvitado("Invitado no encontrado");
  setPasesAsignados(1);
}
    } 



catch (error: any) {
  console.error("Error leyendo invitado:", error);

  setNombreInvitado(
    error?.code
      ? `Error: ${error.code}`
      : "Error al cargar invitado"
  );

  setPasesAsignados(1);
}

  };

  cargarInvitado();

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

  const fotosGaleria = [
    "/images/galeria/foto1.jpg",
    "/images/galeria/foto2.jpg",
    "/images/galeria/foto3.jpg",
    "/images/galeria/foto4.jpg",
    "/images/galeria/foto5.jpg",
    "/images/galeria/foto6.jpg",
  ];

  return (
    <div
      className="relative text-[#4B3561] text-lg md:text-xl font-medium scroll-smooth overflow-hidden min-h-screen bg-gradient-to-b from-[#FFF7EC] via-[#F7E9FF] to-[#FFF7EC]"
      style={{ fontFamily: "'Quicksand', sans-serif" }}
    >
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/images/flores-orilla.png"
          alt="Decoración floral"
          className="w-full h-full object-cover opacity-15"
        />
      </div>

      <Toaster position="top-center" reverseOrder={false} />

      <button
        className="fixed top-4 right-4 bg-[#E8C45C] text-[#4B3561] rounded-full shadow-lg p-3 z-50 hover:bg-[#7B4BA3] hover:text-white transition"
        onClick={toggleMusica}
      >
        {sonando ? "⏸️" : "▶️"}
      </button>

      <section
  className="min-h-screen bg-cover bg-[center_top] justify-between items-center text-white p-6 relative"
  style={{ backgroundImage: "url('/images/portada.jpg')" }}
>
  <div className="absolute inset-0 bg-gradient-to-b from-[#2B1746]/45 via-[#7B4BA3]/20 to-[#2B1746]/65"></div>

        <div className="relative w-full flex flex-col justify-between items-center min-h-screen py-10">
          <div className="text-center mt-10" data-aos="fade-down">
            <h1
              className="text-6xl md:text-8xl font-normal drop-shadow-lg text-[#F8E7A1]"
              style={{ fontFamily: "'Great Vibes', cursive" }}
            >
              Mis XV Años
            </h1>
          </div>
<div className="text-center mb-12" data-aos="fade-up">
  <p className="uppercase tracking-[0.32em] text-base md:text-xl text-[#FFF7EC]/90 mb-4 font-semibold">
    15 de agosto 2026
  </p>

  <h2
    className="text-6xl md:text-9xl drop-shadow-lg text-[#F8E7A1]"
    style={{ fontFamily: "'Great Vibes', cursive" }}
  >
    Sandra Alicia
  </h2>

  <div className="mt-4 w-28 h-1 mx-auto rounded-full bg-[#F8E7A1]"></div>
</div>
        </div>
      </section>

    <section
  className="relative overflow-hidden bg-white/90 shadow-xl rounded-[36px] ring-1 ring-purple-100 my-16 mx-4 md:mx-16 text-center py-16 px-6"
  data-aos="zoom-in"
>
  {/* Decoración suave superior */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-[#B78A25] to-transparent" />

  <div className="max-w-4xl mx-auto">
    <div className="flex justify-center mb-6">
      <img
        src="/images/crown.png"
        alt="Corona decorativa"
        className="w-80 md:w-96 h-auto drop-shadow-md"
      />
    </div>

    <div className="flex items-center justify-center gap-4 mb-8">
      <span className="h-px w-16 md:w-28 bg-[#B78A25]/60" />
      <span className="text-[#B78A25] text-2xl">✦</span>
      <span className="h-px w-16 md:w-28 bg-[#B78A25]/60" />
    </div>

    <p
      className="font-['Great_Vibes'] text-4xl md:text-6xl text-[#7B4BA3] leading-tight max-w-3xl mx-auto"
    >
      Cada farol ilumina un sueño,
      <br />
      cada sueño un nuevo comienzo.
    </p>

    <p className="mt-6 text-lg md:text-2xl text-[#6B5A75] leading-relaxed max-w-3xl mx-auto italic">
      Acompáñame a celebrar la noche en que mi luz brillará más que nunca.
    </p>

    <div className="flex items-center justify-center gap-4 mt-10">
      <span className="h-px w-16 md:w-28 bg-[#B78A25]/60" />
      <span className="text-[#B78A25] text-2xl">✦</span>
      <span className="h-px w-16 md:w-28 bg-[#B78A25]/60" />
    </div>
  </div>
</section>
<section
  className="text-center py-16 px-6 relative z-10"
  data-aos="fade-up"
>
  <div className="max-w-4xl mx-auto rounded-[2rem] bg-white/75 backdrop-blur-md border border-[#E8C45C]/50 shadow-xl px-6 py-12 md:px-12">

    <p
      className="uppercase tracking-[0.35em] text-[#B78A25] text-sm md:text-base font-bold mb-4"
      style={{ fontFamily: "'Quicksand', sans-serif" }}
    >
      Reserva la fecha
    </p>

    <div className="w-24 h-1 bg-[#E8C45C] rounded-full mx-auto mb-6"></div>

    <h2
      className="text-[52px] md:text-[88px] text-[#7B4BA3] leading-none font-bold"
      style={{ fontFamily: "'Quicksand', sans-serif" }}
    >
      15 de agosto
    </h2>

    <p
      className="text-[46px] md:text-[76px] text-[#B78A25] leading-none font-bold mt-2"
      style={{ fontFamily: "'Quicksand', sans-serif" }}
    >
      2026
    </p>

 
    <div className="w-24 h-1 bg-[#E8C45C] rounded-full mx-auto mt-8 mb-10"></div>

   <div className="mb-10">
  <div className="flex items-center justify-center gap-4 mb-5">
    <span className="h-px w-14 md:w-24 bg-[#B78A25]/60" />
    <span className="text-[#B78A25] text-xl">✦</span>
    <span className="h-px w-14 md:w-24 bg-[#B78A25]/60" />
  </div>

  <p
    className="text-4xl md:text-6xl text-[#7B4BA3] leading-tight"
    style={{ fontFamily: "'Great Vibes', cursive" }}
  >
    El mejor viaje comienza cuando te atreves
    <br />
    a dar el primer paso
  </p>
</div>

<ContadorElegante />
  </div>
</section>

      <section className="relative py-20 bg-[#6F3FA0] text-white text-center overflow-hidden z-10">
        <div className="absolute top-0 left-0 w-full z-20 pointer-events-none">
          <svg
            viewBox="0 0 1440 320"
            className="w-full h-[80px]"
            preserveAspectRatio="none"
          >
            <path
              fill="#5A2E82"
              d="M0,64L48,74.7C96,85,192,107,288,122.7C384,139,480,149,576,138.7C672,128,768,96,864,85.3C960,75,1056,85,1152,106.7C1248,128,1344,160,1392,176L1440,192L1440,0L0,0Z"
            />
          </svg>
        </div>

        <div className="py-20 px-6">
          <h2
            className="text-5xl md:text-7xl font-normal text-[#F8E7A1] mb-8"
            style={{ fontFamily: "'Great Vibes', cursive" }}
          >
            Con mucho amor me acompañan
          </h2>

          <div className="max-w-2xl mx-auto text-xl md:text-2xl space-y-12">
            <div data-aos="fade-up" data-aos-delay="100">
              <p className="font-semibold text-[#F8E7A1] mb-2">Mis Padres:</p>
              <div className="w-40 h-0.5 bg-[#F8E7A1] mx-auto my-4 rounded-full"></div>
              <p>Sandra Angelina Ruiz Paredes</p>
              <p>Adrián Valenzuela Barajas</p>
            </div>

            <div data-aos="fade-up" data-aos-delay="200" className="mt-8">
              <p className="font-semibold text-[#F8E7A1] mb-2">Mis Padrinos:</p>
              <div className="w-40 h-0.5 bg-[#F8E7A1] mx-auto my-4 rounded-full"></div>
              <p>Rocio Ruiz Paredes</p>
              <p>Rogelio Ruiz Paredes</p>
            </div>

           <div data-aos="fade-up" data-aos-delay="300" className="mt-10">
  <p
    className="text-4xl md:text-6xl text-[#F8E7A1] max-w-4xl mx-auto leading-tight"
    style={{ fontFamily: "'Great Vibes', cursive" }}
  >
    ¡Acompáñame tú también a celebrar este momento tan especial
    <br />
    lleno de amor, alegría y sueños cumplidos!
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
              fill="#5A2E82"
              d="M0,64L48,74.7C96,85,192,107,288,122.7C384,139,480,149,576,138.7C672,128,768,96,864,85.3C960,75,1056,85,1152,106.7C1248,128,1344,160,1392,176L1440,192L1440,0L0,0Z"
            />
          </svg>
        </div>
      </section>

      <section className="py-20 px-6 text-center relative z-10" data-aos="fade-up">
        <h2
          className="text-5xl md:text-7xl font-normal text-[#7B4BA3] mb-8"
          style={{ fontFamily: "'Great Vibes', cursive" }}
        >
          Detalles del Evento
        </h2>

        <div className="max-w-3xl mx-auto space-y-10 text-xl md:text-2xl">
          <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="100">
            <img src="/iconos/ubicacion.png" alt="Ubicación" className="w-10 h-10 mb-4" />
            <p className="font-semibold text-[#B78A25]">Salón Palladium</p>
            <p>Blvd. Lázaro Cárdenas 1085, Las Flores, 21330 Mexicali, B.C.</p>
          </div>

          <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="200">
            <img
              src="/images/jardin-miniatura.jpg"
              alt="Palladium"
              className="rounded-lg shadow-lg w-72 h-auto object-cover"
            />
            <a
              href="https://maps.app.goo.gl/4cgn53V6EUYMUF6E9"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block bg-[#7B4BA3] text-white px-8 py-3 rounded-full shadow hover:bg-[#E8C45C] hover:text-[#4B3561] transition text-lg md:text-xl font-semibold"
            >
              Ver ubicación en Google Maps
            </a>
          </div>

          <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="300">
            <img src="/iconos/vestimenta.png" alt="Código de vestimenta" className="w-10 h-10 mb-4" />
            <p className="font-semibold text-[#B78A25]">Código de vestimenta:</p>
            <p>Formal</p>
          </div>

          <div className="flex flex-col items-center" data-aos="fade-up" data-aos-delay="400">
            <img src="/iconos/obsequio.png" alt="Obsequios" className="w-10 h-10 mb-4" />
            <p className="font-semibold text-[#B78A25]">Obsequios:</p>
            <p>Tu presencia es mi mejor regalo, pero si deseas obsequiarme algo, tendremos lluvia de sobres.</p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 text-center relative z-10" data-aos="fade-up">
        <h2
          className="text-5xl md:text-6xl font-normal text-[#7B4BA3] mb-10"
          style={{ fontFamily: "'Great Vibes', cursive" }}
        >
          Itinerario
        </h2>

        <div className="relative w-3/4 md:w-1/2 mx-auto">
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full border-l-2 border-[#C7A4E0]"></div>

          <div className="flex flex-col space-y-10">
            <div className="flex items-center">
              <div className="w-1/2 text-right pr-4 text-xl md:text-2xl font-semibold">7:00 PM</div>
              <div className="w-1/2 text-left pl-4 text-xl md:text-2xl">Recepción</div>
            </div>

            <div className="flex items-center">
              <div className="w-1/2 text-right pr-4 text-xl md:text-2xl font-semibold">7:45 PM</div>
              <div className="w-1/2 text-left pl-4 text-xl md:text-2xl">Vals</div>
            </div>

            <div className="flex items-center">
              <div className="w-1/2 text-right pr-4 text-xl md:text-2xl font-semibold">8:15 PM</div>
              <div className="w-1/2 text-left pl-4 text-xl md:text-2xl">Brindis</div>
            </div>

            <div className="flex items-center">
              <div className="w-1/2 text-right pr-4 text-xl md:text-2xl font-semibold">8:30 PM</div>
              <div className="w-1/2 text-left pl-4 text-xl md:text-2xl">Cena</div>
            </div>

            <div className="flex items-center">
              <div className="w-1/2 text-right pr-4 text-xl md:text-2xl font-semibold">9:00 PM</div>
              <div className="w-1/2 text-left pl-4 text-xl md:text-2xl">Fotos</div>
            </div>

            <div className="flex items-center">
              <div className="w-1/2 text-right pr-4 text-xl md:text-2xl font-semibold">Fiesta</div>
              <div className="w-1/2 text-left pl-4 text-xl md:text-2xl">¡A bailar y disfrutar!</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 text-center relative z-10" data-aos="fade-up">
        <div className="max-w-6xl mx-auto">
          <p className="uppercase tracking-[0.32em] text-[#B78A25] text-sm md:text-base font-bold mb-3">
            Recuerdos especiales
          </p>

          <h2
            className="text-5xl md:text-7xl font-normal text-[#7B4BA3] mb-4"
            style={{ fontFamily: "'Great Vibes', cursive" }}
          >
            Galería
          </h2>

          <p className="max-w-2xl mx-auto text-xl md:text-2xl text-[#4B3561] mb-10">
            Hace quince años comenzó mi cuento. Hoy, con el corazón lleno de sueños e ilusión, te invito a compartir el capítulo más especial de mi historia.
          </p>

          <div className="relative rounded-[2rem] bg-white/70 backdrop-blur-md border border-[#E8C45C]/50 shadow-xl px-4 py-6 md:px-6 overflow-hidden">
            <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-5">
              {fotosGaleria.map((foto, index) => (
                <div
                  key={foto}
                  className="shrink-0 w-[82%] sm:w-[48%] md:w-[32%] lg:w-[24%] snap-center"
                >
                  <div className="rounded-[1.5rem] overflow-hidden border-4 border-[#F8E7A1] shadow-lg bg-[#FFF7EC]">
                    <img
                      src={foto}
                      alt={`Foto de Sandra Alicia ${index + 1}`}
                      className="w-full aspect-[3/4] object-cover hover:scale-105 transition duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-base md:text-lg text-[#7B4BA3] font-semibold mt-2">
              Desliza para ver más fotos
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 text-center bg-[#FFF7EC]/90 relative z-10" data-aos="fade-up">
        <div className="flex flex-col items-center space-y-6">
          <img src="/iconos/camara.png" alt="Comparte tus fotos" className="w-16 h-16" />

          <h2 className="text-4xl md:text-5xl font-bold text-[#7B4BA3] animate-heartbeat">
            #XVSandraAlicia
          </h2>

          <p className="max-w-2xl text-xl md:text-2xl text-[#4B3561]">
            Comparte con nosotros tus fotos del evento usando el hashtag{" "}
            <span className="font-semibold text-[#B78A25]">#XVSandraAlicia</span>.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 text-center relative z-10" data-aos="zoom-in-up">
        <h2
          className="text-5xl md:text-6xl font-normal text-[#7B4BA3] mb-4"
          style={{ fontFamily: "'Great Vibes', cursive" }}
        >
          ¿Podrás acompañarme en este día tan especial?
        </h2>
      </section>

      <section className="py-16 relative z-10" data-aos="fade-up">
     
<RSVPForm
  nombreInvitado={nombreInvitado}
  pasesAsignados={pasesAsignados}
  codigoInvitado={codigoInvitado}
/>
      </section>

      <section className="py-16 text-center relative z-10" data-aos="fade-up">
        <h2
          className="text-5xl md:text-6xl font-normal text-[#7B4BA3] mb-4"
          style={{ fontFamily: "'Great Vibes', cursive" }}
        >
          Libro de visitas
        </h2>

        <p className="mb-4 text-xl md:text-2xl">Déjame un mensajito bonito 🥰</p>

        <textarea
          value={mensajeLibro}
          onChange={(e) => setMensajeLibro(e.target.value)}
          className="w-3/4 md:w-1/2 h-36 p-5 rounded-2xl border-2 border-[#C7A4E0] bg-white/90 text-lg md:text-xl focus:outline-none focus:ring-2 focus:ring-[#E8C45C]"
          placeholder="Escribe tu mensaje aquí..."
        ></textarea>

        <br />

        <button
          onClick={enviarMensajeLibro}
          className="mt-4 bg-[#7B4BA3] text-white px-8 py-3 rounded-full hover:bg-[#E8C45C] hover:text-[#4B3561] transition text-lg md:text-xl font-semibold"
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