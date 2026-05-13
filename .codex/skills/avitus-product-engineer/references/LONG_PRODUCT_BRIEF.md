# Avitus Product Brief

## Product Name

Avitus

## Product Category

AI Lead Agent and lead intelligence layer for property-related businesses.

Initial verticals:
- Interior design studios
- Real estate agencies / real estate teams

## One-Sentence Description

Avitus turns messy inbound inquiries, pasted client messages, imported Google Sheets/CSV lead data, old leads, and past-client records into clean, scored, actionable opportunities so property businesses know who to follow up with, nurture, reactivate, or prospect next.

## Core Product Promise

Avitus helps property-related businesses reduce manual data entry, clean messy lead information, qualify leads faster, and prepare follow-up actions while keeping the owner or sales team in control.

The core value is not “AI automation” by itself.

The core value is:

- Less manual lead admin
- Cleaner lead data
- Faster lead qualification
- Clearer prioritization
- Better follow-up preparation
- More visibility into which leads matter

## Strategic Pivot

Avitus originally started as a Make.com automation service for inbound leads.

The product direction has shifted.

Instead of leading with “we automate your inbound leads,” Avitus should lead with:

“Avitus helps you capture, clean, qualify, and act on inbound leads faster.”

Make.com may still be used later as an integration layer, but it should not be the core product.

The core product is a web app with:
- lead capture
- lead cleanup
- lead qualification
- explainable lead scoring
- follow-up preparation
  - manual notes/templates in V1.0
  - AI-prepared follow-up drafts in V1.1 / Signature
- reminders
- import/export
- flexible custom fields

## Documentation Source Of Truth

Use `AGENTS.md` as the repo entry point. Use this file for product strategy, tiers, verticals, roadmap, and positioning. Use `docs/ARCHITECTURE.md` for the service/orchestration model, `docs/SECURITY.md` and `THREAT_MODEL.md` for security posture, and `docs/CODE_REVIEW.md` as the canonical review checklist.

The product architecture PDF is high-level architecture context. It should not override the Markdown rules for V1 scope, tenant isolation, RLS enforcement, build order, or review standards.

## Commercial Tier Model

Commercial tiers describe packaging and roadmap depth. They do not override the implementation order.

### Foundation - Lead Inbox

Foundation is the operational lead inbox. It helps teams replace scattered inquiries and messy spreadsheets with a clean, tenant-separated place to capture, review, track, and follow up with leads.

Foundation includes the public intake form, Lead Inbox, Lead Detail, Paste Message, CSV import, basic column mapping, custom fields, notes, status changes, manual follow-up notes, reminders, owner-written follow-up templates, lead statistics, won lead to project conversion, and tenant-separated workspace.

Foundation can be sold as a no-key pilot. Live AI scoring is not required for V1.0.

### Signature - AI Lead Agent

Signature adds the intelligence layer. It includes live AI extraction and summary, explainable scoring support, classifications, missing information, suggested next action, AI follow-up drafts, duplicate detection, stale lead detection, hot lead alerts, weekly opportunity report, basic low-season detection, and past-client check-in suggestions.

### Bespoke - Demand Engine

Bespoke adds custom operating logic and integration depth. It may include CRM or Google Sheets sync, WhatsApp/email/calendar workflows, advanced routing, custom dashboards, team roles, approval-based sends, client-specific scoring, reactivation campaigns, referral outreach, property-specific prospecting, and bespoke workflow logic.

Tier scope rule: Foundation, Signature, and Bespoke are commercial packaging and roadmap concepts. Build V1.0 core first, then activate AI, imports, follow-up intelligence, seasonal intelligence, and integrations in order.

## Commercial Tier Boundary

Foundation, Signature, and Bespoke are commercial packaging and roadmap concepts.

They do not change the V1 implementation order unless explicitly requested.

Build the V1 core workflow first: public intake form, lead record, lead inbox, lead detail, structured analysis, explainable score, and owner-approved follow-up.

Do not implement Signature or Bespoke features before the Foundation workflow is working end-to-end.

## What Avitus Is

Avitus is an AI Lead Agent and lead intelligence layer for property businesses.

It helps businesses turn messy lead information, stale opportunities, and past-client records into clean, useful, prioritized lead records and owner-approved next actions.

A messy inquiry, intake form submission, pasted WhatsApp/Instagram message, or messy spreadsheet goes in.

A clean, scored, actionable lead record comes out.

## What Avitus Is Not

Avitus is not a generic CRM.

Avitus is not a full project management platform.

Avitus is not a broad automation agency.

Avitus is not a tool that sends uncontrolled AI messages to prospects.

Avitus is not trying to replace every sales tool in v1.

Avitus should stay focused on inbound lead cleanup, qualification, prioritization, and follow-up preparation.

## Target Users

Initial users are property-related businesses that receive high-value inbound leads.

Primary initial users:
- Interior design studio owners
- Interior design sales/admin teams
- Real estate agents
- Real estate teams
- Small real estate agencies

Potential later users:
- Architecture studios
- Renovation companies
- Property developers
- Luxury property consultants
- Property management firms

## Main Pain Points

These businesses often receive leads from many places:

- Instagram DMs
- WhatsApp
- Website forms
- Referrals
- Email
- Google Sheets
- Phone calls
- Manual notes

Their lead data often becomes messy.

Common problems:
- Too many spreadsheet columns
- Inconsistent lead statuses
- Missing contact details
- Duplicate leads
- Old leads mixed with active leads
- Unclear budget information
- Unclear timeline information
- Leads not followed up quickly
- Good leads buried inside messy sheets
- Owners wasting time manually entering data
- No clear way to know which lead matters most

## V1.0 / V1.1 Boundary

V1.0 Foundation Core / No-Key Pilot should work without live AI.

V1.0 proves the operational workflow: invite-only access, tenant-scoped data, public intake form, pasted-message lead creation, CSV import, Lead Inbox, Lead Detail, notes, reminders, status changes, basic statistics, and won lead to project conversion.

AI-ready columns and empty states may exist in V1.0, but live AI extraction, scoring, classification, missing information, recommended next action, and generated follow-up drafts belong to V1.1 unless the user explicitly asks to activate AI earlier.

V1.1 AI Qualification adds structured extraction, schema-validated AI output, explainable score support, classification, missing information, recommended next action, and owner-approved suggested follow-up.

## Core Workflow

The core workflow is:

1. A lead enters Avitus through one of three methods:
   - Public intake form
   - Paste Message
   - Import Sheet

2. Avitus stores the lead.

3. Avitus extracts important details.

4. Avitus creates a clean lead record.

5. Avitus scores and classifies the lead.

6. Avitus explains why the lead is Hot, Warm, Cold, Not Fit, or Needs Review.

7. Avitus recommends the next best action.

8. Avitus drafts a follow-up message.

9. The business owner or team reviews, edits, copies, approves, or acts manually.

## Central Lead Intelligence Orchestrator

Avitus uses a Central Lead Intelligence Orchestrator pattern.

For product language, Avitus is the AI Lead Agent. For engineering language, treat it as a controlled orchestrator that coordinates five bounded internal services through predictable server-side workflows.

The orchestrator is responsible for:
- choosing the correct workflow for a lead, import, reminder, stale opportunity, report, or integration event
- calling the five consolidated services in a controlled order
- validating structured outputs before anything is saved
- applying deterministic scoring rules and Action Risk Tier policy
- enforcing tenant ownership and `studio_id` boundaries
- writing audit-friendly activity records to `agent_runs`
- keeping client-facing and external actions approval-gated by tier

Do not implement Avitus as a fully decentralized multi-agent system in V1. Specialist services should not freely call each other, make final business decisions, or bypass the orchestrator, policy layer, database, schema validation, tenant checks, or owner approval.

Canonical V1 inbound pipeline:

```txt
Lead input
→ Central Lead Intelligence Orchestrator
  → loads AgentContext, prompt pack, schema
  → Lead Intelligence Service (extract, score, classify, summarize)
    → schema validation
    → deterministic score calculation
  → Communication Drafting Service (Tier 2 prepared draft)
  → Pipeline Signals Service (duplicate check)
  → persist (lead, score breakdown, prepared draft)
  → write agent_runs entries
  → surface in Action Queue
→ Owner reviews, edits, copies, approves, or acts manually
```

This keeps Avitus agentic without making it uncontrolled. Detailed service boundaries, tier policy, and observability rules live in AGENTS.md and SKILL.md.

## Product Capabilities and the Five Services

Avitus may use agent language in the product, but each capability is implemented as a bounded server-side intelligence function with clear inputs, structured outputs, schema validation, database-backed state, and owner approval boundaries.

There are 12 product-facing capabilities. Engineering implements them through 5 consolidated internal services. The 12 names appear in the UI, marketing, and Action Queue. The 5 services are the actual codepaths. AGENTS.md and SKILL.md describe the boundary rules.

| Internal service | What it does | Product-facing capabilities |
| --- | --- | --- |
| Lead Intelligence | Extracts, scores, classifies, summarizes, surfaces missing info, recommends next action. | Intake Cleanup, Qualification, Import Mapping, Nurture (signal side) |
| Communication Drafting | One drafting engine. Different inputs produce different message shapes. Tone driven by Qualification Profile and brand voice. | Follow-Up, Reactivation, Past Client Check-In, Outbound Outreach |
| Pipeline Signals | Mostly deterministic detectors. LLM is used only as a tiebreaker. | Duplicate Detection, Stale Lead, Hot Lead, Low-Season |
| Reporting | Batch and scheduled runtime. Aggregates statistics, highlights movement, summarizes the week. | Reporting, weekly opportunity report |
| Integration Payloads | Schema-mapped payloads for external tools. Handles redaction, field mapping, and audit metadata. | Integration, Prospecting payloads |

The 12 names remain valid product vocabulary. They do not justify 12 separate services in code.

These are product and intelligence functions. They do not justify adding LangChain, LangGraph, CrewAI, uncontrolled tool use, or autonomous client-facing actions in V1.

## Avara

Avara is the owner-facing AI assistant inside the web app. It lives in the lower-right of the interface and is available across every page.

Avara is a tool-calling agent with a fixed toolbelt. It is not a planner, a generic chatbot, or an autonomous sender. Each tool is typed, tenant-scoped, RLS-enforced, and tagged with an Action Risk Tier. Avara can answer questions about the studio's leads and pipeline, prepare drafts, and surface items in the Action Queue. It cannot send client-facing messages on its own.

Detailed toolbelt entries and rules live in AGENTS.md and SKILL.md.

## Lead Entry Methods

### 1. Public Intake Form

This is the automatic v1 workflow.

Each business gets a public Avitus intake form link.

A prospect fills out the form.

The lead automatically appears inside the Avitus dashboard.

Avitus then analyzes the lead, scores it, and prepares the next action.

### 2. Paste Message

This is the fast manual workflow.

The owner may receive a lead through WhatsApp, Instagram DM, email, SMS, or referral.

The owner copies the messy message and pastes it into Avitus.

Avitus extracts the important information and creates a clean lead record.

This flow must be mobile-friendly because many owners handle leads from their phone.

### 3. Import Sheet

This is the messy Google Sheets / CSV cleanup workflow.

The business uploads an existing CSV exported from Google Sheets.

Avitus detects columns, suggests mappings, preserves extra columns as custom fields, imports the leads, and runs cleanup and qualification.

This is important because many businesses already manage leads in messy spreadsheets.

## Flexible Data Model

Avitus must not force every business into one rigid lead structure.

Different businesses track different fields.

Interior design studios may track:
- project type
- property type
- location
- budget
- timeline
- style preference
- renovation scope
- designer assigned
- consultation date
- site visit date
- quotation status
- payment status

Real estate teams may track:
- buyer, seller, renter, landlord, investor
- property type
- preferred location
- budget
- property value
- financing status
- timeline
- viewing availability
- listing status
- agent assigned
- property source

Avitus should support core fields plus flexible custom fields.

The main lead inbox should remain clean.

Extra imported fields should be preserved under Custom Fields, not shown everywhere by default.

## Core Product Features for V1

V1 should include:

- Studio/team login
- Studio/team-specific data
- Public intake form
- Lead inbox
- Lead detail page
- Paste Message flow
- CSV import
- Column mapping
- Custom fields preservation
- AI-ready structured lead analysis
- Lead score
- Hot/Warm/Cold/Not Fit/Needs Review classification
- Suggested next action
- Manual follow-up template or placeholder
- Follow-up reminders
- Possible duplicate detection
- Simple project conversion from won leads
- Studio Qualification Profile
- `agent_runs` observability table
- Action Risk Tier enforcement in the orchestrator
- Avara toolbelt scaffolding

## Main Navigation

Use this navigation:

- Overview
- Lead Inbox
- Import
- Intake Form
- Projects
- Settings

Do not include a Designs section in v1.

Projects should stay simple.

A project is created only when a lead is marked Won or Converted.

Do not build full project management yet.

## Overview Page

The Overview page should answer:

“What needs attention today?”

Metrics:
- Hot leads waiting
- New leads
- Needs review
- Follow-ups due
- Possible duplicates

Recent Activity should show:
- New intake form submissions
- Pasted-message leads
- Imported sheet leads
- Status changes
- Follow-up reminders
- Leads converted to projects

Quick actions:
- Import Sheet
- Paste Message
- Copy Intake Link
- View Hot Leads

## Action Queue

Owners should not need to constantly check the web app to discover urgent work.

Avitus should surface high-priority work through an Action Queue and internal alerts while keeping the web app as the source of truth.

The Action Queue should prioritize:
- hot leads waiting for review
- prepared follow-up drafts ready to copy, edit, or approve
- follow-ups due today
- leads going cold
- possible duplicates needing review
- missing information that blocks qualification
- stale warm leads worth reactivating
- past-client check-in opportunities
- low-season recommendations
- integration or export items requiring approval

Action Queue items should clearly show what happened, why it matters, what Avitus recommends next, and whether owner approval is required.

Internal alerts may notify the owner or team that action is needed, but they must not become client-facing messages unless the owner explicitly approves the external action.

## Lead Inbox

The Lead Inbox should show all leads in a clean, prioritized way.

It should support:
- Board view
- Table view
- Filters
- Search
- Classification badges
- Status badges

Board columns:
- New
- Needs Review
- High-Fit
- Contacted
- Consultation Booked
- Won
- Lost

Each lead card should show:
- Lead name
- Project/property type
- Location
- Budget range
- Lead score
- Classification
- Recommended next action
- Lead source
- Last activity

## Lead Detail Page

Each lead detail page should include:

### Lead Overview

- Name
- Contact info
- Lead source
- Status
- Lead score
- Classification
- Recommended next action
- Last contacted date
- Next follow-up date

### Raw Inquiry

Show the original form submission, pasted message, or imported notes.

### AI Summary

Show a short summary of the opportunity.

### Extracted Fields

Show important structured fields.

For interior design:
- project type
- property type
- location
- budget
- timeline
- style preference
- urgency
- lead source

For real estate:
- lead type
- buyer/seller/renter/investor
- property type
- location
- budget or property value
- timeline
- financing/readiness
- urgency
- lead source

### Score Breakdown

The score should be explainable.

The UI should show what contributed to the score.

Do not make the score feel like a black-box AI guess.

### Missing Information

Show what still needs to be asked.

### Client Readiness

Show whether the lead is ready for the next commercial step.

For interior design, this may include budget readiness, scope clarity, consultation readiness, site visit readiness, and proposal follow-up risk.

For real estate, this may include financing readiness, viewing readiness, seller motivation, listing readiness, and follow-up risk.

In Foundation, this should be deterministic and rule-based.

In Signature, Avara may explain readiness and prepare owner-approved follow-up drafts.

### Follow-Up Preparation

In V1.0/Foundation, show manual follow-up notes, owner-written templates, or an empty prepared-follow-up placeholder.

In V1.1/Signature, show an AI-prepared suggested follow-up draft as a Tier 2 prepared action.

Buttons:
- Copy Message
- Edit Message
- Mark as Contacted
- Create Reminder

Do not automatically send client-facing messages in v1.

### Custom Fields

Show preserved imported fields from messy Google Sheets or CSV files.

### Notes and Status History

Allow internal notes.

Show status changes over time.

## Scoring Models

Avitus should use vertical-specific scoring templates.

The AI may interpret messy text, but rules should decide the score. The orchestrator computes the deterministic score from extracted fields and the studio's weights. The Lead Intelligence Service produces extracted fields and a classification suggestion. Disagreement between the two is logged on `agent_runs` as a calibration signal.

### Interior Design Lead Scoring

100-point model:

- Budget fit: 30 points
- Timeline fit: 20 points
- Location fit: 15 points
- Project type fit: 15 points
- Decision-maker readiness: 10 points
- Clarity and completeness: 10 points

### Real Estate Lead Scoring

100-point model:

- Budget / property value fit: 25 points
- Timeline urgency: 20 points
- Location fit: 15 points
- Lead intent clarity: 15 points
- Financing / readiness: 15 points
- Contact completeness: 10 points

Classifications:
- Hot
- Warm
- Cold
- Not Fit
- Needs Review

### Client Readiness Intelligence

Avitus should help owners understand whether a lead is ready for the next commercial step.

Client Readiness Intelligence is not full project management, budgeting software, procurement, transaction management, or financial operations. It is a pre-sale intelligence layer that helps the owner decide what conversation should happen next.

For interior design studios, Avitus should assess:

- budget readiness
- scope clarity
- timeline clarity
- property readiness
- consultation readiness
- site visit readiness
- proposal follow-up risk

Budget readiness should not mean “budget mentioned or not mentioned.”

Some studios want to ask for budget early. Other studios prefer to discuss price only after scope, style, consultation readiness, or expectations are clearer.

Missing budget should usually mean:

“Needs budget clarification.”

It should not automatically mean:

“Low fit.”

Budget Readiness states may include:

- Budget stated
- Budget missing but scope looks promising
- Budget unclear and scope unclear
- Budget may not match requested scope
- Budget conversation should wait until consultation
- Needs expectation-setting before proposal

For real estate teams, Avitus should assess:

- financing readiness
- viewing readiness
- seller motivation
- listing readiness
- location clarity
- budget or property-value clarity
- timeline urgency
- follow-up risk

Real estate readiness states may include:

- Ready for viewing
- Needs financing clarification
- Needs location narrowing
- Seller intent unclear
- Listing readiness unclear
- High-intent lead waiting
- Follow-up risk

For future architecture support, Avitus may assess:

- feasibility readiness
- site or property ownership clarity
- project stage
- permit or zoning awareness
- decision-maker clarity
- scope creep risk
- fee-fit risk

Architecture support is a later vertical. Do not build architecture-specific project profitability, time tracking, utilization, billing, procurement, or full project management in V1.

Client Readiness Intelligence should answer:

- Is this lead ready for consultation, viewing, proposal, or follow-up?
- What information is blocking progress?
- What conversation should happen next?
- What opportunity might be lost if the owner waits?

In Foundation, readiness signals may be deterministic and rule-based.

In Signature, Avara and the Lead Intelligence Service may explain readiness, summarize why it matters, and prepare owner-approved follow-up drafts.

In Bespoke, readiness may be connected to CRM, Google Sheets, WhatsApp, email, calendar, or custom workflows, but client-facing actions still require owner approval.

## Studio Qualification Profile

Settings should include a Studio Qualification Profile.

This profile shapes scoring, recommendations, and follow-up messaging. It is loaded into `AgentContext` for every service call.

Fields:
- Business name
- Business type: Interior Design Studio or Real Estate Agency
- Currency
- Target budget minimum
- Target budget maximum
- Preferred project/property types
- Preferred locations
- Ideal client description
- Low-fit warning signs
- Signature styles or market focus
- Follow-up tone
- Intake form intro
- Thank-you message

Settings should also include Prompt Pack pinning per studio (stable, beta, or pinned channel) and a per-studio monthly cost ceiling for AI usage.

## Operating Autonomy Model

Avitus is autonomous for low-risk internal work and approval-gated for external consequences.

Engineering implements this through a five-tier Action Risk Tier model. Every agent output is tagged with a tier. The orchestrator enforces tier rules before persistence and before any side effect.

- Tier 0 silent: extract, score, classify, summarize. No notification, no approval.
- Tier 1 surface: reminders, duplicate flags, stale and hot alerts, internal notes. Surfaces in the Action Queue.
- Tier 2 prepare: drafted follow-up, reactivation, check-in, or outreach text. Saved as a prepared action. Owner click required to send or copy.
- Tier 3 external: send WhatsApp, email, SMS, pricing, booking, disqualification, CRM final push. Per-action owner approval.
- Tier 4 restricted: bulk operations including mass reactivation, batch outreach, integration backfills. Bespoke only. Campaign approval required.

The owner should not approve every small internal step. The approval gate appears when the action has external consequence, irreversible business meaning, or client-facing impact.

Foundation studios run Tier 0 and Tier 1 only. Signature unlocks Tier 2 prepared drafts. Bespoke unlocks Tier 3 external sends and Tier 4 restricted bulk operations.

Tier rules are enforced in the orchestrator, not at the service or UI layer. Detailed tier exceptions, audit row requirements, and edit semantics live in AGENTS.md and SKILL.md.

## Outbound Opportunity Strategy

Avitus may later support outbound opportunity generation, but it should remain property-specific, relationship-aware, and owner-approved.

Outbound should focus on:
- stale lead reactivation
- past-client check-ins
- referral opportunities
- low-season campaigns
- net-new prospect identification when appropriate

Avitus should not become a generic Apollo, Clay, or Instantly clone. The Communication Drafting Service identifies, drafts, and prepares outreach. Sends are Tier 3 and require owner approval.

## Seasonal Opportunity Layer

The seasonal layer turns lead statistics into action.

The Pipeline Signals Service detects when pipeline activity slows down and the orchestrator surfaces approved opportunity plays such as stale lead reactivation, past-client check-ins, referral outreach, revisiting lost proposals, old consultation follow-ups, or property-specific prospecting.

Start deterministic before complex machine learning. Useful signals include:

- lead volume
- qualified leads
- hot leads waiting
- consultation or viewing activity
- won/lost movement
- follow-up activity
- lead source performance
- stale lead count

A practical first rule is: if qualified leads are down roughly 30-40% versus the prior 30/60/90-day average for two or more weeks, surface a low-season alert.

If there is not enough history, show: `Not enough lead history yet.`

Every recommendation should explain:

- why now
- why this contact, segment, or opportunity
- what action is suggested
- what message should be drafted
- whether owner approval is required

Tier placement:

- Foundation shows lead statistics.
- Signature adds low-season detection, stale lead reminders, and basic reactivation suggestions.
- Bespoke adds custom low-season campaigns, referral systems, CRM/Sheets data, prospect lists, and approval-based outreach workflows.

## AI Agent Positioning

Avitus should feel AI-native, but controlled and trustworthy.

The primary AI concept is the Avitus AI Lead Agent. Internally, this is a Central Lead Intelligence Orchestrator coordinating five consolidated services, not a free-roaming autonomous chatbot.

The AI Lead Agent reviews inbound leads, extracts important details, cleans messy information, scores the opportunity, recommends the next best action, and prepares follow-up.

The agent should advise, prepare, and automate internal admin work.

The agent should not send client-facing messages, pricing, booking links, disqualification messages, WhatsApp messages, emails, or SMS without owner approval.

Avitus should not be positioned as a free-roaming autonomous sales agent. It should be positioned as a controlled AI lead agent for property businesses.

## Positioning

Primary positioning:

Avitus is an AI Lead Agent and lead intelligence layer for property businesses.

It captures, cleans, qualifies, nurtures, and prepares follow-up for inbound leads from forms, messages, and messy spreadsheets. As the product matures, it also helps surface stale leads, past-client check-ins, referral opportunities, low-season actions, and property-specific prospects.

Alternative positioning:

Avitus turns messy lead data into clean, qualified opportunities.

Avitus helps property businesses know who to follow up with first.

Avitus is a lead intelligence inbox for interior design studios and real estate teams.

## Opportunity Recovery Engine

Avitus should be priced and built around opportunity recovery, not basic lead tracking.

The product should help owners identify revenue leakage inside:

- missed follow-ups
- stale high-fit leads
- old imported spreadsheets
- unclear or missing budget, timeline, scope, contact, or location information
- proposal follow-ups
- past-client check-ins
- slow lead-flow periods
- leads that are strong but not yet qualified

The core premium product surfaces are:

- Revenue Risks
- Priority Leads
- Action Queue
- Opportunity Recovery labels
- Weekly Owner Briefing
- Avara Opportunity Review
- studio-specific preference calibration

Each surfaced opportunity should explain:

- why it matters
- what is missing
- what risk exists if ignored
- what action should happen next
- whether owner approval is required

Do not build this as generic analytics. The goal is not more charts. The goal is to help the owner recover, protect, and convert opportunities that would otherwise be missed.

## Product Differentiation

Avitus is different from a spreadsheet because spreadsheets only store messy data.

Avitus cleans, scores, prioritizes, and explains leads.

Avitus is different from a generic CRM because it focuses on:
- messy inbound lead cleanup
- vertical-specific qualification
- AI-assisted lead scoring
- imported sheet cleanup
- follow-up preparation

Avitus is different from a Make.com workflow because it has a product interface, database, user accounts, lead history, scoring logic, and a qualification profile.

Make.com can be used later for integrations, but it is not the core product.

## Tech Stack Direction

Recommended stack:
- Frontend/app: existing codebase from Lovable, hardened with Codex
- Database: Supabase Postgres
- Auth: Supabase Auth
- Tenant isolation: canonical `studio_id` plus enforced Supabase Row Level Security on all tenant-scoped tables, and verify ownership server-side in Edge Functions
- AI: Anthropic Claude or OpenAI structured outputs, server-side only, with prompt caching on the static prefix and Message Batches API for bulk imports
- Per-task model tiering: Haiku-class for extraction and classification, Sonnet-class for drafting and Avara
- Runtime: Supabase Edge Functions for V1.0 to V1.1; Inngest or Trigger.dev introduced at V1.3 for durable workflows
- Hosting: Vercel or similar
- Later integrations: Make.com webhooks for WhatsApp, email, Google Sheets, and CRM actions

## Agent Framework Decision

Avitus v1 should not use LangChain, LangGraph, or CrewAI by default.

V1 should use direct server-side AI calls through Supabase Edge Functions or trusted backend code, with structured JSON outputs and schema validation.

The first AI workflow is:

Lead input → AI extraction → schema validation → explainable scoring → saved lead analysis → AI-prepared follow-up draft for owner review.

At V1.3, when stale-lead sweeps, low-season detection, weekly reports, and large CSV imports all land at once, introduce Inngest or Trigger.dev for durable retries, idempotency keys, fan-out and fan-in, and observable workflow state. Both are TypeScript-native and integrate cleanly with Supabase.

LangGraph becomes a candidate only if a future Bespoke engagement requires durable multi-step agent workflows with human-in-the-loop branching. Not before.

CrewAI may be considered later only if Avitus truly needs multiple specialized agents working together.

Do not add agent frameworks before the core lead workflow is working.

## Implementation Roadmap

Build the product core before outbound, sync, and advanced integrations.

### V1.0 - Foundation Core / No-Key Pilot

Purpose: a lead can enter Avitus and become a clean operational lead record.

Deliverables: auth, tenant-scoped database, public intake form, Lead Inbox, Lead Detail, basic settings, demo seed data only, paste message flow, notes, status, reminders, basic stats, won lead to project conversion. `agent_runs` table provisioned. Action Risk Tier model wired. Action Queue skeleton. Avara stub with read-only Tier 0 tools.

#### Foundation Intelligence Baseline

Foundation should not feel like a passive lead tracker.

Even without live AI, Foundation should include lightweight deterministic intelligence that helps the owner know what needs attention.

Foundation should surface:

- Action Queue basics
- Priority Leads
- follow-ups due
- overdue reminders
- stale lead flags
- possible duplicate warnings
- missing budget, timeline, scope, contact, or location flags
- import rows needing review
- lead status health
- simple revenue-risk messages such as “This lead has had no follow-up in 7+ days.”

These signals may be rule-based in V1.0 and do not require live AI.

Foundation should help owners answer:

- Who needs attention today?
- Which leads are going cold?
- What information is missing?
- Which leads may be worth saving?

Do not add AI-generated scoring, AI-written follow-up drafts, autonomous outreach, CRM sync, WhatsApp/email/SMS sending, or advanced automation to Foundation. Those belong to V1.1, Signature, or Bespoke.

### V1.1 - AI Qualification

Purpose: messy lead data becomes structured, scored, and explainable.

Deliverables: Lead Intelligence Service live with structured extraction, score breakdown, classification, missing information, recommended action. Communication Drafting Service for follow-up. First Prompt Packs for interior design and real estate. Prompt caching on the static prefix. Avara toolbelt expanded with `query_leads`, `get_lead_detail`, `explain_score`, `pipeline_metrics`.

### V1.2 - Import Intelligence

Purpose: existing messy sheets become useful inside Avitus.

Deliverables: CSV upload, column preview, mapping, custom field preservation, import summary, rows needing review, duplicate detection. Message Batches API for imports.

### V1.3 - Follow-Up Intelligence

Purpose: owners act faster on serious leads.

Deliverables: Pipeline Signals Service for duplicates, stale leads, hot leads. Follow-up reminders, weekly reports, internal alerts, follow-up due dashboard. Inngest or Trigger.dev introduced for durable workflows.

### V1.4 - Seasonal and Reactivation Layer

Purpose: Avitus detects slow periods and surfaces overlooked opportunities.

Deliverables: low-season detection, stale lead recommendations, past-client check-ins, referral opportunity suggestions, low-season opportunity report. Communication Drafting Service for reactivation and check-ins. Tier 2 expansion.

### V1.5 - Integration Foundation

Purpose: Avitus sends clean lead intelligence to the tools clients already use.

Deliverables: Integration Payloads Service. CSV export, Google Sheets export, webhooks, background jobs, Make.com bridge, external mappings, sync logs. Tier 3 enabled.

### V2.0 - Bespoke Demand Engine

Purpose: Avitus connects to the client operating stack with controlled automation.

Deliverables: CRM push, WhatsApp/email workflows, calendar, routing, approval-based sends, property-specific prospecting. Tier 4 unlocked.

## Long-Term Vision

Long term, Avitus can become the inbound lead operating system for property-related businesses.

Future features may include:
- Google Sheets live sync
- WhatsApp Business integration
- Email integration
- Calendar booking
- CRM export
- Automated internal follow-up reminders
- Approval-based message sending
- Weekly lead reports
- Team assignment
- Lead source analytics
- Conversion analytics
- Vertical templates for architecture, renovation, development, and property management

But v1 should stay focused.

## Integration Strategy

Avitus should not try to replace every tool a business already uses.

The long-term strategy is to become the lead intelligence layer that cleans, scores, and prepares inbound leads, then sends the clean version to the tools owners already use.

Integration priority:
1. CSV import/export
2. Google Sheets export
3. Webhooks
4. Google Sheets one-way sync
5. CRM push
6. WhatsApp/email/calendar workflows
7. Two-way sync only for Bespoke clients

Make.com may be used as an integration bridge for advanced clients, especially before native integrations are worth building.

## V1 Principle

Do not overbuild.

Sample data is allowed only for local development, demo seeds, or empty-state previews. Production flows should use database-backed records and should not fall back to hardcoded sample data.

Do not build:
- full project management
- direct Instagram DM integration
- direct WhatsApp sending
- two-way Google Sheets sync
- advanced email automation
- generic CRM bloat
- LangChain, LangGraph, or CrewAI

Build:
- public intake form
- lead inbox
- paste message to create lead
- CSV import with column mapping
- flexible custom fields
- AI-ready lead analysis
- explainable lead score
- manual follow-up template or placeholder in V1.0; AI-prepared follow-up draft in V1.1/Signature
- follow-up reminders
- simple project conversion from won leads
- qualification profile
- `agent_runs` observability
- Action Risk Tier enforcement
- Avara toolbelt scaffolding

## Inbound and Outbound Scope

Avitus supports two growth motions:

### Inbound Lead Agent

The Inbound Lead Agent handles people already coming in.

Responsibilities:
- capture inbound inquiries
- clean messy lead data
- qualify and score leads
- identify missing information
- recommend next action
- draft owner-approved follow-up
- support lead nurturing
- prevent hot leads from going cold

Inbound lifecycle:
Capture → Clean → Qualify → Prioritize → Nurture → Prepare Follow-Up → Convert

### Outbound Opportunity Agent

The Outbound Opportunity Agent helps create or reactivate demand.

Responsibilities:
- identify new prospect opportunities
- surface stale leads worth reactivation
- maintain past-client relationships
- suggest referral outreach
- detect low-season opportunity gaps
- rank outbound opportunities
- draft owner-approved outreach
- track response and nurture status

Outbound lifecycle:
Identify → Research → Score → Segment → Draft Outreach → Owner Approves → Track Response → Nurture

Outbound should not be generic mass outreach. It should be property-specific, relationship-aware, and approval-based. Outbound drafting is Tier 2. Sending is Tier 3.

## Core Product Test

The finished MVP should clearly answer:

How does a lead get into Avitus?

Answer:
Intake Form, Paste Message, or Import Sheet.

What does Avitus do with the lead?

Answer:
It cleans the data, extracts important fields, scores the lead, summarizes the opportunity, recommends the next action, and prepares a follow-up message.

Does Avitus automatically message clients?

Answer:
Not in v1. The owner approves, copies, or edits client-facing communication.

What makes Avitus different from a spreadsheet?

Answer:
Spreadsheets store messy lead data. Avitus turns messy lead data into clean, scored, actionable lead records.

What makes Avitus different from a generic CRM?

Answer:
Avitus is built for property-related businesses and focuses on lead cleanup, qualification, prioritization, and follow-up preparation.

## Future Outbound Data Model

Do not build this before the V1 lead workflow works end-to-end.

Future outbound or reactivation features may require:
- contacts
- prospects
- opportunities
- outreach_drafts
- outreach_sequences
- consent_status
- source_attribution
- relationship_type
- last_touch_at
- campaign_memberships
- referral_sources

Every outbound-related record must be scoped by canonical `studio_id`.
