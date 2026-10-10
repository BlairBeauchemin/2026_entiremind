import type { HeroPhoneContent } from "./hero-phone";

/**
 * Seed of Life: seven equal circles, each centred on its neighbours' edges,
 * inside one outer ring. Even-weight line, no fills — the moodboard's emblem
 * language (docs/brand/moodboard.html).
 */
const SeedOfLifeMark = (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    aria-hidden="true"
  >
    <circle cx="32" cy="32" r="24" />
    <circle cx="32" cy="32" r="12" />
    <circle cx="44" cy="32" r="12" />
    <circle cx="38" cy="42.392" r="12" />
    <circle cx="26" cy="42.392" r="12" />
    <circle cx="20" cy="32" r="12" />
    <circle cx="26" cy="21.608" r="12" />
    <circle cx="38" cy="21.608" r="12" />
  </svg>
);

const StarIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.2l2.6 6.1 6.6.5-5 4.4 1.5 6.5L12 16.3l-5.7 3.4 1.5-6.5-5-4.4 6.6-.5z" />
  </svg>
);

const GlobeIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" />
  </svg>
);

/** Neutral seat-grid stand-in, only used to calibrate against the reference. */
const ReplicaArt = (
  <svg viewBox="0 0 376 214" aria-hidden="true">
    <rect x="76" y="34" width="224" height="5" rx="2.5" fill="#C9D2DC" />
    {Array.from({ length: 6 }).flatMap((_, r) =>
      Array.from({ length: 12 }).map((__, c) => (
        <rect
          key={`${r}-${c}`}
          x={76 + c * 19.2}
          y={54 + r * 19}
          width="15"
          height="14"
          rx="3"
          fill={(r * 7 + c * 3) % 5 === 0 ? "#ECEDF1" : "#C7D3DF"}
        />
      )),
    )}
  </svg>
);

export const ENTIREMIND_CONTENT: HeroPhoneContent = {
  name: "Entiremind",
  mark: SeedOfLifeMark,
  bubbles: [
    {
      from: "them",
      text: "Morning, Maya. Yesterday you said you felt braver once you sent that email. What made it possible?",
    },
    { from: "me", text: "Honestly? I stopped waiting to feel ready." },
    {
      from: "them",
      text: "That's the whole thing, isn't it. Ready shows up after you move.",
    },
  ],
  card: {
    title: "Your intention",
    subtitle: "Written by you",
    icon: StarIcon,
    quote: "Open my studio by spring.",
    action: "Open intention",
  },
};

/** The reference's own copy and geometry — calibration only, never shipped. */
export const REPLICA_CONTENT: HeroPhoneContent = {
  name: "Muse",
  status: "Booking tickets...",
  bubbles: [
    {
      from: "them",
      text: "Tickets just opened for the movie you're tracking. 4:30 PM or 7:30 PM. Interested?",
    },
    { from: "me", text: "Yeah, book for 2" },
    { from: "me", text: "Lets do 7:30pm" },
  ],
  card: {
    title: "Browser",
    subtitle: "Selecting seats...",
    icon: GlobeIcon,
    body: ReplicaArt,
    action: "Open browser",
  },
};
