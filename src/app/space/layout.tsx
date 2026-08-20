import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Space",
  description: "A quiet place to sit with what you're manifesting.",
  robots: { index: false, follow: false },
};

/**
 * Full-bleed shell for The Space.
 *
 * A sibling of /dashboard rather than a child, so none of the dashboard chrome
 * (sidebar, cream ground, max-width column) reaches it. `100dvh` rather than
 * `100vh` because mobile browser chrome collapses on scroll and `vh` would
 * leave the sky clipped behind it.
 */
export default function SpaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden overscroll-none bg-[#05080f] text-cream"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {children}
    </div>
  );
}
