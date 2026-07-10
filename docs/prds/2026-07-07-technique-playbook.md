# Technique Playbook

**Status:** Draft
**Author:** Blair Beauchemin
**Date:** 2026-07-07
**Target launch:** stacked on PR #9 (quote library + weekly editions)

---

## Summary

Give the daily SMS a **method**. Today the morning message is an LLM freestyling
in a calm voice with no methodology beneath it. The Technique Playbook is a
curated, founder-editable library of distilled thinking-tools — from books like
*Designing Your Life*, *Don't Believe Everything You Think*, *The Mountain Is
You*, and neuroscience-of-manifestation work — stored as **prompt recipes** the
generation engine selects from, matched to each user's cognitive-distortion
profile and current emotional state. Techniques arrive as **questions that
enact** the tool, never lessons.

## Background

**Grounding.** Entiremind's competitive edge is learning velocity and the depth
of the relationship — persona (distortions, archetype, tone), enrichment
(sentiment, themes), and memory are already rich. What's missing is *substance*:
an answer to "why this question today?" beyond a content-type rotation. This is
the "aha moment" investment — where Entiremind stops being a tone of voice and
becomes a system with a point of view (see `docs/methodology.md`).

The design reuses the just-shipped quote library (PR #9) end to end:
`techniques` ↔ `quotes`, `messages.technique_id` ↔ `messages.quote_id`,
`GeneratedMessage.techniqueId`, `SendSmsOptions.techniqueId`,
`scripts/digest-techniques.ts` ↔ `scripts/import-quotes.ts`.

## Goals

1. **Enact, not teach.** Every technique becomes one short question; the tool is
   never named or explained to the user (`docs/methodology.md`).
2. **Add forever without code.** Digest script drafts techniques from book notes
   → founder reviews/activates in the dashboard.
3. **Edit without deploys.** Full founder CRUD + Supabase; all targeting and
   recipes are data.
4. **Learn per technique.** Every send is tagged `technique_id`; reply rate
   accrues automatically.
5. **Zero regression.** No eligible technique (or the probability roll) → the
   exact current generic prompt path runs.
6. **Safety.** Struggling/withdrawn users only receive `gentle` techniques.

## Non-goals (v1)

- Signal-weighted (bandit) selection — deferred until there's reply data;
  `priority` + matching carry v1.
- Cross-tab analytics (reply-rate-by-distortion), A/B recipe variants.
- Surfacing techniques or sources to end users. The library is internal.
