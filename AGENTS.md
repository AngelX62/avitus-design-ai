# Avitus / Avitus Leads — Repo Instructions

Use this file as the slim entry point for Claude Code, Codex, and other coding agents.

Avitus is an AI-native lead intelligence web app for property businesses, starting with interior design studios and real estate teams.

Avara is the lower-right AI assistant inside the Avitus web app. Avara is not a generic chatbot. It is the owner-facing interface to the Central Lead Intelligence Orchestrator.

## Source of Truth

This file is the entry point. Load deeper docs only when relevant:

- `docs/PRODUCT_BRIEF.md` — product strategy, tiers, verticals, roadmap, positioning.
- `docs/ARCHITECTURE.md` — v2.9 service model, Avara, Action Risk Tiers, AgentContext, Prompt Packs, runtime.
- `docs/SECURITY.md` — data security, privacy, tenant isolation, secrets, PII, approval gates.
- `docs/MEMORY.md` — Avara memory architecture, correction capture, calibration, retention.
- `docs/CODE_REVIEW.md` — review checklist before finalizing changes.

The product architecture PDF is high-level context only. Markdown rules override the PDF for implementation.

## Product Context

Avitus helps property businesses capture, clean, qualify, prioritize, nurture, reactivate, and prepare follow-up for leads.

It turns messy inbound inquiries, pasted client messages, imported CSV/Google Sheets data, old leads, and past-client records into clean, scored, actionable opportunities.

Avitus is not:

- a generic CRM
- a full project management system
- a broad automation agency
- an uncontrolled autonomous sales agent
- a generic mass outbound tool

Keep the app focused on lead capture, cleanup, qualification, prioritization, follow-up preparation, reminders, import/export, Action Queue, and Avara.

## Build Order

Protect this order unless the user explicitly asks otherwise:

1. Supabase Auth and tenant isolation.
2. Public intake form.
3. Lead record.
4. Lead Inbox.
5. Lead Detail.
6. Paste Message flow.
7. CSV import and `custom_fields` preservation.
8. AI-ready analysis fields and safe empty/failure states.
9. V1.1 AI extraction and explainable scoring.
10. Follow-up preparation.
11. Action Queue.
12. Avara fixed toolbelt.
13. Follow-up intelligence.
14. Seasonal/reactivation intelligence.
15. Integration foundation.

Do not build outbound, CRM sync, Google Sheets sync, WhatsApp/email sending, or advanced automation before the core lead workflow works end-to-end.

## Core Architecture

Avitus uses a Central Lead Intelligence Orchestrator.

The orchestrator coordinates five internal services:

- Lead Intelligence
- Communication Drafting
- Pipeline Signals
- Reporting
- Integration Payloads

Twelve product-facing capabilities map onto those services:

- Intake Cleanup
- Qualification
- Follow-Up
- Nurture
- Import Mapping
- Duplicate Detection
- Low-Season
- Reactivation
- Reporting
- Past Client Relationship
- Prospecting
- Integration

Do not create twelve separate top-level agent codepaths. New intelligence work should map to one of the five services.

Services do not call each other, persist directly, or produce side effects. The orchestrator chains services, validates outputs, enforces tier policy, persists results, and writes `agent_runs` rows.

## Action Risk Tiers

Every agent/service output is tagged with a tier. The orchestrator enforces tier rules before persistence and before side effects.

- Tier 0 silent: extract, score, classify, summarize, missing info detection. No notification, no approval.
- Tier 1 surface: reminders, duplicate flags, stale/hot alerts, internal notes. Action Queue, no approval.
- Tier 2 prepare: drafted follow-up, reactivation, check-in, or outreach text. Owner click required to send or copy.
- Tier 3 external: WhatsApp, email, SMS, pricing, booking, disqualification, CRM final push, mark Lost when client-facing. Per-action approval.
- Tier 4 restricted: bulk reactivation, batch outreach, mass status changes, integration backfills. Bespoke only, campaign approval.

Foundation runs Tier 0 and Tier 1 only. Signature unlocks Tier 2. Bespoke unlocks Tier 3 and Tier 4.

## Foundation Intelligence Baseline

Foundation must not be built as a passive tracker only.

Even in the no-key pilot, Foundation should include lightweight rule-based intelligence that helps the owner know what needs attention.

Foundation should surface:

- Action Queue basics
- Priority Leads
- stale lead flags
- follow-ups due
- overdue reminders
- missing budget, timeline, scope, contact, or location flags
- possible duplicate warnings
- import rows needing review
- lead status health
- simple revenue-risk messages such as “This lead has had no follow-up in 7+ days.”

These signals may be deterministic in V1.0 and do not require live AI.

Foundation should help owners answer:

- Who needs attention today?
- Which leads are going cold?
- What information is missing?
- Which leads may be worth saving?

Live AI scoring, AI-generated follow-up drafts, autonomous outreach, CRM sync, WhatsApp/email/SMS sending, and advanced automation still belong to V1.1, Signature, or Bespoke.

## Avara Rules

Avara is the lower-right AI assistant in the web app.

Avara can chat with owners, answer pipeline questions, explain scores, summarize leads, draft follow-ups, create low-risk internal actions, surface Action Queue items, and help with imports.

Avara must use a fixed, typed, tenant-scoped toolbelt. It must not call arbitrary tools, bypass the orchestrator, bypass `studio_id`, or perform external/client-facing actions without approval.

Avara should adapt to studio-specific approval patterns over time, but only through explainable, repeated, `studio_id`-scoped evidence. One correction or approval must not silently change scoring, recommendations, or studio preferences.

## Memory Rules

Avara uses a bounded memory architecture.

Six conceptual memory types exist, but Avitus implements the first four across the V1.x roadmap and defers procedural and resource memory:

- Core Memory: stable studio preferences from Studio Qualification Profile, including business type, target budget, preferred locations, preferred project/property types, brand voice, follow-up tone, prompt pack version, and qualification settings.
- Episodic Memory: lead-specific history such as status changes, notes, reminders, owner edits, classification overrides, draft edits, and `agent_runs.human_correction_jsonb`.
- Semantic Memory: stable learned patterns derived from repeated owner corrections, such as common lead-quality signals, repeated objections, preferred wording, frequent missing information, and calibrated studio-specific interpretation.
- Working Memory: temporary Avara session context, including current page, selected lead, current import, recent messages, and current Action Queue context.
- Procedural Memory: deferred. Do not let Avitus learn autonomous workflows or new procedures from history in V1.
- Resource Memory: deferred. Do not add file/document memory, vector RAG, uploaded-resource memory, or broad knowledge-base memory in V1.

Memory rules:

- All memory must be scoped by canonical `studio_id`.
- Avara must never mix memory across studios.
- Working memory must expire on session end, logout, or studio switch.
- Working memory must not be promoted into long-term memory automatically.
- One owner correction must not immediately change the studio profile.
- Stable patterns may update `studio_voice_profile` or calibration settings only after repeated evidence and owner-safe review.
- Raw lead text must not be copied into multiple memory tables.
- Raw lead text belongs only where explicitly allowed, such as `agent_runs.raw_text`, with retention and redaction rules.
- Do not add embeddings, vector memory, A-Mem-style linking, MemoryOS, MIRIX-style multimodal memory, or RAG memory in V1 unless explicitly requested and justified.

## Security Rules

- Use `studio_id` as the canonical tenant key.
- Enforce Supabase RLS on tenant-scoped tables.
- Verify studio membership server-side in Edge Functions.
- Never expose service role keys, model API keys, private tokens, or secrets in frontend code.
- Keep AI calls server-side.
- Validate structured AI output before saving.
- Every AI call writes `agent_runs`.
- Do not log raw lead messages, full CSV rows, emails, phone numbers, secrets, or sensitive PII in application logs.
- Do not trust frontend filtering for tenant security.

## AgentContext

Every service receives a typed `AgentContext` built by the orchestrator. Services do not load tenant config on their own.

```ts
type AgentContext = {
  studio_id: string;
  vertical: 'interior_design' | 'real_estate';
  language: 'id' | 'en';
  qualification_profile: QualificationProfile;
  brand_voice: BrandVoice;
  currency: string;
  prior_outputs: AgentOutput[];
  schema_version: string;
  prompt_pack_version: string;
  run_id: string;
  requested_tier: 0 | 1 | 2 | 3 | 4;
};
```

## Prompt Packs

Prompts are versioned bundles keyed by `(service, vertical, language)`. Prompt Packs live in the database, not hardcoded in code. A studio is pinned to a Prompt Pack version in Settings.

New verticals ship as new Prompt Packs and scoring weights, not forks of the codebase.

## Commands

Use the project’s actual package scripts. When available, run:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

If a command does not exist, say so and run the closest available check.