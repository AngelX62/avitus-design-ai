# Avitus / Avara Memory Architecture

Avara uses bounded product memory, not unrestricted agent memory.

The purpose of memory is to make Avara more useful for a specific studio while preserving tenant isolation, privacy, explainability, and owner control.

## Memory Philosophy

Memory should help Avara remember stable business preferences, lead history, owner corrections, and active session context.

Memory should not become a hidden autonomous brain.

Memory must not let Avara:
- mix tenant data
- retain unnecessary PII
- invent long-term facts from one interaction
- learn unsafe external-action behavior
- bypass Action Risk Tiers
- build broad RAG or file memory in V1

## Conceptual Memory Types

Avitus recognizes six conceptual memory types:

1. Core Memory
2. Episodic Memory
3. Semantic Memory
4. Working Memory
5. Procedural Memory
6. Resource Memory

Avitus implements the first four across the V1.x roadmap and defers procedural and resource memory.

## Core Memory

Core Memory stores stable studio-level preferences.

Examples:
- studio/business name
- vertical: `interior_design` or `real_estate`
- currency
- target budget range
- preferred locations
- preferred project/property types
- ideal client profile
- low-fit warning signs
- signature style or market focus
- brand voice
- follow-up tone
- prompt pack version
- qualification profile settings

Source of truth:
- Studio Qualification Profile
- studio settings
- prompt pack pinning
- studio voice profile where approved

Core Memory must be explicitly set or owner-approved. It should not update silently from a single Avara chat.

- budget conversation style: direct, soft discovery, consultation first, or education first

## Episodic Memory

Episodic Memory stores specific historical events.

Examples:
- lead status changes
- notes
- reminders
- follow-up history
- owner draft edits
- classification overrides
- field corrections
- owner-approved or rejected actions
- previous `agent_runs`
- Action Queue outcomes

Source of truth:
- lead status history
- lead notes
- reminders
- prepared actions
- `agent_runs`
- `human_correction_jsonb`

Episodic Memory should answer questions like:
- “What happened with this lead?”
- “When did we last follow up?”
- “What did the owner change?”
- “Which recommendations were ignored or approved?”

## Semantic Memory

Semantic Memory stores stable patterns derived from repeated evidence.

Examples:
- this studio prefers warmer follow-up language
- leads below a certain budget are often marked low-fit
- owner often corrects “Warm” to “Hot” when timeline is urgent
- common missing fields for this studio are budget and site visit timing
- specific locations are often outside service range
- real estate leads with financing unclear usually need follow-up questions first

Semantic Memory must be derived cautiously.

Rules:
- do not update from one correction
- require repeated evidence
- preserve auditability
- keep changes explainable
- allow rollback or review
- scope every pattern by `studio_id`

Avara may detect repeated owner preferences around budget conversation style, such as owners consistently removing direct budget questions from drafts.

This should become an explainable calibration suggestion, not an automatic behavior change.

## Working Memory

Working Memory is temporary Avara session context.

Examples:
- current page
- current selected lead
- current import session
- current Action Queue filter
- current chat turn
- current owner request
- recent tool results

Rules:
- expires on session end, logout, or studio switch
- must not cross studios
- must not become permanent automatically
- should not store raw PII longer than needed
- should not be used as authorization

Working Memory helps Avara answer context-aware questions like:
- “Draft a follow-up for this lead.”
- “Why is this one Warm?”
- “Create a reminder for tomorrow.”
- “What should I do next?”

## Deferred Memory Types

### Procedural Memory

Deferred in V1.

Procedural Memory would store learned workflows, repeated action patterns, or studio-specific operating procedures.

Do not implement this in V1 because it can create unsafe automation drift.

### Resource Memory

Deferred in V1.

Resource Memory would store documents, files, uploaded assets, external knowledge bases, embeddings, or vector-search memory.

Do not implement this in V1. Avoid RAG, vector memory, broad file memory, or uploaded-resource memory unless explicitly requested and justified.

## Owner Correction Loop

Owner corrections are calibration signals, not immediate truth.

Examples:
- owner edits a follow-up draft
- owner changes classification
- owner corrects extracted budget
- owner marks recommendation as not useful
- owner approves or rejects an action

Correction flow:
1. correction is written to `agent_runs.human_correction_jsonb`
2. correction is linked to `studio_id`, `lead_id`, `service_name`, `prompt_pack_version`, and `schema_version`
3. repeated patterns are reviewed or aggregated
4. stable patterns may update studio voice/profile/calibration settings
5. single corrections do not automatically update Core or Semantic Memory

## Tenant Isolation

Every memory record must be scoped by `studio_id`.

Avara must never:
- retrieve memory across studios
- summarize one studio’s behavior to another studio
- use owner corrections from one studio to personalize another studio
- reuse working memory after studio switch
- expose raw lead data through memory retrieval

RLS and server-side ownership checks are required for all persisted memory records.

## Privacy and Retention

Do not duplicate raw lead text across memory stores.

Raw lead text may exist only in explicitly approved locations such as `agent_runs.raw_text`, subject to retention and redaction rules.

Do not store:
- full CSV rows in logs
- phone numbers in telemetry
- emails in URLs
- raw WhatsApp/Instagram messages in generic memory tables
- secrets, tokens, or service role keys
- cross-tenant memory summaries

Prefer storing:
- structured fields
- redacted summaries
- hashed input references
- owner correction metadata
- stable profile settings
- non-sensitive calibration signals

## V1 Implementation Boundary

Allowed in V1/V1.1:
- Studio Qualification Profile as Core Memory
- lead status history and notes as Episodic Memory
- `agent_runs.human_correction_jsonb` for calibration
- temporary Avara Working Memory
- cautious studio voice profile updates later
- no cross-tenant memory
- no vector memory
- no RAG memory
- no autonomous procedural memory

Not allowed in V1:
- broad vector database memory
- file/document RAG memory
- multimodal resource memory
- automatic workflow learning
- memory-driven external sends
- cross-studio calibration
- hidden personalization that cannot be explained