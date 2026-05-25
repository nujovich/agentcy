# DESIGN.md — Agentcy

Working rules for anyone (human or AI) producing UI in this project. If you are designing, prototyping, or shipping a screen, you follow this file. The full narrative lives in `README.md`; this is the operational subset.

> **One-line brief:** *La agencia detrás de tu agencia.* A control-room SaaS for boutique marketing agencies, driven by a 6-agent AI pipeline. Humans approve every step.

---

## 0. Before you start

1. Import `colors_and_type.css` in the `<head>` of every HTML file. Always first.
2. Never hardcode a hex outside that file. Use `var(--color-*)`.
3. Default surface is **light**. Use **dark** (`.theme-dark` on `<body>` or a panel) only for the dashboard, the login left-panel, and any in-product "control room" surface.
4. Copy the assets and components you need into the project — don't reference design-system paths directly from a deliverable.

---

## 1. Voice & copy (Spanish, rioplatense)

The product UI is **always in Spanish**. Use `vos`, never `tú`.

| Do | Don't |
|---|---|
| "Bienvenida de nuevo" | "Iniciar sesión" |
| "Creá tu cuenta" | "Sign up" / "Crear cuenta" |
| "Aprobar Brand Profile" | "Submit" / "Guardar" |
| "El agente está analizando la marca…" | "Loading…" / shimmer skeleton |
| "Pendiente" / "Aprobado" / "Listo para generar" | "Locked" / "Approved" / "Ready" |

Casing: **sentence case** for headlines and buttons. Action verb first on buttons ("Generar →", "Continuar con Google"). Em dash and `·` separate metadata (`Tech · Buenos Aires`). Bilingual product nouns are fine — "Brand Profile", "Pipeline", "Strategy" — these are the user's vocabulary.

**Emoji:** functional only (pipeline state markers `✅ 🔓 🔒`, provider badge `💰 Económico`). Never decorative, never in headings, never in marketing copy.

---

## 2. Tokens — the only colors that exist

Pulled from `colors_and_type.css`. If a token isn't here, it isn't in the system.

### Brand
- `--color-primary` `#0D7377` — dominant teal. Buttons, links, focus, brand surfaces.
- `--color-primary-dark` `#0A5E62` — hover for primary.
- `--color-primary-light` `#14ABAB` — pipeline running pulse.
- `--color-primary-soft` `#D5EEEE` — chip/hover bg on light surfaces.
- `--color-accent` `#F2A65A` — warm orange. Reserve for "awaiting approval" state and the one CTA per screen that needs to win. Not a second primary.
- `--color-accent-soft` `#FDE8CE` — bg for the approval pill.

### Neutrals (light)
`--color-ink` `#0F1923` · `--color-ink-soft` `#4A5568` · `--color-ink-muted` `#94A3B8`
`--color-surface` `#F8FAFB` · `--color-surface-2` `#EEF2F5` · `--color-border` `#E2E8EE`

### Neutrals (dark)
`--color-dark-bg` `#0B1015` · `--color-dark-surface` `#111A22` · `--color-dark-surface-2` `#182330` · `--color-dark-border` `#1E2D3D` · `--color-dark-ink` `#E6EDF3` · `--color-dark-ink-soft` `#94A3B8`

### Semantic / state
`--color-success` · `--color-warning` · `--color-danger` (rust, not bright red).
Pipeline state: `--state-idle` · `--state-running` · `--state-awaiting` · `--state-approved` · `--state-blocked`.

### Forbidden palettes
- ❌ Purple / violet (that's MERMELADA.TECH).
- ❌ Navy + orange (that's the pitch deck).
- ❌ Blue→purple "AI" gradients (Jasper / Copilot cliché).

---

## 3. Type

- **Headings:** `--font-heading` (Plus Jakarta Sans 700/800). Tight tracking. Always sentence case.
- **Body:** `--font-body` (DM Sans 400/500).
- **Mono:** `--font-mono` (JetBrains Mono). Agent output, IDs, model names, JSON.
- **Never** Inter, Roboto, Arial, Geist, system fallback as the primary.

Scale via `--fs-display | h1 | h2 | h3 | h4 | body | small | micro`. One `<h1>` per page; sub-sections cascade H2 → H3.

---

## 4. Shape, depth, motion

| Concern | Rule |
|---|---|
| Card | `border-radius: var(--radius-lg)` · 1px `--color-border` · `--shadow-sm` on light, no shadow on dark (border carries elevation). |
| Input | `--radius-md`. Focus = 3px teal ring at ~30% (`--shadow-glow-primary`) + border darkens to `--color-primary`. |
| Pill | `--radius-pill`, padding `4px 10px`, micro caps or mono. **Status only.** |
| Shadow | `--shadow-sm` cards · `--shadow-md` popovers · `--shadow-lg` modals. Two-layer, Linear-ish. |
| Motion | 200ms on `var(--ease-out)`. Hover changes color/border, never position. Press = `translate-y-px`. |
| Blur | Only on the dark scrolled header (`backdrop-filter: blur(12px)` over `rgba(11,16,21,0.7)`). Nowhere else. |
| Pulse | The single *running* pipeline step pulses teal → teal-light at 1.2s. Nothing else animates ambiently. |
| Skeletons | **None.** Use a muted text placeholder: "El agente está analizando la marca…". |

---

## 5. Layout

- Dashboard sidebar: **fixed 240px**, logo lockup top-left, always visible.
- Form column: `max-width: 880px` (`max-w-3xl`).
- Dashboard column: `max-width: 1120px`.
- Onboarding pattern: **stepper-left, live preview-right** (Brand Profile builds in real time as user fills the form).
- Generous whitespace. Tight, regular grid. The vibe is "operations console", not "marketing landing".

---

## 6. Components — the canon

The complete reference lives in `ui_kits/app/`. Fork those screens; don't redraw from scratch.

**Buttons**
- Primary: solid `--color-primary`, white text, `--radius-md`. Hover → `--color-primary-dark`.
- Secondary: white bg, 1px `--color-border`, ink text. Hover → `--color-surface-2`.
- Ghost: text-only, ink → primary on hover.
- Accent: solid `--color-accent`. Used **only** on the moment a CTA must win (e.g. "Aprobar Brand Profile" when state is *awaiting*).

**Status pills**
- *Pendiente* — neutral, `--color-surface-2` bg, ink-soft text.
- *Listo para generar* — teal soft, primary text.
- *Pendiente de aprobación* — accent soft, accent dark text. Animates in (fade + 4px y-translate, 220ms).
- *Aprobado* — success soft, success text.

**Cards**
- `rounded-lg border bg-card shadow-sm` (Tailwind pattern in the codebase).
- ❌ No left-accent colored border cards. Banned.

**Pipeline step**
- Six steps, locked → running → awaiting → approved. Only one runs at a time. State markers may use emoji (`🔒 🔓 ✅`) — kept as a deliberate small touch.

**Provider badge**
- Real provider logomark (Anthropic / OpenAI / Google / Together / Groq) if available; otherwise one-letter mono cap chip in primary teal.

**Logo**
- Use `assets/logo-t-mark.svg` and friends. Never redraw the T freehand. The T can also serve as a typographic ornament (small `·` between metadata) — reuse the SVG.

---

## 7. Iconography

- **Lucide** at 16px default · 20px in headers · 14px in chips. Stroke 1.75, `currentColor`.
- CDN: `<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>` then `<i data-lucide="check-circle-2"></i>`.

**Banned motifs:** generic chat bubbles, robot/AI mascot avatars, decorative sparkles ✨ (sparkle is OK on the actual "Generate" CTA where it's earned), hand-drawn SVG of pipelines/agents.

---

## 8. Backgrounds & ornament

- Solid surfaces by default. No gradient heroes.
- One acceptable ornament: a 30%-opacity teal radial glow behind the pipeline visual on the login left panel. Barely there.
- A 24px dot grid at 6% opacity is allowed as a control-room backdrop on dark surfaces. Optional.
- No stock photos. If imagery ever appears, it's warm-temperature documentary — cream / amber / muted teal.

---

## 9. Working with HTML deliverables in this project

When producing a new HTML mock, prototype, or deck for this brand:

1. `<link rel="stylesheet" href="colors_and_type.css">` in `<head>`.
2. Build from `ui_kits/app/` — copy the screen closest to what you need and fork it.
3. Reach for tokens, not values. `padding: var(--space-4)`, not `padding: 16px`.
4. Spanish copy (`vos`) for any UI text — even placeholder text. English only for product nouns the user already says in English.
5. One H1 per page. Sentence case. Headlines with `text-wrap: balance`.
6. Lay siblings out with `display: flex` / `grid` + `gap`. Never inline-block + whitespace.
7. When in doubt: **less ornament, more grid. Warmer copy, more `vos`.**

---

## 10. Quick checklist before shipping a screen

- [ ] `colors_and_type.css` imported, no raw hex anywhere.
- [ ] All copy is `vos`-form Spanish, sentence case.
- [ ] Exactly one primary CTA per region. Accent orange used at most once per screen, and only for "awaiting approval" energy.
- [ ] Cards use border + `--shadow-sm` on light, border-only on dark. No left-accent stripe.
- [ ] Inputs have the teal focus ring.
- [ ] No skeleton shimmer, no purple, no AI gradient, no robot mascot.
- [ ] H1 count = 1. Type uses Plus Jakarta / DM Sans / JetBrains Mono only.
- [ ] Logo is the SVG from `assets/`, not redrawn.
- [ ] Pipeline running state pulses; nothing else animates ambiently.
