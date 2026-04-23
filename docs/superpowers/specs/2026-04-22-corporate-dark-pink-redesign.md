# Corporate Dark Mode Redesign — Design Spec

**Date:** 2026-04-22
**Status:** Approved
**Scope:** Frontend visual redesign — layout, theming, component library migration

---

## Context

The Equipment Manager frontend is built on Tailwind CSS v4 with custom components, blue as the primary accent color, a top navigation bar, and system fonts. The goal is a stronger corporate look: dark mode as the primary aesthetic, a fuchsia accent color, Inter typography, and a sidebar-based layout. The redesign adopts shadcn/ui as a component library to standardize UI primitives across the app.

No changes to routing, API layer, auth, or business logic. This is a visual layer migration.

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Accent color | Fuchsia `#d946ef` | Electric, distinctive, high contrast on dark backgrounds |
| Dark background | Slate `#0f172a` | Cool blue-tinted dark; common in corporate dashboards |
| Font | Inter (Google Fonts) | Industry standard for SaaS dashboards; clean, highly legible |
| Layout shell | Sidebar navigation | Standard corporate dashboard pattern; active state indicator reinforces brand |
| Component library | shadcn/ui | Code-owned primitives, Radix accessibility, pairs cleanly with Tailwind v4 |

---

## Theme Tokens

Defined in `frontend/src/index.css` as CSS custom properties. shadcn reads these via `var(--token)` references baked into the generated component source.

### Light mode (`:root`)

```css
--background: #ffffff;
--foreground: #0f172a;
--primary: #d946ef;
--primary-foreground: #ffffff;
--secondary: #f1f5f9;
--secondary-foreground: #0f172a;
--muted: #f8fafc;
--muted-foreground: #64748b;
--accent: #fdf4ff;
--accent-foreground: #d946ef;
--destructive: #ef4444;
--destructive-foreground: #ffffff;
--border: #e2e8f0;
--input: #e2e8f0;
--ring: #d946ef;
--card: #ffffff;
--card-foreground: #0f172a;
--sidebar-background: #f8fafc;
--sidebar-active: #fdf4ff;
--sidebar-active-border: #d946ef;
--radius: 0.5rem;
```

### Dark mode (`.dark`)

```css
--background: #0f172a;
--foreground: #f1f5f9;
--primary: #d946ef;
--primary-foreground: #ffffff;
--secondary: #1e293b;
--secondary-foreground: #f1f5f9;
--muted: #1e293b;
--muted-foreground: #94a3b8;
--accent: #2d1a3d;
--accent-foreground: #e879f9;
--destructive: #ef4444;
--destructive-foreground: #ffffff;
--border: #1e293b;
--input: #1e293b;
--ring: #d946ef;
--card: #1e293b;
--card-foreground: #f1f5f9;
--sidebar-background: #0a0f1e;
--sidebar-active: #2d1a3d;
--sidebar-active-border: #d946ef;
```

---

## Font

Inter loaded via Google Fonts in `frontend/index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Applied as the base font in `index.css`:

```css
body {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}
```

---

## Shell Architecture

The current layout (inline in `App.tsx`, using `Header.tsx`) is replaced by three new components:

### `Sidebar.tsx`
Replaces `Header.tsx`. Full-height left panel containing:
- Logo/brand mark at top (fuchsia icon + "Equipment Manager" wordmark)
- Nav section with labeled groups ("Main", "Admin")
- Nav items: Dashboard, Equipment, Procedures, Users, Setup
- Active item: `bg-[--sidebar-active]`, `border-l-2 border-[--sidebar-active-border]`, text in `--accent-foreground`
- Active state driven by `useLocation()` from react-router — match on `pathname.startsWith(route)`
- Footer: avatar initials, user name + role, logout via shadcn `DropdownMenu`

### `AppLayout.tsx`
Replaces the unnamed layout wrapper in `App.tsx`. Renders:
```tsx
<div className="flex h-screen overflow-hidden">
  <Sidebar />
  <div className="flex flex-col flex-1 overflow-hidden">
    <Topbar />
    <main className="flex-1 overflow-y-auto p-6">
      <Outlet />
    </main>
  </div>
</div>
```

### `Topbar.tsx`
Slim bar (52px) above the content area:
- Left: `Breadcrumbs` component (unchanged logic, updated classes)
- Right: `ThemeToggle` (updated to shadcn `Button` variant `ghost`)

### Components removed
- `Header.tsx` — superseded by `Sidebar.tsx` + `Topbar.tsx`
- `Footer.tsx` — removed. Version info is dropped from the UI (it's dev-facing; the backend exposes it via `/api/about` if needed).

---

## shadcn/ui Component Installation

Install via `npx shadcn add <component>` after `npx shadcn init`.

| shadcn component | Used in |
|---|---|
| `button` | All action buttons across all pages and components |
| `input` | EquipmentForm, ProcedureForm, LoginPage, search fields |
| `label` | All form field labels |
| `select` | EquipmentForm status/category selects |
| `textarea` | EquipmentForm notes field |
| `badge` | Status badges in EquipmentList, ProcedureList, DashboardPage |
| `table` | EquipmentList, ProcedureList, DashboardPage, UsersPage |
| `card` | Stat cards on DashboardPage, mobile card views |
| `dropdown-menu` | Sidebar user menu (logout) |
| `separator` | Sidebar nav section dividers |
| `alert` | Error/success alerts — LoginPage and any API error surfaces |
| `skeleton` | Loading states on list/table pages |
| `tooltip` | Icon-only buttons (ThemeToggle, logout icon) |

---

## Existing Components — Migration Scope

| Component | Change |
|---|---|
| `EquipmentForm.tsx` | Replace input/select/textarea/button with shadcn primitives; update container classes to token-based |
| `EquipmentList.tsx` | Replace table markup with shadcn Table; replace badges with shadcn Badge; replace action buttons |
| `ProcedureForm.tsx` | Same as EquipmentForm; SimpleMDE wrapper stays, surrounding chrome updates |
| `ProcedureList.tsx` | Same as EquipmentList |
| `CalendarView.tsx` | Class updates only — no shadcn replacement needed |
| `Breadcrumbs.tsx` | Class updates only |
| `ThemeProvider.tsx` | No change |
| `ThemeToggle.tsx` | Wrap with shadcn `Button variant="ghost"` + shadcn `Tooltip` |
| All pages | Update wrapper padding/spacing classes to token-based; replace hand-rolled alerts with shadcn `Alert` |

---

## SimpleMDE Dark Mode

The existing custom CSS overrides in `index.css` for CodeMirror/SimpleMDE are retained. Colors updated to match slate palette:

```css
.dark .EasyMDEContainer .CodeMirror {
  background: #1e293b;
  color: #f1f5f9;
  border-color: #334155;
}
.dark .EasyMDEContainer .editor-toolbar {
  background: #0f172a;
  border-color: #1e293b;
}
.dark .EasyMDEContainer .editor-toolbar button {
  color: #94a3b8;
}
.dark .EasyMDEContainer .editor-toolbar button:hover {
  background: #1e293b;
  color: #f1f5f9;
}
```

---

## Loading States

Pages that currently render nothing during data fetch will show shadcn `Skeleton` rows. Pattern:

```tsx
if (loading) return <TableSkeleton rows={5} />
```

`TableSkeleton` is a small local component (not from shadcn directly) that renders skeleton rows matching the table column count. Added to EquipmentList, ProcedureList, UsersPage, DashboardPage.

---

## Error Handling

Hand-rolled error alert markup replaced with shadcn `Alert`:

```tsx
<Alert variant="destructive">
  <AlertDescription>{error}</AlertDescription>
</Alert>
```

Applied consistently across: LoginPage, EquipmentForm, ProcedureForm, any page surfacing API errors.

---

## Testing

- Framework: Vitest + Testing Library (no change)
- Run `npm test` after each component migration
- Testing Library queries target roles/labels, not class names — tests should pass without modification
- No new test files required for this redesign

---

## Out of Scope

- Routing changes
- API layer changes
- Auth / permission logic changes
- Mobile-specific layout redesign (responsive classes updated but no new mobile-first work)
- Animation or transition system
- Dark/light mode toggle behavior (next-themes stays as-is)
