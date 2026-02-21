import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";

export const metadata = {
  title: "Terms of Service | Entiremind",
  description:
    "Terms of Service for Entiremind - Understand your rights and responsibilities when using our service.",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-teal-900/60 mb-12">
            Last updated: February 10, 2026
          </p>

          <div className="prose prose-teal max-w-none space-y-8 text-teal-900/80">
            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Acceptance of Terms
              </h2>
              <p className="leading-relaxed">
                By accessing or using Entiremind&apos;s services, including our
                website and SMS messaging service, you agree to be bound by
                these Terms of Service. If you do not agree to these terms,
                please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Description of Service
              </h2>
              <p className="leading-relaxed">
                Entiremind is an SMS-based manifestation and reflection service
                designed to help you align your thoughts, intentions, and
                actions toward your goals. Our service sends you periodic
                prompts and messages to support your manifestation practice and
                records your responses to personalize your experience.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                User Accounts
              </h2>
              <p className="leading-relaxed mb-4">
                To use our service, you must create an account and provide
                accurate information. You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the confidentiality of your account</li>
                <li>All activities that occur under your account</li>
                <li>
                  Notifying us immediately of any unauthorized use of your
                  account
                </li>
                <li>Providing accurate and current contact information</li>
              </ul>
            </section>

            <section className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                SMS Messaging Terms
              </h2>
              <p className="leading-relaxed mb-4">
                By providing your mobile phone number and opting into our
                service, you consent to receive SMS messages from Entiremind.
                Please read these terms carefully:
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <strong>Consent:</strong> You expressly consent to receive
                  recurring automated SMS messages at the phone number you
                  provide.
                </li>
                <li>
                  <strong>Message Frequency:</strong> You may receive up to 14
                  messages per week. Frequency varies based on your engagement
                  and preferences.
                </li>
                <li>
                  <strong>Opt-Out:</strong> You can cancel SMS messages at any
                  time by texting <strong>STOP</strong> to our number. After
                  opting out, you will receive a confirmation message.
                </li>
                <li>
                  <strong>Help:</strong> Text <strong>HELP</strong> for customer
                  support information.
                </li>
                <li>
                  <strong>Message and data rates may apply.</strong> Check with
                  your mobile carrier for details about your messaging plan.
                </li>
                <li>
                  <strong>Carrier Liability:</strong> Carriers are not liable
                  for delayed or undelivered messages.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Subscription and Payment
              </h2>
              <p className="leading-relaxed mb-4">
                Entiremind offers subscription-based services. By subscribing,
                you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pay the applicable subscription fees</li>
                <li>
                  Authorize us to charge your payment method on a recurring
                  basis
                </li>
                <li>
                  Provide accurate billing information and keep it up to date
                </li>
              </ul>
              <p className="leading-relaxed mt-4">
                You may cancel your subscription at any time through your
                account dashboard or by contacting us. Cancellation will take
                effect at the end of your current billing period.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                User Conduct
              </h2>
              <p className="leading-relaxed mb-4">
                You agree not to use our service to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>
                  Send abusive, harassing, or threatening messages to our team
                </li>
                <li>Impersonate any person or entity</li>
                <li>
                  Interfere with or disrupt the service or servers connected to
                  the service
                </li>
                <li>
                  Attempt to gain unauthorized access to any part of the service
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Intellectual Property
              </h2>
              <p className="leading-relaxed">
                All content, features, and functionality of the Entiremind
                service, including but not limited to text, graphics, logos, and
                software, are the exclusive property of Entiremind and are
                protected by intellectual property laws. You may not copy,
                modify, distribute, or create derivative works without our
                express written permission.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Your Content
              </h2>
              <p className="leading-relaxed">
                When you submit intentions, reflections, or messages through our
                service, you retain ownership of your content. However, you
                grant us a license to use, store, and process your content to
                provide and improve our services. We may use anonymized and
                aggregated data for research and service improvement.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Disclaimers
              </h2>
              <p className="leading-relaxed mb-4">
                <strong>No Medical or Professional Advice:</strong> Entiremind
                is not a substitute for professional medical, psychological, or
                financial advice. Our service is for personal development and
                reflection purposes only.
              </p>
              <p className="leading-relaxed">
                <strong>Service Availability:</strong> We provide our service
                &quot;as is&quot; and &quot;as available.&quot; We do not
                guarantee uninterrupted access or that the service will meet
                your specific expectations or goals.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Limitation of Liability
              </h2>
              <p className="leading-relaxed">
                To the maximum extent permitted by law, Entiremind and its
                officers, directors, employees, and agents shall not be liable
                for any indirect, incidental, special, consequential, or
                punitive damages arising from your use of the service, including
                but not limited to loss of data, profits, or goodwill.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Indemnification
              </h2>
              <p className="leading-relaxed">
                You agree to indemnify and hold harmless Entiremind and its
                affiliates from any claims, damages, losses, or expenses arising
                from your use of the service or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Termination
              </h2>
              <p className="leading-relaxed">
                We reserve the right to suspend or terminate your access to the
                service at any time, with or without cause, with or without
                notice. Upon termination, your right to use the service will
                immediately cease.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Changes to Terms
              </h2>
              <p className="leading-relaxed">
                We may modify these Terms of Service at any time. We will notify
                you of material changes by posting the updated terms on our
                website. Your continued use of the service after such changes
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Governing Law
              </h2>
              <p className="leading-relaxed">
                These Terms of Service shall be governed by and construed in
                accordance with the laws of the United States, without regard to
                conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Contact Us
              </h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms of Service, please
                contact us at:
              </p>
              <p className="leading-relaxed mt-4">
                <strong>Email:</strong> privacy@entiremind.com
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
