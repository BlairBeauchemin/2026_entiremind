# Entiremind Methodology — House Editorial Stance

This is the document that keeps the Technique Playbook coherent as it grows.
Every technique — seeded, hand-written, or drafted by the digest script — must
sit inside the stance below. When in doubt, this file wins.

## The synthesis: thoughts are material, not master

Entiremind draws on sources that appear to disagree. Manifestation work says
your thoughts shape your reality. Cognitive/defusion work (*Don't Believe
Everything You Think*) says your thoughts are unreliable and shouldn't be
obeyed. Design thinking (*Designing Your Life*) says stop thinking and go
prototype. Self-sabotage work (*The Mountain Is You*) says your patterns are
protecting you.

Our reconciliation, and the line the whole product speaks from:

> **Thoughts are material, not master.** You don't obey your thoughts and you
> don't fight them — you choose which ones to feed, and you act to gather
> evidence for the life you're building.

This lets thought-skepticism and manifestation coexist: a thought is raw
material you can notice, question, and put down (defusion), *and* attention is
generative, so what you dwell on and act toward compounds (manifestation).
Prototyping is how you feed the useful thoughts with evidence.

## Voice

- Calm, warm, lightly magical. Never hustle-culture, clinical, preachy, or
  productivity-flavored.
- No emojis. Under 160 characters for SMS.
- We are a companion, not a coach. We don't explain, teach, or diagnose.

## The core rule: enact, don't teach

A technique is a way of *asking*, never a lesson. The user must never see the
technique named or explained — they just receive one question that quietly does
the work.

- ❌ "Cognitive defusion means noticing thoughts as passing mental events."
- ✅ "That worry from earlier — if it were weather, what would it be, and is it
  really the whole sky?"

Every `prompt_recipe` is an instruction to the generator to turn an idea into
ONE enacting question. If a recipe could be read as advice, it's wrong.

## IP hygiene

Ideas are not copyrightable; expression and branded exercises are. We build
techniques *informed by* books, never copies of them.

- Distill the idea into our own words.
- Give every technique a fresh **house name** that is ours, not the book's.
- Never reproduce an author's named/branded exercise or verbatim phrasing.
- `source_title` / `source_author` are **internal lineage only** — never
  surfaced to users in SMS or the dashboard-facing product. Credit thinkers, if
  at all, only in the weekly email ("this week draws on ideas from …").

## Safety

- Techniques flagged `gentle` are the only ones served to users who are
  struggling (last-reply sentiment) or withdrawn (silence streak). Anything
  that asks for effort, action, or confrontation must be `gentle = false`.
- Never push harder on someone who's quiet or hurting. The system encodes this
  in selection; writers must set `gentle` honestly.
- If a technique touches genuinely heavy territory, keep the question open and
  low-pressure — an invitation, never a demand.

## How techniques enter the library

1. Founder reads a book, pastes takeaways (+ a `Source:` line) into a markdown
   file.
2. `npx tsx scripts/digest-techniques.ts <notes.md>` drafts technique rows in
   this voice, following the rules above, and inserts them as `status='active'`.
   **Running the script is the decision** — there is no second approval step.
3. Review happens after the fact on `/dashboard/founder`: per-technique reply
   rate accrues automatically (every send is tagged), the recipe and targeting
   are editable in place, and anything that doesn't land gets retired.

The rails that protect users are in the selection logic, not in a review queue:
a technique marked `gentle = false` never reaches someone struggling or
withdrawn, and setting `technique_apply_probability = 0` disables the whole
system instantly, without a deploy. That is what makes shipping-by-default safe
here — write `gentle` honestly and the system cannot misuse the library.

The one thing no technique may ever do is rewrite what the user said they want.
A technique changes how we *ask*; the intention itself is the user's, and only
the user edits it.
