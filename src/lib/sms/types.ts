/**
 * Common types for SMS provider abstraction layer
 */

// Twilio is the only supported provider. Historical rows written by the
// removed Telnyx integration keep provider='telnyx' in the database; the
// database row types (lib/supabase.ts) still cover that value for reads.
export type SmsProvider = "twilio";

export type ContentType = "reflection" | "quote" | "check-in" | "action" | "gratitude" | "welcome" | "manual" | "ack";

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  externalMessageId?: string;
  error?: string;
}

export interface InboundSmsData {
  fromPhoneNumber: string;
  toPhoneNumber: string;
  text: string;
  externalMessageId: string;
}

export interface SmsProviderAdapter {
  /**
   * The provider name for database storage
   */
  provider: SmsProvider;

  /**
   * Send an SMS message
   */
  sendSms(toPhoneNumber: string, text: string): Promise<{
    success: boolean;
    externalMessageId?: string;
    error?: string;
  }>;

  /**
   * Get the configured phone number for this provider
   */
  getPhoneNumber(): string;
}
