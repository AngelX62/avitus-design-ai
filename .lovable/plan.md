# Avitus — AI Platform for Interior Design Studios

An internal studio workspace that automates two things designers spend the most time on: **producing design concepts** and **handling lead flow**. Editorial-minimal aesthetic, calm and confident, inspired by your geometric A-logo.

---

## Brand & Visual Direction

- **Aesthetic:** Editorial Minimal — generous whitespace, ivory/off-white background, deep charcoal type, hairline borders, no rounded corners on key surfaces.
- **Type:** Serif display headings (e.g. Cormorant / Fraunces), clean sans for UI/body (Inter).
- **Palette:** Ivory `#FAF8F4`, Ink `#111111`, Stone `#8A857C`, faint Sand accent for hover states.
- **Logo:** Your uploaded A-mark used in the sidebar and on auth screens.
- **Tone:** Quiet luxury. Buttons are thin-bordered or solid ink. Section labels use spaced uppercase micro-type (e.g. `STUDIO · DESIGNS`).

---

## Auth & Access

- Email + password and Google sign-in (Lovable Cloud).
- Studio-team only — no client portal in v1.
- Roles via a separate `user_roles` table: `owner`, `designer`. Owners manage team; designers do daily work.
- A simple `profiles` table for name + avatar.

---

## App Structure

```text
/auth                  Sign in / sign up
/                      Dashboard (overview)
/designs               AI design generations gallery
/designs/new           Create a new generation
/designs/:id           Single generation detail
/leads                 Leads pipeline (kanban + table view)
/leads/:id             Lead detail with AI follow-up
/projects              Client projects list
/projects/:id          Project workspace (rooms, versions, notes)
/settings              Studio settings, team, branding
```

A persistent left sidebar holds the A-mark logo, primary nav, and the signed-in designer.

---

## Feature 1 — AI Design Generation

**Goal:** Turn a brief + reference assets into styled concept images in under a minute.

**Inputs (any combination):**
- Room photo upload (the "before")
- Floor plan upload (PDF or image)
- Text brief ("Calm Japandi living room for a young family, lots of natural light…")
- Style preset chips: Scandi, Japandi, Modern, Mid-century, Coastal, Industrial, Wabi-sabi
- Color palette picker (3–5 swatches)
- Budget tier: Essential / Considered / Bespoke
- Number of variations (1–4)

**Output:**
- Generated concept renders displayed in an editorial grid
- Auto-generated short "design rationale" paragraph per variation
- Suggested material/finish list (e.g. "Oak veneer, bouclé, brushed brass")
- Save to a project, download, or regenerate with tweaks

**How it works:** A backend edge function composes the brief + reference image into a multimodal call to Lovable AI (`google/gemini-3-pro-image-preview` for the renders, `google/gemini-3-flash-preview` for the rationale + materials list). Originals and outputs are stored in a `designs` storage bucket.

---

## Feature 2 — Leads CRM with AI Qualification

**Public intake form** (shareable link, embeddable) collects: name, email, phone, project type, rooms, budget range, timeline, location, free-text brief, optional photo.

**Pipeline stages:** New → Qualified → Proposal → Won / Lost. Kanban board with drag-and-drop, plus a sortable table view.

**AI on every new lead, automatically:**
- **Fit score 0–100** based on budget, scope match, timeline, and the studio's profile in Settings
- **One-line summary** of who they are and what they want
- **Suggested next action** ("Book a 20-min discovery call — high-fit kitchen reno")
- **Drafted personalized reply email** the designer can edit and send (or copy)
- **Red flags** surfaced (e.g. unrealistic budget for scope)

Lead detail page shows: contact info, full brief, AI summary card, activity timeline (notes, status changes, emails drafted), and a "Convert to project" button.

---

## Feature 3 — Client Project Management

Each project belongs to one lead/client and contains:
- **Rooms** (Living, Kitchen, Primary Bedroom…)
- **Design versions** per room — each version is a saved AI generation or uploaded image, with rationale and materials list
- **Internal notes** thread
- **Status:** Concept / Development / Final / Delivered
- **Files tab:** floor plans, mood boards, supplier quotes (uploads to storage)

Quick actions from a project: "Generate a new concept for this room", "Open client lead", "Mark delivered".

---

## Dashboard (the home screen)

A calm overview, not a wall of charts:
- Hero stat row: New leads this week · High-fit leads waiting · Active projects · Designs generated this month
- "Needs your attention" list (high-fit unanswered leads, projects awaiting next step)
- Recent designs strip (last 6 generations, thumbnails)
- Recent leads with AI summaries

---

## Settings

- **Studio profile:** name, logo, ideal client description, target budget range, signature styles — this powers AI lead scoring and design tone.
- **Intake form:** copy the public URL, customize fields, preview.
- **Team:** invite designers, manage roles.
- **Account:** profile, password.

---

## Technical Notes

- **Frontend:** React + Vite + Tailwind, shadcn/ui components restyled toward the editorial aesthetic (squared corners, hairline borders, serif headings).
- **Backend:** Lovable Cloud (Supabase) — Postgres, Auth, Storage, Edge Functions.
- **AI:** Lovable AI Gateway. Gemini 3 Flash for text (scoring, summaries, drafts, rationale), Gemini 3 Pro Image for concept renders, all called from edge functions (`generate-design`, `score-lead`, `draft-reply`).
- **Storage buckets:** `design-inputs` (private), `design-outputs` (private, signed URLs), `project-files` (private).
- **Tables:** `profiles`, `user_roles`, `studio_settings`, `leads`, `lead_activities`, `projects`, `rooms`, `design_generations`, `design_variations`, `project_files`. RLS on every table — designers see all studio data; only owners can edit team and studio settings. Roles checked via a `has_role()` security-definer function.
- **Public intake form** posts to a public edge function (no auth) that creates the lead and triggers AI scoring asynchronously.

---

## Build Order

1. Foundation: design system (fonts, colors, layout shell, sidebar, logo), auth, profiles + roles.
2. Leads: public intake form, pipeline board, lead detail, AI scoring + reply draft.
3. Designs: generation flow, gallery, detail page with rationale + materials.
4. Projects: list, project workspace with rooms and versions, link from leads.
5. Dashboard + Settings polish.

After v1 ships we can layer on a client portal, email sending integration, and proposal/PDF export.
