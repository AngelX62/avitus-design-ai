# Avitus Code Review Guidelines

Review all changes as if Avitus stores sensitive lead and customer data for multiple businesses.

## Highest Priority Issues

Flag these as serious issues:

- One studio can access another studio’s leads, imports, settings, projects, notes, reminders, memory, Avara sessions, or `agent_runs`.
- Queries do not filter by canonical `studio_id`.
- New tables or APIs introduce a second tenant key such as `business_id` without an explicit migration reason.
- Supabase RLS is missing or bypassed for tenant-scoped tables.
- Edge Functions use a service role key but do not verify studio membership server-side.
- API keys, service role keys, model keys, or private tokens are exposed in frontend code.
- Raw lead messages, full CSV rows, emails, phone numbers, secrets, or sensitive PII are logged unnecessarily.
- AI output is trusted without validation.
- AI call is made without writing an `agent_runs` row.
- Client-facing messages are sent automatically without owner approval.
- A Tier 3 or Tier 4 action fires without a matching approval row.
- Avara calls a tool outside the fixed toolbelt.
- Avara answers with cross-tenant data.
- Imported CSV data overwrites existing lead data without review.
- Extra imported columns are discarded instead of preserved as `custom_fields`.

## Product Fit Review

Flag features that make Avitus drift into a generic CRM or project management app.

Avitus should stay focused on:

- inbound lead capture
- lead cleanup
- lead qualification
- lead scoring
- follow-up preparation
- reminders
- import/export
- flexible custom fields
- Action Queue
- Avara

Avoid adding:

- full project management
- generic task management
- complex CRM bloat
- uncontrolled AI messaging
- direct WhatsApp/email/SMS sending without approval
- direct Instagram DM integration in V1
- two-way sync before one-way sync and conflict rules

## Client Readiness Review

Flag changes that confuse Client Readiness Intelligence with full project operations.

Allowed:

- budget readiness
- scope clarity
- timeline clarity
- consultation readiness
- site visit readiness
- financing readiness
- viewing readiness
- seller/listing readiness
- feasibility readiness for future architecture support
- missing information that blocks the next commercial step
- next best question or next owner action

Not allowed in V1:

- full project budgeting
- procurement
- FF&E tracking
- supplier quote management
- construction cost tracking
- transaction management
- broker commission management
- architecture time tracking
- utilization tracking
- phase billing
- full project management

Client Readiness should help the owner decide what conversation happens next before the opportunity goes cold.

## Commercial Value Review

Flag features that do not clearly support one of these outcomes:

- faster lead response
- cleaner lead data
- better lead prioritization
- fewer forgotten follow-ups
- more stale opportunities surfaced
- more owner-approved follow-up actions
- better visibility into pipeline risk
- more recovered opportunities from old leads or past clients

A feature is not automatically valuable because it uses AI.

Prefer features that help the owner answer:

- Who should I follow up with first?
- Which lead is going cold?
- What information is missing?
- Which old lead is worth reactivating?
- What action is ready for my approval?
- What opportunity might I lose if I do nothing?

Reject features that make Avitus feel impressive but do not help owners act on valuable opportunities.

## Build Order Review

Flag changes that skip the approved order:

1. Auth and tenant isolation
2. Public intake form
3. Lead record
4. Lead Inbox
5. Lead Detail
6. Paste Message
7. CSV import and custom fields
8. AI-ready analysis fields
9. V1.1 AI extraction and explainable scoring
10. Follow-up preparation
11. Action Queue
12. Avara fixed toolbelt
13. Follow-up intelligence
14. Seasonal/reactivation intelligence
15. Integration foundation

Commercial tiers do not justify bypassing the build order.

## Action Risk Tier Review

Every agent output must be tagged with a tier. The orchestrator, not the service or UI, enforces tier rules.

Flag issues when:

- An agent output is not tagged with a tier.
- A service upgrades its own tier.
- Tier rules are enforced only in the UI or service.
- Tier 3 or Tier 4 action fires without an approval row.
- A Tier 1 alert becomes a client-facing message.
- A Tier 2 draft is sent without owner click.
- Foundation studio gets Tier 2.
- Signature studio gets Tier 3.
- Bulk operation runs outside Bespoke or without campaign approval.

## Service Consolidation Review

Engineering implements five internal services.

Flag issues when:

- A new top-level agent codepath is created instead of extending one of the five services.
- A service calls another service directly.
- A service writes to the database directly.
- A service produces a side effect such as sending an email or mutating external tools.
- A new “agent” does not map onto one of the five services.
- Drafting logic is duplicated instead of using Communication Drafting.
- Deterministic detection logic lives outside Pipeline Signals.
- A service lacks one typed input and one typed output schema.

Five services:

- Lead Intelligence
- Communication Drafting
- Pipeline Signals
- Reporting
- Integration Payloads

## AgentContext and Prompt Pack Review

Every service receives typed `AgentContext`.

Flag issues when:

- A service takes ad hoc tenant parameters instead of `AgentContext`.
- A service loads tenant configuration on its own.
- Vertical-specific copy is hardcoded in service code.
- Brand voice is hardcoded instead of read from `AgentContext.brand_voice`.
- A studio is not pinned to a `prompt_pack_version`.
- `prompt_pack_version` is missing from `agent_runs`.
- Cache keys do not include `prompt_pack_version`.
- New verticals are implemented as code forks instead of Prompt Packs and scoring weights.

## Agent Observability Review

`agent_runs` is the spine of accuracy work.

Flag issues when:

- An AI call is made without `agent_runs`.
- `agent_runs` is missing `run_id`, `studio_id`, `service_name`, `model`, `prompt_pack_version`, `schema_version`, `tier`, `status`, `latency_ms`, or `cost_usd`.
- Owner corrections do not write to `human_correction_jsonb`.
- `agent_runs` is not `studio_id` scoped.
- `agent_runs` is not protected by RLS.
- Raw lead text is stored outside approved fields.
- Application logs contain PII or full raw messages.

## Avara Review

Avara is a fixed-toolbelt assistant.

Flag issues when:

- Avara calls tools outside the defined toolbelt.
- A tool lacks RLS enforcement.
- A tool lacks a tier tag.
- A tool does not verify studio membership.
- Avara bypasses the orchestrator.
- Avara reveals cross-tenant data.
- Avara leaks raw PII not requested by an authorized user.
- Avara performs Tier 3 or Tier 4 actions without approval.
- Avara behaves like a generic chatbot instead of a specialized lead intelligence assistant.

## Data Security and Privacy Review

Flag issues when:

- Raw PII appears in logs, URLs, telemetry, metrics, or error tracking.
- Raw CSV rows are logged.
- Raw lead text is duplicated across multiple tables.
- Retention/redaction policy is missing for `agent_runs.raw_text`.
- Deleted leads do not cascade/anonymize related AI/memory records where expected.
- Service role key is used in broad functions without minimal access checks.
- Prompt injection text from leads or CSVs is treated as trusted instructions.
- AI-generated content is displayed or saved without output validation.
- System prompts, hidden rules, or internal policies are exposed to users.

## Memory Review

Flag issues when:

- Memory records are not scoped by `studio_id`.
- Avara working memory persists across studio switches.
- Working memory becomes long-term memory automatically.
- One owner correction immediately mutates the studio profile.
- Raw text is copied into memory tables unnecessarily.
- Calibration jobs read corrections across studios.
- Cross-studio learning is added without anonymization and explicit approval.
- Vector memory/RAG/file memory/A-Mem-style linking is added in V1 without explicit justification.
- Procedural or resource memory is built before core Avara behavior is stable.

## Import Review

Flag issues when:

- Imported data overwrites existing leads without review.
- Unmapped columns are discarded instead of stored in `custom_fields`.
- Import preview is skipped.
- Rows needing review are silently imported as clean.
- Duplicates are merged without owner review.
- CSV data bypasses tenant checks.

## Integration Review

Flag issues when:

- Integration sends/pushes data without studio ownership checks.
- Integration sends external messages without approval.
- Two-way sync is built before one-way sync, conflict rules, and audit logs.
- CRM/Sheets overwrites Avitus data without source-of-truth rules.
- Integration logs contain raw PII unnecessarily.

## Seasonal and Reactivation Review

Flag issues when:

- Low-season alerts are generated without enough history.
- The system claims seasonality when it should show `Not enough lead history yet.`
- Recommendations do not explain why now, why this contact/segment, and what action is suggested.
- Reactivation or outreach sends without approval.
- Seasonal logic becomes generic mass outbound.

## Framework Review

Flag issues when:

- LangChain, LangGraph, CrewAI, or another framework is added in V1 without explicit need.
- A framework is used to bypass tier policy, RLS, schema validation, or approval gates.
- Decentralized agent-to-agent autonomy is introduced before the core workflow works.

## UX Review

The app should clearly answer:

- How did the lead enter Avitus?
- What did Avitus extract?
- Why did the lead receive this score?
- What is missing?
- What should the owner do next?
- Is owner approval required?

Keep the UI premium, calm, focused, and operational.

## AI Evaluation Review

Before enabling live AI qualification for production, require an evaluation set.

Minimum eval set:

- 20 interior design leads
- 20 real estate leads
- 10 messy or incomplete leads
- 10 duplicate/import leads
- 10 prompt-injection or malicious lead messages

The eval should test:

- field extraction
- missing information detection
- client readiness status
- score input quality
- classification suggestion
- recommended next action
- follow-up draft safety
- no cross-tenant data access
- no fake output when AI is disabled
- prompt injection resistance

Flag issues when:

- AI output is accepted without schema validation
- AI produces a score directly instead of score inputs where deterministic scoring is required
- prompt-injection text changes system behavior
- generated follow-up text is treated as sent or approved
- failed AI runs do not write `agent_runs`
- failed AI runs make the lead unusable instead of falling back to manual review

## Production Readiness Review

Before production launch or customer data import, verify:

- all tenant-scoped tables use canonical `studio_id`
- RLS is enabled on every tenant-scoped table
- Edge Functions verify studio membership server-side
- frontend env variables are browser-safe only
- service role keys are never exposed to frontend code
- raw lead messages and full CSV rows are not logged
- public intake rejects raw public `studio_id`
- CSV import preserves unmapped columns as `custom_fields`
- no hardcoded mock data appears as production fallback
- no fake AI output appears when AI is disabled
- Action Queue signals are backed by real data or deterministic rules
- `agent_runs` exists and is RLS-protected
- approval rows exist before Tier 3 or Tier 4 external actions are implemented
- deletion or redaction behavior is documented for leads, raw AI text, and studios
- lint, typecheck, tests, and build pass before deployment
