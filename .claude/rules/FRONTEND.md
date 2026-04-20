# Frontend Development Guide

> This document defines the coding standards, conventions, and architecture patterns for this React + TypeScript
> application. All contributors — human or AI — must follow these rules when writing, reviewing, or modifying frontend
> code.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Components](#components)
4. [TypeScript](#typescript)
5. [State Management](#state-management)
6. [Data Fetching](#data-fetching)
7. [Styling](#styling)
8. [Custom Hooks](#custom-hooks)
9. [Naming Conventions](#naming-conventions)
10. [File Organization](#file-organization)
11. [Testing](#testing)
12. [Do's and Don'ts](#dos-and-donts)

---

## Tech Stack

| Concern      | Library                        |
|--------------|--------------------------------|
| Framework    | React 18+                      |
| Language     | TypeScript (strict mode)       |
| Build Tool   | Vite                           |
| Styling      | Tailwind CSS + shadcn/ui       |
| Server State | TanStack Query (React Query)   |
| Global State | Zustand                        |
| Routing      | React Router v6+               |
| HTTP Client  | Axios                          |
| Forms        | React Hook Form + Zod          |
| Testing      | Vitest + React Testing Library |

---

## Project Structure

Use a **feature-based folder structure**. Group files by domain/feature, not by file type.

```
src/
├── app/                    # App-level setup (router, providers, global styles)
│   ├── App.tsx
│   ├── Router.tsx
│   └── providers.tsx
├── features/               # Feature domains (primary unit of organization)
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── LoginForm.test.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── services/
│   │   │   └── authService.ts
│   │   ├── store/
│   │   │   └── authStore.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   └── index.ts        # Barrel export
│   └── dashboard/
│       └── ...
├── components/             # Truly shared/global UI components only
│   ├── ui/                 # shadcn/ui primitives (auto-generated, do not edit)
│   └── shared/             # Custom shared components (Button, Modal, etc.)
├── hooks/                  # Global custom hooks shared across features
├── lib/                    # Third-party config (queryClient, axios instance, etc.)
├── types/                  # Global TypeScript types and interfaces
└── utils/                  # Pure utility functions
```

### Barrel Exports

Every feature folder must have an `index.ts` that exports its public API:

```ts
// features/auth/index.ts
export {LoginForm} from './components/LoginForm';
export {useAuth} from './hooks/useAuth';
export type {User, AuthState} from './types/auth.types';
```

Import from the barrel, not deep paths:

```ts
// ✅ Correct
import {LoginForm, useAuth} from '@/features/auth';

// ❌ Avoid
import {LoginForm} from '@/features/auth/components/LoginForm';
```

---

## Components

### Functional Components Only

Never use class components. Always use **fat arrow (`const`) style** for component definitions. Never use `function`
declarations or `React.FC` for components.

```ts
// ✅ Correct — fat arrow const with explicit return type
interface UserCardProps {
    name: string;
    email: string;
    avatarUrl?: string;
}

const UserCard = ({name, email, avatarUrl}: UserCardProps): JSX.Element => {
    return (
        <div className = "flex items-center gap-3 p-4 rounded-lg border" >
        {avatarUrl && <img src = {avatarUrl}
    alt = {name}
    className = "w-10 h-10 rounded-full" / >
}
    <div>
        <p className = "font-medium" > {name} < /p>
        < p
    className = "text-sm text-muted-foreground" > {email} < /p>
        < /div>
        < /div>
)
    ;
};

export {UserCard};
```

```ts
// ❌ Avoid — function declaration style
function UserCard({name, email}: UserCardProps): JSX.Element { ...
}

// ❌ Avoid — React.FC suppresses some type errors and adds implicit children
const UserCard: React.FC<UserCardProps> = ({name, email}) => { ...
};
```

### Props Rules

- Always define props as a named `interface` above the component
- Destructure props inline in the arrow function signature
- Use optional chaining (`?.`) and nullish coalescing (`??`) for optional props
- Never spread unknown props onto DOM elements without explicit filtering

```ts
// ✅ Correct
interface ButtonProps {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'ghost';
}

const Button = ({label, onClick, disabled = false, variant = 'primary'}: ButtonProps): JSX.Element => {
...
};
```

### Component Responsibilities

Keep components **focused and small**. A component should do one thing well.

- **Container components** — handle data fetching, state, and logic via hooks; pass data down as props
- **Presentational components** — receive props, render UI, emit events; contain no business logic
- If a component exceeds ~150 lines, consider splitting it

---

## TypeScript

### Strict Mode

TypeScript must run with `strict: true` in `tsconfig.json`. No exceptions.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

### `interface` vs `type`

- Use `interface` for object shapes (props, API responses, models) — they are extendable and produce clearer error
  messages
- Use `type` for unions, intersections, mapped types, and aliases

```ts
// ✅ interface for object shapes
interface User {
    id: string;
    name: string;
    role: UserRole;
}

// ✅ type for unions and aliases
type UserRole = 'admin' | 'editor' | 'viewer';
type UserMap = Record<string, User>;
```

### Avoid `any`

Never use `any`. Use `unknown` with type guards when the shape is truly unknown.

```ts
// ❌ Avoid
const parse = (data: any) => { ... }

// ✅ Correct
const parse = (data: unknown): User => {
  if (!isUser(data)) throw new Error('Invalid user data');
  return data;
};

const isUser = (value: unknown): value is User => {
  return typeof value === 'object' && value !== null && 'id' in value;
};
```

### Type All Signatures

Explicitly type all function parameters and return values.

```ts
// ✅ Correct
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};
```

---

## State Management

### Decision Tree

Use the simplest tool that solves the problem:

```
Is this server/remote data?
  └─ Yes → TanStack Query (useQuery / useMutation)

Is this UI-only, local state?
  └─ Yes → useState / useReducer (inside the component or a custom hook)

Does this state need to be shared across many unrelated components?
  └─ Yes → Zustand store
```

### Local State — `useState` / `useReducer`

```ts
// Simple values → useState
const [isOpen, setIsOpen] = useState(false);

// Complex state with multiple sub-values → useReducer
const [state, dispatch] = useReducer(cartReducer, initialCartState);
```

### Global State — Zustand

Define stores inside the relevant feature's `store/` folder.

```ts
// features/auth/store/authStore.ts
import { create } from 'zustand';
import type { User } from '../types/auth.types';

interface AuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearAuth: () => set({ user: null }),
}));
```

- Keep stores **flat** — avoid deeply nested state
- One store per feature domain
- Never mutate state directly; always use the setter functions

### Server State — TanStack Query

All remote data lives in TanStack Query. Never store fetched data in Zustand or local state.

```ts
// features/users/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, createUser } from '../services/userService';
import type { User, CreateUserInput } from '../types/user.types';

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, CreateUserInput>({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

---

## Data Fetching

### Axios — Required HTTP Client

Always use **Axios** for all HTTP requests. Never use the native `fetch` API. Axios provides better error handling,
request/response interceptors, and automatic JSON parsing.

Configure a shared Axios instance in `src/lib/apiClient.ts` and import it everywhere:

```ts
// src/lib/apiClient.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Centralize error handling (logging, toast, redirect on 401, etc.)
    return Promise.reject(error);
  }
);
```

### Service Layer

All API calls must live in a `services/` file — never inline Axios calls inside components or hooks.

```ts
// features/users/services/userService.ts
import {apiClient} from '@/lib/apiClient';
import type {User, CreateUserInput} from '../types/user.types';

export const fetchUsers = async (): Promise<User[]> => {
    const {data} = await apiClient.get<User[]>('/users');
    return data;
};

export const fetchUserById = async (id: string): Promise<User> => {
    const {data} = await apiClient.get<User>(`/users/${id}`);
    return data;
};

export const createUser = async (input: CreateUserInput): Promise<User> => {
    const {data} = await apiClient.post<User>('/users', input);
    return data;
};

export const updateUser = async (id: string, input: Partial<CreateUserInput>): Promise<User> => {
    const {data} = await apiClient.patch<User>(`/users/${id}`, input);
    return data;
};

export const deleteUser = async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
};
```

### Query Keys

Define query keys as constants to avoid typos and enable precise cache invalidation:

```ts
// features/users/hooks/userQueryKeys.ts
export const userQueryKeys = {
  all: ['users'] as const,
  detail: (id: string) => ['users', id] as const,
};
```

---

## Styling

### Tailwind CSS

Use Tailwind utility classes as the primary styling method.

```tsx
// ✅ Correct
const Alert = ({message}: { message: string }): JSX.Element => {
    return (
        <div
            className="flex items-center gap-2 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            <span>{message}</span>
        </div>
    );
};
```

- Keep className strings readable — break long ones across lines using template literals or `clsx`
- Use `clsx` or `cn` (shadcn's utility) for conditional classes — never string interpolation

```ts
import { cn } from '@/lib/utils';

<div className={cn('rounded-md p-4', isActive && 'bg-blue-50', isError && 'bg-red-50')} />
```

### shadcn/ui

Use shadcn/ui for all common UI primitives (Button, Dialog, Select, etc.). Do not rebuild these from scratch.

- shadcn components live in `src/components/ui/` — **do not manually edit these files**
- Extend or wrap shadcn components in `src/components/shared/` when customization is needed

```tsx
// ✅ Wrap shadcn components for app-specific variants
import { Button } from '@/components/ui/button';

interface PrimaryButtonProps {
  label: string;
  onClick: () => void;
  isLoading?: boolean;
}

const PrimaryButton = ({ label, onClick, isLoading = false }: PrimaryButtonProps): JSX.Element => {
  return (
    <Button onClick={onClick} disabled={isLoading} className="min-w-[120px]">
      {isLoading ? 'Loading...' : label}
    </Button>
  );
};
```

### No CSS-in-JS

Do not use `styled-components`, `Emotion`, or inline `style` props for layout. Inline styles are only acceptable for
dynamic values that cannot be expressed with Tailwind (e.g., dynamic pixel values from JS calculations).

---

## Custom Hooks

Extract all non-trivial logic out of components into `use*` hooks.

### Rules

- A hook must start with `use`
- Hooks live in the `hooks/` folder of their feature (or `src/hooks/` if global)
- Return typed objects `{ data, isLoading, error }` — not positional arrays (unless mimicking `useState`)
- A hook should do one thing: manage one slice of behavior or state

```ts
// features/auth/hooks/useAuth.ts
import { useAuthStore } from '../store/authStore';
import { useLoginMutation } from './useLoginMutation';
import type { LoginInput } from '../types/auth.types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const { user, setUser, clearAuth } = useAuthStore();
  const loginMutation = useLoginMutation();

  const login = async (input: LoginInput): Promise<void> => {
    const user = await loginMutation.mutateAsync(input);
    setUser(user);
  };

  const logout = (): void => {
    clearAuth();
  };

  return {
    user,
    isAuthenticated: user !== null,
    login,
    logout,
  };
};
```

---

## Naming Conventions

| Item               | Convention                          | Example                            |
|--------------------|-------------------------------------|------------------------------------|
| Components         | PascalCase                          | `UserCard.tsx`, `LoginForm.tsx`    |
| Hooks              | camelCase with `use` prefix         | `useAuth.ts`, `useUsers.ts`        |
| Services           | camelCase with `Service` suffix     | `userService.ts`                   |
| Stores             | camelCase with `Store` suffix       | `authStore.ts`                     |
| Types/Interfaces   | PascalCase                          | `User`, `AuthState`, `ButtonProps` |
| Type files         | camelCase with `.types.ts` suffix   | `auth.types.ts`                    |
| Utilities          | camelCase                           | `formatCurrency.ts`, `cn.ts`       |
| Constants          | SCREAMING_SNAKE_CASE                | `MAX_RETRY_COUNT`, `API_BASE_URL`  |
| CSS classes        | Tailwind utilities only             | —                                  |
| Event handlers     | `handle` prefix                     | `handleSubmit`, `handleChange`     |
| Boolean props/vars | `is`, `has`, `can`, `should` prefix | `isLoading`, `hasError`, `canEdit` |

---

## File Organization

### Co-location

Keep related files together. A component's test and styles live next to the component file.

```
features/auth/components/
├── LoginForm.tsx
├── LoginForm.test.tsx        # Unit/component tests
└── LoginForm.stories.tsx     # Storybook stories (if applicable)
```

### One Export Per File (Preferred)

Prefer one primary export per file. Named exports are preferred over default exports for better refactoring support.

```ts
// ✅ Named export
export {UserCard};

// ❌ Avoid default exports (harder to rename, harder to search)
export default UserCard;
```

---

## Testing

### Tools

- **Vitest** — test runner
- **React Testing Library** — component testing (never test implementation details)
- **MSW (Mock Service Worker)** — mock API calls in tests

### What to Test

- Custom hooks (logic, state transitions, side effects)
- Complex utility functions
- Key user flows in container/page components
- Do NOT test shadcn/ui internals or presentational-only components with no logic

### Rules

- Query elements by role, label, or text — not by class name or test ID (unless unavoidable)
- Test behavior, not implementation
- One `describe` block per component or hook
- Mock external services (API calls) at the network layer with MSW

```tsx
// ✅ Correct — tests behavior the user would observe
it('displays an error message when login fails', async () => {
  render(<LoginForm />);

  await userEvent.type(screen.getByLabelText('Email'), 'bad@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
});
```

---

## Do's and Don'ts

### ✅ Do

- Write small, focused components with a single responsibility
- Extract all business logic into custom hooks
- Use TanStack Query for all remote/server data
- Use `interface` for object shapes, `type` for unions
- Use `clsx` / `cn` for conditional Tailwind classes
- Define query keys as typed constants
- Co-locate tests with the files they test
- Use barrel `index.ts` exports per feature
- Handle loading, error, and empty states in every data-dependent component

### ❌ Don't

- Use class components
- Use `function` declarations or `React.FC` for components — use fat arrow `const` style instead
- Use `any` — use `unknown` + type guards
- Use the native `fetch` API — always use the shared Axios `apiClient`
- Inline Axios calls inside components or hooks — use the service layer
- Store server data in Zustand or `useState`
- Use default exports
- Use `styled-components` or `Emotion`
- Mutate state directly in Zustand stores
- Write components longer than ~150 lines without splitting
- Nest ternaries more than one level deep in JSX — extract to a variable or sub-component

---

*This document should be kept up to date as the project evolves. When introducing a new pattern or library, update this
guide first.*