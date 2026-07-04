/**
 * Failed-payment dunning (Part B of docs/plans/2026-07-04-monetization-growth.md).
 *
 * Stripe Smart Retries fires invoice.payment_failed on every retry across a
 * ~2-week cycle. We text the user promptly on the first failure, at most once
 * per DUNNING_THROTTLE_DAYS, so the whole cycle produces ~2 texts. Messaging
 * continues throughout — past_due is a grace state, not a cutoff. Only the
 * final cancellation (customer.subscription.deleted) ends entitlement, with
 * a farewell that makes coming back easy.
 */

const SETTINGS_URL = "https://www.entiremind.com/dashboard/settings";

export const DUNNING_THROTTLE_DAYS = 5;

/**
 * Should a dunning notice go out for this payment-failure event?
 * Pure — throttles repeat notices within the retry cycle.
 */
export function shouldSendDunningNotice(
  lastNotifiedAt: string | null,
  now: Date = new Date(),
): boolean {
  if (!lastNotifiedAt) return true;
  const last = new Date(lastNotifiedAt).getTime();
  if (Number.isNaN(last)) return true;
  const days = (now.getTime() - last) / 86_400_000;
  return days >= DUNNING_THROTTLE_DAYS;
}

/** First notice: payment failed, card likely expired, messages continue. */
export function buildPaymentFailedMessage(name: string | null): string {
  const greeting = name ? `${name}, your` : "Your";
  return (
    greeting +
    " Entiremind payment didn't go through — usually just an expired card. " +
    `You can update it in a minute here: ${SETTINGS_URL} — ` +
    "your messages continue in the meantime."
  );
}

/** Final notice: subscription ended after retries were exhausted. */
export function buildSubscriptionEndedMessage(name: string | null): string {
  const greeting = name ? `${name}, your` : "Your";
  return (
    greeting +
    " Entiremind subscription has ended. Your reflections and history are " +
    "saved. Whenever you want to pick the daily practice back up: " +
    SETTINGS_URL
  );
}
