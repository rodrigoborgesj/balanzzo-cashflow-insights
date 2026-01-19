import karuanaLogo from "@/assets/clients/karuana.jpeg";
import podoSaudeLogo from "@/assets/clients/podo-saude.jpeg";
import clinicaAlaniaLogo from "@/assets/clients/clinica-alania-vargas.jpeg";
import b5AutomotivaLogo from "@/assets/clients/b5-automotiva.jpeg";
import dinnyEstevezLogo from "@/assets/clients/dinny-estevez.jpeg";

const clients = [
  { name: "Karuana Serviços Ambientais", logo: karuanaLogo },
  { name: "Podo Saúde", logo: podoSaudeLogo },
  { name: "Clínica Alânia Vargas", logo: clinicaAlaniaLogo },
  { name: "B5 Estética Automotiva", logo: b5AutomotivaLogo },
  { name: "Dinny Estevez", logo: dinnyEstevezLogo },
];

export function ClientLogosCarousel() {
  // Duplicate the clients array for seamless infinite scroll
  const duplicatedClients = [...clients, ...clients];

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-brand-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <p className="text-sm sm:text-base md:text-lg text-brand-dark-green/60 font-medium">
            Empresas que confiam na Balanzzo
          </p>
        </div>

        {/* Infinite Scroll Container */}
        <div className="relative">
          {/* Gradient overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-brand-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 bg-gradient-to-l from-brand-white to-transparent z-10 pointer-events-none" />

          {/* Scrolling logos */}
          <div className="flex animate-scroll">
            {duplicatedClients.map((client, index) => (
              <div
                key={`${client.name}-${index}`}
                className="flex-shrink-0 mx-6 sm:mx-8 md:mx-12"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full overflow-hidden grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100">
                  <img
                    src={client.logo}
                    alt={client.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
