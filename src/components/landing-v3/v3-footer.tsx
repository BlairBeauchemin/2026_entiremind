import Link from "next/link";

/**
 * Privacy / Terms / SMS Policy are not optional here. The v2 footer omits all
 * three, which is a defect rather than a style choice on a page that leads to
 * an SMS product.
 */
const LINKS = [
  { href: "#section-how-it-works", label: "How it works" },
  { href: "#section-approach", label: "Our approach" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/sms-policy", label: "SMS Policy" },
];

export function V3Footer() {
  return (
    <footer className="relative z-10 border-t border-rule py-16">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <Link
            href="/v3"
            className="font-serif text-2xl tracking-[2px] text-ink"
          >
            Entiremind
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-sans text-sm text-muted">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-cobalt"
              >
                {link.label}
              </a>
            ))}
          </div>

          <p className="font-sans text-xs text-muted">
            &copy; {new Date().getFullYear()} Entiremind. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
