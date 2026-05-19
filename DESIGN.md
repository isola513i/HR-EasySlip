# Design System

## Color Palette

Strategy: **Restrained** on product surfaces; **Committed** on brand/hero sections. Indigo primary, with blue-to-cyan gradient accents at key brand moments.

| Role | Value | Usage |
|------|-------|-------|
| Background | `#f6f8fa` | Page background (cool-tinted near-white) |
| Foreground | `#10151e` | Body text, headings |
| Primary | `#3d46cc` | CTAs, links, active states, badges |
| Primary foreground | `#ffffff` | Text on primary surfaces |
| Muted foreground | `#5e6878` | Secondary text, labels |
| Card | `#ffffff` | Card surfaces |
| Border | derived | Light separator lines |
| Accent cyan | `#06b6d4` | Gradient tail on hero/CTA gradients |

Brand gradient (CTA, hero, Pro pricing card): `from-[#1d2bca] via-[#3d46cc] to-[#06b6d4]`
Light section tint: `from-[#eef4ff] via-white to-[#f6f8fa]`

Hard-coded hex usage is intentional for gradient stops that can't be expressed as tokens.

## Typography

Primary font: NotoSansThai (variable, `--font-geist-sans`)
Monospace: Geist Mono (`--font-geist-mono`) — used for slugs, code, company URLs

| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | `text-5xl–6xl` | `font-bold` | Hero headline |
| H2 | `text-3xl–4xl` | `font-bold` | Section titles |
| H3 | `text-xl` | `font-semibold` | Card/subsection titles |
| Body | `text-base` | `font-normal` | Main content |
| Caption | `text-sm` | `font-normal` | Labels, sublabels |
| Micro | `text-xs` | `font-medium` | Badges, pills, hints |

Line length cap: 65–75ch on body text. `max-w-xl` or `max-w-2xl` on paragraphs.

## Spacing & Layout

Sections: `py-20 sm:py-24` (consistent, except Trust Pillars at `py-10`)
Max content width: `max-w-7xl` with `px-4 sm:px-6 lg:px-8`
Card padding: `p-8` (feature cards), `p-5` (about/use-case cards)
Radius: `--radius: 0.75rem` base; cards use `rounded-2xl`

## Elevation

| Level | Usage |
|-------|-------|
| `shadow-sm` | Default card (feature grid, about values) |
| `shadow-md` | Nav hover, dropdown |
| `shadow-xl shadow-primary/30` | Hero screenshot, Pro pricing card |
| `shadow-2xl shadow-primary/30` | Highlighted pricing tier |

## Components

Built on shadcn/ui (29 components). Key custom patterns:

- **AuthLayout** (`components/shared/auth-layout.tsx`): Two-panel — left form, right branded dashboard showcase. Used for signin, signup, workspace login.
- **MarketingNav** (`components/marketing/marketing-nav.tsx`): Sticky, `h-20`, white/80 backdrop blur, 5 anchor links + signin/trial buttons.
- **PricingTable**: 3-tier cards; Pro card uses full brand gradient with dot-pattern overlay.
- **Brand CTA button**: `bg-gradient-to-r from-[#3d46cc] via-[#2f50e6] to-[#3b82f6]`, `h-14 px-10` on desktop.
- **Social icons**: Brand-color backgrounds (LINE `#00B900`, Facebook `#1877F2`, TikTok `#010101`) with white SVG icons.

## Motion

Library: `tw-animate-css`
Pattern: `animate-in fade-in slide-in-from-bottom-2 duration-500` on scroll-reveal
Easing: default ease-out
Reduced-motion: `@media (prefers-reduced-motion: reduce)` disables all animation durations to 0.001ms

## Do / Don't

**Do**: Real product screenshots > marketing art. Token-based colors. `scroll-mt-24` on all anchor sections. `focus-visible:ring-2 focus-visible:ring-ring` on interactive elements.

**Don't**: Gradient text (`bg-clip-text`). Side-stripe card borders. Glassmorphism blurs. Fake metrics or placeholder avatars. Strong legal compliance claims. Nested cards. Identical card grids across all sections.
