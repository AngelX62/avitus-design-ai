# Avitus V1 Deployment Notes

Date: April 30, 2026

## Required Frontend Environment

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Only browser-safe Supabase values belong in frontend env files. Never put `sb_secret`, service role keys, Supabase service-role keys, OpenAI keys, webhook secrets, or any other server secret in `.env.local`, hosted frontend env, or client-side code.

Frontend env should not contain variables with names such as `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SERVICE_ROLE`, `SB_SECRET`, or `SECRET_KEY`.

Run `npm run check:env` before deployment to scan frontend env files without printing secret values.

## No-Key V1 Behavior

`OPENAI_API_KEY` is intentionally optional for V1. When it is unset on the server, leads created through intake, paste, manual entry, or import are saved for manual review without `fit_score`, `classification`, `temperature`, or `score_breakdown`.

For the no-key pilot, leave `OPENAI_API_KEY` unset in Supabase Edge Function secrets. The UI should show "Analysis not enabled yet" or "manual review" states, not fake summaries, fake classifications, fake scores, or fake score breakdowns.

OpenAI activation should happen later through server-side Supabase Edge Function secrets only. Do not add OpenAI variables to frontend env.

## Pre-Customer Checklist

- Hosted smoke test passes against the target Supabase project.
- Second-user tenant isolation smoke passes for leads, projects, notes/activity, settings, and copied URLs.
- Supabase migrations are applied to the target project.
- Supabase Edge Functions are deployed to the target project.
- Frontend env uses the correct project URL and publishable key for the target environment.
- No frontend env contains service role keys, `sb_secret`, OpenAI keys, or other server secrets.
- `npm run check:env` passes before build/deploy.
- No-key lead creation keeps analysis fields empty until real server-side analysis is intentionally enabled.

See `docs/NO_KEY_PILOT_GUIDE.md` for the owner handoff workflow.
