import type { Metadata } from "next";
import Link from "next/link";
import { Hero, type HeroLayout } from "@/components/landing/hero";
import { SignupVariantProvider } from "@/components/landing/signup-variant";
import type { SignupVariant } from "@/components/landing/signup-variant-config";

// Internal: the three hero variants stacked, to flip through on a phone.
// Heroes only; each links to its full page. Unlisted and kept out of search
// results (unlike /preview/*, it is served on deployed previews too).
export const metadata: Metadata = {
  title: "Hero variants | Entiremind",
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
};

const VARIANTS: {
  key: string;
  label: string;
  note: string;
  href: string;
  variant: SignupVariant;
  layout: HeroLayout;
}[] = [
  {
    key: "a",
    label: "A · On-page form",
    note: "Name and email right in the hero.",
    href: "/lp/form",
    variant: "form",
    layout: "copy-first",
  },
  {
    key: "b",
    label: "B · Pop-up",
    note: "The button opens the name and email pop-up.",
    href: "/lp/modal",
    variant: "modal",
    layout: "copy-first",
  },
  {
    key: "c",
    label: "C · Phone-first",
    note: "Same as A, but on phones the scene comes before the subhead (desktop matches A).",
    href: "/lp/phone-first",
    variant: "form",
    layout: "phone-first",
  },
];

export default function HeroComparePage() {
  return (
    <main className="bg-linen text-ink font-sans min-h-screen overflow-x-hidden">
      {VARIANTS.map((v) => (
        <section key={v.key} className="border-b-4 border-cobalt">
          <div className="sticky top-0 z-40 bg-cobalt text-linen px-6 py-3">
            <p className="font-sans text-base font-medium">
              {v.label}{" "}
              <Link
                href={v.href}
                className="underline underline-offset-2 text-sm font-normal"
              >
                Open full page
              </Link>
            </p>
            <p className="text-sm text-linen/85">{v.note}</p>
          </div>
          <SignupVariantProvider variant={v.variant}>
            <Hero layout={v.layout} anchorId={`join-${v.key}`} />
          </SignupVariantProvider>
        </section>
      ))}
    </main>
  );
}
