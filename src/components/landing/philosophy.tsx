import { Zap, MessageCircle, Sparkles } from "lucide-react";

export function Philosophy() {
  return (
    <section id="section-philosophy" className="py-32 relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
        <h2 className="font-serif text-5xl md:text-6xl text-navy font-medium">
          The Philosophy of Less
        </h2>
        <p className="text-xl text-teal-900 leading-relaxed font-light font-sans">
          Most apps demand your attention. Entiremind respects it. We believe
          that the most powerful tools are the ones that get out of your way.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-24 grid md:grid-cols-3 gap-10">
        {/* Card 1 */}
        <div className="group p-10 rounded-[2rem] bg-white/40 border border-white/60 backdrop-blur-sm hover:bg-white/60 transition-all duration-500">
          <div className="w-12 h-12 rounded-full border border-teal-900/10 flex items-center justify-center text-lg mb-8 text-teal-900 group-hover:scale-110 transition-transform duration-500">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-3xl text-navy mb-4 font-medium">
            Velocity of Learning
          </h3>
          <p className="text-teal-900/70 leading-relaxed font-sans font-light">
            The system operates as a real-time behavioral loop. Your actions
            teach the system, and the system guides your next action.
          </p>
        </div>

        {/* Card 2 */}
        <div className="group p-10 rounded-[2rem] bg-white/40 border border-white/60 backdrop-blur-sm hover:bg-white/60 transition-all duration-500">
          <div className="w-12 h-12 rounded-full border border-teal-900/10 flex items-center justify-center text-lg mb-8 text-teal-900 group-hover:scale-110 transition-transform duration-500">
            <MessageCircle className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-3xl text-navy mb-4 font-medium">
            Silence is a Signal
          </h3>
          <p className="text-teal-900/70 leading-relaxed font-sans font-light">
            We don&apos;t nag. If you don&apos;t reply, we record the silence as
            data. The system adapts to your rhythm, not the other way around.
          </p>
        </div>

        {/* Card 3 */}
        <div className="group p-10 rounded-[2rem] bg-white/40 border border-white/60 backdrop-blur-sm hover:bg-white/60 transition-all duration-500">
          <div className="w-12 h-12 rounded-full border border-teal-900/10 flex items-center justify-center text-lg mb-8 text-teal-900 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-3xl text-navy mb-4 font-medium">
            Lightly Magical
          </h3>
          <p className="text-teal-900/70 leading-relaxed font-sans font-light">
            Calm, inspiring, and intuitive. No charts, no streaks, no
            productivity theater. Just pure intention and reflection.
          </p>
        </div>
      </div>
    </section>
  );
}
