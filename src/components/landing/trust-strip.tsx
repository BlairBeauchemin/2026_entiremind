import {
  Zap,
  Shield,
  Brain,
} from "lucide-react";

export function TrustStrip() {
  return (
    <section className="py-12 border-y border-teal-900/5 bg-white/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
        <div className="flex items-center gap-2 text-teal-900 font-serif text-xl italic">
          <span className="text-xl font-bold">S</span> Stripe
        </div>
        <div className="flex items-center gap-2 text-teal-900 font-serif text-xl italic">
          <span className="text-xl font-bold">T</span> Twilio
        </div>
        <div className="flex items-center gap-2 text-teal-900 font-serif text-xl italic">
          <Shield className="w-5 h-5" /> Secure
        </div>
        <div className="flex items-center gap-2 text-teal-900 font-serif text-xl italic">
          <Zap className="w-5 h-5" /> Instant
        </div>
        <div className="flex items-center gap-2 text-teal-900 font-serif text-xl italic">
          <Brain className="w-5 h-5" /> OpenAI
        </div>
      </div>
    </section>
  );
}
