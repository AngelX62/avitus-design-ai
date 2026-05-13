# Avitus Design AI

## Documentation source of truth

Use the Markdown guidance files as the implementation source of truth:

- `AGENTS.md`
- `docs/PRODUCT_BRIEF.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `THREAT_MODEL.md`
- `docs/CODE_REVIEW.md`

The Codex skill keeps `.codex/skills/avitus-product-engineer/SKILL.md` and its local product brief mirror for skill compatibility.

The architecture PDF in `docs/` is high-level product architecture context. It should not override the Markdown rules for V1 scope, tenant isolation, RLS, build order, or review standards.

## Local development

Install dependencies and start Vite:

```sh
npm install
npm run dev
```

Vite is configured to use port `8080`. If that port is busy, it will print the next available local URL.

## Environment

Create `.env.local` from `.env.example` and fill in your Supabase project values:

```sh
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key
```

Restart `npm run dev` after changing environment variables.

Supabase Edge Functions need server-side secrets. Set these in Supabase, not in `.env.local`:

```sh
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=http://localhost:8080,https://your-production-domain.com
```

## V1 architecture notes

- Studio data is tenant-scoped with canonical `studio_id` and protected by enforced Supabase RLS.
- Users join studios by invite only; signup no longer grants automatic access.
- Public intake uses `/intake/:studioSlug` and creates leads through `create-intake-lead`.
- Pasted leads, CSV imports, and scoring run through Supabase Edge Functions.
- Edge Functions must verify studio membership/ownership server-side before reading or writing tenant-scoped data, especially when using service role keys.
- OpenAI is called only from Supabase Edge Functions. The browser never receives `OPENAI_API_KEY`.
- Sample data is limited to local development, demo seeds, or empty-state previews. Production flows should use database-backed records.
- Foundation, Signature, and Bespoke are commercial packaging and roadmap concepts. They do not change the V1 build order unless explicitly requested.
