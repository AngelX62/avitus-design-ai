# Clay & Bone — Editorial Polish Pass

Visual-only refresh. No database, routing, or feature changes. Goal: take Avitus from "clean admin" to "premium studio operating system" that feels at home next to Kinfolk, RH, and AD.

## Palette (replaces current ivory/sand tokens)

| Token | HSL | Hex | Use |
|---|---|---|---|
| `--background` (canvas / bone) | `36 27% 90%` | #EFE7DA | Page background |
| `--card` (cream) | `38 56% 95%` | #FBF6EC | Raised surfaces, sidebar |
| `--ink` (espresso) | `24 22% 13%` | #2A201A | Primary type, buttons |
| `--stone` (body) | `28 16% 42%` | #7C6A5A | Secondary type |
| `--hairline` (border) | `34 30% 79%` | #D9CDB9 | All dividers |
| `--accent` (terracotta) | `15 58% 40%` | #A14A2C | One-per-screen accent |
| `--sand` (muted) | `34 25% 84%` | #DCD0BC | Subtle fills, hover |

Rule: terracotta appears at most **once per screen** (active nav indicator OR a single hot-lead marker — never both).

## Typography moves

- Headlines: `Cormorant Garamond 300` (already loaded). Bump KPI numerals to 64–80px.
- Italic Cormorant for subtitles and asides (e.g. page subtitles, empty states, metadata like "*landed 2h ago*").
- Inter 400/500 for UI, micro-labels stay uppercase tracked at 0.22em.
- Add a new utility class `.serif-numeral` → `font-family: Cormorant; font-weight: 300; font-feature-settings: "lnum";`

## The 9 editorial moves (applied)

1. **Numeric section markers** — `§ 01 OVERVIEW` replaces plain "STUDIO · OVERVIEW" eyebrows. Add a `SectionMarker` component.
2. **Large serif KPI numerals** — `<KPI>` component using `.serif-numeral` at 72px.
3. **Italic serif subtitles** — `PageHeader` subtitle prop renders in italic Cormorant.
4. **Hairlines, not boxes** — remove card borders on Overview metric row and Recent Activity. Use horizontal `border-t border-hairline` dividers + generous `py-10` spacing.
5. **Asymmetric metric layout** — Overview becomes: one hero KPI (Hot Leads, full-width feel, 80px numeral, italic caption) + 4 smaller siblings in a hairline-divided row beneath.
6. **Borderless empty states** — replace the bordered "Nothing yet…" box with centered italic serif line, no border, `py-20`.
7. **Sidebar refinement** — sidebar bg becomes cream `--card`, active nav uses 2px left terracotta hairline + ink text (no filled bg). Nav items numbered: `01 Overview`, `02 Lead Inbox`, etc.
8. **Masthead credit line** — top of Overview: `AVITUS · STUDIO OPERATING SYSTEM — Q2 26` in micro-label tracked, hairline beneath.
9. **One restraint rule** — audit each page; remove any duplicate accent usage.

## Files to modify

**Tokens & base**
- `src/index.css` — replace `:root` color tokens with Clay & Bone values; add `.serif-numeral`, `.italic-serif` utilities; add subtle paper texture to body via `background-image` (radial-gradient, 2% opacity, optional).
- `tailwind.config.ts` — add `hairline`, `cream`, `terracotta` to color extensions.

**Components**
- `src/components/StudioLayout.tsx` — sidebar bg `bg-card`, active state to left-border accent, number nav items, refined typography.
- `src/components/PageHeader.tsx` — subtitle in italic Cormorant; eyebrow accepts a section number prop.
- `src/components/Logo.tsx` — wordmark uses ink color, slightly tighter tracking.
- New `src/components/SectionMarker.tsx` — `§ 01 OVERVIEW` marker.
- New `src/components/KPI.tsx` — label + serif numeral + optional italic caption.
- New `src/components/Hairline.tsx` — semantic divider.

**Pages**
- `src/pages/Index.tsx` (Overview) — full restructure: masthead line → hero KPI → hairline-divided sibling KPIs → hairline → recent activity (borderless empty state).
- `src/pages/Leads.tsx` — kanban column headers gain section numbers; cards lose heavy borders, use cream bg + hairline; status pills restyled (no chromatic colors except terracotta for "hot").
- `src/pages/LeadDetail.tsx` — section markers between Raw Inquiry / AI Summary / Score Breakdown / Missing Info / Prepared Follow-Up; score bars use ink fill on sand track.
- `src/pages/Import.tsx` — step indicator restyled as `§ 01 UPLOAD → § 02 PREVIEW` hairline progress.
- `src/pages/PasteMessage.tsx` — already mobile-good; just retoken colors and italicize subtitle.
- `src/pages/Settings.tsx` — section markers per group, hairline dividers between groups.
- `src/pages/Auth.tsx` — bone canvas, cream form card with single hairline, italic serif tagline.
- `src/pages/Intake.tsx` — public form: bone bg, large italic serif heading, hairline-only fields (no boxed inputs).

## Out of scope

- No new features, routes, edge functions, or DB changes.
- No new fonts (Cormorant + Inter already loaded).
- No dark mode adjustments (project is light-only).
- Kanban drag/drop logic untouched.

## QA after build

Screenshot Overview, Lead Inbox, a Lead Detail, Import step 1, Settings, and the public Intake form at 1280px and 390px. Confirm: terracotta appears once per screen max, no boxed cards remain on Overview, italic serif renders correctly, sidebar active state is the left hairline (not filled bg).
