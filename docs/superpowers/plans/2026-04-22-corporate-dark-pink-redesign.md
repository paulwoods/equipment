# Corporate Dark Mode Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Equipment Manager frontend to a corporate dark theme with a fuchsia accent, Inter font, shadcn/ui component library, and a sidebar layout replacing the current top nav.

**Architecture:** Install shadcn/ui (Radix-based, code-owned primitives), replace CSS variables in `index.css` with the full shadcn token set, build `Sidebar.tsx` + `AppLayout.tsx` + `Topbar.tsx` as the new shell, then migrate each component and page to shadcn primitives. No changes to routing, API, auth, or business logic.

**Tech Stack:** React 19, Tailwind CSS v4 (`@tailwindcss/vite`, no `tailwind.config.js`), shadcn/ui, Radix UI, `class-variance-authority`, `clsx`, `tailwind-merge`, `next-themes`, `lucide-react`, `react-router-dom` v7, Vitest + Testing Library.

---

## File Map

**New files:**
- `frontend/src/components/Sidebar.tsx` — full-height sidebar nav with logo, nav items, user footer
- `frontend/src/components/AppLayout.tsx` — shell layout: sidebar + topbar + main outlet
- `frontend/src/components/Topbar.tsx` — slim topbar: breadcrumbs left, theme toggle right
- `frontend/src/components/TableSkeleton.tsx` — skeleton loading rows for tables
- `frontend/src/lib/utils.ts` — `cn()` helper (created by `shadcn init`)
- `frontend/src/components/ui/` — shadcn generated components (button, input, label, select, textarea, badge, table, card, dropdown-menu, separator, alert, skeleton, tooltip)
- `frontend/tests/components/Sidebar.test.tsx` — Sidebar tests
- `frontend/tests/components/AppLayout.test.tsx` — AppLayout smoke test

**Modified files:**
- `frontend/index.html` — add Inter Google Fonts links
- `frontend/src/index.css` — replace CSS vars with shadcn token set + Inter font + updated SimpleMDE dark overrides
- `frontend/src/App.tsx` — swap `Layout` + `Header`/`Footer` imports for `AppLayout`; update `components` barrel
- `frontend/src/components/index.ts` — remove `Header`, `Footer`; add `Sidebar`, `AppLayout`, `Topbar`, `TableSkeleton`
- `frontend/src/components/ThemeToggle.tsx` — wrap with shadcn `Button` + `Tooltip`
- `frontend/src/components/Breadcrumbs.tsx` — class updates to token-based colors
- `frontend/src/components/EquipmentForm.tsx` — shadcn Input, Label, Select, Textarea, Button
- `frontend/src/components/EquipmentList.tsx` — shadcn Table, Badge, Button; skeleton loading; token colors
- `frontend/src/components/ProcedureForm.tsx` — shadcn Input, Label, Button; SimpleMDE chrome update
- `frontend/src/components/ProcedureList.tsx` — shadcn Table, Button; skeleton loading; token colors
- `frontend/src/components/CalendarView.tsx` — class updates only
- `frontend/src/pages/LoginPage.tsx` — shadcn Input, Button, Alert; token colors
- `frontend/src/pages/DashboardPage.tsx` — shadcn Card, Table, Badge, Button, Skeleton; token colors
- `frontend/src/pages/UsersPage.tsx` — shadcn Table, Button, Alert; skeleton loading; token colors
- `frontend/src/pages/EquipmentPage.tsx` — token color updates
- `frontend/src/pages/*.tsx` (remaining) — token color class updates on wrappers/headings/buttons

**Deleted files:**
- `frontend/src/components/Header.tsx`
- `frontend/src/components/Footer.tsx`
- `frontend/tests/components/Header.test.tsx`
- `frontend/tests/components/Footer.test.tsx`

---

## Task 1: Add Inter font and update index.html

**Files:**
- Modify: `frontend/index.html`

- [ ] **Step 1: Add Inter font links to `index.html`**

Open `frontend/index.html`. Add these three lines inside `<head>`, before the closing `</head>` tag:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Verify the file looks correct**

Run: `grep -n "Inter" frontend/index.html`
Expected output: one line containing the Google Fonts URL for Inter.

- [ ] **Step 3: Commit**

```bash
git add frontend/index.html
git commit -m "feat: add Inter font via Google Fonts"
```

---

## Task 2: Replace CSS tokens in index.css

**Files:**
- Modify: `frontend/src/index.css`

This task replaces the two CSS variable blocks (`:root` and `.dark`) with the full shadcn token set, changes the body font to Inter, and updates the SimpleMDE dark mode overrides to match the slate palette.

- [ ] **Step 1: Replace the entire contents of `frontend/src/index.css`**

```css
@import "tailwindcss";

@plugin "@tailwindcss/typography";

@variant dark (&:where(.dark, .dark *));

:root {
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
}

.dark {
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
}

body {
  margin: 0;
  background-color: var(--background);
  color: var(--foreground);
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

/* SimpleMDE Dark Mode Overrides */
.dark .EasyMDEContainer .CodeMirror {
  background: #1e293b !important;
  color: #f1f5f9 !important;
  border-color: #334155 !important;
}

.dark .EasyMDEContainer .editor-toolbar {
  background: #0f172a !important;
  border-color: #1e293b !important;
}

.dark .EasyMDEContainer .editor-toolbar button {
  color: #94a3b8 !important;
}

.dark .EasyMDEContainer .editor-toolbar button:hover,
.dark .EasyMDEContainer .editor-toolbar button.active {
  background: #1e293b !important;
  border-color: #334155 !important;
  color: #f1f5f9 !important;
}

.dark .EasyMDEContainer .editor-preview {
  background: #1e293b !important;
  color: #f1f5f9 !important;
}

.dark .EasyMDEContainer .editor-statusbar {
  color: #94a3b8 !important;
}

.dark .EasyMDEContainer .CodeMirror-cursor {
  border-left: 1px solid #f1f5f9 !important;
}

/* EasyMDE light mode button fix */
.editor-toolbar button {
  color: black !important;
}

.editor-toolbar button.active,
.editor-toolbar button:hover {
  background: #f0f0f0 !important;
  border-color: #ccc !important;
  color: black !important;
}
```

- [ ] **Step 2: Run tests to confirm nothing broken**

```bash
cd frontend && npm test
```
Expected: all tests pass (CSS changes don't affect test assertions).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: replace CSS tokens with shadcn palette — fuchsia/slate theme"
```

---

## Task 3: Install shadcn/ui

**Files:**
- Create: `frontend/components.json` (generated by shadcn init)
- Create: `frontend/src/lib/utils.ts` (generated by shadcn init)
- Create: `frontend/src/components/ui/` (generated per component)

shadcn/ui works with Tailwind v4 but requires specific init flags. Follow each step exactly.

- [ ] **Step 1: Install peer dependencies**

```bash
cd frontend && npm install class-variance-authority clsx tailwind-merge @radix-ui/react-slot
```

Expected: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Run shadcn init**

```bash
cd frontend && npx shadcn@latest init --defaults
```

When prompted:
- Style: **Default**
- Base color: **Slate** (we'll override the actual values — this just seeds the config)
- CSS variables: **yes**

This creates `components.json` and `src/lib/utils.ts`.

- [ ] **Step 3: Verify `src/lib/utils.ts` was created**

Run: `cat frontend/src/lib/utils.ts`
Expected output:
```ts
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
(exact output may vary slightly — just confirm the `cn` function exists)

- [ ] **Step 4: Install all required shadcn components**

```bash
cd frontend && npx shadcn@latest add button input label select textarea badge table card dropdown-menu separator alert skeleton tooltip
```

Accept all prompts. This populates `src/components/ui/`.

- [ ] **Step 5: Verify components were created**

```bash
ls frontend/src/components/ui/
```
Expected: `button.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `textarea.tsx`, `badge.tsx`, `table.tsx`, `card.tsx`, `dropdown-menu.tsx`, `separator.tsx`, `alert.tsx`, `skeleton.tsx`, `tooltip.tsx`.

- [ ] **Step 6: Run tests**

```bash
cd frontend && npm test
```
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add frontend/components.json frontend/src/lib/ frontend/src/components/ui/ frontend/package.json frontend/package-lock.json
git commit -m "feat: install shadcn/ui with fuchsia/slate theme primitives"
```

---

## Task 4: Build `Sidebar.tsx`

**Files:**
- Create: `frontend/src/components/Sidebar.tsx`
- Create: `frontend/tests/components/Sidebar.test.tsx`

The sidebar is the new primary navigation shell. It reads `useLocation()` to set active states and `useAuth()` for the user footer.

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/components/Sidebar.test.tsx`:

```tsx
import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {AuthContext} from '../../src/hooks/useAuth';
import {Sidebar} from '../../src/components/Sidebar';

vi.mock('../../src/api/client', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({resolvedTheme: 'light', setTheme: vi.fn()}),
}));

const renderSidebar = (username = 'alice@example.com', initialPath = '/dashboard') => {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthContext.Provider value={{username, role: 'ADMIN', setAuthenticated: vi.fn()}}>
        <Sidebar />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('Sidebar', () => {
  it('renders the app brand name', () => {
    renderSidebar();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
  });

  it('renders main nav links', () => {
    renderSidebar();
    expect(screen.getByRole('link', {name: /dashboard/i})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /equipment/i})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /procedures/i})).toBeInTheDocument();
  });

  it('renders admin nav links', () => {
    renderSidebar();
    expect(screen.getByRole('link', {name: /users/i})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /setup/i})).toBeInTheDocument();
  });

  it('renders the logged-in username', () => {
    renderSidebar();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('marks the current route as active', () => {
    renderSidebar('alice@example.com', '/dashboard');
    const dashboardLink = screen.getByRole('link', {name: /dashboard/i});
    expect(dashboardLink.className).toMatch(/border-l-2/);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
cd frontend && npm test -- tests/components/Sidebar.test.tsx
```
Expected: FAIL — `Sidebar` not found.

- [ ] **Step 3: Create `frontend/src/components/Sidebar.tsx`**

```tsx
import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import {
  LayoutDashboard,
  Monitor,
  FileText,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import {useAuth} from '../hooks';
import {logout} from '../api/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {Separator} from './ui/separator';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const mainNav: NavItem[] = [
  {label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard},
  {label: 'Equipment', href: '/equipment', icon: Monitor},
  {label: 'Procedures', href: '/procedures', icon: FileText},
];

const adminNav: NavItem[] = [
  {label: 'Users', href: '/users', icon: Users},
  {label: 'Setup', href: '/setup', icon: Settings},
];

const NavLink = ({item}: {item: NavItem}): React.JSX.Element => {
  const {pathname} = useLocation();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  return (
    <Link
      to={item.href}
      className={[
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors border-l-2',
        isActive
          ? 'bg-[var(--sidebar-active)] border-[var(--sidebar-active-border)] text-[var(--accent-foreground)]'
          : 'border-transparent text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]',
      ].join(' ')}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {item.label}
    </Link>
  );
};

export const Sidebar = (): React.JSX.Element => {
  const {username, setAuthenticated} = useAuth();

  const handleLogout = async (): Promise<void> => {
    await logout();
    setAuthenticated(false);
    window.location.href = '/';
  };

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : '??';

  return (
    <aside
      className="flex flex-col w-56 flex-shrink-0 border-r"
      style={{
        background: 'var(--sidebar-background)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{borderColor: 'var(--border)'}}>
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
          style={{background: 'var(--primary)'}}
        >
          <Monitor className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold" style={{color: 'var(--foreground)'}}>Equipment</div>
          <div className="text-xs" style={{color: 'var(--muted-foreground)'}}>Manager</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-4">
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-widest" style={{color: 'var(--muted-foreground)'}}>
          Main
        </p>
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <Separator className="my-3" />

        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-widest" style={{color: 'var(--muted-foreground)'}}>
          Admin
        </p>
        {adminNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t px-2 py-3" style={{borderColor: 'var(--border)'}}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full px-2 py-2 rounded-md text-left transition-colors hover:bg-[var(--secondary)] cursor-pointer">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--primary) 40%, transparent)',
                  color: 'var(--primary)',
                }}
              >
                {initials}
              </div>
              <span className="text-xs font-medium truncate flex-1" style={{color: 'var(--foreground)'}}>
                {username ?? 'Guest'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-[var(--destructive)]">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};
```

- [ ] **Step 4: Run tests**

```bash
cd frontend && npm test -- tests/components/Sidebar.test.tsx
```
Expected: all 5 tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
cd frontend && npm test
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Sidebar.tsx frontend/tests/components/Sidebar.test.tsx
git commit -m "feat: add Sidebar navigation component"
```

---

## Task 5: Build `Topbar.tsx` and `AppLayout.tsx`

**Files:**
- Create: `frontend/src/components/Topbar.tsx`
- Create: `frontend/src/components/AppLayout.tsx`
- Create: `frontend/tests/components/AppLayout.test.tsx`

- [ ] **Step 1: Create `frontend/src/components/Topbar.tsx`**

```tsx
import React from 'react';
import {Breadcrumbs} from './Breadcrumbs';
import {ThemeToggle} from './ThemeToggle';

export const Topbar = (): React.JSX.Element => {
  return (
    <div
      className="flex items-center justify-between h-[52px] px-6 border-b flex-shrink-0"
      style={{
        background: 'var(--background)',
        borderColor: 'var(--border)',
      }}
    >
      <Breadcrumbs />
      <ThemeToggle />
    </div>
  );
};
```

- [ ] **Step 2: Create `frontend/src/components/AppLayout.tsx`**

```tsx
import React from 'react';
import {Outlet} from 'react-router-dom';
import {Sidebar} from './Sidebar';
import {Topbar} from './Topbar';

export const AppLayout = (): React.JSX.Element => {
  return (
    <div className="flex h-screen overflow-hidden" style={{background: 'var(--background)'}}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Write a smoke test for `AppLayout`**

Create `frontend/tests/components/AppLayout.test.tsx`:

```tsx
import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter, Routes, Route} from 'react-router-dom';
import {AuthContext} from '../../src/hooks/useAuth';
import {AppLayout} from '../../src/components/AppLayout';

vi.mock('../../src/api/client', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
  fetchEquipment: vi.fn().mockResolvedValue([]),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({resolvedTheme: 'light', setTheme: vi.fn()}),
}));

describe('AppLayout', () => {
  it('renders sidebar and outlet content', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthContext.Provider value={{username: 'alice@example.com', role: 'ADMIN', setAuthenticated: vi.fn()}}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<div>Dashboard content</div>} />
            </Route>
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the new tests**

```bash
cd frontend && npm test -- tests/components/AppLayout.test.tsx
```
Expected: 1 test PASSES.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Topbar.tsx frontend/src/components/AppLayout.tsx frontend/tests/components/AppLayout.test.tsx
git commit -m "feat: add AppLayout and Topbar shell components"
```

---

## Task 6: Wire `AppLayout` into `App.tsx`, remove `Header`/`Footer`

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/index.ts`
- Delete: `frontend/src/components/Header.tsx`
- Delete: `frontend/src/components/Footer.tsx`
- Delete: `frontend/tests/components/Header.test.tsx`
- Delete: `frontend/tests/components/Footer.test.tsx`

- [ ] **Step 1: Update `frontend/src/components/index.ts`**

Replace the entire file:

```ts
export {AppLayout} from './AppLayout';
export {Sidebar} from './Sidebar';
export {Topbar} from './Topbar';
export {Breadcrumbs} from './Breadcrumbs';
export {CalendarView} from './CalendarView';
export {EquipmentForm} from './EquipmentForm';
export {EquipmentList} from './EquipmentList';
export {ProcedureForm} from './ProcedureForm';
export {ProcedureList} from './ProcedureList';
export {TableSkeleton} from './TableSkeleton';
export {ThemeProvider} from './ThemeProvider';
export {ThemeToggle} from './ThemeToggle';
```

- [ ] **Step 2: Rewrite the `Layout` component and imports in `App.tsx`**

In `frontend/src/App.tsx`, make these changes:

1. Replace the import line:
```tsx
// OLD
import {Breadcrumbs, Footer, Header, ThemeProvider} from './components';

// NEW
import {AppLayout, ThemeProvider} from './components';
```

2. Delete the entire `Layout` component function (the one that wraps `Header`, `Breadcrumbs`, `main`, `Footer`).

3. Replace every occurrence of `<Layout>...</Layout>` with `<AppLayout />` used as a route element. The `Layout` component previously wrapped child pages — in react-router v7, `AppLayout` uses `<Outlet />` instead. Update the route structure to nest protected routes under `AppLayout`:

Replace the entire return statement's `<Routes>` block with:

```tsx
<Routes>
  <Route path="/login" element={
    setupRequired
      ? <Navigate to="/setup" replace/>
      : <LoginPage/>
  }/>
  <Route path="/setup" element={
    !setupRequired
      ? <Navigate to="/login" replace/>
      : email
        ? <Navigate to="/dashboard" replace/>
        : <SetupPage onSetupComplete={(e) => {
            setSetupRequired(false);
            setEmail(e);
            setRole('ADMIN');
          }}/>
  }/>
  <Route element={<AppLayout />}>
    <Route path="/" element={<HomePage/>}/>
    <Route path="/dashboard" element={<ProtectedRoute email={email}><DashboardPage/></ProtectedRoute>}/>
    <Route path="/equipment" element={<ProtectedRoute email={email}><EquipmentPage/></ProtectedRoute>}/>
    <Route path="/equipment/new" element={<ProtectedRoute email={email}><NewEquipmentPage/></ProtectedRoute>}/>
    <Route path="/equipment/import" element={<ProtectedRoute email={email}><ImportEquipmentPage/></ProtectedRoute>}/>
    <Route path="/equipment/:id" element={<ProtectedRoute email={email}><EquipmentShowPage/></ProtectedRoute>}/>
    <Route path="/equipment/:id/edit" element={<ProtectedRoute email={email}><EditEquipmentPage/></ProtectedRoute>}/>
    <Route path="/equipment/:id/procedures" element={<ProtectedRoute email={email}><ProceduresPage/></ProtectedRoute>}/>
    <Route path="/equipment/:id/procedures/new" element={<ProtectedRoute email={email}><NewProcedurePage/></ProtectedRoute>}/>
    <Route path="/equipment/:id/procedures/:procedureId" element={<ProtectedRoute email={email}><ProcedureShowPage/></ProtectedRoute>}/>
    <Route path="/equipment/:id/procedures/:procedureId/edit" element={<ProtectedRoute email={email}><EditProcedurePage/></ProtectedRoute>}/>
    <Route path="/equipment/:id/procedures/:procedureId/perform" element={<ProtectedRoute email={email}><PerformProcedurePage/></ProtectedRoute>}/>
    <Route path="/equipment/:id/procedures/:procedureId/history" element={<ProtectedRoute email={email}><ProcedureHistoryPage/></ProtectedRoute>}/>
    <Route path="/users" element={<ProtectedRoute email={email}><UsersPage/></ProtectedRoute>}/>
    <Route path="/users/new" element={<ProtectedRoute email={email}><NewUserPage/></ProtectedRoute>}/>
    <Route path="/users/:id/edit" element={<ProtectedRoute email={email}><EditUserPage/></ProtectedRoute>}/>
    <Route path="/about" element={<AboutPage/>}/>
    <Route path="/contact" element={<ContactPage/>}/>
  </Route>
</Routes>
```

- [ ] **Step 3: Delete old files**

```bash
rm frontend/src/components/Header.tsx
rm frontend/src/components/Footer.tsx
rm frontend/tests/components/Header.test.tsx
rm frontend/tests/components/Footer.test.tsx
```

- [ ] **Step 4: Run full test suite**

```bash
cd frontend && npm test
```
Expected: all tests pass. (Header and Footer tests are gone; everything else should still work.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire AppLayout into App.tsx, remove Header and Footer"
```

---

## Task 7: Update `ThemeToggle.tsx` to use shadcn Button + Tooltip

**Files:**
- Modify: `frontend/src/components/ThemeToggle.tsx`

- [ ] **Step 1: Rewrite `frontend/src/components/ThemeToggle.tsx`**

```tsx
import React from 'react';
import {Moon, Sun} from 'lucide-react';
import {useTheme} from 'next-themes';
import {Button} from './ui/button';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from './ui/tooltip';

export const ThemeToggle = (): React.JSX.Element => {
  const {resolvedTheme, setTheme} = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Toggle theme"><div className="w-5 h-5"/></Button>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark'
              ? <Sun className="w-5 h-5 text-yellow-400"/>
              : <Moon className="w-5 h-5"/>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
```

- [ ] **Step 2: Run tests**

```bash
cd frontend && npm test -- tests/components/ThemeToggle.test.tsx
```
Expected: all ThemeToggle tests pass.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ThemeToggle.tsx
git commit -m "feat: migrate ThemeToggle to shadcn Button + Tooltip"
```

---

## Task 8: Update `Breadcrumbs.tsx` to token-based colors

**Files:**
- Modify: `frontend/src/components/Breadcrumbs.tsx`

Only class name changes — logic is unchanged.

- [ ] **Step 1: Update color classes in `Breadcrumbs.tsx`**

Find and replace these class strings (exact find/replace — don't change logic or structure):

| Find | Replace |
|---|---|
| `text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white` | `text-[var(--muted-foreground)] hover:text-[var(--foreground)]` |
| `text-gray-500 md:ml-2 dark:text-gray-400` | `text-[var(--muted-foreground)] md:ml-2` |
| `text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white` | `text-[var(--muted-foreground)] hover:text-[var(--foreground)] md:ml-2` |
| `text-gray-400 mx-1` | `text-[var(--muted-foreground)] mx-1` |

- [ ] **Step 2: Run tests**

```bash
cd frontend && npm test -- tests/components/Breadcrumbs.test.tsx
```
Expected: all Breadcrumbs tests pass.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Breadcrumbs.tsx
git commit -m "feat: update Breadcrumbs to token-based colors"
```

---

## Task 9: Create `TableSkeleton.tsx`

**Files:**
- Create: `frontend/src/components/TableSkeleton.tsx`

- [ ] **Step 1: Create `frontend/src/components/TableSkeleton.tsx`**

```tsx
import React from 'react';
import {Skeleton} from './ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton = ({rows = 5, columns = 4}: TableSkeletonProps): React.JSX.Element => {
  return (
    <div className="space-y-2 p-4">
      {Array.from({length: rows}).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({length: columns}).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/TableSkeleton.tsx
git commit -m "feat: add TableSkeleton loading component"
```

---

## Task 10: Migrate `EquipmentForm.tsx` to shadcn

**Files:**
- Modify: `frontend/src/components/EquipmentForm.tsx`

Replace all form field markup with shadcn primitives. Logic (`handleSubmit`, `handleChange`, `formData` state) is unchanged.

- [ ] **Step 1: Rewrite `frontend/src/components/EquipmentForm.tsx`**

```tsx
import type {ChangeEvent, FormEvent} from 'react';
import React, {useState} from 'react';
import type {Equipment} from '../types/equipment';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {Textarea} from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface EquipmentFormProps {
  equipment?: Equipment;
  onSubmit: (data: Omit<Equipment, 'id'> | Equipment) => void;
  onCancel: () => void;
}

export const EquipmentForm = ({equipment, onSubmit, onCancel}: EquipmentFormProps): React.JSX.Element => {
  const [formData, setFormData] = useState({
    manufacturer: equipment?.manufacturer ?? '',
    modelNumber: equipment?.modelNumber ?? '',
    serialNumber: equipment?.serialNumber ?? '',
    assetTag: equipment?.assetTag ?? '',
    location: equipment?.location ?? '',
    status: equipment?.status ?? 'Active' as Equipment['status'],
    description: equipment?.description ?? '',
    purchaseDate: equipment?.purchaseDate
      ? equipment.purchaseDate.split('T')[0]
      : new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (equipment) {
      onSubmit({...formData, id: equipment.id} as Equipment);
    } else {
      onSubmit(formData);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 rounded-lg border"
      style={{background: 'var(--card)', borderColor: 'var(--border)'}}
    >
      <h2 className="text-xl font-bold" style={{color: 'var(--card-foreground)'}}>
        {equipment ? 'Edit Equipment' : 'Add Equipment'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input id="manufacturer" name="manufacturer" value={formData.manufacturer} onChange={handleChange} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="modelNumber">Model Number</Label>
          <Input id="modelNumber" name="modelNumber" value={formData.modelNumber} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input id="serialNumber" name="serialNumber" value={formData.serialNumber} onChange={handleChange} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="assetTag">Asset Tag</Label>
          <Input id="assetTag" name="assetTag" value={formData.assetTag} onChange={handleChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" value={formData.location} onChange={handleChange} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData((prev) => ({...prev, status: value as Equipment['status']}))}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="In Use">In Use</SelectItem>
              <SelectItem value="Under Repair">Under Repair</SelectItem>
              <SelectItem value="Decommissioned">Decommissioned</SelectItem>
              <SelectItem value="In Storage">In Storage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="purchaseDate">Purchase Date</Label>
        <Input id="purchaseDate" type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} required />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t" style={{borderColor: 'var(--border)'}}>
        <Button type="button" variant="outline" onClick={onCancel} className="order-2 sm:order-1">
          Cancel
        </Button>
        <Button type="submit" className="order-1 sm:order-2">
          {equipment ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};
```

- [ ] **Step 2: Run EquipmentForm tests**

```bash
cd frontend && npm test -- tests/components/EquipmentForm.test.tsx
```
Expected: all tests pass.

- [ ] **Step 3: Run full suite**

```bash
cd frontend && npm test
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/EquipmentForm.tsx
git commit -m "feat: migrate EquipmentForm to shadcn primitives"
```

---

## Task 11: Migrate `EquipmentList.tsx` to shadcn

**Files:**
- Modify: `frontend/src/components/EquipmentList.tsx`

Replace table markup with shadcn Table, badges with shadcn Badge, action buttons with shadcn Button, add TableSkeleton for loading, update all color classes to token-based.

- [ ] **Step 1: Rewrite `frontend/src/components/EquipmentList.tsx`**

```tsx
import React, {useMemo, useState} from 'react';
import type {Equipment, EquipmentStatus} from '../types/equipment';
import {Link} from 'react-router-dom';
import {ChevronDown, ChevronUp, Search, X} from 'lucide-react';
import {Badge} from './ui/badge';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {TableSkeleton} from './TableSkeleton';

interface EquipmentListProps {
  items: Equipment[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

type SortField = 'manufacturer' | 'modelNumber' | 'location' | 'status';
type SortOrder = 'asc' | 'desc';

const statusVariant: Record<EquipmentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'Active': 'default',
  'In Use': 'secondary',
  'Under Repair': 'outline',
  'Decommissioned': 'destructive',
  'In Storage': 'secondary',
};

const SortIndicator = ({field, sortField, sortOrder}: {
  field: SortField;
  sortField: SortField;
  sortOrder: SortOrder;
}): React.JSX.Element => {
  if (sortField !== field) return <div className="w-4 h-4 ml-1 inline-block"/>;
  return sortOrder === 'asc'
    ? <ChevronUp className="w-4 h-4 ml-1 inline-block"/>
    : <ChevronDown className="w-4 h-4 ml-1 inline-block"/>;
};

export const EquipmentList = ({items, onDelete, loading = false}: EquipmentListProps): React.JSX.Element => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('manufacturer');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.manufacturer.toLowerCase().includes(lowerSearch) ||
        item.modelNumber.toLowerCase().includes(lowerSearch) ||
        (item.location && item.location.toLowerCase().includes(lowerSearch)) ||
        (item.status && item.status.toLowerCase().includes(lowerSearch)) ||
        (item.description && item.description.toLowerCase().includes(lowerSearch))
      );
    }
    result.sort((a, b) => {
      const aValue: string = a[sortField]?.toLowerCase() ?? '';
      const bValue: string = b[sortField]?.toLowerCase() ?? '';
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [items, searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]"/>
          <Input
            type="text"
            placeholder="Search equipment..."
            className="pl-10 pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setSearchTerm('')}>
              <X className="h-4 w-4 text-[var(--muted-foreground)]"/>
            </button>
          )}
        </div>
        <Button variant="secondary" asChild>
          <Link to="/equipment/import">Import</Link>
        </Button>
        <Button asChild>
          <Link to="/equipment/new">Add Equipment</Link>
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : (
        <>
          <div className="hidden md:block rounded-md border overflow-hidden" style={{borderColor: 'var(--border)'}}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('modelNumber')}>
                    Model Number <SortIndicator field="modelNumber" sortField={sortField} sortOrder={sortOrder}/>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('manufacturer')}>
                    Manufacturer <SortIndicator field="manufacturer" sortField={sortField} sortOrder={sortOrder}/>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('location')}>
                    Location <SortIndicator field="location" sortField={sortField} sortOrder={sortOrder}/>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                    Status <SortIndicator field="status" sortField={sortField} sortOrder={sortOrder}/>
                  </TableHead>
                  <TableHead>Procedures</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <Link to={`/equipment/${item.id}`} className="text-[var(--primary)] hover:underline">
                        {item.modelNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{item.manufacturer}</TableCell>
                    <TableCell>{item.location ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[item.status] ?? 'default'}>{item.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/equipment/${item.id}/procedures`}>View</Link>
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="mr-2">
                        <Link to={`/equipment/${item.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[var(--destructive)]" onClick={() => onDelete(item.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden divide-y" style={{borderColor: 'var(--border)'}}>
            {filteredAndSortedItems.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Link to={`/equipment/${item.id}`} className="text-[var(--primary)] hover:underline">
                      <h3 className="text-sm font-bold">{item.modelNumber}</h3>
                    </Link>
                    <p className="text-sm text-[var(--muted-foreground)]">{item.manufacturer}</p>
                    {item.location && <p className="text-xs text-[var(--muted-foreground)]">{item.location}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/equipment/${item.id}/procedures`}>View</Link>
                    </Button>
                    <Badge variant={statusVariant[item.status] ?? 'default'}>{item.status}</Badge>
                  </div>
                </div>
                {item.description && <p className="text-sm text-[var(--muted-foreground)]">{item.description}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/equipment/${item.id}/edit`}>Edit</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[var(--destructive)]" onClick={() => onDelete(item.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredAndSortedItems.length === 0 && (
            <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
              {searchTerm ? 'No equipment matches your search.' : 'No equipment found. Add some to get started!'}
            </div>
          )}
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Run EquipmentList tests**

```bash
cd frontend && npm test -- tests/components/EquipmentList.test.tsx
```
Expected: all tests pass.

- [ ] **Step 3: Run full suite**

```bash
cd frontend && npm test
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/EquipmentList.tsx
git commit -m "feat: migrate EquipmentList to shadcn Table + Badge + Button"
```

---

## Task 12: Migrate `ProcedureForm.tsx` to shadcn

**Files:**
- Modify: `frontend/src/components/ProcedureForm.tsx`

Logic and SimpleMDE instances are unchanged; only surrounding form chrome is migrated.

- [ ] **Step 1: Rewrite `frontend/src/components/ProcedureForm.tsx`**

```tsx
import type {ChangeEvent, FormEvent} from 'react';
import React, {useMemo, useState} from 'react';
import type {Procedure} from '../types/procedure';
import type {Equipment} from '../types/equipment';
import SimpleMDE from 'react-simplemde-editor';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';

interface ProcedureFormProps {
  equipment?: Equipment;
  procedure?: Procedure;
  onSubmit: (data: Omit<Procedure, 'id'> | Procedure) => void;
  onCancel: () => void;
}

export const ProcedureForm = ({equipment, procedure, onSubmit, onCancel}: ProcedureFormProps): React.JSX.Element => {
  const [formData, setFormData] = useState<Omit<Procedure, 'id'>>({
    name: procedure?.name ?? '',
    description: procedure?.description ?? '',
    steps: procedure?.steps ?? '',
    requiredTools: procedure?.requiredTools ?? '',
    intervalDays: procedure?.intervalDays ?? 0,
  });

  const mdeOptions = useMemo(() => ({
    spellChecker: false,
    placeholder: 'Enter steps here...',
    status: false,
  }), []);

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (procedure) {
      onSubmit({...formData, id: procedure.id} as Procedure);
    } else {
      onSubmit(formData);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const {name, value} = e.target;
    if (name === 'intervalDays') {
      setFormData((prev) => ({...prev, [name]: parseInt(value) || 0}));
    } else {
      setFormData((prev) => ({...prev, [name]: value}));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 rounded-lg border"
      style={{background: 'var(--card)', borderColor: 'var(--border)'}}
    >
      {equipment && (
        <div className="p-4 rounded-md border" style={{background: 'var(--muted)', borderColor: 'var(--border)'}}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color: 'var(--muted-foreground)'}}>
            Equipment Details
          </h3>
          <div className="text-sm font-bold" style={{color: 'var(--card-foreground)'}}>
            {equipment.manufacturer} {equipment.modelNumber}
          </div>
          {equipment.description && (
            <div className="text-sm mt-1" style={{color: 'var(--muted-foreground)'}}>{equipment.description}</div>
          )}
        </div>
      )}

      <h2 className="text-xl font-bold" style={{color: 'var(--card-foreground)'}}>
        {procedure ? 'Edit Procedure' : 'Add Procedure'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="intervalDays">Interval (Days)</Label>
          <Input id="intervalDays" type="number" name="intervalDays" value={formData.intervalDays} onChange={handleChange} required min="0" />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" value={formData.description} onChange={handleChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <Label>Required Tools / PPE</Label>
          <SimpleMDE
            value={formData.requiredTools}
            onChange={(value) => setFormData((prev) => ({...prev, requiredTools: value}))}
            options={{...mdeOptions, placeholder: 'e.g., "10mm wrench", "Multimeter", "Safety glasses"'}}
          />
        </div>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <Label>Procedure Steps</Label>
          <SimpleMDE
            value={formData.steps}
            onChange={(value) => setFormData((prev) => ({...prev, steps: value}))}
            options={mdeOptions}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t" style={{borderColor: 'var(--border)'}}>
        <Button type="button" variant="outline" onClick={onCancel} className="order-2 sm:order-1">
          Cancel
        </Button>
        <Button type="submit" className="order-1 sm:order-2">
          {procedure ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};
```

- [ ] **Step 2: Run ProcedureForm tests**

```bash
cd frontend && npm test -- tests/components/ProcedureForm.test.tsx
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ProcedureForm.tsx
git commit -m "feat: migrate ProcedureForm to shadcn primitives"
```

---

## Task 13: Migrate `ProcedureList.tsx` to shadcn

**Files:**
- Modify: `frontend/src/components/ProcedureList.tsx`

- [ ] **Step 1: Rewrite `frontend/src/components/ProcedureList.tsx`**

```tsx
import React, {useMemo, useState} from 'react';
import type {Procedure} from '../types/procedure';
import {Link} from 'react-router-dom';
import {ChevronDown, ChevronUp, Search, X} from 'lucide-react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from './ui/table';
import {TableSkeleton} from './TableSkeleton';

interface ProcedureListProps {
  equipmentId: string;
  procedures: Procedure[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

type SortField = 'name' | 'description' | 'intervalDays';
type SortOrder = 'asc' | 'desc';

const SortIndicator = ({field, sortField, sortOrder}: {
  field: SortField;
  sortField: SortField;
  sortOrder: SortOrder;
}): React.JSX.Element => {
  if (sortField !== field) return <div className="w-4 h-4 ml-1 inline-block"/>;
  return sortOrder === 'asc'
    ? <ChevronUp className="w-4 h-4 ml-1 inline-block"/>
    : <ChevronDown className="w-4 h-4 ml-1 inline-block"/>;
};

export const ProcedureList = ({equipmentId, procedures, onDelete, loading = false}: ProcedureListProps): React.JSX.Element => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredAndSortedProcedures = useMemo(() => {
    let result = [...procedures];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(proc =>
        proc.name.toLowerCase().includes(lowerSearch) ||
        (proc.description && proc.description.toLowerCase().includes(lowerSearch))
      );
    }
    result.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      if (sortField === 'name' || sortField === 'description') {
        aValue = (a[sortField] ?? '').toLowerCase();
        bValue = (b[sortField] ?? '').toLowerCase();
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [procedures, searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]"/>
        <Input
          type="text"
          placeholder="Search procedures..."
          className="pl-10 pr-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setSearchTerm('')}>
            <X className="h-4 w-4 text-[var(--muted-foreground)]"/>
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : (
        <>
          <div className="hidden md:block rounded-md border overflow-hidden" style={{borderColor: 'var(--border)'}}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    Name <SortIndicator field="name" sortField={sortField} sortOrder={sortOrder}/>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('description')}>
                    Description <SortIndicator field="description" sortField={sortField} sortOrder={sortOrder}/>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('intervalDays')}>
                    Interval <SortIndicator field="intervalDays" sortField={sortField} sortOrder={sortOrder}/>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedProcedures.map((proc) => (
                  <TableRow key={proc.id}>
                    <TableCell className="font-medium">
                      <Link to={`/equipment/${equipmentId}/procedures/${proc.id}`} className="text-[var(--primary)] hover:underline">
                        {proc.name}
                      </Link>
                    </TableCell>
                    <TableCell>{proc.description}</TableCell>
                    <TableCell>{proc.intervalDays}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="mr-1">
                        <Link to={`/equipment/${equipmentId}/procedures/${proc.id}/perform`}>Perform</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="mr-1">
                        <Link to={`/equipment/${equipmentId}/procedures/${proc.id}/history`}>History</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="mr-1">
                        <Link to={`/equipment/${equipmentId}/procedures/${proc.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[var(--destructive)]" onClick={() => onDelete(proc.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden divide-y" style={{borderColor: 'var(--border)'}}>
            {filteredAndSortedProcedures.map((proc) => (
              <div key={proc.id} className="py-4 space-y-3">
                <div>
                  <Link to={`/equipment/${equipmentId}/procedures/${proc.id}`} className="text-[var(--primary)] hover:underline">
                    <h3 className="text-sm font-bold">{proc.name}</h3>
                  </Link>
                  {proc.description && <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">{proc.description}</p>}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">Interval: {proc.intervalDays} days</div>
                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/equipment/${equipmentId}/procedures/${proc.id}/perform`}>Perform</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/equipment/${equipmentId}/procedures/${proc.id}/history`}>History</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/equipment/${equipmentId}/procedures/${proc.id}/edit`}>Edit</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[var(--destructive)]" onClick={() => onDelete(proc.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredAndSortedProcedures.length === 0 && (
            <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
              {searchTerm ? 'No procedures match your search.' : 'No procedures found for this equipment.'}
            </div>
          )}
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Run ProcedureList tests**

```bash
cd frontend && npm test -- tests/components/ProcedureList.test.tsx
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ProcedureList.tsx
git commit -m "feat: migrate ProcedureList to shadcn Table + Button"
```

---

## Task 14: Migrate `LoginPage.tsx` to shadcn

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Rewrite `frontend/src/pages/LoginPage.tsx`**

```tsx
import React, {useState} from 'react';
import {login} from '../api/client';
import {Lock, User} from 'lucide-react';
import {useAuth} from '../hooks';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {Label} from '../components/ui/label';
import {Alert, AlertDescription} from '../components/ui/alert';

const LoginPage = (): React.JSX.Element => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {setAuthenticated} = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await login(email, password);
      if (res.ok) {
        await setAuthenticated(true);
        const returnTo = searchParams.get('returnTo');
        navigate(returnTo ? decodeURIComponent(returnTo) : '/', {replace: true});
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    } catch {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background: 'var(--background)'}}>
      <div
        className="max-w-md w-full space-y-8 p-8 rounded-xl border shadow-lg"
        style={{background: 'var(--card)', borderColor: 'var(--border)'}}
      >
        <div>
          <h2 className="text-center text-3xl font-extrabold" style={{color: 'var(--card-foreground)'}}>
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm" style={{color: 'var(--muted-foreground)'}}>
            Please enter your email and password
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="sr-only">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)]"/>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="sr-only">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)]"/>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Password"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export {LoginPage};
```

- [ ] **Step 2: Run LoginPage tests**

```bash
cd frontend && npm test -- tests/pages/LoginPage.test.tsx
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat: migrate LoginPage to shadcn Input + Button + Alert"
```

---

## Task 15: Migrate `DashboardPage.tsx` token colors + shadcn Button

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx`

The dashboard has a lot of hardcoded color classes. This task replaces them with token-based equivalents and migrates buttons to shadcn. The `loading` branch also gets `TableSkeleton`.

- [ ] **Step 1: Update imports at the top of `DashboardPage.tsx`**

Add these imports after the existing imports:

```tsx
import {Button} from '../components/ui/button';
import {TableSkeleton} from '../components';
```

- [ ] **Step 2: Replace the loading branch**

Find:
```tsx
{loading ? (
  <div className="p-8 text-center text-gray-500">Loading...</div>
) : (
```

Replace with:
```tsx
{loading ? (
  <TableSkeleton rows={6} columns={5} />
) : (
```

- [ ] **Step 3: Replace hardcoded color classes throughout the file**

Make these find-and-replace passes (use your editor's global replace within the file):

| Find | Replace |
|---|---|
| `bg-gray-100 dark:bg-gray-950` | `bg-[var(--background)]` |
| `bg-white dark:bg-gray-900` | `bg-[var(--card)]` |
| `bg-white dark:bg-gray-800` | `bg-[var(--secondary)]` |
| `text-gray-900 dark:text-gray-100` | `text-[var(--foreground)]` |
| `text-gray-500 dark:text-gray-400` | `text-[var(--muted-foreground)]` |
| `text-gray-700 dark:text-gray-200` | `text-[var(--foreground)]` |
| `border-gray-200 dark:border-gray-800` | `border-[var(--border)]` |
| `border-gray-300 dark:border-gray-700` | `border-[var(--border)]` |
| `divide-gray-200 dark:divide-gray-800` | `divide-[var(--border)]` |
| `bg-gray-50 dark:bg-gray-800/50` | `bg-[var(--muted)]` |
| `text-blue-600 dark:text-blue-400` | `text-[var(--primary)]` |
| `border-blue-600 text-blue-600 dark:text-blue-400` | `border-[var(--primary)] text-[var(--primary)]` |
| `bg-blue-600 text-white rounded-md hover:bg-blue-700` | `bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:opacity-90` |
| `text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300` | `text-green-500 hover:text-green-400` |
| `text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300` | `text-[var(--primary)] hover:opacity-80` |
| `text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300` | `text-[var(--destructive)] hover:opacity-80` |
| `text-red-600 dark:text-red-400` | `text-[var(--destructive)]` |

- [ ] **Step 4: Replace the "Email Dashboard" and nav buttons with shadcn Button**

Find the button group in the page header:
```tsx
<button
  onClick={handleEmailDashboard}
  disabled={emailSending}
  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 ..."
>
  <Mail className="w-4 h-4"/>
  {emailSending ? "Sending..." : "Email Dashboard"}
</button>
<Link to="/equipment" className="px-4 py-2 bg-blue-600 ...">Equipment</Link>
<Link to="/users" className="px-4 py-2 bg-blue-600 ...">Users</Link>
```

Replace with:
```tsx
<Button variant="outline" onClick={handleEmailDashboard} disabled={emailSending}>
  <Mail className="w-4 h-4 mr-2"/>
  {emailSending ? 'Sending...' : 'Email Dashboard'}
</Button>
<Button asChild>
  <Link to="/equipment">Equipment</Link>
</Button>
<Button asChild>
  <Link to="/users">Users</Link>
</Button>
```

- [ ] **Step 5: Run DashboardPage tests**

```bash
cd frontend && npm test -- tests/pages/DashboardPage.test.tsx
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx
git commit -m "feat: migrate DashboardPage to token colors + shadcn Button + skeleton"
```

---

## Task 16: Migrate `UsersPage.tsx` to shadcn + skeleton

**Files:**
- Modify: `frontend/src/pages/UsersPage.tsx`

- [ ] **Step 1: Read the full file**

```bash
cat frontend/src/pages/UsersPage.tsx
```

- [ ] **Step 2: Update imports**

Add at the top:
```tsx
import {Button} from '../components/ui/button';
import {Alert, AlertDescription} from '../components/ui/alert';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '../components/ui/table';
import {TableSkeleton} from '../components';
```

- [ ] **Step 3: Replace loading/error states**

Find:
```tsx
if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
if (error) return <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>;
```

Replace with:
```tsx
if (loading) return <TableSkeleton rows={5} columns={4} />;
if (error) return (
  <div className="p-8">
    <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
  </div>
);
```

- [ ] **Step 4: Replace page wrapper and heading color classes**

Replace `bg-gray-100 dark:bg-gray-950` → `bg-[var(--background)]`
Replace `text-gray-900 dark:text-gray-100` → `text-[var(--foreground)]`
Replace `bg-white dark:bg-gray-900` → `bg-[var(--card)]`

- [ ] **Step 5: Replace the "New User" link with a shadcn Button**

Find:
```tsx
<Link to="/users/new" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-center">
  New User
</Link>
```
Replace with:
```tsx
<Button asChild>
  <Link to="/users/new">New User</Link>
</Button>
```

- [ ] **Step 6: Replace the page JSX with shadcn Table**

Replace the entire `return (...)` block with:

```tsx
return (
  <div className="py-8 px-4 sm:px-6 lg:px-8" style={{background: 'var(--background)'}}>
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold" style={{color: 'var(--foreground)'}}>Users</h1>
        {isAdmin && (
          <Button asChild>
            <Link to="/users/new">New User</Link>
          </Button>
        )}
      </div>

      <div className="rounded-lg border overflow-hidden" style={{background: 'var(--card)', borderColor: 'var(--border)'}}>
        {users.length === 0 ? (
          <p className="p-6 text-center text-sm" style={{color: 'var(--muted-foreground)'}}>No users found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell style={{color: 'var(--muted-foreground)'}}>{user.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'SYSTEM_ADMIN'
                        ? 'bg-red-900/30 text-red-300'
                        : user.role === 'ADMIN'
                          ? 'bg-purple-900/30 text-purple-300'
                          : user.role === 'EDIT'
                            ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                            : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="mr-1">
                        <Link to={`/users/${user.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[var(--destructive)]" onClick={() => handleDelete(user.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  </div>
);
```

- [ ] **Step 7: Run UsersPage tests (if they exist)**

```bash
cd frontend && npm test -- tests/pages/UsersPage.test.tsx 2>/dev/null || echo "No UsersPage test file — skipping"
```

- [ ] **Step 8: Run full suite**

```bash
cd frontend && npm test
```

- [ ] **Step 9: Commit**

```bash
git add frontend/src/pages/UsersPage.tsx
git commit -m "feat: migrate UsersPage to shadcn Table + Button + skeleton + Alert"
```

---

## Task 17: Update remaining pages — token color pass

**Files:**
- Modify: all remaining pages in `frontend/src/pages/` that still use hardcoded gray/blue classes

This is a mechanical find-and-replace pass. For each page listed, open the file and apply the same substitution table from Task 15 Step 3. Then run the full test suite once at the end.

Pages to update:
- `EquipmentPage.tsx`
- `EquipmentShowPage.tsx`
- `NewEquipmentPage.tsx`
- `EditEquipmentPage.tsx`
- `ProceduresPage.tsx`
- `ProcedureShowPage.tsx`
- `NewProcedurePage.tsx`
- `EditProcedurePage.tsx`
- `PerformProcedurePage.tsx`
- `ProcedureHistoryPage.tsx`
- `ImportEquipmentPage.tsx`
- `NewUserPage.tsx`
- `EditUserPage.tsx`
- `HomePage.tsx`
- `AboutPage.tsx`
- `ContactPage.tsx`
- `SetupPage.tsx`

- [ ] **Step 1: Apply the substitution table to each page**

For each page, replace these patterns:

| Find | Replace |
|---|---|
| `bg-gray-100 dark:bg-gray-950` | `bg-[var(--background)]` |
| `min-h-screen bg-gray-100 dark:bg-gray-950` | `min-h-screen bg-[var(--background)]` |
| `bg-white dark:bg-gray-900` | `bg-[var(--card)]` |
| `bg-white dark:bg-gray-800` | `bg-[var(--secondary)]` |
| `text-gray-900 dark:text-gray-100` | `text-[var(--foreground)]` |
| `text-gray-700 dark:text-gray-300` | `text-[var(--muted-foreground)]` |
| `text-gray-500 dark:text-gray-400` | `text-[var(--muted-foreground)]` |
| `text-gray-600 dark:text-gray-400` | `text-[var(--muted-foreground)]` |
| `border-gray-200 dark:border-gray-800` | `border-[var(--border)]` |
| `border-gray-300 dark:border-gray-700` | `border-[var(--border)]` |
| `dark:border-gray-800` | `border-[var(--border)]` |
| `bg-blue-600 text-white rounded-md hover:bg-blue-700` | `bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:opacity-90` |
| `text-blue-600 dark:text-blue-400` | `text-[var(--primary)]` |
| `text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300` | `text-[var(--primary)] hover:opacity-80` |
| `text-red-600 dark:text-red-400` | `text-[var(--destructive)]` |
| `text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300` | `text-green-500 hover:text-green-400` |

- [ ] **Step 2: Run full test suite**

```bash
cd frontend && npm test
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/
git commit -m "feat: apply token-based color classes to all remaining pages"
```

---

## Task 18: Update `CalendarView.tsx` token colors

**Files:**
- Modify: `frontend/src/components/CalendarView.tsx`

- [ ] **Step 1: Apply the substitution table from Task 17 to `CalendarView.tsx`**

Open `frontend/src/components/CalendarView.tsx` and apply all the same find/replace pairs from Task 17 Step 1.

- [ ] **Step 2: Run full suite**

```bash
cd frontend && npm test
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/CalendarView.tsx
git commit -m "feat: update CalendarView to token-based colors"
```

---

## Task 19: Final verification

- [ ] **Step 1: Run full test suite**

```bash
cd frontend && npm test
```
Expected: all tests pass with no failures.

- [ ] **Step 2: Build the app to confirm no TypeScript errors**

```bash
cd frontend && npm run build
```
Expected: build completes with no errors or warnings.

- [ ] **Step 3: Start dev server and do a visual walkthrough**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173` and verify:
- Sidebar renders on all authenticated routes
- Fuchsia active state visible on current nav item
- Dark mode toggle works (sidebar background goes to `#0a0f1e`, text fuchsia accent visible)
- Login page renders with shadcn inputs and fuchsia primary button
- Equipment list renders with shadcn table and badges
- Procedure forms render with shadcn inputs and SimpleMDE editors
- Inter font is loading (check DevTools → Network → Fonts)

- [ ] **Step 4: Commit any final fixups found during visual walkthrough**

```bash
git add -A
git commit -m "fix: visual walkthrough fixups post-migration"
```
