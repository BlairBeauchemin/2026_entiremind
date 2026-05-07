/**
 * Signal types for behavioral tracking
 */

export type SignalEventType =
  | "reply"
  | "silence"
  | "unprompted"
  | "quick_reply"
  | "long_reply"
  | "stop_request";

export interface SignalMetadata {
  reply_time_minutes?: number;
  reply_length?: number;
  outbound_text?: string;
  inbound_text?: string;
}

export interface TrackReplyParams {
  userId: string;
  inboundMessageId: string;
  outboundMessageId: string | null;
  replyTimeMinutes: number | null;
  replyLength: number;
}

export interface TrackSilenceParams {
  userId: string;
  outboundMessageId: string;
}

export interface UserSignalsSummary {
  userId: string;
  totalMessagesSent: number;
  totalReplies: number;
  replyRate: number | null;
  avgReplyTimeMinutes: number | null;
  avgReplyLength: number | null;
  lastReplyAt: string | null;
  lastMessageSentAt: string | null;
  consecutiveSilences: number;
  engagementScore: number;
}
