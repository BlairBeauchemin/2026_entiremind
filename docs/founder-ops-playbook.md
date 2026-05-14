# Founder Operations Playbook

A practical guide to running Entiremind day-to-day after Content Engine v2 is live. Plain language, action-first. When you see X, do Y.

For product context, see `docs/content-engine-v2-overview.md`. For the technical reference, see `CLAUDE.md`.

---

## 1. The weekly Monday ritual (~30 min)

Run this once a week, ideally Monday late morning — after the weekly memory cron has fired (Monday 4–5 AM Pacific).

1. **Skim Vercel logs.** Vercel dashboard → Logs → filter last 7 days for errors. Anything from `/api/cron/*` or `/api/sms/webhook/*` deserves attention.
2. **Open `/dashboard/founder`.**
3. **Clear the intention shift queue.** Review any pending suggestions. Approve or dismiss each. If you're not sure — dismiss. The system will surface it again next week if it's real.
4. **Scan per-user insights.** Expand a few users. Do their memory blobs feel accurate? Do the themes match what you'd expect?
5. **Glance at sentiment trends.** Anyone trending hard toward "struggling" for two weeks running? That user may need a manual check-in.
6. **Read 5–10 recent messages.** Open the message log. Skim the most recent prompts and replies. Does the system's voice still feel right? Are AI mirrors landing?
7. **Note anything off.** If you spot a pattern — repeated content types, weird theme tags, robotic acks — open the symptom runbook (Section 3) or tune a knob (Section 4).

### What "normal" looks like

- Most active users got a daily prompt every day this week
- Substantive replies got an AI mirror within a few seconds
- Short replies got a soft ack (rotating, never the same one twice in a row for the same user)
- `user_memory` rows have `updated_at` from Monday morning
- Reply rates per user are above zero
- No 500-level errors in the cron routes

---

## 2. First two weeks after v2 launch (extra attention)

The system is newly behaving differently. Watch closer than usual.

1. **Read every AI mirror for the first 50 inbound replies.** Open the messages table in Supabase, filter `content_type='ack'` and `ai_generated=true`. Are they on-tone? On-target? Generic?
2. **Watch for false-positive intention shifts.** Early in v2's life, every user has thin memory. The model may over-detect. Bias toward dismissing for the first 3–4 weeks.
3. **Confirm the daily prompt still goes out** every morning. Check the messages table for `content_type='reflection'/'check-in'/'action'/'gratitude'/'quote'` rows from each active user, daily.
4. **Don't tune the config tables in week 1.** Let baseline behavior settle. You can't tell what's working without a baseline.
5. **Note any tone issues but don't act on them yet.** Collect 3–5 examples first, then ping me to retune the prompt. Single examples are noise.
6. **Talk to 2–3 active users about their experience.** Ask what the morning prompt and acks feel like. Their words tell you more than any metric.

---

## 3. Symptom → fix runbook

| You notice | Likely cause | What to do |
|---|---|---|
| A user said the ack felt like a chatbot | AI mirror prompt tone, or soft-ack repetition | Soft acks: edit `soft_acks` table directly. Mirrors: ping me to retune `src/lib/ai/prompts/enrich.ts` |
| Morning prompts feel repetitive for a user | `no_repeat_days` too low | In `content_selection_config`, raise `no_repeat_days` from 1 to 2 |
| Same content type two days in a row | Repeat-prevention rule misfiring, OR the user has very few past sends | Verify in messages table. If repeat is real, ping me to investigate. |
| User got `quote` two weeks in a row | `quote_max_per_week` not being respected | Check the config; verify it's set to 1. If still happening, ping me. |
| User reports they got no message today | One of: paused, no phone, didn't onboard, or cron error | Open Supabase → users → check `status`, `phone`, `onboarding_completed`. Then check Vercel cron logs for that day. |
| User's memory blob looks empty after a week of replies | Weekly cron didn't run, or call failed | Manually trigger: `curl -H "Authorization: Bearer $CRON_SECRET" https://www.entiremind.com/api/cron/weekly-memory` |
| Intention shift suggestion looks wrong | Confidence threshold too low, or model misread the data | Dismiss it. If a specific user keeps generating false ones, ping me. |
| Founder dashboard is empty / errors | Auth issue or service-role permission | Sign out and back in. If still broken, ping me. |
| AI mirror references the user's name awkwardly | Prompt instruction needs tightening | Ping me — this is a prompt tuning issue. |
| Reply rate is dropping across all users | Could be many things; don't panic | Note it, watch one more week. If sustained, ping me. |
| A user asked us to update their intention | Manual change | Supabase → `intentions` table → set old row's `status='completed'`, insert new row with `status='active'`. Or approve through founder dashboard if a shift suggestion is pending. |
| Spam SMS coming through the webhook | Unknown numbers without user accounts | They're already ignored (no `users` row, no ack). No action needed. |

---

## 4. Tuning reference

Three places you can tune the system from the Supabase dashboard without involving me.

### Soft acks (`soft_acks` table)

- **When to add new phrases:** existing ones feel stale, or you want more brand-specific tone.
- **How:** insert rows directly. Each phrase is one row with `text` and `active=true`.
- **When to retire one:** a phrase feels off. Set `active=false` (don't delete — keeps history clean).
- **Effect:** immediate. Next inbound reply uses the updated pool.

### Content selection (`content_selection_config` table — singleton, id=1)

| Knob | Default | Raise it when | Lower it when |
|---|---|---|---|
| `no_repeat_days` | 1 | Prompts feel repetitive day to day → try 2 | Rarely needs lowering |
| `earned_reply_bias` | 0.60 | You want the system to lean harder into what works per user → try 0.75 | Outputs feel too predictable → try 0.4 |
| `earned_reply_min_sends` | 5 | You want stable bias before kicking in → try 8 | New users feel un-personalized → try 3 |
| `quote_max_per_week` | 1 | Rarely needs changing | Rarely needs changing |
| `silence_threshold` | 3 | "Gentle mode" triggers too often → try 4 or 5 | Disengaged users feel ignored → try 2 |

- **Effect:** takes effect on next daily send (next morning at 7:45 AM Pacific).

### Intention shift confidence threshold

- Currently hardcoded at 0.6 in `src/lib/ai/memory.ts`.
- Not in the config table — changing it needs me.
- **Symptoms to flag:** "too many false positives" → ask to raise. "Missing real shifts I can see in user replies" → ask to lower.

---

## 5. When to ask for engineering help

### You can do alone

- Edit soft acks
- Tune content selection rules
- Approve / dismiss intention shifts
- Pause / resume a specific user
- Schedule a message manually via the founder dashboard
- Read or inspect any data in Supabase
- Manually trigger crons via curl
- Change a user's intention directly in the `intentions` table

### Ping me for

- Editing any AI prompt (enrichment, memory, daily prompt, future noticing)
- Adjusting thresholds not in `content_selection_config` (intention shift confidence, ack length, etc.)
- New features
- Database schema changes
- Cron schedule changes
- Anything that requires deploying code
- Cost spikes you can't explain

### How to ask

- Describe the symptom in plain language ("the morning messages feel samey," "this user's memory looks wrong").
- Include 2–3 concrete examples if you can.
- Don't translate to technical — just say what you're seeing and let me figure out what to change.

---

## 6. Glossary

Terms you'll see in Supabase, the founder dashboard, or the docs.

- **Ack / soft ack** — short auto-response to a user's reply, picked from the `soft_acks` library ("Got that.", "Holding this.").
- **Mirror** — AI-generated reflection sent in response to a *substantive* reply.
- **Enrichment** — the AI classification run on every inbound reply (sentiment, themes, category, etc.).
- **Insights** — the JSON column on the `messages` table holding the enrichment output.
- **Memory / memory blob** — the weekly compacted summary of each user, stored in `user_memory`.
- **Theme** — a short, lowercase tag describing what a user has been talking about (e.g., "self-worth at work").
- **Category** — the fixed bucket a theme belongs to (career, health, relationships, money, identity, creative, family, spiritual, other).
- **Sentiment** — positive / neutral / struggling.
- **Substantive** — flag set by enrichment when a reply has real content (≥30 chars or strong emotional/thematic signal).
- **Engagement score** — 0–100 metric of how engaged a user has been overall.
- **Consecutive silences** — number of prompts in a row a user hasn't replied to.
- **Intention** — the user's stated goal, stored in the `intentions` table.
- **Intention shift** — when the system detects a user's focus has meaningfully changed.
- **Daily prompt** — the morning SMS (`content_type` in: reflection, check-in, action, gratitude, quote).
- **Content type** — the kind of morning prompt being sent on a given day.
- **Noticing** *(once v3 ships)* — the Sunday-evening reflection message.
- **Cron / scheduled job** — an automated task that runs on a fixed schedule (daily-send, weekly-memory, silence-detect).
- **CRON_SECRET** — the env-var token that authenticates manual cron triggers.

---

## Quick-reference URLs

- Founder dashboard: `https://www.entiremind.com/dashboard/founder`
- Vercel logs: `https://vercel.com/blairs-projects-7e709a29/2026-entiremind/logs`
- Supabase tables: `https://supabase.com/dashboard/project/cprzebhlwfibajrrtuqp/editor`
- Manual weekly-memory cron: `curl -H "Authorization: Bearer $CRON_SECRET" https://www.entiremind.com/api/cron/weekly-memory`
- Manual silence-detection cron: `curl -H "Authorization: Bearer $CRON_SECRET" https://www.entiremind.com/api/cron/detect-silence`
- Manual daily-send cron (use carefully — sends real SMS): `curl -H "Authorization: Bearer $CRON_SECRET" https://www.entiremind.com/api/cron/daily-send`
