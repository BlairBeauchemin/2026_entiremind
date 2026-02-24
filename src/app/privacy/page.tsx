import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";

export const metadata = {
  title: "Privacy Policy | Entiremind",
  description:
    "Privacy Policy for Entiremind - Learn how we protect your data and handle your information.",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-teal-900/60 mb-12">
            Last updated: February 24, 2026
          </p>

          <div className="prose prose-teal max-w-none space-y-8 text-teal-900/80">
            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Introduction
              </h2>
              <p className="leading-relaxed">
                Entiremind (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;)
                is committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our SMS-based manifestation service.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Information We Collect
              </h2>
              <p className="leading-relaxed mb-4">
                We collect information that you provide directly to us,
                including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Contact Information:</strong> Email address and mobile
                  phone number
                </li>
                <li>
                  <strong>Profile Information:</strong> Name and timezone
                  preferences
                </li>
                <li>
                  <strong>Intention Statements:</strong> The goals and
                  manifestations you share with us
                </li>
                <li>
                  <strong>Message Data:</strong> SMS messages you send and
                  receive through our service
                </li>
                <li>
                  <strong>Behavioral Signals:</strong> Response patterns,
                  engagement timing, and interaction data
                </li>
                <li>
                  <strong>Payment Information:</strong> Subscription and billing
                  data (processed securely by Stripe)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                How We Use Your Information
              </h2>
              <p className="leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and personalize our SMS manifestation service</li>
                <li>Send you reflection prompts and supportive messages</li>
                <li>Learn from your engagement to improve our messaging</li>
                <li>Process your subscription payments</li>
                <li>Communicate with you about your account</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                SMS/Mobile Messaging Privacy
              </h2>
              <p className="leading-relaxed mb-4">
                Your mobile phone number is used solely to provide our SMS
                messaging service. We want you to know:
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <strong>
                    No mobile information will be shared with third
                    parties/affiliates for marketing/promotional purposes. All
                    categories of personal data exclude text messaging originator
                    opt-in data and consent; this information will not be shared
                    with any third parties.
                  </strong>
                </li>
                <li>
                  <strong>Message Frequency:</strong> You may receive up to 2
                  messages per day as part of our reflection loop service. The
                  actual frequency depends on your engagement and preferences.
                </li>
                <li>
                  <strong>Message and data rates may apply.</strong> Your
                  carrier&apos;s standard messaging rates will apply to messages
                  you send and receive.
                </li>
                <li>
                  <strong>Opt-Out:</strong> You can stop receiving messages at
                  any time by texting <strong>STOP</strong> to our number.
                </li>
                <li>
                  <strong>Help:</strong> Text <strong>HELP</strong> for
                  assistance with our messaging service.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Data Sharing
              </h2>
              <p className="leading-relaxed mb-4">
                We may share your information only in the following
                circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Service Providers:</strong> With trusted partners who
                  help us operate our service (SMS delivery, payment
                  processing), bound by confidentiality agreements
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or
                  to protect our rights
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a
                  merger, acquisition, or sale of assets
                </li>
              </ul>
              <p className="leading-relaxed mt-4">
                We never sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Data Retention
              </h2>
              <p className="leading-relaxed">
                We retain your information for as long as your account is active
                or as needed to provide you services. If you cancel your
                subscription, we will retain your data for a reasonable period
                to comply with legal obligations and resolve disputes. You may
                request deletion of your data at any time by contacting us.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Data Security
              </h2>
              <p className="leading-relaxed">
                We implement appropriate technical and organizational measures
                to protect your personal information. However, no method of
                transmission over the Internet or electronic storage is
                completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Your Rights
              </h2>
              <p className="leading-relaxed mb-4">
                Depending on your location, you may have certain rights
                regarding your personal information, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access to your personal data</li>
                <li>Correction of inaccurate data</li>
                <li>Deletion of your data</li>
                <li>Data portability</li>
                <li>Opting out of marketing communications</li>
              </ul>
              <p className="leading-relaxed mt-4">
                To exercise any of these rights, please contact us using the
                information below.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Children&apos;s Privacy
              </h2>
              <p className="leading-relaxed">
                Our service is not intended for individuals under the age of 18.
                We do not knowingly collect personal information from children.
                If you believe we have collected information from a child,
                please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Changes to This Policy
              </h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by posting the new Privacy
                Policy on this page and updating the &quot;Last updated&quot;
                date.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl text-navy font-medium mb-4">
                Contact Us
              </h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy or our data
                practices, please contact us at:
              </p>
              <div className="leading-relaxed mt-4">
                <p>
                  <strong>Email:</strong> privacy@entiremind.com
                </p>
                <p className="mt-2 font-medium">Entiremind</p>
                <p>819 Pacific Avenue</p>
                <p>Alameda, California 94501</p>
                <p>United States</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
