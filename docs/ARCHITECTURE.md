# Avitus Architecture — v2.9 / Avara Update

Avitus is an AI-native lead intelligence web app for property businesses.

Avara is the lower-right AI assistant inside the Avitus web app. Avara is the owner-facing interface to the Central Lead Intelligence Orchestrator.

## Product Identity

Avitus is:

- an AI Lead Agent and lead intelligence layer
- a web app for property businesses
- a lead cleanup and scoring product
- an Action Queue for urgent lead work
- a preparation layer before or beside a CRM

Avitus is not:

- a generic CRM
- a full project management system
- a broad automation agency
- an uncontrolled autonomous sales agent
- a generic mass outbound platform

## Architecture Principle

Avitus does the thinking and preparation automatically. Action Risk Tiers define whether the owner sees nothing, sees an Action Queue item, sees a prepared draft, or is asked for approval before anything leaves the studio.

The product remains AI-native, but the engineering is intentionally controlled:

- centralized orchestration
- five consolidated services
- typed inputs and outputs
- schema validation
- deterministic scoring
- tiered approval
- tenant isolation
- `agent_runs` observability
- fixed Avara toolbelt
- cost discipline
- degraded mode when AI is unavailable

## Central Lead Intelligence Orchestrator

The Central Lead Intelligence Orchestrator owns workflow order, context loading, service chaining, output validation, deterministic scoring, tier enforcement, persistence, audit records, and Action Queue routing.

Specialist services do not freely call each other. They do not make final business decisions. They do not write to the database directly. They do not trigger external actions.

Canonical inbound pipeline:

```txt
Lead input
  -> Orchestrator
    -> load AgentContext, Prompt Pack, schema
    -> Lead Intelligence Service
      -> extraction
      -> classification suggestion
      -> summary
      -> missing information
      -> schema validation
      -> deterministic score calculation
    -> Communication Drafting Service when Tier 2 is allowed
    -> Pipeline Signals Service for duplicate/stale/hot signals
    -> persist lead, score breakdown, prepared action
    -> write agent_runs rows
    -> surface Action Queue item when needed
  -> Owner reviews, edits, copies, approves, or acts manually
```

## Five Internal Services

Engineering implements five internal services. The twelve product-facing capability names are UI/marketing vocabulary, not twelve independent code services.

### 1. Lead Intelligence

Handles extraction, cleanup, classification suggestions, summaries, missing information, recommended next action, and score inputs.

Covers:

- Intake Cleanup
- Qualification
- Import Mapping where AI is needed
- Nurture signal side

Recommended next actions are vertical-aware outputs from the Lead Intelligence Service. They must use AgentContext, the Studio Qualification Profile, the selected Prompt Pack, vertical-specific lead fields, and scoring weights.

## Lead Intelligence Output Contract

Lead Intelligence must return structured output only.

Minimum output shape:

```ts
type LeadIntelligenceOutput = {
  extracted_fields: {
    full_name?: string;
    email?: string;
    phone?: string;
    source?: string;
    project_type?: string;
    property_type?: string;
    lead_type?: string;
    location?: string;
    budget_range?: string;
    property_value?: string;
    timeline?: string;
    scope?: string;
    style_preference?: string;
    financing_status?: string;
    viewing_readiness?: string;
    seller_motivation?: string;
  };

  summary?: string;

  missing_information: string[];

  client_readiness?: {
    status: string;
    reasons: string[];
    blockers: string[];
    next_best_question?: string;
  };

  score_inputs: {
    budget_fit?: string;
    timeline_fit?: string;
    location_fit?: string;
    scope_clarity?: string;
    project_type_fit?: string;
    intent_clarity?: string;
    financing_readiness?: string;
    contact_completeness?: string;
  };

  classification_suggestion?: 'Hot' | 'Warm' | 'Cold' | 'Not Fit' | 'Needs Review';

  recommended_next_action?: string;

  confidence: number;
};

#### Client Readiness Outputs

The Lead Intelligence Service may produce Client Readiness outputs as part of extraction, scoring support, missing information, and recommended next action.

Client Readiness outputs are vertical-aware.

For interior design, readiness may include budget readiness, scope clarity, timeline clarity, consultation readiness, site visit readiness, and proposal follow-up risk.

For real estate, readiness may include financing readiness, viewing readiness, seller motivation, listing readiness, location clarity, timeline urgency, and follow-up risk.

For future architecture support, readiness may include feasibility readiness, site ownership clarity, project stage, permit/zoning awareness, decision-maker clarity, scope creep risk, and fee-fit risk.

These outputs must be schema-validated, tenant-scoped, and tagged with an Action Risk Tier.

Foundation may surface deterministic readiness signals only.

Signature may use AI to explain readiness and prepare Tier 2 follow-up drafts.

Bespoke may connect readiness outputs to external workflows only with approval-gated Tier 3 or Tier 4 controls.

Do not create a separate Readiness Agent. Readiness belongs inside Lead Intelligence and Pipeline Signals.

### 2. Communication Drafting

One drafting engine for follow-up, reactivation, check-in, and outreach drafts. Tone comes from the Studio Qualification Profile and `brand_voice`.

Covers:

- Follow-Up
- Reactivation
- Past Client Check-In
- Outbound Outreach

### 3. Pipeline Signals

Mostly deterministic detectors. LLM is only a tiebreaker for ambiguous cases.

Covers:

- Duplicate Detection
- Stale Lead
- Hot Lead
- Low-Season

### 4. Reporting

Batch or scheduled reporting service for weekly summaries, lead movement, source performance, and owner-readable action recommendations.

Covers:

- Reporting
- Weekly opportunity report

### 5. Integration Payloads

Prepares schema-mapped payloads for external tools. Handles redaction, mapping, sync metadata, and audit metadata.

Covers:

- Integration
- Prospecting payloads

## Action Risk Tier Model

Every service output is tagged with a tier.

| Tier | Name | Covers | Notification | Approval |
| --- | --- | --- | --- | --- |
| 0 | Silent | extract, score, classify, summarize, missing info | none | none |
| 1 | Surface | reminders, duplicate flags, stale/hot alerts, internal notes | Action Queue | none |
| 2 | Prepare | follow-up, reactivation, check-in, outreach drafts | Action Queue | owner click to send/copy |
| 3 | External | WhatsApp, email, SMS, pricing, booking, disqualification, CRM final push | Action Queue | per-action approval |
| 4 | Restricted | bulk reactivation, batch outreach, mass status changes, integration backfills | dedicated screen | campaign approval, Bespoke only |

Tier rules:

- Enforced by the orchestrator, not the UI or service.
- A service cannot upgrade its own tier.
- Tier 3 and Tier 4 require approval rows even if cancelled later.
- Foundation runs Tier 0 and Tier 1.
- Signature unlocks Tier 2.
- Bespoke unlocks Tier 3 and Tier 4.

## Opportunity Recovery Loop

The long-term product advantage is the Opportunity Recovery Loop.

1. Capture messy lead data.
2. Clean and structure the lead.
3. Score and classify the opportunity.
4. Detect missing information, stale status, duplicate risk, or follow-up risk.
5. Surface the item in the Action Queue.
6. Avara explains why it matters.
7. Avara prepares the next action.
8. Owner reviews, edits, copies, approves, or rejects.
9. Owner correction is written to `agent_runs.human_correction_jsonb`.
10. Stable patterns improve studio-specific calibration over time.

This loop is how Avitus becomes more useful for each studio without becoming an uncontrolled autonomous agent.

### Studio Preference Calibration Loop

Avara should improve over time by detecting repeated owner approval and rejection patterns.

The Central Lead Intelligence Orchestrator should capture owner corrections and outcomes through `agent_runs.human_correction_jsonb`, lead status history, approvals, rejections, won/lost outcomes, and draft edits.

Stable patterns may become calibration suggestions for scoring, missing-info priority, recommended next actions, Priority Leads, and follow-up tone.

Services must not silently rewrite studio preferences. The orchestrator should route stable calibration suggestions for owner review before updating Core Memory or the Studio Qualification Profile.

## Avara

Avara is the lower-right AI assistant inside the web app.

Avara is:

- specialized for interior design studios and real estate teams
- connected to the Central Lead Intelligence Orchestrator
- tenant-scoped by `studio_id`
- powered by a fixed toolbelt
- allowed to chat and take low-risk internal actions
- approval-gated for external/client-facing actions

Avara can answer:

- What needs attention today?
- Which hot leads have not been contacted?
- Why was this lead scored Warm?
- Draft a follow-up for this lead.
- Which leads are missing budget or timeline?
- Find stale warm leads from the last 60 days.
- Are we entering a slower lead period?
- Help me map this imported spreadsheet.
- Prepare my weekly opportunity report.

Avara can take low-risk internal actions:

- create reminders
- prepare drafts
- surface Action Queue items
- flag duplicates
- summarize leads
- explain scores
- help map columns
- prepare reports

Avara cannot perform external/client-facing actions without approval.

## Avara Toolbelt

Avara tools should be typed Edge Functions with RLS and tier tags.

Initial tool categories:

- `query_leads`
- `get_lead_detail`
- `explain_score`
- `pipeline_metrics`
- `create_internal_reminder`
- `draft_follow_up`
- `find_stale_leads`
- `find_duplicates`
- `prepare_weekly_report`
- `suggest_import_mapping`

No arbitrary tool use. No hidden external sends. No cross-tenant queries.

## AgentContext

The orchestrator builds `AgentContext` once per workflow and passes it to services.

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

Services must not load tenant configuration independently.

### Budget Conversation Style

`AgentContext.qualification_profile` may include `budget_conversation_style`.

Lead Intelligence and Communication Drafting must respect this setting when budget is missing or unclear.

A service must not hardcode one budget-question style for all studios. Prompt Packs may vary budget handling by vertical, but the Studio Qualification Profile is the final studio-level preference.

## Prompt Packs

Prompt Packs are versioned bundles keyed by `(service, vertical, language)`.

Each pack contains:

- system prompt
- few-shot examples
- output schema
- tier policy notes
- vertical-specific language
- tone constraints

Rules:

- Stored in the database, not hardcoded in service code.
- Each studio is pinned to a pack version.
- Studios may use stable, beta, or pinned channels.
- Bad prompt releases roll back the pack, not the deploy.
- `prompt_pack_version` is written to `agent_runs`.
- Cache keys include `prompt_pack_version`.

## Agent Observability

Every AI call writes an `agent_runs` row.

Minimum fields:

```sql
run_id, studio_id, lead_id, agent_name, service_name,
model, prompt_pack_version, schema_version,
input_hash,
structured_output_jsonb, raw_text,
tier, status, confidence, latency_ms, cost_usd,
human_correction_jsonb, created_at
```

`agent_runs` is used for:

- debugging
- calibration
- prompt evaluation
- owner correction capture
- cost analysis
- failure diagnosis
- auditability

Raw lead text should be stored only where explicitly allowed, preferably in `agent_runs.raw_text` with retention/redaction rules.

## Cost Architecture

Use cost controls from the start:

- prompt caching for static Prompt Pack prefix
- batch processing for imports
- smaller/cheaper models for extraction/classification where quality is acceptable
- stronger models for drafting and Avara when needed
- per-studio monthly cost ceiling
- `cost_usd` on `agent_runs`
- graceful degraded mode when AI is unavailable or budget exhausted

## Runtime Substrate

V1.0 to V1.1:

- Supabase Edge Functions
- direct model calls
- schema validation
- deterministic scoring
- database-backed state

V1.3+:

- introduce Inngest or Trigger.dev for durable retries, idempotency, fan-out/fan-in, and observable workflows

LangGraph only becomes a candidate if a future Bespoke engagement truly requires durable multi-step agent workflows with human-in-the-loop branching.

CrewAI is not a V1 dependency.

## Failure Contract

Every agent/service run should return one of:

- `success`
- `partial`
- `failed`

Failures should not break the lead record. If AI fails, keep the lead usable, show the failure state, and allow manual owner action.

## V1 Scope Boundary

Do not build yet:

- direct Instagram DM integration
- direct WhatsApp/email/SMS sending
- generic CRM bloat
- full project management
- two-way sync
- advanced outbound automation
- decentralized agent autonomy
- LangChain/LangGraph/CrewAI as default V1 dependencies