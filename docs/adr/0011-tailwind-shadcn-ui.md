# 11. Tailwind v4 + shadcn/Radix component library

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

The frontend needs accessible, themeable primitives (dropdowns, selects,
tooltips, dialogs) without committing to a heavyweight component framework
that paints over Tailwind. The project uses Tailwind v4 — see
`@tailwindcss/vite` and `tailwindcss` `^4.1.8` in `frontend/package.json`.
The project's `CLAUDE.md` instructs contributors to use Tailwind v4
*semantic* utilities and avoid arbitrary CSS variable values.

## Decision

- **Styling:** Tailwind v4 with utility classes and the official
  typography plugin. No CSS-in-JS, no custom variable bag.
- **Components:** [shadcn/ui](https://ui.shadcn.com/) — copies generator
  output into `frontend/src/components/ui` so the components live in this
  repo and can be edited freely (no version-pinned dependency to upgrade).
- **Primitives:** Radix UI (`@radix-ui/react-dropdown-menu`, `react-select`,
  `react-tooltip`, `react-label`, `react-separator`, `react-slot`)
  underneath shadcn — provides accessibility (focus management, keyboard
  navigation, ARIA roles).
- **Theming:** `next-themes` for light/dark mode (`ThemeProvider` in
  `App.tsx` defaults to `"system"`).
- **Icons:** `lucide-react`.
- **Markdown / Editor:** `react-markdown` for rendering, `easymde` /
  `react-simplemde-editor` for the Markdown text fields used by procedure
  descriptions.

## Consequences

- **Positive:** customizing a component means editing its source, not
  fighting a third-party theme system.
- **Positive:** Radix carries the accessibility burden — focus traps,
  escape-to-close, screen-reader semantics — without the team owning that
  code.
- **Negative:** shadcn components are forked into the repo, so library
  fixes don't flow in automatically; treat them as project source.
- **Negative:** Tailwind v4 is recent and its generator/plugin ecosystem
  is still settling. The CLAUDE.md guideline about semantic utilities is a
  hedge against drifting back to v3 patterns.
