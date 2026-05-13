# Avitus Security and Privacy Architecture

Avitus stores sensitive lead and customer data for multiple businesses. Treat all tenant data as confidential.

## Security Principles

- Tenant isolation is mandatory.
- Frontend filtering is not security.
- RLS and server-side ownership checks are security.
- AI output is untrusted until validated.
- AI actions are tier-gated.
- External/client-facing actions require approval.
- Raw PII should not appear in logs, metrics, URLs, or telemetry.
- Avara must never mix tenant context.

## Tenant Isolation

Use `studio_id` as the canonical tenant key.

Tenant-scoped records include:

- leads
- lead notes
- lead status history
- reminders
- projects
- imports
- import mappings
- qualification profiles
- prompt pack pinning
- Avara sessions
- memory records
- agent_runs
- Action Queue items
- approval rows
- integration payloads

Do not introduce `business_id` or another tenant key unless there is a documented migration reason.

## Supabase RLS

Every tenant-scoped table must have RLS enabled.

Policies must ensure authenticated users can access only records belonging to studios where they have membership.

Do not rely only on:

- frontend filtering
- route guards
- hidden UI
- client-side studio selection

## Edge Functions

Edge Functions must verify studio membership/ownership server-side before reading or writing tenant-scoped data.

This is especially important when an Edge Function uses a service role key.

Reject requests when:

- the user is not authenticated
- the user is not a member of the requested studio
- `studio_id`, `lead_id`, `import_id`, `invite_token`, or integration payload does not belong to that studio
- the request attempts a tier not available to the studio’s plan

## Secrets

Never expose the following in frontend code:

- Supabase service role key
- OpenAI API key
- Anthropic API key
- integration secrets
- webhook signing secrets
- private tokens
- database credentials

Frontend may only use safe public environment variables such as the Supabase URL and anon/publishable key.

## PII Handling

Sensitive lead data may include:

- names
- phone numbers
- email addresses
- addresses
- budget
- property details
- project details
- raw WhatsApp/Instagram/email/SMS messages
- CSV rows
- client notes

Rules:

- Do not log full raw messages.
- Do not log full CSV rows.
- Do not put PII in URLs.
- Do not send PII to telemetry tools unnecessarily.
- Do not include raw PII in audit rows unless explicitly designed and protected.
- Redact or hash where practical.
- Store raw text only in approved database fields with RLS and retention policy.

## `agent_runs.raw_text`

Raw lead text should not be duplicated across tables.

If raw AI input/output text must be stored, store it only in `agent_runs.raw_text` or another explicitly approved field with:

- `studio_id` scope
- RLS
- retention/redaction policy
- restricted UI visibility
- no exposure in logs or telemetry

Structured outputs should be preferred over raw text wherever possible.

## Data Retention and Deletion

Default direction:

- Retain operational lead data while the studio account is active.
- Redact or delete unnecessary raw AI text after a defined retention period.
- Apply a default 90-day raw-text redaction policy unless business requirements say otherwise.
- Deleting a studio or lead should cascade or anonymize related records where required.
- Backups may retain deleted data temporarily according to backup policy, but this should be documented.

## Avara Security

Avara is a tool-calling assistant with a fixed toolbelt.

Avara must:

- run through the Central Lead Intelligence Orchestrator
- use typed Edge Function tools
- pass `studio_id` tenant checks
- respect RLS
- tag outputs with Action Risk Tier
- write `agent_runs`
- avoid exposing raw lead text unless requested and authorized
- preserve approval gates

Avara must not:

- call arbitrary tools
- query cross-tenant data
- use another studio’s memory/session
- send external/client-facing messages without approval
- bypass the orchestrator
- leak system prompts or hidden policy

## Action Approval Security

Tier 3 and Tier 4 actions require explicit approval rows.

Approval rows should record:

- `studio_id`
- actor/user id
- action type
- target entity id
- prepared payload hash or version
- approved timestamp
- execution status
- cancellation status when applicable

Do not execute Tier 3 or Tier 4 actions using only frontend state or an internal boolean flag.

## Prompt Injection and Tool Misuse

Treat lead messages, imported CSV fields, website form text, and pasted messages as untrusted input.

Common risks:

- prompt injection inside raw lead messages
- imported CSV rows telling the model to ignore policy
- malicious links inside lead messages
- instructions to reveal system prompts
- instructions to access another studio’s data
- attempts to force external sending

Mitigations:

- separate system/developer instructions from user/lead data
- quote or delimit untrusted lead text
- validate tool calls server-side
- enforce tool permissions outside the model
- enforce tiers in the orchestrator
- run output validation before saving or displaying actions
- never let model text override security policy

## AI Output Handling

AI output is not final authority.

Before saving or acting on AI output:

- validate schema
- validate tier
- validate studio ownership
- validate score inputs
- validate allowed action type
- store `agent_runs`
- show failure/partial state if needed

The deterministic scoring layer decides final score where possible. AI can interpret messy text and suggest classification, but the score should not be a black-box model number.

## Integration Security

Integration jobs must verify studio ownership before pushing, syncing, or mutating lead data.

Rules:

- One-way export before two-way sync.
- No CRM/Sheets overwrite without source-of-truth rules.
- No external send without approval when Tier 3/4.
- Integration payloads should include only necessary fields.
- Integration logs should not contain raw PII unless explicitly protected.
- Webhooks should use signing secrets.

## OWASP Baseline

Use OWASP Top 10 for LLM Applications 2025 as the baseline AI security checklist, especially:

- prompt injection
- sensitive information disclosure
- supply chain risks
- data/model poisoning
- improper output handling
- excessive agency
- system prompt leakage

For Avitus, the most important risks are cross-tenant leakage, prompt injection, excessive agency, raw PII logging, and unapproved external actions.