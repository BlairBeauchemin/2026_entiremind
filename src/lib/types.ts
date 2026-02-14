export type MessageDirection = "inbound" | "outbound";
export type MessageType = "reflection" | "check-in" | "prompt" | "reply";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  timezone: string;
  plan: string;
  createdAt: string;
}

export interface Intention {
  id: string;
  userId: string;
  text: string;
  status: "active" | "completed";
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: "free" | "monthly" | "yearly";
  status: "active" | "paused" | "cancelled" | "past_due" | "trialing";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface Message {
  id: string;
  userId: string;
  direction: MessageDirection;
  type: MessageType;
  body: string;
  createdAt: string;
}
