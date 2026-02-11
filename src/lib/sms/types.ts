/**
 * Common types for SMS provider abstraction layer
 */

export type SmsProvider = "telnyx" | "twilio";

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
