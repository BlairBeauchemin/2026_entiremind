import type { HeroPhoneContent } from "./hero-phone";

/**
 * Seed of Life: seven equal circles, each centred on its neighbours' edges,
 * inside one outer ring. Even-weight line, no fills — the moodboard's emblem
 * language (docs/brand/moodboard.html).
 */
export const SeedOfLifeMark = (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
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

/**
 * The intention as a place: sunrise over rolling hills, a path winding toward
 * it, a sprout in the foreground. Cobalt and its tints only — every colour is
 * #2A3A9C mixed with white, so the art sits on the same hue as the brand.
 */
const IntentionLandscapeArt = (
  <svg
    viewBox="0 0 376 214"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="hero-phone-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F7F8FC" />
        <stop offset="1" stopColor="#E9EBF5" />
      </linearGradient>
    </defs>
    <rect width="376" height="214" fill="url(#hero-phone-sky)" />
    <g stroke="#A0A6D2" strokeWidth="2.4" strokeLinecap="round">
      <line x1="188" y1="54" x2="188" y2="70" />
      <line x1="160" y1="64" x2="167" y2="75" />
      <line x1="216" y1="64" x2="209" y2="75" />
      <line x1="144" y1="86" x2="156" y2="91" />
      <line x1="232" y1="86" x2="220" y2="91" />
    </g>
    <path d="M158 118a30 30 0 0 1 60 0z" fill="#B4BADC" />
    <path
      d="M0 134 C70 104 124 112 188 122 C252 134 304 104 376 112 L376 214 L0 214Z"
      fill="#E1E3F1"
    />
    <path
      d="M0 156 C84 130 156 142 220 152 C284 164 326 146 376 142 L376 214 L0 214Z"
      fill="#F0F1F8"
    />
    <g fill="none" stroke="#757FBF" strokeWidth="2">
      <path d="M0 146 C70 122 124 124 178 132" />
      <path d="M222 152 C284 164 326 146 376 142" />
      <path d="M150 214 C120 190 210 182 198 172 C188 164 240 158 252 154" />
    </g>
    <ellipse cx="46" cy="114" rx="8" ry="21" fill="#BFC4E1" />
    <line
      x1="46"
      y1="126"
      x2="46"
      y2="146"
      stroke="#757FBF"
      strokeWidth="1.8"
    />
    <ellipse cx="68" cy="106" rx="9" ry="25" fill="#BFC4E1" />
    <line
      x1="68"
      y1="120"
      x2="68"
      y2="142"
      stroke="#757FBF"
      strokeWidth="1.8"
    />
    <path
      d="M318 146 v-18 M318 134 c-8-2-12-10-10-16 8 2 11 9 10 16 M318 134 c8-2 12-10 10-16 -8 2-11 9-10 16"
      stroke="#2A3A9C"
      strokeWidth="1.8"
      fill="#5F6BB5"
    />
  </svg>
);

/**
 * The intention, achieved: a sunlit studio drawn in cobalt line on a cobalt
 * wash, with a small milestone tag. Brand colours only (cobalt + its tints).
 */
const StudioAchievedArt = (
  <svg
    viewBox="0 0 376 120"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="hero-phone-studio-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F6F7FC" />
        <stop offset="1" stopColor="#E7E9F4" />
      </linearGradient>
    </defs>
    <rect width="376" height="120" fill="url(#hero-phone-studio-wall)" />
    {/* Light falling through the window onto the floor */}
    <path d="M44 42 L106 42 L156 104 L46 104 Z" fill="#FFFFFF" opacity="0.6" />
    <g
      fill="none"
      stroke="#2A3A9C"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Arched window */}
      <path d="M40 96 V46 a35 35 0 0 1 70 0 V96 Z" fill="#FBFBFE" />
      <path d="M75 11 V96 M40 64 H110" />
      {/* Floor */}
      <path d="M16 104 H360" />
      {/* Easel + canvas */}
      <path d="M246 82 L232 104 M270 82 L284 104 M258 78 V104" />
      <rect x="226" y="42" width="64" height="40" rx="3" fill="#FFFFFF" />
      <circle cx="243" cy="56" r="5" />
      <path d="M232 76 C246 64 260 70 284 62" />
      {/* Plant */}
      <path d="M326 104 l-5 -16 h20 l-5 16 Z" fill="#FFFFFF" />
      <path d="M331 88 V70 M331 79 c-8 -2 -12 -9 -10 -14 8 2 11 8 10 14 M331 75 c8 -2 12 -9 10 -14 -8 2 -11 8 -10 14" />
    </g>
    {/* Milestone tag */}
    <g transform="translate(236 9)">
      <rect width="128" height="26" rx="13" fill="#FFFFFF" />
      <circle cx="14" cy="13" r="8" fill="#2A3A9C" />
      <path
        d="M10 13.2 l2.6 2.6 l5.2 -5.6"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="28"
        y="17.5"
        fontSize="12.5"
        fontWeight="600"
        fill="#2A3A9C"
        fontFamily="inherit"
      >
        Lease signed
      </text>
    </g>
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
  draft: "Just booked a studio viewi",
  card: {
    title: "Your intention",
    subtitle: "Open my studio by spring",
    icon: StarIcon,
    body: IntentionLandscapeArt,
    action: "Open intention",
  },
};

/**
 * The Messages-style SmsPhone's conversation: the same thread, with Maya's
 * reply sent rather than half-typed, so the screen fills and the composer
 * sits empty.
 */
export const SMS_CONTENT: HeroPhoneContent = {
  ...ENTIREMIND_CONTENT,
  bubbles: [
    ...ENTIREMIND_CONTENT.bubbles,
    { from: "me", text: "Just booked a studio viewing for Saturday." },
  ],
  draft: undefined,
};

/**
 * The "Introducing Entiremind" demo: one exchange the product supports end to
 * end. A morning prompt, Maya's reply, and a reply that reflects her own words
 * back with one small action, ending on her answer.
 */
export const DEMO_CONTENT: HeroPhoneContent = {
  ...ENTIREMIND_CONTENT,
  bubbles: [
    {
      from: "them",
      text: "Picture an ordinary morning in the life you want to create. What feels different? Choose one small piece of that feeling to bring into today.",
    },
    {
      from: "me",
      text: "No rushing. Coffee, then sketching by the window.",
    },
    {
      from: "them",
      text: "Making something first. Ten minutes of sketching could be today's piece.",
    },
    { from: "me", text: "Doing it before I open my email." },
  ],
  draft: undefined,
};

/** Alternate: the intention in the person's own words, in the brand serif. */
export const ENTIREMIND_QUOTE_CONTENT: HeroPhoneContent = {
  ...ENTIREMIND_CONTENT,
  card: {
    title: "Your intention",
    subtitle: "Written by you",
    icon: StarIcon,
    quote: "Open my studio by spring.",
    action: "Open intention",
  },
};

/** Alternate: the card shows the intention being achieved, not the words. */
export const ENTIREMIND_VISUAL_CONTENT: HeroPhoneContent = {
  ...ENTIREMIND_CONTENT,
  card: {
    title: "Your intention",
    subtitle: "Open my studio by spring",
    icon: StarIcon,
    body: StudioAchievedArt,
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
