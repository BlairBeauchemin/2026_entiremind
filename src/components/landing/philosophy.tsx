import { Zap, MessageCircle, Sparkles } from "lucide-react";

export function Philosophy() {
  return (
    <section id="section-philosophy" className="py-32 relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
        <h2 className="font-serif text-section text-ink">
          The Philosophy of Less
        </h2>
        <p className="text-xl text-ink leading-relaxed font-light font-sans">
          Most apps demand your attention. Entiremind respects it. We believe
          that the most powerful tools are the ones that get out of your way.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-24 grid md:grid-cols-3 gap-10">
        {/* Card 1 */}
        <div className="group p-10 rounded-sm bg-surface border border-rule hover:border-cobalt transition-all duration-500">
          <div className="w-12 h-12 rounded-full border border-rule flex items-center justify-center text-lg mb-8 text-ink group-hover:scale-110 transition-transform duration-500">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-3xl text-ink mb-4">
            It Remembers You
          </h3>
          <p className="text-muted leading-relaxed font-sans font-light">
            Every reply teaches it a little more about what you&apos;re calling
            in. Affirmation apps talk at you — Entiremind listens back.
          </p>
        </div>

        {/* Card 2 */}
        <div className="group p-10 rounded-sm bg-surface border border-rule hover:border-cobalt transition-all duration-500">
          <div className="w-12 h-12 rounded-full border border-rule flex items-center justify-center text-lg mb-8 text-ink group-hover:scale-110 transition-transform duration-500">
            <MessageCircle className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-3xl text-ink mb-4">
            No Guilt, No Nagging
          </h3>
          <p className="text-muted leading-relaxed font-sans font-light">
            Quiet days are honored, not punished. If you don&apos;t reply, it
            softens and adapts to your rhythm — never the other way around.
          </p>
        </div>

        {/* Card 3 */}
        <div className="group p-10 rounded-sm bg-surface border border-rule hover:border-cobalt transition-all duration-500">
          <div className="w-12 h-12 rounded-full border border-rule flex items-center justify-center text-lg mb-8 text-ink group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-3xl text-ink mb-4">Lightly Magical</h3>
          <p className="text-muted leading-relaxed font-sans font-light">
            Calm, inspiring, and intuitive. No charts, no streaks, no
            productivity theater. Just intention, reflection, and a little
            wonder in your day.
          </p>
        </div>
      </div>
    </section>
  );
}
