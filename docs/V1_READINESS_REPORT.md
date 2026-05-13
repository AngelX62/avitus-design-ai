# Avitus V1 Readiness Report

Date: April 30, 2026

## Green Paths

- Automated checks pass for the current no-key V1 baseline: lint, typecheck, tests, and production build.
- OpenAI is not configured in the local env files inspected, so the current app is aligned with no-key acceptance mode.
- Live local Supabase no-key smoke passed with the frontend pointed at `http://127.0.0.1:54321`.
- Hosted/staging Supabase no-key smoke passed with the frontend pointed at the hosted Supabase project.
- Manual, pasted, imported, and public intake lead creation paths use Edge Functions or studio-scoped RLS-backed writes.
- Public intake uses `studio_slug`; direct public `studio_id` intake is rejected by the intake safety helper.
- Lead detail keeps no-key leads usable for status changes, notes, follow-up draft editing, reminders, and won-to-project conversion.
- Overview already surfaces needs review, follow-ups due, possible duplicates, and recent activity.
- `generate-design` remains removed; Designs pages are not routed in `App.tsx`.

## Blockers Fixed

- Import progress copy no longer claims analysis is running before the backend confirms AI availability.

## Smoke Test Status

- Live local Supabase smoke passed.
- Confirmed no-key V1 flow works locally with Supabase running through Docker.
- Hosted/staging Supabase smoke passed.
- Second-user tenant isolation smoke passed for leads, projects, notes/activity, settings, and copied URLs.
- Owner signup/login, intake, paste/manual/import, lead detail actions, reminders, and won-to-project conversion were validated by manual smoke.

## Remaining V1 Gaps

- OpenAI activation remains deferred; V1 should continue to behave cleanly without scores until the backend key is intentionally configured.
- Final production environment review is still needed before loading real customer data.
- Owner handoff should use the no-key pilot guide so manual-review behavior is clear before AI activation.

## Next Recommended Slice

Prepare and deploy the no-key V1 for controlled customer testing. OpenAI activation remains a later V1.1 slice when the key/model are ready.
