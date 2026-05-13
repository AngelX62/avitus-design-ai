# Claude Code Instructions — Avitus / Avitus Leads

Avitus is an AI-native lead intelligence web app for property businesses, starting with interior design studios and real estate teams.

Avara is the lower-right AI assistant inside the Avitus web app. Avara is not a generic chatbot. It is a specialized lead intelligence assistant that routes through the Central Lead Intelligence Orchestrator.

## Read Order

Read @AGENTS.md first.

Do not load every deep document by default. Load the deeper docs only when the task touches that area:

- Product scope, tiers, positioning, roadmap: `docs/PRODUCT_BRIEF.md`
- Architecture, services, tiers, Avara, AgentContext, Prompt Packs: `docs/ARCHITECTURE.md`
- Tenant isolation, PII, secrets, logging, approvals, AI security: `docs/SECURITY.md`
- Avara memory, owner corrections, calibration: `docs/MEMORY.md`
- Review checklist before finalizing changes: `docs/CODE_REVIEW.md`

The product architecture PDF is high-level context only. Markdown files are the implementation source of truth.

## Non-Negotiables

- Avitus is a web app, not a generic CRM or autonomous sales bot.
- Use canonical `studio_id` for tenant isolation.
- Enforce Supabase RLS on tenant-scoped tables.
- Verify studio membership server-side in Edge Functions, especially when using service role keys.
- Keep OpenAI, Anthropic, service role, and private API keys out of frontend code.
- Keep AI calls server-side through Supabase Edge Functions or trusted backend code.
- Validate all AI outputs before saving.
- Every AI call must write an `agent_runs` row.
- Do not log raw lead messages, full CSV rows, emails, phone numbers, secrets, or sensitive PII in application logs.
- Avara must use a fixed, typed, tenant-scoped toolbelt.
- Tier 3 and Tier 4 actions require explicit approval rows.
- Do not send WhatsApp, email, SMS, pricing, booking links, disqualification messages, outbound/reactivation messages, CRM final pushes, or external workflow actions without owner approval.
- Do not add LangChain, LangGraph, CrewAI, or another agent framework in V1 unless explicitly requested and justified.

## Working Style

Before significant changes, inspect the relevant files, explain the plan briefly, make the smallest safe change, preserve existing behavior, and run lint/typecheck/tests/build when practical.


## Memory

For Avara memory, read `docs/MEMORY.md`.

Non-negotiable summary: memory is `studio_id` scoped, working memory is temporary, owner corrections go through `agent_runs`, stable preferences must not update from one correction, and no vector/RAG/resource memory is allowed in V1 unless explicitly requested.