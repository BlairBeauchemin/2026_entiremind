import { createServiceRoleClient } from "./supabase";

/**
 * Silence recovery arc.
 *
 * A user who stops replying has functionally churned long before they cancel.
 * Instead of sending daily prompts into the void:
 *  - at `reconnectAfterSilences` consecutive silences, the daily send is
 *    replaced (once per silent stretch) with a reconnect message that names
 *    the quiet and offers ways forward, including PAUSE;
 *  - if silence continues to `pauseAfterSilences`, a farewell goes out and
 *    messaging is paused (users.status = 'paused'), so we stop texting
 *    someone who's gone — good for them, and for deliverability.
 * Replying to anything (including RESUME) resets the streak via the normal
 * reply-signal path.
 */

export interface SilenceRecoveryConfig {
  reconnectAfterSilences: number;
  pauseAfterSilences: number;
}

const DEFAULT_CONFIG: SilenceRecoveryConfig = {
  reconnectAfterSilences: 5,
  pauseAfterSilences: 9,
};

export type SilenceRecoveryAction = "none" | "reconnect" | "pause";

/**
 * Decide what the daily send should do for a user given their silence streak.
 * Pure — all inputs supplied by the caller.
 *
 * A pause is only issued after a reconnect has been sent (and gone
 * unanswered) in the current silent stretch: the user always gets a warning
 * with a way back before we go quiet on them.
 */
export function decideSilenceRecovery(params: {
  consecutiveSilences: number;
  config: SilenceRecoveryConfig;
  reconnectSentSinceLastReply: boolean;
}): SilenceRecoveryAction {
  const { consecutiveSilences, config, reconnectSentSinceLastReply } = params;

  if (consecutiveSilences < config.reconnectAfterSilences) {
    return "none";
  }

  if (!reconnectSentSinceLastReply) {
    return "reconnect";
  }

  if (consecutiveSilences >= config.pauseAfterSilences) {
    return "pause";
  }

  return "none";
}

/**
 * Load silence-recovery thresholds from the founder-tunable
 * content_selection_config singleton, falling back to defaults.
 */
export async function loadSilenceRecoveryConfig(): Promise<SilenceRecoveryConfig> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("content_selection_config")
    .select("reconnect_after_silences, pause_after_silences")
    .eq("id", 1)
    .maybeSingle();

  return {
    reconnectAfterSilences:
      data?.reconnect_after_silences ?? DEFAULT_CONFIG.reconnectAfterSilences,
    pauseAfterSilences:
      data?.pause_after_silences ?? DEFAULT_CONFIG.pauseAfterSilences,
  };
}

/**
 * Has a reconnect message been sent since the user's last reply?
 * (With no reply on record, any reconnect ever counts.)
 */
export async function hasReconnectSinceLastReply(
  userId: string,
  lastReplyAt: string | null,
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from("messages")
    .select("id")
    .eq("user_id", userId)
    .eq("direction", "outbound")
    .eq("content_type", "reconnect")
    .limit(1);

  if (lastReplyAt) {
    query = query.gt("created_at", lastReplyAt);
  }

  const { data } = await query;
  return Boolean(data && data.length > 0);
}

/**
 * The reconnect nudge. Deliberately not AI-generated: this moment calls for
 * something plain and predictable, and the user hasn't given us anything
 * recent to personalize from anyway.
 */
export function buildReconnectMessage(name: string | null): string {
  const greeting = name ? `Hey ${name} — ` : "Hey — ";
  return (
    greeting +
    "I've noticed it's been quiet lately, and that's okay. If these messages " +
    "haven't been landing, tell me what would serve you better. If you need " +
    "a break, reply PAUSE and I'll hold off until you're ready."
  );
}

/** The farewell sent when auto-pausing after continued silence. */
export function buildPauseMessage(name: string | null): string {
  const greeting = name ? `${name}, I'm` : "I'm";
  return (
    greeting +
    " going to pause the daily messages for now — I don't want to add " +
    "noise. Everything you've shared is safe, and whenever you're ready to " +
    "pick this back up, just text RESUME."
  );
}

/** Confirmation replies for the PAUSE / RESUME keywords. */
export const PAUSE_CONFIRMATION =
  "Done — daily messages are paused. Text RESUME whenever you want to pick things back up.";

export const RESUME_CONFIRMATION =
  "Welcome back. Your daily messages will pick up tomorrow morning.";
