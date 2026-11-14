import type { Metadata } from "next";
import { BottomCTA } from "@/components/landing/bottom-cta";
import { SignupVariantProvider } from "@/components/landing/signup-variant";

// Internal: the blue band's form with its two button options, stacked to
// compare. Unlisted and kept out of search results.
export const metadata: Metadata = {
  title: "Bottom form options | Entiremind",
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
};

const OPTIONS = [
  { key: "linen", label: "A · Linen button (live style)", button: "default" },
  { key: "gold", label: "B · Gold button", button: "gold" },
] as const;

export default function BottomCtaOptionsPage() {
  return (
    <main className="bg-linen text-ink font-sans min-h-screen">
      <SignupVariantProvider variant="form">
        {OPTIONS.map((o) => (
          <section key={o.key}>
            <div className="bg-ink text-linen px-6 py-3">
              <p className="font-sans text-base font-medium">{o.label}</p>
            </div>
            <BottomCTA button={o.button} />
          </section>
        ))}
      </SignupVariantProvider>
    </main>
  );
}
