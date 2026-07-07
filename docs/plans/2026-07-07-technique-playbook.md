# Technique Playbook — Implementation Plan

**PRD:** `docs/prds/2026-07-07-technique-playbook.md`
**Branch:** `claude/technique-playbook` (stacks on `claude/motivational-quotes-app-review-uzmn14` / PR #9)
**Date:** 2026-07-07

---

## Architecture overview

```
                 buildUserContext(userId)
                          │  (persona distortions, sentiment, silence, memory)
                          ▼
                 selectContentType(context)  ──► "quote"? ──► quote fast-path (returns)
                          │
                          ▼
              pickTechniqueForUser(context, contentType)
                          │   roll(technique_apply_probability)
                          │   load active techniques
                          │   filterEligible (content type · gentle-if-fragile · tone · no-repeat)
                          │   scoreTechnique (+3 distortion, +2 sentiment, +1 category, +priority, +jitter)
                          ▼
        technique | null ─┴─► buildUserPrompt(context, contentType, technique)
                                  │   technique ? recipe-frame : getContentTypePrompt
                                  ▼
                          adapter.generateMessage → GeneratedMessage{ text, contentType, techniqueId }
                                  ▼
                          sendSms(..., { techniqueId }) → messages.technique_id
                                  ▼
                    reply / silence → signal machinery → per-technique reply rate
```

## Files

**New**
- `supabase/migrations/019_techniques.sql` — table (internal RLS), `messages.technique_id`, config knobs, 10 seed techniques.
- `src/lib/techniques/types.ts`, `src/lib/techniques/index.ts` (`pickTechniqueForUser`, pure `filterEligible` + `scoreTechnique`), `src/lib/techniques/index.test.ts`.
- `scripts/digest-techniques.ts` — notes.md → Sonnet drafts → `status='draft'`.
- `src/app/api/founder/techniques/route.ts` — `requireFounder`; create/update/activate/retire.
- `src/components/dashboard/technique-playbook.tsx` — list + stats + edit-in-place + create.
- `docs/methodology.md`, this plan, the PRD.

**Modified**
- `src/lib/ai/types.ts` — `GeneratedMessage.techniqueId`.
- `src/lib/ai/prompts.ts` — `buildUserPrompt(..., technique?)` recipe frame.
- `src/lib/ai/index.ts` — `pickTechniqueForUser` after content-type selection; thread `techniqueId`.
- `src/lib/sms/index.ts` — `SendSmsOptions.techniqueId`; `technique_id` in the three inserts.
- `src/app/api/cron/daily-send/route.ts` — pass `techniqueId`.
- `src/app/dashboard/founder/page.tsx` — Technique Playbook section + `buildTechniquePlaybook` stats.

## Config knobs (`content_selection_config`)

- `technique_apply_probability` DECIMAL default `0.50` — share of sends carrying a technique; `0` disables instantly.
- `technique_no_repeat_count` INT default `10` — recent techniques excluded per user.

## Scoring

`+3` distortion overlap · `+2` sentiment fit (empty = any) · `+1` category fit (empty = any) · `+ priority` · `+ random()*0.5` jitter. Highest score wins; empty eligible set → `null` → generic path.

## Verification

See PRD goals; steps in the plan file (`/root/.claude/plans/...`). Summary:
migration + `select … from techniques`; `npm run test:run` (scoring/filter);
generation smoke with `technique_apply_probability=1`; regression with `=0`;
digest script → drafts; founder flow; `typecheck && lint:check && build`.
