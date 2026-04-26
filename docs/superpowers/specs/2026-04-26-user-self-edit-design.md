# User Self-Edit Design

**Date:** 2026-04-26

## Problem

Users cannot edit their own accounts. The existing `PUT /api/v1/users/{id}` endpoint is admin-only and explicitly blocks self-edits with a 403. There is no profile page or self-service password change.

## Goals

- Any authenticated user can edit their own name and email.
- Any authenticated user can change their own password (requires current password verification).
- Role cannot be changed by the user themselves.
- Users cannot delete their own account.
- Admins editing another user via the existing edit page cannot change their own role if they navigate to their own user record.

## Out of Scope

- Password reset via email.
- Admin password changes on behalf of another user.
- Email verification after email change.

---

## Backend

### New Endpoints

#### `PUT /api/v1/users/me`

Update the authenticated user's own name and email.

- **Auth:** Any authenticated user (`isAuthenticated()`).
- **Request body:** `UserSelfUpdateRequest`
- **Response:** `200 OK` with `UserSelfUpdateResponse`
- **Errors:**
  - `409 Conflict` — email already in use by another account.

#### `POST /api/v1/users/me/password`

Change the authenticated user's password.

- **Auth:** Any authenticated user (`isAuthenticated()`).
- **Request body:** `UserPasswordChangeRequest`
- **Response:** `204 No Content`
- **Errors:**
  - `400 Bad Request` — current password is incorrect.

#### `GET /api/v1/auth/me` (modified)

Add `id` (UUID as string) to the existing response so the frontend can identify the current user without fetching the full user list.

Current response: `{ email, role }`
Updated response: `{ id, email, role }`

---

### New DTOs

```java
// UserSelfUpdateRequest.java
public record UserSelfUpdateRequest(
    @NotBlank String name,
    @NotBlank @Email String email
) {}

// UserPasswordChangeRequest.java
public record UserPasswordChangeRequest(
    @NotBlank String currentPassword,
    @NotBlank String newPassword
) {}

// UserSelfUpdateResponse.java
public record UserSelfUpdateResponse(
    UUID id,
    String name,
    String email,
    Role role
) {}
```

---

### Service Changes (`UserService`)

**`updateSelf(UUID currentUserId, UserSelfUpdateRequest request)`**

- Loads user by `currentUserId`, throws `404` if not found.
- If email has changed, checks uniqueness — throws `409` if another account owns that email.
- Updates `name` and `email`, saves, returns `UserSelfUpdateResponse`.
- No role field. No self-edit guard (this is the self-edit method).

**`changePassword(UUID currentUserId, UserPasswordChangeRequest request)`**

- Loads user by `currentUserId`, throws `404` if not found.
- Calls `passwordEncoder.matches(request.currentPassword(), user.getPassword())`.
- If no match, throws `400 Bad Request` with message "Current password is incorrect".
- Encodes `request.newPassword()` and saves.

---

### Controller Changes (`UserController`)

Add two new methods. `currentUserId` resolution reuses the existing private helper.

```java
@PutMapping("/me")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<UserSelfUpdateResponse> updateMe(
        @Valid @RequestBody UserSelfUpdateRequest request,
        Authentication authentication) {
    UUID currentUserId = currentUserId(authentication);
    return ResponseEntity.ok(userService.updateSelf(currentUserId, request));
}

@PostMapping("/me/password")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<Void> changePassword(
        @Valid @RequestBody UserPasswordChangeRequest request,
        Authentication authentication) {
    UUID currentUserId = currentUserId(authentication);
    userService.changePassword(currentUserId, request);
    return ResponseEntity.noContent().build();
}
```

**Note:** Spring MVC matches `/me` literally before `/{id}`, so no routing conflict.

---

### `AuthController` Changes

Update the `/me` response to include the user's `id`:

```java
@GetMapping("/me")
public ResponseEntity<Map<String, String>> me(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
        return ResponseEntity.ok().build();
    }
    String email = authentication.getName();
    String role = authentication.getAuthorities().iterator().next().getAuthority();
    String id = userService.findByEmail(email)
            .map(u -> u.getId().toString())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    return ResponseEntity.ok(Map.of("email", email, "role", role, "id", id));
}
```

---

## Frontend

### Auth Context

Add `userId: string | null` to `AuthContextValue` and populate it from the `/auth/me` response alongside `email` and `role`. This allows any page to know the current user's ID without an extra API call.

```typescript
interface AuthContextValue {
    username: string | null;
    userId: string | null;
    role: UserRole | null;
    setAuthenticated: (authenticated: boolean) => Promise<void>;
}
```

`App.tsx` already calls `/auth/me` on mount and on `setAuthenticated` — add `userId` to that state alongside `email` and `role`.

---

### New API Client Functions

```typescript
// PUT /api/v1/users/me
export const updateMe = async (payload: { name: string; email: string }): Promise<User> => {
    const { data } = await apiClient.put<User>('/api/v1/users/me', payload);
    return data;
};

// POST /api/v1/users/me/password
export const changePassword = async (payload: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.post('/api/v1/users/me/password', payload);
};
```

---

### New Page: `ProfilePage`

**Route:** `/profile`
**Access:** All authenticated users.

Two independent forms on a single page, vertically stacked with a section heading each.

#### Profile Details Form

- Fields: Name (text), Email (email)
- Pre-populated on mount via `getUser(userId)` using `userId` from auth context.
- Submit calls `updateMe({ name, email })`.
- On success: update auth context `username` if email changed (so the nav display stays current), show a success message.
- Errors: surface the `detail` field from the API response (e.g. "Email already in use").

#### Change Password Form

- Fields: Current Password, New Password, Confirm New Password.
- Confirm New Password is frontend-only validation (must match New Password before submit).
- Submit calls `changePassword({ currentPassword, newPassword })`.
- On success: clear all three fields, show a success message.
- Errors: surface the `detail` field from the API response (e.g. "Current password is incorrect").

---

### Nav Change

Add a "My Profile" link to the sidebar navigation, visible to all authenticated users. It links to `/profile`. Position: below the main nav items, above or alongside any existing account/logout controls.

Add the route to `App.tsx`:

```tsx
<Route path="/profile" element={<ProtectedRoute email={email}><ProfilePage /></ProtectedRoute>} />
```

---

### `EditUserPage` Changes

When `id` (from URL params) matches `userId` from auth context, the page is in self-edit mode:

- Role `<select>` is replaced with a read-only display of the current role (same badge style as `UsersPage`).
- The delete button/link is not rendered.
- The form still submits to `PUT /api/v1/users/{id}` via `updateUser` — the backend enforces the role-lock server-side too, but the UI should not offer it.

No other changes to `EditUserPage` — name and email remain editable.

---

## Security Notes

- Role cannot be changed via self-edit: `UserSelfUpdateRequest` has no `role` field; `updateSelf` never touches the role column.
- Self-deletion remains blocked in `UserService.delete()` — no change needed there.
- The admin `PUT /api/v1/users/{id}` self-edit block (`id.equals(currentUserId)`) remains in place — the new `/me` endpoint is the only path for self-edits.
- Password change requires current password verification — no privilege escalation risk.
- Both new endpoints are behind `isAuthenticated()`, consistent with other protected endpoints.

---

## Testing

**Backend (unit/integration):**
- `updateSelf` — happy path, email conflict, user not found.
- `changePassword` — happy path, wrong current password, user not found.
- `PUT /api/v1/users/me` — unauthenticated returns 401.
- `POST /api/v1/users/me/password` — unauthenticated returns 401, wrong password returns 400.
- `/auth/me` — response includes `id`.

**Frontend:**
- `ProfilePage` renders both forms pre-populated.
- Profile form shows success/error states.
- Password form validates confirm field client-side.
- Password form shows success/error states and clears on success.
- `EditUserPage` in self-edit mode: role is read-only, no delete shown.
