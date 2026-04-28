# Avitus MVP Refocus — AI Inbound Lead Assistant

Reposition the app around three lead entry methods (Intake Form, Paste Message, Import Sheet) producing clean, scored, actionable lead records. Keep the editorial-minimal aesthetic. Studio owner stays in control — Avitus never sends client-facing messages automatically.

## 1. Database changes (one migration)

**Extend `leads`:**
- `property_type` text
- `style_preference` text
- `urgency` text
- `temperature` text (`hot` | `warm` | `cold`)
- `missing_info` text[]
- `suggested_followup` text
- `score_breakdown` jsonb (`{budget_fit, timeline_fit, location_fit, project_type_fit, decision_maker, clarity}`, each 0–100)
- `raw_inquiry` text
- `custom_fields` jsonb default `'{}'`
- `last_contacted_at` timestamptz
- `reminder_at` timestamptz

**`lead_status` enum:** add `needs_review`, `high_fit`, `contacted`, `consultation_booked`. Existing `new`, `won`, `lost` stay; old `qualified`/`proposal` remain valid but unused in UI.

**Extend `studio_settings`:**
- `currency` text default `'USD'`
- `preferred_project_types` text[]
- `preferred_locations` text[]
- `low_fit_signs` text
- `followup_tone` text default `'warm'`

**New `lead_status_history`:** `id, lead_id, from_status, to_status, changed_by, changed_at` — RLS for studio members.

**Trigger:** when a lead moves to `won`, auto-insert a `projects` row (name = lead full_name + project_type, link `lead_id`).

**Seed ~6 demo leads** spanning the new statuses, temperatures, and sources so the board is populated.

## 2. Edge functions

**`score-lead` (rewrite):** expanded JSON schema returning `fit_score`, `summary`, `temperature`, `urgency`, `next_action`, `suggested_followup`, `missing_info[]`, `score_breakdown{...}`, `red_flags[]`. Prompt incorporates studio profile (currency, preferred types/locations, low-fit signs, follow-up tone).

**`extract-lead` (new):** input `{ raw_text, source }`. Returns parsed fields (name, phone, email, project_type, property_type, location, budget_range, timeline, style_preference, urgency, missing_info). Caller inserts row + invokes `score-lead`.

**`import-leads` (new):** input `{ rows, mapping }`. Bulk-inserts, stuffs unmapped columns into `custom_fields`, then triggers `score-lead` per row (concurrency-capped).

## 3. Sidebar (StudioLayout)

**Overview · Lead Inbox · Import · Intake Form · Projects · Settings.**
- "Lead Inbox" → `/leads`
- "Intake Form" → opens current studio's `/intake` link in new tab + Settings has copy link
- Designs link removed; routes remain mounted.

## 4. Overview (`/`)

Stat cards: **Hot leads waiting · New leads · Needs review · Follow-ups due · Possible duplicates**.

**Recent Activity** feed (newest 15) merging:
- Intake form submissions (source=intake_form)
- Pasted-message leads (source=pasted)
- Imported leads (source=imported)
- Status changes (from `lead_status_history`)
- Follow-up reminders (leads where `reminder_at` ≤ now)

Each row: small source/event chip + lead name + relative time, links to lead.

## 5. Lead Inbox (`/leads`, renamed)

Header title "Lead Inbox." Three top buttons: **Import Sheet** (→ `/import`), **Paste Message** (→ `/leads/paste`), **Create Lead** (modal with minimal form).

Keep Board / Table views.

**Board columns:** New · Needs Review · High-Fit · Contacted · Consultation Booked · Won · Lost (horizontal scroll on small screens).

**Lead card:** name (serif), project_type, location, budget_range (currency-formatted), score badge, temperature pill (hot=ember, warm=sand, cold=stone), one-line `next_action`.

## 6. Paste Message (`/leads/paste`) — mobile-first

Step 1: full-bleed textarea, source chips (WhatsApp / Instagram / Email / SMS / Other), sticky bottom **Create Lead** button (large tap target, `pb-[env(safe-area-inset-bottom)]`).

Step 2 (review): runs `extract-lead`, shows editable extracted fields + score preview. Sticky **Save Lead**. On save: insert with `raw_inquiry` + extracted fields + source, fire `score-lead`, navigate to detail.

Container `max-w-xl mx-auto`, inputs `min-h-12`.

## 7. Import (`/import`) — new

Four steps with progress dots:
1. **Upload** — drag/drop CSV (uses `papaparse`).
2. **Preview** — first 5 rows + detected headers.
3. **Map columns** — each CSV column → dropdown (Name, Phone, Email, Source, Project type, Property type, Location, Budget, Timeline, Style, Notes, "Custom field", "Skip"). Heuristic auto-suggest by header name.
4. **Import** — calls `import-leads`, progress indicator, redirects to `/leads`.

Unmapped columns → `custom_fields[csv_header] = value`. Never silently dropped.

## 8. Lead Detail (`/leads/:id`) — restructure

Sections in order:

- **A. Lead Overview** — name, contact, status select, score, temperature, recommended next action.
- **B. Raw Inquiry** — `raw_inquiry` (or fallback to original brief) in soft monospace block.
- **C. AI Summary** — `ai_summary`.
- **D. Extracted Fields** — grid: project_type, property_type, location, budget_range, timeline, style_preference, urgency, source.
- **E. Score Breakdown** — six horizontal bars from `score_breakdown` (budget/timeline/location/project_type/decision_maker/clarity).
- **F. Missing Information** — bulleted `missing_info`.
- **G. Prepared Follow-Up** — editable textarea pre-filled with `suggested_followup` + buttons:
  - **Copy Message** (clipboard)
  - **Edit Message** (toggle edit mode, save to `suggested_followup`)
  - **Mark as Contacted** (sets status=`contacted`, stamps `last_contacted_at`)
  - **Create Reminder** (small popover: 1d / 3d / 1w / custom → sets `reminder_at`)
  - No "send" action — owner approves/copies manually.
- **H. Custom Fields** — key/value table from `custom_fields` (only shown when non-empty).
- **I. Notes & History** — `lead_activities` (notes) interleaved with `lead_status_history`.

## 9. Settings → "Studio Qualification Profile"

Header retitled. Fields: Studio name, Currency (IDR / USD / SGD / AUD / Other), Target budget min, Target budget max, Preferred project types (chips), Preferred locations (chips), Ideal client, Low-fit warning signs, Signature styles, Follow-up tone (warm / direct / playful / formal), Intake form intro. Public intake link copy block stays.

## 10. Projects

Stays minimal. Auto-created on lead `won`. List shows name, client, status, source lead link. No new project management UI.

## 11. Routing (`App.tsx`)

Add: `/leads/paste` → PasteMessage, `/import` → Import. Keep existing routes; Designs unlinked from sidebar.

## Technical notes

- Add `papaparse` + `@types/papaparse`.
- `src/lib/format.ts` — currency-aware budget formatter using studio currency.
- All AI fields render gracefully when null (skeleton or em-dash).
- Enum additions via `ALTER TYPE ADD VALUE` (separate statements, not in a transaction block).
- Trigger for auto-project creation uses SECURITY DEFINER function in `public`.
- Reminder logic: "Follow-ups due" = `reminder_at <= now()` OR (`status = contacted` AND `last_contacted_at < now() - 3 days`).
- Possible duplicates: leads sharing normalized email or phone (basic SQL count of pairs).
- All edge functions return CORS headers; validate inputs with zod.
- Mobile: Paste page uses `min-h-[100dvh]` and safe-area padding.
- Visual style unchanged — ivory/ink, serif headings, hairline borders.

## Out of scope (explicit)

- Outbound automated messaging (WhatsApp/email/SMS sending)
- Live Instagram/WhatsApp/Sheets sync
- Designs feature (hidden, code retained)
- Full project management
- CSV export (later)

## Build order

1. Migration (columns, enum, settings, history table, trigger) + demo seed
2. Edge functions: updated `score-lead`, new `extract-lead`, new `import-leads`
3. Sidebar rename + new routes
4. Lead Inbox page (buttons, columns, cards, currency formatting)
5. Paste Message flow (mobile-first)
6. Import flow (CSV → mapping → import)
7. Lead Detail restructure (Prepared Follow-Up actions)
8. Overview metrics + Recent Activity feed
9. Settings → Qualification Profile expansion