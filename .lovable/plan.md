## Atelier — Architectural Grid

A full visual + layout redirection. Move Avitus from the current ivory/serif "magazine" feel to a **gallery-architectural** aesthetic: bone canvas, sharp 12-column grids divided by structural hairlines, modern grotesk headlines (not serif romance), terracotta as the only accent, and data presented like an architect's drawing sheet rather than a CRM dashboard.

This is what the third prototype showed: top horizontal navigation, asymmetric column splits with vertical dividers, big tabular numerals, small inline status chips, and pipeline bars. Calm, dense-when-needed, never decorative.

---

### Palette (replaces Clay & Bone)

| Token | HSL | Hex | Use |
|---|---|---|---|
| `--background` | `45 20% 97%` | #FAF9F6 | Canvas |
| `--card` (panel) | `40 16% 93%` | #F1EFE9 | Secondary surface (right column, hovers) |
| `--foreground` (ink) | `60 5% 6%` | #0F0F0E | Type, structural lines, primary buttons |
| `--muted-foreground` (graphite) | `48 4% 42%` | #6E6E68 | Secondary type, micro-labels |
| `--border` (rule) | `42 9% 84%` | #DAD8D2 | Inner dividers (lighter than ink rules) |
| `--accent` (terracotta) | `15 63% 46%` | #C04A2C | One accent per screen — hot status, deltas, period mark |
| `--ink-rule` | same as ink | #0F0F0E | Major structural dividers (1px ink) |

Two-tier divider system is core to the aesthetic: **1px ink** for top/bottom of major sections, **1px stone (#DAD8D2)** for cells inside.

### Typography

- **Headlines & numerals:** Inter at weight 400 with tight letter-spacing (`-0.035em` for h1, `-0.04em` for KPI numerals). Modern grotesk, not serif. Cormorant is removed from headings.
- **Body & UI:** Inter 400/500.
- **Micro-labels:** Inter 500, uppercase, `letter-spacing: 0.16em`, 11px, graphite color. Sectioned with letter prefixes — `A · TODAY'S BRIEF`, `B · PIPELINE`, `C · RECENT INQUIRIES`.
- **Tabular numerals:** `font-feature-settings: "tnum","lnum"` on all numbers.
- Cormorant Garamond is **removed** from the project. The serif romance is gone — Atelier is grotesk-only.

### Layout primitives

1. **Top horizontal navigation** replaces the left sidebar. 56px tall, ink bottom rule, wordmark left, nav links center-left, date + avatar right. Active link = 1px ink underline.
2. **12-column page grid** with `border-bottom: 1px solid ink` framing major sections.
3. **Asymmetric splits** — most pages use a 7/5 or 8/4 column split; the smaller column gets `bg-card` (panel) for a quiet contrast block.
4. **Section letters, not section numbers** — `A · OVERVIEW`, `B · PIPELINE`, `C · RECENT`. Drops the editorial `§ 01` feel.
5. **Inline KPI rows** inside sections, separated by 1px stone verticals — no boxed cards anywhere.
6. **Pipeline visualization** — horizontal bars on a stone track with ink fill (terracotta only on the "Won" / hot bar).
7. **Status chips** are square (no radius), 10–11px, uppercase, `padding: 2px 6px`. Hot = terracotta fill on bone text; everything else = ink outline on bone.

### Files to change

**Tokens & base**
- `src/index.css` — replace all color tokens with the palette above; remove `serif-numeral` and `italic-serif` utilities; add `.tabular`, `.rule-ink`, `.rule-stone`, `.section-letter`. Set `--radius: 0`. Remove the Cormorant `@import` (keep Inter only, add weight 600).
- `tailwind.config.ts` — remove `serif` font family alias to Cormorant, remove `cream`/`ivory`/`bone`/`sand`/`terracotta` legacy tokens, add `panel` and `rule`. Keep `accent` mapped to terracotta.

**Components**
- `src/components/StudioLayout.tsx` — **rewrite from sidebar to top nav.** 56px header bar, ink bottom rule, nav items with underline-on-active, date stamp + avatar circle on right. Outlet sits inside a max-w-[1400px] container.
- `src/components/PageHeader.tsx` — drop the `§ 01` marker; eyebrow becomes `A · LABEL` style; title uses Inter 400 not serif; remove italic subtitle styling.
- `src/components/SectionMarker.tsx` — replace `§ 01 OVERVIEW` with `B · OVERVIEW` (letter prefix, ink dot separator). Keep the API.
- `src/components/KPI.tsx` — numeral becomes Inter 400 tabular, 56–72px, with optional delta line below in terracotta (`↑ 3 vs last week`) or graphite (`— flat`).
- `src/components/Hairline.tsx` — accept `weight: "ink" | "stone"` prop (default stone).
- `src/components/Logo.tsx` — wordmark in Inter 500, all caps, terracotta period: `AVITUS.`
- New `src/components/StatChip.tsx` — square uppercase status chip (hot/new/contacted/etc) with the chip rules above.
- New `src/components/PipelineBar.tsx` — label + count + horizontal bar (stone track, ink fill, terracotta for won/hot).

**Pages**
- `src/pages/Index.tsx` (Overview) — restructure to the prototype: 7/5 split with KPI row on the left and a **Pipeline panel** on the right (`bg-panel`). Below: full-width Recent Inquiries as a 3-column grid divided by stone verticals. Replace serif numerals with Inter tabular. Drop the masthead "AVITUS · STUDIO OPERATING SYSTEM" line — date moves into the top nav.
- `src/pages/Leads.tsx` — Kanban columns lose the cream card backgrounds; cards become hairline-bordered rows on bone with the new StatChip for temperature. Stage headers use `A · NEW`, `B · NEEDS REVIEW` letters. Table view gains tabular numerals and inline pipeline-style fit-score bars.
- `src/pages/LeadDetail.tsx` — sections re-lettered (A through H), score block uses Inter tabular at 96px with a horizontal pipeline-style score bar instead of the serif 112px numeral.
- `src/pages/Import.tsx` — step indicator becomes `A · UPLOAD ─── B · PREVIEW ─── C · CONFIRM` with ink rules between.
- `src/pages/PasteMessage.tsx`, `src/pages/Settings.tsx`, `src/pages/Projects.tsx`, `src/pages/Designs.tsx`, `src/pages/ProjectDetail.tsx`, `src/pages/DesignDetail.tsx`, `src/pages/DesignNew.tsx` — retoken to new palette, swap section markers, remove italic-serif usages, replace any remaining serif headings with Inter.
- `src/pages/Auth.tsx` — single ink-rule centered form on bone, no card box, terracotta period in wordmark, Inter throughout.
- `src/pages/Intake.tsx` (public form) — bone canvas, top centered wordmark, hairline-only inputs (border-bottom only), Inter headlines.

### Out of scope

- No new routes, edge functions, schema, or auth changes.
- No dark mode.
- Drag/drop and data logic untouched.

### QA after build

Screenshot Overview, Leads (board + table), a Lead Detail, Import step 1, Settings, Auth, and public Intake at 1280px and 390px. Verify: top nav present (no sidebar), terracotta appears at most once per screen, no Cormorant anywhere, all KPI numerals are tabular Inter, dividers correctly use the two-tier ink/stone system.