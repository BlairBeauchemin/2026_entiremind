import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";

export const metadata = {
  title: "SMS Messaging Policy | Entiremind",
  description:
    "SMS Messaging Policy for Entiremind - Learn about our SMS messaging practices and your rights.",
};

export default function SmsMessagingPolicyPage() {
  return (
    <div className="bg-cream text-teal-900 font-sans min-h-screen relative overflow-x-hidden selection:bg-em-purple-300/30 selection:text-teal-900">
      {/* Background Grain Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      {/* Ambient Background Gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-em-purple-300/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-em-yellow-400/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <Navigation />

      <main className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl md:text-5xl text-navy font-medium mb-4">
            SMS Messaging Policy
          </h1>
          <p className="text-teal-900/60 mb-12">Last updated: February 10, 2026</p>

          <div className="prose prose-teal max-w-none space-y-8 text-teal-900/80">
            <section className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
              <p className="leading-relaxed mb-6">
                By opting into Entiremind&apos;s SMS service, you agree to
                receive recurring automated marketing and personalized
                manifestation messages.
              </p>

              <ul className="list-disc pl-6 space-y-4">
                <li>
                  <strong>Message Frequency:</strong> Up to 14 messages per
                  week.
                </li>
                <li>
                  <strong>Opt-Out:</strong> Text <strong>STOP</strong> at any
                  time to cancel. After opting out, you will receive one final
                  confirmation message.
                </li>
                <li>
                  <strong>Help:</strong> Text <strong>HELP</strong> for
                  assistance or email support@entiremind.com.
                </li>
                <li>Message and data rates may apply.</li>
                <li>
                  Consent to receive SMS messages is not required as a condition
                  of purchase.
                </li>
                <li>We do not sell your phone number or personal information.</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
