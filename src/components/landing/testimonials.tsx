import { Check, Star } from "lucide-react";

export function Testimonials() {
  return (
    <section id="section-testimonials" className="py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-gradient-to-tr from-em-purple-300 to-em-yellow-400 rounded-[2rem] rotate-3 opacity-20 blur-2xl" />
            <img
              src="https://nivbeqiuhotuxbmcvuxt.supabase.co/storage/v1/object/public/project-images/10ae444c-eb2d-49cc-b7cb-99d5ff759dd0/3371a2a2-9129-48ec-91b3-9b707cf37942.webp"
              alt="Mindful Design"
              className="relative rounded-[2rem] shadow-2xl w-full object-cover h-[600px] grayscale hover:grayscale-0 transition-all duration-1000"
            />

            {/* Floating Quote */}
            <div className="absolute -bottom-10 -right-10 bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl max-w-xs border border-white hidden md:block">
              <div className="flex text-em-yellow-400 mb-4 text-[10px] gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </div>
              <p className="text-teal-900 font-serif italic text-xl leading-relaxed">
                &ldquo;It feels like having a wise friend in my pocket who
                actually listens.&rdquo;
              </p>
            </div>
          </div>

          <div className="space-y-12 order-1 lg:order-2">
            <h2 className="font-serif text-5xl md:text-6xl text-navy font-medium leading-tight">
              Why early adopters love Entiremind
            </h2>

            <div className="space-y-10">
              {[
                {
                  title: "Zero Friction",
                  description:
                    "No login screens, no loading spinners. Just SMS.",
                },
                {
                  title: "Emotional Buy-in",
                  description:
                    "The act of typing your intention creates a contract with yourself.",
                },
                {
                  title: "Founder Led",
                  description:
                    "Early signals are reviewed by humans to ensure the system evolves correctly.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-6 items-start group">
                  <div className="w-12 h-12 rounded-full border border-teal-900/10 flex items-center justify-center text-teal-900 flex-shrink-0 mt-1 group-hover:bg-teal-900 group-hover:text-cream transition-colors duration-300">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-2xl text-navy mb-2 font-medium">
                      {item.title}
                    </h4>
                    <p className="text-teal-900/70 font-sans font-light leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
