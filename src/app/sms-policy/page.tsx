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
          <p className="text-teal-900/60 mb-12">Last updated: February 24, 2026</p>

          <div className="prose prose-teal max-w-none space-y-8 text-teal-900/80">
            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Program Description
              </h2>
              <p className="leading-relaxed">
                Entiremind is an SMS-based manifestation and reflection service.
                After opting in, you will receive recurring automated personalized
                manifestation and reflection messages designed to help you align
                your intentions and take action toward your goals.
              </p>
            </section>

            <section className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                SMS Program Terms
              </h2>
              <p className="leading-relaxed mb-6">
                By opting into Entiremind&apos;s SMS service, you agree to
                receive recurring automated personalized manifestation and
                reflection SMS messages from Entiremind.
              </p>

              <ul className="list-disc pl-6 space-y-4">
                <li>
                  <strong>Message Frequency:</strong> Up to 2 messages per day.
                  Actual frequency varies based on your engagement.
                </li>
                <li>
                  <strong>Opt-Out:</strong> Text <strong>STOP</strong> at any
                  time to cancel. After opting out, you will receive one final
                  confirmation message and no further messages will be sent.
                </li>
                <li>
                  <strong>Help:</strong> Text <strong>HELP</strong> for
                  assistance or email{" "}
                  <a
                    href="mailto:support@entiremind.com"
                    className="underline hover:opacity-80"
                  >
                    support@entiremind.com
                  </a>
                  .
                </li>
                <li>
                  <strong>Message and data rates may apply.</strong> Check with
                  your mobile carrier for details.
                </li>
                <li>
                  Consent to receive SMS messages is not required as a condition
                  of purchase.
                </li>
                <li>
                  <strong>
                    Mobile opt-in information and phone numbers will not be
                    shared with, sold, or rented to third parties or affiliates
                    for marketing or promotional purposes.
                  </strong>
                </li>
                <li>
                  Carriers are not liable for delayed or undelivered messages.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                How to Opt In
              </h2>
              <p className="leading-relaxed">
                You opt in to receive SMS messages from Entiremind by submitting
                your phone number and checking the SMS consent checkbox on our
                sign-up form at{" "}
                <a
                  href="https://www.entiremind.com"
                  className="underline hover:opacity-80"
                >
                  entiremind.com
                </a>
                . By checking that box, you expressly consent to receive the
                messages described above.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Contact Us
              </h2>
              <p className="leading-relaxed">
                If you have questions about our SMS program, contact us at:
              </p>
              <div className="mt-4 leading-relaxed">
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:support@entiremind.com"
                    className="underline hover:opacity-80"
                  >
                    support@entiremind.com
                  </a>
                </p>
                <p className="mt-2">
                  <strong>Address:</strong> Entiremind, 819 Pacific Avenue,
                  Alameda, California 94501, United States
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
