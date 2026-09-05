# Founder Operations Playbook

How to run Entiremind day-to-day. Plain language, action-first. When you see X, do Y.

**The stance this document is written from:** the system runs itself. There is no queue
here for you to clear, and nothing waits on your approval before it reaches a user. Your
job is to read outcomes, turn knobs, and intervene by exception — not to be in the request
path. If you ever find yourself doing repetitive per-item approval, that is a bug to
report, not a duty to keep up with.

For product context see `PRODUCT.md`; for what is actually built see `CLAUDE.md`.

*Last reconciled against the code: 5 September 2026.*

---

## 1. The weekly Monday ritual (~20 min)

Run this once a week, ideally Monday late morning — after the weekly memory cron has fired
(Monday 12:00 UTC, so 4–5 AM Pacific).

1. **Skim Vercel logs.** Dashboard → Logs → last 7 days, filtered to errors. Anything from
   `/api/cron/*` or `/api/sms/webhook/*` deserves attention.
2. **Open `/dashboard/founder`.**
3. **Read the outcomes, not a queue.** Per-technique reply rate, reply-rate-by-content-type,
   and the acquisition + onboarding funnels. You are looking for *which shapes earn replies*,
   which is the only question that matters.
4. **Scan per-user insights.** Expand a few users. Do the memory blobs feel accurate? Do the
   themes match what you'd expect from their replies?
5. **Glance at sentiment trends.** Anyone trending hard toward "struggling" two weeks running
   may want a real, human check-in from you. That is an exception, and exceptions are
   exactly what your attention is for.
6. **Skim the intention drift log.** Read-only. It tells you what the system noticed and
   whether the user was nudged. Nothing to approve — if a detection looks silly, that is a
   signal to raise `intention_shift_min_confidence`, not to click anything.
7. **Read 5–10 recent messages.** Does the voice still sound like us? Are mirrors landing?

### What "normal" looks like

- Most active users got a daily prompt every day this week
- Substantive replies got an AI mirror within a few seconds; short replies got a rotating soft ack
- `user_memory` rows have `updated_at` from Monday morning
- `messages.message_mode` is populated on daily prompts and varies across the four modes
- Reply rates per user are above zero
- No 500-level errors in the cron routes

---

## 2. What still needs you, and why

Four things do not happen without a human. Each is here for a reason that is not taste, and
none of them should grow a fifth sibling without a good argument.

| What | Why it waits on you | Where |
|---|---|---|
| **Paid ad launches** | Unattended spend against a live budget | `/dashboard/founder/marketing` review queue; enforced in `pipeline/publish.ts` |
| **Organic social publishing** | Brand voice in public, hard to unpublish | `brand_channels.publish_mode` |
| **Weekly email sends** | CAN-SPAM / list compliance on bulk mail | drafts land in ActiveCampaign; you press send |
| **Publishing a testimonial** | It is someone's words about their own life | `/dashboard/founder` testimonial review; consent required |

**And one rule that is not a gate:** the user's intention is changed by the user, in the
app. Not by the model, not by you. If a user emails asking you to change it, point them at
`/dashboard/intentions` — or, if they truly can't, edit the `intentions` table by hand and
tell them you did.

---

## 3. Symptom → fix runbook

| You notice | Likely cause | What to do |
|---|---|---|
| A user said the ack felt like a chatbot | AI mirror tone, or soft-ack repetition | Soft acks: edit the `soft_acks` table directly. Mirrors: ping me to retune `src/lib/ai/prompts/enrich.ts` |
| Morning prompts feel repetitive for a user | `no_repeat_days` too low | Raise `no_repeat_days` from 1 to 2 |
| Prompts all sound like questions | `feeling_seen_enabled` got turned off | Set it back to `true`; every mode collapses to `question` when it's false |
| Mirrors/callbacks feel forced or too frequent | Mode targets too high | Lower `mirror_target_per_week` / `callback_target_per_week` |
| Messages are running long | `mode_char_ceiling` | Lower it from 300 (modes are deliberately allowed past the 160-char norm) |
| A technique landed badly | It went live on digest — by design | Retire it on `/dashboard/founder`. To slow the whole system down, lower `technique_apply_probability`; `0` disables techniques instantly |
| Techniques reaching people who are struggling | A technique is mis-flagged `gentle` | Fix the `gentle` flag on that row. This is the safety rail, so treat a wrong one as urgent |
| Intention-drift nudges feel premature or wrong | Confidence gate too low | Raise `intention_shift_min_confidence` (default 0.60) |
| A user got two drift nudges for the same thing | Should be impossible — nudge-once guard | Real bug; ping me with the `intention_shift_suggestions` rows |
| User reports they got no message today | Paused, no phone, didn't onboard, expired trial, or cron error | Supabase → `users` → check `status`, `phone`, `onboarding_completed`; then `subscriptions.trial_ends_at`; then Vercel cron logs |
| User's memory blob is empty after a week of replies | Weekly cron didn't run, or the call failed | Trigger manually (URLs at the bottom) |
| Replies have `insights` null | Enrichment failed | Run the reconcile cron by hand; it re-enriches. If it recurs, ping me |
| Founder dashboard is empty / errors | Auth or service-role issue | Sign out and back in. If still broken, ping me |
| Reply rate dropping across all users | Many possible causes; don't panic | Note it, watch one more week. If sustained, ping me |
| Spam SMS through the webhook | Unknown numbers with no user account | Already ignored — no `users` row, no ack, no AI call. No action |

---

## 4. Tuning reference

Everything here is a column on `content_selection_config` (singleton, `id = 1`), editable
from the Supabase table editor. No deploy. Effective on the next daily send.

| Knob | Default | Raise it when | Lower it when |
|---|---|---|---|
| `no_repeat_days` | 1 | Prompts feel repetitive day to day → 2 | Rarely |
| `earned_reply_bias` | 0.60 | Lean harder into what works per user → 0.75 | Output feels too predictable → 0.4 |
| `earned_reply_min_sends` | 5 | Want a stabler bias before it kicks in → 8 | New users feel un-personalized → 3 |
| `earned_reply_lookback_days` | 30 | — | — |
| `quote_max_per_week` | 1 | Rarely | Rarely |
| `silence_threshold` | 3 | Gentle mode triggers too often → 4–5 | Disengaged users feel ignored → 2 |
| `reconnect_after_silences` | 5 | Reconnects feel pushy → 6–7 | People drift away unnoticed → 4 |
| `pause_after_silences` | 9 | Want to hold on longer | Want to stop texting the unreachable sooner |
| `technique_apply_probability` | 0.50 | Want more shaped prompts → 0.7 | Techniques feel heavy-handed → 0.3, or `0` to disable |
| `technique_no_repeat_count` | 10 | Same technique recurring → 15 | Library too small to sustain it |
| `feeling_seen_enabled` | true | — | `false` reverts every prompt to a plain question |
| `mirror_target_per_week` | 2 | Want more "I heard you" messages → 3 | Mirrors feel repetitive → 1 |
| `callback_target_per_week` | 1 | Want more long-memory callbacks → 2 | Callbacks feel like surveillance → 0 |
| `mode_char_ceiling` | 300 | — | Tighten toward the 160-char SMS norm |
| `intention_shift_min_confidence` | 0.60 | Drift nudges feel premature → 0.75 | Obvious drift is going unnoticed → 0.5 |

Also tunable, elsewhere:

- **`soft_acks` table** — the ack phrase library. Insert rows to add, `active = false` to
  retire (don't delete). Effective immediately, on the next inbound reply.
- **`techniques` table** — `status` (`active` / `retired`) and the `gentle` flag.
- **`marketing_engine_config`** — `enabled`, `weekly_pieces_per_brand`, batch caps, default
  budget, `ads_launch_paused`, `video_enabled`.
- **`system_prompts`** — versioned generation prompts, one active row. Production prose is
  unchanged until you activate a version. A/B in the simulator first.

---

## 5. Before you change generation: use the simulator

`/dashboard/founder/simulator` runs the real pipeline against test personas
(`users.is_test`) and never sends SMS. Create a persona, step a day at a time, and read the
per-day "why" drawer — which content type, which mode, which technique, and what drove each
choice. Step a full week to see the memory blob it produces.

This is the right place to try a new system prompt. Production generation is byte-identical
to today until you explicitly activate a version there.

---

## 6. When to ask for engineering help

**You can do alone:** everything in §4, retiring techniques, pausing/resuming a user,
scheduling a message by hand, inspecting any data in Supabase, triggering crons by curl,
running the simulator, activating a system-prompt version.

**Ping me for:** editing AI prompt *source* (enrichment, memory, daily prompt), thresholds
that aren't columns yet, new features, schema changes, cron schedule changes, anything
needing a deploy, and cost spikes you can't explain.

**How to ask:** describe the symptom in plain language, with 2–3 concrete examples. Don't
translate to technical — say what you're seeing and let me find the cause.

---

## 7. Glossary

- **Ack / soft ack** — short auto-response to a reply, from the `soft_acks` library.
- **Mirror** — AI-generated reflection sent in response to a *substantive* reply.
- **Enrichment** — the AI classification run on every inbound (sentiment, themes, category).
- **Insights** — the JSON column on `messages` holding the enrichment output.
- **Memory / memory blob** — the weekly compacted summary of each user, in `user_memory`.
- **Theme** — a short lowercase tag for what a user has been talking about.
- **Sentiment** — positive / neutral / struggling.
- **Substantive** — enrichment flag: the reply has real content (≥30 chars or strong signal).
- **Engagement score** — 0–100 measure of overall engagement.
- **Consecutive silences** — prompts in a row with no reply.
- **Intention** — the user's stated goal. Authored by the user, always.
- **Intention drift** — the system noticing their focus has moved. Logged and nudged, never applied.
- **Steer** — a short-lived topic redirect from an explicit "can we focus on X" reply.
- **Content type** — *what* a prompt is about (reflection, check-in, action, gratitude, quote).
- **Message mode** — *how* it stands (question, mirror, callback, attunement). Orthogonal to content type.
- **Technique** — an internal prompt recipe shaping how a question is asked. Never shown or named to users.
- **Recap** — the Monday message reflecting a user's week back to them.
- **Reconnect** — the message sent when someone has gone quiet, offering PAUSE.
- **CRON_SECRET** — the env token authenticating manual cron triggers.

---

## Quick-reference URLs

- Founder dashboard: `https://www.entiremind.com/dashboard/founder`
- Simulator: `https://www.entiremind.com/dashboard/founder/simulator`
- Marketing engine: `https://www.entiremind.com/dashboard/founder/marketing`
- Vercel logs: `https://vercel.com/blairs-projects-7e709a29/2026-entiremind/logs`
- Supabase tables: `https://supabase.com/dashboard/project/cprzebhlwfibajrrtuqp/editor`

Manual cron triggers (all take `-H "Authorization: Bearer $CRON_SECRET"`):

- `.../api/cron/weekly-memory` — compaction, drift detection, recap staging
- `.../api/cron/detect-silence` — flags unreplied messages
- `.../api/cron/reconcile-enrichment` — re-enriches replies with null insights (built, unscheduled)
- `.../api/cron/daily-send` — **sends real SMS.** Use carefully.
