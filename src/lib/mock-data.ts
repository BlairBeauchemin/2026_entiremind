import type { User, Intention, Message, Subscription } from "./types";

export const mockUser: User = {
  id: "usr_001",
  name: "Alex Rivera",
  email: "alex@example.com",
  phone: "+15551234567",
  timezone: "America/New_York",
  plan: "Free Plan",
  createdAt: "2026-01-28T10:00:00Z",
};

export const mockIntention: Intention = {
  id: "int_001",
  userId: "usr_001",
  text: "I want to cultivate deep focus and presence in everything I do",
  status: "active",
  createdAt: "2026-01-31T09:00:00Z",
};

export const mockIntentionHistory: Intention[] = [
  {
    id: "int_001",
    userId: "usr_001",
    text: "I want to cultivate deep focus and presence in everything I do",
    status: "active",
    createdAt: "2026-01-31T09:00:00Z",
  },
  {
    id: "int_002",
    userId: "usr_001",
    text: "I choose to release anxiety and embrace calm in challenging moments",
    status: "completed",
    createdAt: "2026-01-20T10:00:00Z",
  },
  {
    id: "int_003",
    userId: "usr_001",
    text: "I am attracting abundance and opportunities aligned with my purpose",
    status: "completed",
    createdAt: "2026-01-10T08:30:00Z",
  },
];

export const mockSubscription: Subscription = {
  id: "sub_001",
  userId: "usr_001",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  plan: "free",
  status: "active",
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

function atTime(base: Date, hours: number, minutes: number): string {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export const mockMessages: Message[] = [
  {
    id: "msg_001",
    userId: "usr_001",
    direction: "outbound",
    type: "prompt",
    body: "Good morning, Alex. What is one thing you wish to manifest into reality today?",
    createdAt: atTime(threeDaysAgo, 8, 0),
  },
  {
    id: "msg_002",
    userId: "usr_001",
    direction: "inbound",
    type: "reply",
    body: "I want to cultivate deep focus and presence in everything I do.",
    createdAt: atTime(threeDaysAgo, 8, 12),
  },
  {
    id: "msg_003",
    userId: "usr_001",
    direction: "outbound",
    type: "reflection",
    body: "Beautiful. Your intention has been set: deep focus and presence. I\u2019ll hold this with you. When you feel distracted, simply reply \u201CAnchor\u201D and I\u2019ll remind you.",
    createdAt: atTime(threeDaysAgo, 8, 13),
  },
  {
    id: "msg_004",
    userId: "usr_001",
    direction: "outbound",
    type: "check-in",
    body: "Midday pause. How present have you felt so far today? No judgment \u2014 just notice.",
    createdAt: atTime(twoDaysAgo, 12, 0),
  },
  {
    id: "msg_005",
    userId: "usr_001",
    direction: "inbound",
    type: "reply",
    body: "Honestly, I got pulled into meetings all morning. But I\u2019m noticing it now, which feels like progress.",
    createdAt: atTime(twoDaysAgo, 12, 14),
  },
  {
    id: "msg_006",
    userId: "usr_001",
    direction: "outbound",
    type: "reflection",
    body: "Noticing is the first act of presence. You\u2019re already practicing what you intend to become.",
    createdAt: atTime(twoDaysAgo, 12, 15),
  },
  {
    id: "msg_007",
    userId: "usr_001",
    direction: "outbound",
    type: "prompt",
    body: "Evening reflection: What moment today felt most aligned with your intention of deep focus?",
    createdAt: atTime(yesterday, 19, 0),
  },
  {
    id: "msg_008",
    userId: "usr_001",
    direction: "inbound",
    type: "reply",
    body: "Writing for 45 minutes this afternoon with my phone in another room. It felt effortless.",
    createdAt: atTime(yesterday, 19, 22),
  },
  {
    id: "msg_009",
    userId: "usr_001",
    direction: "outbound",
    type: "reflection",
    body: "Effortless focus \u2014 that\u2019s the signal. Your environment shaped your state. Remember this pattern.",
    createdAt: atTime(yesterday, 19, 23),
  },
  {
    id: "msg_010",
    userId: "usr_001",
    direction: "outbound",
    type: "check-in",
    body: "Good morning. A new day to practice presence. What does deep focus look like for you today?",
    createdAt: atTime(today, 9, 14),
  },
];
