# Avitus No-Key Pilot Guide

Date: May 2, 2026

This guide is for running Avitus V1.0 without an OpenAI API key. The pilot should feel like an operational lead inbox: owners can capture, review, organize, remind, and convert leads without fake AI scores or automated client messages.

## What The Owner Can Do

- Sign up or log in with Supabase Auth.
- Work inside one active studio workspace.
- Copy or open the public intake form link from Settings or empty-state actions.
- Receive public intake submissions through the studio slug link.
- Connect an existing form later through the secure form bridge direction if the studio already uses one.
- Paste a client message and save it as a lead for manual review.
- Import CSV leads, map known columns, and preserve extra columns as custom fields.
- Create leads manually from the Lead Inbox.
- Open Lead Detail to review raw inquiry, saved fields, notes, status, reminders, and follow-up draft space.
- Edit and copy a follow-up draft manually.
- Convert a won lead into a simple project.

## No-Key Behavior

For this pilot, `OPENAI_API_KEY` stays unset. Avitus should show "Analysis not enabled yet" or manual-review states where AI output will appear later.

No-key leads must not show production fake values for:

- `fit_score`
- `classification`
- `temperature`
- `score_breakdown`
- AI summaries
- AI-generated recommended actions
- AI-generated follow-up drafts

If analysis is not enabled, the lead is still usable. The owner reviews the saved fields manually, adds notes, edits a follow-up draft if needed, and moves the lead through the normal statuses.

## Rule-Based Foundation Intelligence

The no-key pilot may include deterministic operational signals.

These are allowed because they do not require live AI and do not pretend to be AI analysis.

Allowed rule-based signals:

- follow-ups due
- overdue reminders
- stale lead flags
- missing budget, timeline, scope, contact, or location flags
- possible duplicate warnings
- import rows needing review
- lead status health
- simple revenue-risk messages such as “This lead has had no follow-up in 7+ days.”
- Priority Leads based on deterministic rules
- Action Queue basics
- speed-to-lead risk for real estate when based on timestamps
- budget-readiness gaps for interior design when based on missing or unclear fields

These signals must be clearly treated as operational rules, not AI-generated analysis.

Do not show fake AI values for fit score, classification, temperature, score breakdown, AI summary, AI recommended next action, or AI-generated follow-up drafts.

If AI is not enabled, Avitus should still help the owner decide what needs attention, but it must not pretend to have performed AI qualification.

## Rule-Based Foundation Intelligence

The no-key pilot may include deterministic operational signals.

These are allowed because they do not require live AI and do not pretend to be AI analysis.

Allowed rule-based signals:

- follow-ups due
- overdue reminders
- stale lead flags
- missing budget, timeline, scope, contact, or location flags
- possible duplicate warnings
- import rows needing review
- lead status health
- simple revenue-risk messages such as “This lead has had no follow-up in 7+ days.”
- Priority Leads based on deterministic rules
- Action Queue basics

These signals must be clearly treated as operational rules, not AI-generated analysis.

Do not show fake AI values for fit score, classification, temperature, score breakdown, AI summary, AI recommended next action, or AI-generated follow-up drafts.

If AI is not enabled, Avitus should still help the owner decide what needs attention, but it must not pretend to have performed AI qualification.

## Intake Form

Each studio should share the public intake URL that uses its `studio_slug`, for example:

```text
https://your-app-domain.com/intake/{studio_slug}
```

Direct public intake using a raw `studio_id` is not part of the pilot flow and should be rejected by the backend.

The Avitus intake form should be lightly customizable, not a drag-and-drop form builder. For V1, customization should stay limited to studio/business name, business type, intake intro text, thank-you message, currency, preferred project/property types, preferred locations, budget expectations, and follow-up tone.

Later optional standard field visibility/required toggles are acceptable, but custom layouts, conditional logic, full branding/theme editor, many custom field types, and OpenAI activation are outside this no-key pilot boundary.

## Capture Options

Use the Avitus intake form, or connect your existing form.

- No form yet: use the Avitus intake form.
- Already has a form: connect it to Avitus through the secure inbound webhook/form bridge direction.
- Spreadsheet leads: import CSV.
- WhatsApp, Instagram, email, SMS, or referral messages: use Paste Message.

Existing-form connection is the next automatic capture direction for tools such as Typeform, Tally, Google Forms, Webflow, Wix, Squarespace, WordPress, or custom website forms. It should create leads through a trusted backend path, identify the studio through a safe configured route/token/slug, and never accept raw public `studio_id`.

For the no-key pilot, connected-form submissions should create leads for manual review without fake scores or automatic client-facing replies.

## CSV Import

Use CSV imports for old sheets or current lead lists. Core columns should map into lead fields, and unmapped columns should remain under `custom_fields` so owners do not lose business-specific context.

Recommended pilot columns:

- Name
- Email
- Phone
- Source
- Project type
- Property type
- Location
- Budget
- Timeline
- Notes

Extra columns are allowed and should be preserved as custom fields.

## Manual Review Workflow

1. Open the lead from Lead Inbox.
2. Check the raw inquiry and saved fields.
3. Add an internal note if context is missing.
4. Change status when the lead moves forward or closes.
5. Add or edit a follow-up draft manually.
6. Copy the follow-up text into the owner's normal communication tool.
7. Create a reminder if the lead needs another touch.
8. Mark the lead as won when appropriate, then convert it to a project.

Avitus must not send WhatsApp, email, SMS, pricing, booking, or disqualification messages automatically.

## Pilot Handoff Checklist

- Owner can log in and see the correct studio name.
- Public intake link is copied from the app, not assembled by hand.
- Intake, paste, import, and manual creation save leads for manual review.
- Lead Detail shows clear dormant analysis states instead of fake AI output.
- Overview uses real lead records for stats and charts.
- Projects are created only from won leads.
- Second-user tenant isolation has passed before any real customer data is loaded.
- Frontend env contains only browser-safe Supabase variables.
