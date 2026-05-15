# Content Engine v2 — Plain-English Overview

A non-technical reference for what just got built, what it does, what you can tune yourself, and what's next.

For the deep technical version, see `docs/prds/2026-05-12-content-engine-v2.md` and `docs/plans/2026-05-12-content-engine-v2.md`.

---

## The short version

Entiremind used to send one AI-generated message per user every morning, and silently log replies. It didn't know what users had said in the past, didn't acknowledge when someone replied, and picked content types at random.

**Now:**

1. Every reply gets a response within a few seconds (a short ack, or an AI mirror for deeper replies).
2. Every reply is classified — sentiment, themes, emotional state — and stored.
3. Once a week, the system reads each user's recent replies and writes a short "memory" of who they are. That memory gets injected into every morning prompt going forward.
4. Morning prompts no longer pick content types at random — they pick based on what's working for each user, what was said yesterday, and how the user is feeling.
5. Onboarding now asks 4 reflective questions instead of 1, and those seed the memory for new users from day one.
6. You get a founder dashboard where you can see each user's memory, recent themes, sentiment trend, and approve any time the system thinks their intention has shifted.

The whole thing is designed to stay cheap — about $1/day in AI cost even at 1,000 active users.

---

## What changed, in plain terms

### 1. Every reply gets feedback

Before: a user replies, the message lands in the database, nothing happens.

Now:
- **Short replies** ("yes", "thanks", "ok") get a quick acknowledgement from a curated list of 15 phrases ("Got that.", "Holding this.", "Thank you.", etc.). The system rotates through them so the same one doesn't appear twice in a row.
- **Real replies** (longer than 30 characters or carrying real emotional content) get an AI-generated mirror — a short reflection on what they said. Example: user texts "Today felt heavy, like I was pushing against something." → system replies "That pushing-against-nothing feeling is real. Glad you named it."

This happens in the background — the user gets the ack within roughly 5 seconds of replying.

### 2. The system listens more carefully

Every inbound reply is now classified by AI:
- **Sentiment** (positive / neutral / struggling)
- **Emotional state** (a short label like "tentative" or "hopeful")
- **Themes** (a few short tags like "self-worth at work" or "calling dad")
- **Category** (career, health, relationships, money, identity, creative, family, spiritual, other)

This data is stored so you can see it later, and so the AI can use it.

### 3. The system remembers each user

Once a week (Monday morning), a more powerful AI model (Sonnet) reads each user's last 7 days of replies and writes a short memory blob — a structured summary of:
- Their **vision** of what they're working toward
- Their **obstacles**
- Their **recent emotional state**
- **Open threads** they've mentioned (e.g., "wanted to call dad")
- Their **last breakthrough** moment
- **Tone notes** on how they prefer to be talked to

This memory gets quietly fed into every morning prompt that week. The AI writing the morning message is told "don't quote this back, just let it shape what you say."

### 4. Morning messages are smarter

Before: random pick from 4 content types.

Now: rules-based. The system:
- Won't send the same content type two days in a row
- Picks lighter content (check-in, gratitude) when the user is silent or struggling
- Caps "quotes" at 1 per week so they stay rare
- 60% of the time, biases toward content types that earn replies from this user
- 40% of the time, picks more randomly
- References yesterday's reply when it was substantive, but only if it fits naturally

### 5. Onboarding goes deeper

Before: 4 steps — welcome, name, phone, intention.

Now: 7 steps. Three new ones after intention:
- **Vision** — "If this manifested, what would your life look like?"
- **Obstacles** — "What's been getting in the way?"
- **Aligned-state** — "When do you feel most like yourself?"

These four answers (intention, vision, obstacles, aligned-state) are saved AND turned into the user's first memory blob immediately. So a brand-new user gets a personalized first message instead of a generic one.

### 6. Intention drift detection

The same Monday memory pass also looks for signs that a user's goal has shifted — maybe they signed up to manifest a new job but they've spent the last two weeks talking about their relationship.

When detected with enough confidence (60%+), the system writes a suggestion for you to review. You can:
- **Approve** — the system archives the old intention and creates a new one
- **Dismiss** — nothing changes

The system never updates intentions on its own. You decide.

### 7. New founder dashboard

`/dashboard/founder` now shows you:
- **Intention shift queue** at the top — pending suggestions to review
- **Per-user insights** — expand each user to see their memory blob, recent themes, sentiment trend (last 14 days as a colored bar), and reply rate by content type
- Existing message log and scheduling tools, unchanged

### 8. Timezone preference (UI only for now)

Users can set their preferred send hour in settings. The setting is saved but not yet honored — all messages still go out at 7:45 AM Pacific. We'll turn this on when we upgrade to Vercel Pro (which enables more frequent cron runs).

---

## What you can control without writing code

Three places in the Supabase dashboard let you tune the system without involving an engineer.

### Soft acknowledgement phrases

Table: `soft_acks`

Edit, add, or disable the short ack phrases. The system currently has 15:

- Got that.
- Holding this.
- Thank you.
- Sitting with that.
- Hearing you.
- Noted.
- Got it. Talk soon.
- Received. Thank you.
- That landed.
- Thanks for sharing.
- Holding what you said.
- Carrying that with me.
- Heard.
- Got you.
- Thanks, friend.

To change: open the table in Supabase, add new rows, or set `active = false` to retire one. Changes take effect immediately — no deploy needed.

### Content selection rules

Table: `content_selection_config` (one row, id = 1)

| Column | What it does | Default |
|---|---|---|
| `no_repeat_days` | Don't send the same content type within this many days | 1 |
| `earned_reply_bias` | Probability (0–1) of biasing toward types that earn replies | 0.60 |
| `earned_reply_min_sends` | Minimum sends before a content type counts toward reply-rate stats | 5 |
| `earned_reply_lookback_days` | How far back to compute reply rates | 30 |
| `quote_max_per_week` | Max number of "quote" messages per user per week | 1 |
| `silence_threshold` | Number of silent days before forcing lighter content | 3 |

Changes take effect on the next daily send.

### Intention shift confidence

Currently hardcoded at 0.6 (60% confidence). If false positives become annoying, raise it. If you suspect the system is missing real shifts, lower it. Right now this requires a small code change — let me know if you want it moved into the config table too.

---

## What it costs

At your current scale (small): under $5/month in AI costs total.

At 1,000 active users:
- Reply enrichment: ~$0.20/day
- Daily prompts: ~$0.20/day
- Weekly memory: ~$0.70/day (amortized)
- **Total: roughly $30/month**

If costs climb unexpectedly, the most likely culprit is too many inbound messages per user. The system enriches every inbound, and each one runs an AI call. STOP, HELP, and unknown numbers don't trigger AI calls, so spam isn't an issue.

---

## Your deployment steps

When you're back on your laptop:

1. **Pull the branch:**
   ```
   git checkout claude/document-skills-GSDID
   git pull origin claude/document-skills-GSDID
   ```

2. **Install dependencies and verify locally:**
   ```
   npm install
   npm run typecheck
   npm run lint:check
   npm run build
   ```

3. **Walk through onboarding in your browser:**
   ```
   npm run dev
   ```
   Sign up as a fresh user, complete all 7 steps. Confirm the new vision/obstacles/aligned-state screens feel calm and consistent.

4. **Verify the founder dashboard:** Visit `/dashboard/founder` — should now show intention shift queue and per-user insights sections (they'll be empty until the cron runs).

5. **Verify settings:** Visit `/dashboard/settings`, edit profile, confirm the "preferred send hour" picker shows up.

6. **Merge to main** to trigger production deploy.

7. **After deploy, test the ack flow:** reply to a daily prompt from your test phone. You should get either a soft ack or an AI mirror within about 5 seconds.

8. **Manually trigger the weekly memory cron once** so existing users get memory blobs immediately rather than waiting for next Monday:
   ```
   curl -H "Authorization: Bearer $CRON_SECRET" https://www.entiremind.com/api/cron/weekly-memory
   ```

9. **Check the founder page** — per-user insights should now populate.

---

## What to watch in the first week

- **Ack tone.** Especially the AI-generated mirrors on substantive replies. If they ever feel off (too therapist-y, too quick to give advice, robotic), the fix is to edit the prompt in `src/lib/ai/prompts/enrich.ts`. Tell me what to change and I'll iterate it.
- **Soft-ack repetition.** If "Got that." starts feeling stale, add more phrases to `soft_acks`.
- **Daily prompt quality.** Do morning messages feel like they're starting to reflect what users have said? After a week of replies + one Monday memory pass, you should be able to feel it.
- **Reply rate.** This is the north star. It should climb week over week as the system learns each user.

---

## What's deliberately not built yet

These were scoped out of Phase 1 intentionally — they're on the roadmap but require either more user data or a Vercel Pro upgrade.

- **Send at the user's preferred hour.** UI works, backend doesn't yet. Needs hourly crons, which need Vercel Pro.
- **True timezone-aware delivery.** Same dependency.
- **Embedding-based reply retrieval.** Right now memory captures themes but doesn't search across past replies semantically. Phase 3.
- **Bandit-style content selection.** Rules work fine today; replacing them with statistical optimization is overkill until you have hundreds of users with rich reply history. Phase 3.
- **User-facing insights surface.** Right now the memory blob is founder-only. Eventually we could show users "here's what we've noticed about your patterns." Phase 3.
- **Automatic intention updates without approval.** Founder approval gate stays in place until the system has proven it's reliable. Phase 4.

---

## Where to find things

| You want to... | Look here |
|---|---|
| Read the original PRD | `docs/prds/2026-05-12-content-engine-v2.md` |
| Read the technical implementation plan | `docs/plans/2026-05-12-content-engine-v2.md` |
| See what was built (technical) | `CLAUDE.md` (search "Content Engine v2") |
| Edit soft-ack phrases | Supabase → Table Editor → `soft_acks` |
| Tune content selection rules | Supabase → Table Editor → `content_selection_config` |
| Review intention shift suggestions | `/dashboard/founder` |
| See a user's memory | `/dashboard/founder` → expand the user's row |
| Trigger the weekly memory cron manually | `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/weekly-memory` |
| See enrichment data for a reply | Supabase → Table Editor → `messages` → `insights` column |
| See all themes a user has talked about | Supabase → Table Editor → `message_themes` filtered by user_id |

---

## When something feels off

Tell me, in plain language, what's bothering you. Examples:

- "The acks feel like a chatbot." → I'll tighten the enrichment prompt or trim the soft-ack library.
- "The morning messages are too samey." → I'll tweak the content selection rules or add more variety to the prompts.
- "Users are getting the same content type two days running." → Bug or config; I'll investigate.
- "The system suggested an intention shift that's clearly wrong." → I'll raise the confidence threshold or refine the detection prompt.
- "I want users to see their own memory." → That's a Phase 3 build but I can prioritize it.

You don't need to translate to technical language. Just describe the symptom and I'll figure out the fix.
