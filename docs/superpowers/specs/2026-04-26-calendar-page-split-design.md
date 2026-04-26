# Calendar Page Split — Design Spec

**Date:** 2026-04-26

## Context

`DashboardPage` currently renders two tabs: a list view and a calendar view. The goal is to split these into two
independent pages — `DashboardPage` (list only) and a new `CalendarPage` (calendar only) — and surface the calendar as a
first-class nav item in the Sidebar.

## Changes

### 1. `DashboardPage` (`src/pages/DashboardPage.tsx`)

Remove all tab-related state and UI:

- Delete `activeTab` state
- Delete the tab bar (`List View` / `Calendar View` buttons)
- Delete the `calendarEvents` memo
- Remove the `Calendar` icon import from lucide-react

What remains: search input, sort controls, `Email Dashboard` button, `Equipment` and `Users` action buttons, and the
`DashboardList` table. The `DashboardList`, `DueStatus`, and `SortIndicator` sub-components stay in this file.

### 2. `CalendarPage` (new file: `src/pages/CalendarPage.tsx`)

- Calls `getDashboard()` independently with its own loading state
- Computes `calendarEvents` from the result (same mapping as the current dashboard)
- Renders `<CalendarView events={calendarEvents} />` inside the same card shell used by the current calendar tab
- No search, no sort, no email button

### 3. Routing (`src/App.tsx`)

Add `/calendar` as a protected route inside the `AppLayout` wrapper, alongside the existing `/dashboard` route.

### 4. Sidebar (`src/components/Sidebar.tsx`)

Add a **Calendar** nav item between Dashboard and Equipment using the `Calendar` icon from lucide-react. Active-route
detection uses the existing `useLocation()` pattern already in the Sidebar.

### 5. Exports (`src/pages/index.ts`)

Add `CalendarPage` to the barrel export.

## Files Modified

| File                          | Change                                                   |
|-------------------------------|----------------------------------------------------------|
| `src/pages/DashboardPage.tsx` | Remove tab UI, calendar state/memo, Calendar icon import |
| `src/pages/CalendarPage.tsx`  | **New file**                                             |
| `src/pages/index.ts`          | Export `CalendarPage`                                    |
| `src/App.tsx`                 | Add `/calendar` protected route                          |
| `src/components/Sidebar.tsx`  | Add Calendar nav item                                    |

## Verification

1. Run `npm run dev` and navigate to `/dashboard` — list view renders, no tabs visible.
2. Navigate to `/calendar` — calendar renders with procedure due dates.
3. Sidebar shows Dashboard, Calendar, Equipment in order; active state highlights correctly on each route.
4. Clicking a calendar event navigates to the correct procedure page.
5. Run `npm run test` to confirm no regressions.
