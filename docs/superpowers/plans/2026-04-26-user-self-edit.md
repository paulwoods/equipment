# User Self-Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow any authenticated user to edit their own name, email, and password via a new `/profile` page, while also allowing admins to see (but not change) their own role when navigating to their own record on the admin edit page.

**Architecture:** Three new backend endpoints (`PUT /api/v1/users/me`, `POST /api/v1/users/me/password`, updated `GET /api/v1/auth/me`) in existing controllers; three new DTOs; two new `UserService` methods. On the frontend: `userId` added to `AuthContext`, two new API client functions, a new `ProfilePage`, a "My Profile" nav link in `Sidebar`, and self-edit guards in `EditUserPage`.

**Tech Stack:** Java 21, Spring Boot 3, Spring Security, Mockito, MockMvc (backend); React 18, TypeScript, Tailwind CSS, Axios (frontend). Run backend tests with `./mvnw test` from the `backend/` directory. No frontend test framework is currently wired up — frontend changes are verified by running the dev server.

---

## File Map

**Create:**
- `backend/src/main/java/com/mrpaulwoods/equipment/backend/dto/UserSelfUpdateRequest.java`
- `backend/src/main/java/com/mrpaulwoods/equipment/backend/dto/UserPasswordChangeRequest.java`
- `backend/src/main/java/com/mrpaulwoods/equipment/backend/dto/UserSelfUpdateResponse.java`
- `frontend/src/pages/ProfilePage.tsx`

**Modify:**
- `backend/src/main/java/com/mrpaulwoods/equipment/backend/service/UserService.java` — add `updateSelf`, `changePassword`
- `backend/src/main/java/com/mrpaulwoods/equipment/backend/controller/UserController.java` — add `updateMe`, `changePassword` endpoints
- `backend/src/main/java/com/mrpaulwoods/equipment/backend/controller/AuthController.java` — add `id` to `/me` response
- `backend/src/test/java/com/mrpaulwoods/equipment/backend/service/UserServiceTest.java` — add tests for new service methods
- `backend/src/test/java/com/mrpaulwoods/equipment/backend/controller/UserControllerTest.java` — add tests for new endpoints
- `backend/src/test/java/com/mrpaulwoods/equipment/backend/controller/AuthControllerTest.java` — update `/me` test to assert `id` field
- `frontend/src/api/client.ts` — add `updateMe`, `changePassword`, update `getMe` return type
- `frontend/src/hooks/useAuth.ts` — add `userId` to `AuthContextValue`
- `frontend/src/App.tsx` — populate `userId` from `getMe`, pass to context, add `/profile` route
- `frontend/src/components/Sidebar.tsx` — add "My Profile" nav link
- `frontend/src/pages/EditUserPage.tsx` — disable role select and hide delete when editing self
- `frontend/src/pages/index.ts` — export `ProfilePage`

---

## Task 1: New DTOs

**Files:**
- Create: `backend/src/main/java/com/mrpaulwoods/equipment/backend/dto/UserSelfUpdateRequest.java`
- Create: `backend/src/main/java/com/mrpaulwoods/equipment/backend/dto/UserPasswordChangeRequest.java`
- Create: `backend/src/main/java/com/mrpaulwoods/equipment/backend/dto/UserSelfUpdateResponse.java`

- [ ] **Step 1: Create `UserSelfUpdateRequest.java`**

```java
package com.mrpaulwoods.equipment.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserSelfUpdateRequest(
        @NotBlank String name,
        @NotBlank @Email String email
) {
}
```

- [ ] **Step 2: Create `UserPasswordChangeRequest.java`**

```java
package com.mrpaulwoods.equipment.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record UserPasswordChangeRequest(
        @NotBlank String currentPassword,
        @NotBlank String newPassword
) {
}
```

- [ ] **Step 3: Create `UserSelfUpdateResponse.java`**

```java
package com.mrpaulwoods.equipment.backend.dto;

import com.mrpaulwoods.equipment.backend.util.Role;

import java.util.UUID;

public record UserSelfUpdateResponse(
        UUID id,
        String name,
        String email,
        Role role
) {
}
```

- [ ] **Step 4: Confirm the project compiles**

```bash
cd backend && ./mvnw compile -q
```

Expected: `BUILD SUCCESS` with no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/mrpaulwoods/equipment/backend/dto/UserSelfUpdateRequest.java \
        backend/src/main/java/com/mrpaulwoods/equipment/backend/dto/UserPasswordChangeRequest.java \
        backend/src/main/java/com/mrpaulwoods/equipment/backend/dto/UserSelfUpdateResponse.java
git commit -m "feat: add DTOs for user self-edit and password change"
```

---

## Task 2: `UserService` — `updateSelf` method

**Files:**
- Modify: `backend/src/main/java/com/mrpaulwoods/equipment/backend/service/UserService.java`
- Modify: `backend/src/test/java/com/mrpaulwoods/equipment/backend/service/UserServiceTest.java`

- [ ] **Step 1: Write failing tests for `updateSelf`**

Add these tests to `UserServiceTest.java` inside the class, after the existing `// --- update ---` block:

```java
// --- updateSelf ---

@Test
void updateSelf_happyPath_updatesNameAndEmail() {
    UUID id = UUID.randomUUID();
    User user = sampleUser(id, "Old Name", "old@example.com", Role.USER);
    var request = new UserSelfUpdateRequest("New Name", "new@example.com");

    given(userRepository.findById(id)).willReturn(Optional.of(user));
    given(userRepository.findByEmail("new@example.com")).willReturn(Optional.empty());
    given(userRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

    UserSelfUpdateResponse result = userService.updateSelf(id, request);

    assertThat(result.name()).isEqualTo("New Name");
    assertThat(result.email()).isEqualTo("new@example.com");
    assertThat(result.role()).isEqualTo(Role.USER);
}

@Test
void updateSelf_emailUnchanged_doesNotCheckUniqueness() {
    UUID id = UUID.randomUUID();
    User user = sampleUser(id, "Alice", "alice@example.com", Role.USER);
    var request = new UserSelfUpdateRequest("Alice Updated", "alice@example.com");

    given(userRepository.findById(id)).willReturn(Optional.of(user));
    given(userRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

    UserSelfUpdateResponse result = userService.updateSelf(id, request);

    assertThat(result.name()).isEqualTo("Alice Updated");
    then(userRepository).should(never()).findByEmail(any());
}

@Test
void updateSelf_emailTakenByOtherUser_throwsConflict() {
    UUID id = UUID.randomUUID();
    UUID otherId = UUID.randomUUID();
    User user = sampleUser(id, "Alice", "alice@example.com", Role.USER);
    User other = sampleUser(otherId, "Bob", "taken@example.com", Role.USER);
    var request = new UserSelfUpdateRequest("Alice", "taken@example.com");

    given(userRepository.findById(id)).willReturn(Optional.of(user));
    given(userRepository.findByEmail("taken@example.com")).willReturn(Optional.of(other));

    assertThatThrownBy(() -> userService.updateSelf(id, request))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
            .isEqualTo(HttpStatus.CONFLICT.value());

    then(userRepository).should(never()).save(any());
}

@Test
void updateSelf_userNotFound_throwsNotFound() {
    UUID id = UUID.randomUUID();
    var request = new UserSelfUpdateRequest("Alice", "alice@example.com");

    given(userRepository.findById(id)).willReturn(Optional.empty());

    assertThatThrownBy(() -> userService.updateSelf(id, request))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
            .isEqualTo(HttpStatus.NOT_FOUND.value());
}
```

Also add the import at the top of the file (after existing imports):
```java
import com.mrpaulwoods.equipment.backend.dto.UserSelfUpdateRequest;
```

- [ ] **Step 2: Run the tests — confirm they fail**

```bash
cd backend && ./mvnw test -pl . -Dtest=UserServiceTest -q 2>&1 | grep -E "FAIL|ERROR|BUILD"
```

Expected: `BUILD FAILURE` — method `updateSelf` does not exist yet.

- [ ] **Step 3: Implement `updateSelf` in `UserService.java`**

Add this method after the existing `update` method (around line 86):

```java
@Transactional
public UserSelfUpdateResponse updateSelf(UUID currentUserId, UserSelfUpdateRequest request) {
    User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    if (!user.getEmail().equals(request.email())) {
        userRepository.findByEmail(request.email()).ifPresent(existing -> {
            if (!existing.getId().equals(currentUserId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
            }
        });
    }

    user.setName(request.name());
    user.setEmail(request.email());
    User saved = userRepository.save(user);
    return new UserSelfUpdateResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getRole());
}
```

Also add the import at the top of `UserService.java`:
```java
import com.mrpaulwoods.equipment.backend.dto.UserSelfUpdateRequest;
import com.mrpaulwoods.equipment.backend.dto.UserSelfUpdateResponse;
```

- [ ] **Step 4: Run the tests — confirm they pass**

```bash
cd backend && ./mvnw test -pl . -Dtest=UserServiceTest -q 2>&1 | grep -E "Tests run|BUILD"
```

Expected: `BUILD SUCCESS`, all `updateSelf` tests passing.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/mrpaulwoods/equipment/backend/service/UserService.java \
        backend/src/test/java/com/mrpaulwoods/equipment/backend/service/UserServiceTest.java
git commit -m "feat: add UserService.updateSelf with tests"
```

---

## Task 3: `UserService` — `changePassword` method

**Files:**
- Modify: `backend/src/main/java/com/mrpaulwoods/equipment/backend/service/UserService.java`
- Modify: `backend/src/test/java/com/mrpaulwoods/equipment/backend/service/UserServiceTest.java`

- [ ] **Step 1: Write failing tests for `changePassword`**

Add these tests to `UserServiceTest.java` after the `updateSelf` tests:

```java
// --- changePassword ---

@Test
void changePassword_correctCurrentPassword_savesNewHash() {
    UUID id = UUID.randomUUID();
    User user = sampleUser(id, "Alice", "alice@example.com", Role.USER);
    var request = new UserPasswordChangeRequest("oldpass", "newpass");

    given(userRepository.findById(id)).willReturn(Optional.of(user));
    given(passwordEncoder.matches("oldpass", "hashed")).willReturn(true);
    given(passwordEncoder.encode("newpass")).willReturn("newhashed");
    given(userRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

    userService.changePassword(id, request);

    then(userRepository).should().save(any());
}

@Test
void changePassword_wrongCurrentPassword_throwsBadRequest() {
    UUID id = UUID.randomUUID();
    User user = sampleUser(id, "Alice", "alice@example.com", Role.USER);
    var request = new UserPasswordChangeRequest("wrongpass", "newpass");

    given(userRepository.findById(id)).willReturn(Optional.of(user));
    given(passwordEncoder.matches("wrongpass", "hashed")).willReturn(false);

    assertThatThrownBy(() -> userService.changePassword(id, request))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
            .isEqualTo(HttpStatus.BAD_REQUEST.value());

    then(userRepository).should(never()).save(any());
}

@Test
void changePassword_userNotFound_throwsNotFound() {
    UUID id = UUID.randomUUID();
    var request = new UserPasswordChangeRequest("pass", "newpass");

    given(userRepository.findById(id)).willReturn(Optional.empty());

    assertThatThrownBy(() -> userService.changePassword(id, request))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
            .isEqualTo(HttpStatus.NOT_FOUND.value());
}
```

Also add the import at the top of the test file:
```java
import com.mrpaulwoods.equipment.backend.dto.UserPasswordChangeRequest;
```

- [ ] **Step 2: Run the tests — confirm they fail**

```bash
cd backend && ./mvnw test -pl . -Dtest=UserServiceTest -q 2>&1 | grep -E "FAIL|ERROR|BUILD"
```

Expected: `BUILD FAILURE` — method `changePassword` does not exist yet.

- [ ] **Step 3: Implement `changePassword` in `UserService.java`**

Add this method after `updateSelf`:

```java
@Transactional
public void changePassword(UUID currentUserId, UserPasswordChangeRequest request) {
    User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
    }

    user.setPassword(passwordEncoder.encode(request.newPassword()));
    userRepository.save(user);
}
```

Also add the import:
```java
import com.mrpaulwoods.equipment.backend.dto.UserPasswordChangeRequest;
```

- [ ] **Step 4: Run the tests — confirm they pass**

```bash
cd backend && ./mvnw test -pl . -Dtest=UserServiceTest -q 2>&1 | grep -E "Tests run|BUILD"
```

Expected: `BUILD SUCCESS`, all tests including `changePassword` passing.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/mrpaulwoods/equipment/backend/service/UserService.java \
        backend/src/test/java/com/mrpaulwoods/equipment/backend/service/UserServiceTest.java
git commit -m "feat: add UserService.changePassword with tests"
```

---

## Task 4: `UserController` — new `/me` endpoints

**Files:**
- Modify: `backend/src/main/java/com/mrpaulwoods/equipment/backend/controller/UserController.java`
- Modify: `backend/src/test/java/com/mrpaulwoods/equipment/backend/controller/UserControllerTest.java`

- [ ] **Step 1: Write failing controller tests**

Add these tests to `UserControllerTest.java` after the existing `delete_whenNotFound_returns404` test:

```java
// --- PUT /me ---

@Test
void updateMe_withValidBody_returns200() throws Exception {
    authenticateAsAdmin();
    var response = new UserSelfUpdateResponse(USER_ID, "Updated", "updated@example.com", Role.ADMIN);
    given(userService.updateSelf(any(), any())).willReturn(response);

    String body = """
            {"name": "Updated", "email": "updated@example.com"}
            """;

    mockMvc.perform(put("/api/v1/users/me")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Updated"))
            .andExpect(jsonPath("$.email").value("updated@example.com"));
}

@Test
void updateMe_withMissingFields_returns400() throws Exception {
    mockMvc.perform(put("/api/v1/users/me")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
            .andExpect(status().isBadRequest());
}

@Test
void updateMe_whenEmailConflict_returns409() throws Exception {
    authenticateAsAdmin();
    given(userService.updateSelf(any(), any()))
            .willThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use"));

    String body = """
            {"name": "Admin", "email": "taken@example.com"}
            """;

    mockMvc.perform(put("/api/v1/users/me")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isConflict());
}

// --- POST /me/password ---

@Test
void changePassword_withValidBody_returns204() throws Exception {
    authenticateAsAdmin();
    doNothing().when(userService).changePassword(any(), any());

    String body = """
            {"currentPassword": "oldpass", "newPassword": "newpass"}
            """;

    mockMvc.perform(post("/api/v1/users/me/password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isNoContent());
}

@Test
void changePassword_withMissingFields_returns400() throws Exception {
    mockMvc.perform(post("/api/v1/users/me/password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
            .andExpect(status().isBadRequest());
}

@Test
void changePassword_whenWrongCurrentPassword_returns400() throws Exception {
    authenticateAsAdmin();
    doThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect"))
            .when(userService).changePassword(any(), any());

    String body = """
            {"currentPassword": "wrong", "newPassword": "newpass"}
            """;

    mockMvc.perform(post("/api/v1/users/me/password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isBadRequest());
}
```

Add these imports to `UserControllerTest.java`:
```java
import com.mrpaulwoods.equipment.backend.dto.UserSelfUpdateResponse;
import com.mrpaulwoods.equipment.backend.dto.UserPasswordChangeRequest;
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd backend && ./mvnw test -pl . -Dtest=UserControllerTest -q 2>&1 | grep -E "FAIL|ERROR|BUILD"
```

Expected: `BUILD FAILURE` — methods `updateSelf` and `changePassword` not found on the controller mock.

- [ ] **Step 3: Add the two new endpoints to `UserController.java`**

Add these two methods after the existing `delete` method (before the private helpers):

```java
@Operation(summary = "Update own name and email")
@PreAuthorize("isAuthenticated()")
@PutMapping("/me")
public ResponseEntity<UserSelfUpdateResponse> updateMe(
        @Valid @RequestBody UserSelfUpdateRequest request,
        Authentication authentication) {
    UUID currentUserId = currentUserId(authentication);
    return ResponseEntity.ok(userService.updateSelf(currentUserId, request));
}

@Operation(summary = "Change own password")
@PreAuthorize("isAuthenticated()")
@PostMapping("/me/password")
public ResponseEntity<Void> changePassword(
        @Valid @RequestBody UserPasswordChangeRequest request,
        Authentication authentication) {
    UUID currentUserId = currentUserId(authentication);
    userService.changePassword(currentUserId, request);
    return ResponseEntity.noContent().build();
}
```

Add imports to `UserController.java`:
```java
import com.mrpaulwoods.equipment.backend.dto.UserPasswordChangeRequest;
import com.mrpaulwoods.equipment.backend.dto.UserSelfUpdateRequest;
import com.mrpaulwoods.equipment.backend.dto.UserSelfUpdateResponse;
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd backend && ./mvnw test -pl . -Dtest=UserControllerTest -q 2>&1 | grep -E "Tests run|BUILD"
```

Expected: `BUILD SUCCESS`, all tests passing.

- [ ] **Step 5: Run the full test suite to confirm no regressions**

```bash
cd backend && ./mvnw test -q 2>&1 | grep -E "Tests run:|BUILD" | tail -5
```

Expected: `BUILD SUCCESS`, 203+ tests, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/mrpaulwoods/equipment/backend/controller/UserController.java \
        backend/src/test/java/com/mrpaulwoods/equipment/backend/controller/UserControllerTest.java
git commit -m "feat: add PUT /users/me and POST /users/me/password endpoints"
```

---

## Task 5: `AuthController` — add `id` to `/me` response

**Files:**
- Modify: `backend/src/main/java/com/mrpaulwoods/equipment/backend/controller/AuthController.java`
- Modify: `backend/src/test/java/com/mrpaulwoods/equipment/backend/controller/AuthControllerTest.java`

- [ ] **Step 1: Update the failing test for `/me`**

Find the existing test `me_whenAuthenticated_returnsEmailAndRole` in `AuthControllerTest.java` and replace it with:

```java
@Test
void me_whenAuthenticated_returnsEmailAndRole() throws Exception {
    Authentication auth = mock(Authentication.class);
    when(auth.isAuthenticated()).thenReturn(true);
    when(auth.getName()).thenReturn("admin@example.com");
    when(auth.getAuthorities()).thenAnswer(_ ->
            List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

    User user = new User();
    user.setId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
    user.setEmail("admin@example.com");
    user.setRole(Role.ADMIN);
    when(userService.findByEmail("admin@example.com")).thenReturn(Optional.of(user));

    mockMvc.perform(get("/api/v1/auth/me").principal(auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("admin@example.com"))
            .andExpect(jsonPath("$.role").value("ROLE_ADMIN"))
            .andExpect(jsonPath("$.id").value("00000000-0000-0000-0000-000000000001"));
}
```

- [ ] **Step 2: Run the test — confirm it fails**

```bash
cd backend && ./mvnw test -pl . -Dtest=AuthControllerTest#me_whenAuthenticated_returnsEmailAndRole -q 2>&1 | grep -E "FAIL|ERROR|BUILD"
```

Expected: `BUILD FAILURE` — the `id` field is not in the response yet.

- [ ] **Step 3: Update the `me` method in `AuthController.java`**

Find the existing `me` method (around line 114) and replace it entirely with:

```java
@Operation(summary = "Return the currently authenticated user")
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

- [ ] **Step 4: Run the test — confirm it passes**

```bash
cd backend && ./mvnw test -pl . -Dtest=AuthControllerTest -q 2>&1 | grep -E "Tests run|BUILD"
```

Expected: `BUILD SUCCESS`, all AuthController tests passing.

- [ ] **Step 5: Run the full test suite**

```bash
cd backend && ./mvnw test -q 2>&1 | grep -E "Tests run:|BUILD" | tail -5
```

Expected: `BUILD SUCCESS`, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/mrpaulwoods/equipment/backend/controller/AuthController.java \
        backend/src/test/java/com/mrpaulwoods/equipment/backend/controller/AuthControllerTest.java
git commit -m "feat: include user id in /auth/me response"
```

---

## Task 6: Frontend — auth context and API client

**Files:**
- Modify: `frontend/src/hooks/useAuth.ts`
- Modify: `frontend/src/api/client.ts`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add `userId` to `AuthContextValue` in `useAuth.ts`**

Replace the entire content of `frontend/src/hooks/useAuth.ts` with:

```typescript
import {createContext, useContext} from "react";
import type {UserRole} from "../types/user";

interface AuthContextValue {
    username: string | null;
    userId: string | null;
    role: UserRole | null;
    setAuthenticated: (authenticated: boolean) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
    username: null,
    userId: null,
    role: null,
    setAuthenticated: async () => {
    },
});

export const useAuth = (): AuthContextValue => {
    return useContext(AuthContext);
};
```

- [ ] **Step 2: Update `getMe` return type and add new API functions in `client.ts`**

Find the `getMe` function in `frontend/src/api/client.ts`:

```typescript
export const getMe = async (): Promise<{ email: string; role: string } | null> => {
    const {data} = await apiClient.get<{ email: string; role: string } | null>('/api/v1/auth/me');
    return data;
};
```

Replace it with:

```typescript
export const getMe = async (): Promise<{ id: string; email: string; role: string } | null> => {
    const {data} = await apiClient.get<{ id: string; email: string; role: string } | null>('/api/v1/auth/me');
    return data;
};
```

Then add these two new functions after `deleteUser`:

```typescript
export const updateMe = async (payload: { name: string; email: string }): Promise<User> => {
    const {data} = await apiClient.put<User>('/api/v1/users/me', payload);
    return data;
};

export const changePassword = async (payload: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.post('/api/v1/users/me/password', payload);
};
```

- [ ] **Step 3: Update `App.tsx` to populate `userId` and pass it to context**

In `App.tsx`, add `userId` state alongside `email` and `role`:

Replace this block:
```typescript
const [email, setEmail] = useState<string | null>(null);
const [role, setRole] = useState<UserRole | null>(null);
const [authChecked, setAuthChecked] = useState(false);
const [setupRequired, setSetupRequired] = useState(false);
```

With:
```typescript
const [email, setEmail] = useState<string | null>(null);
const [userId, setUserId] = useState<string | null>(null);
const [role, setRole] = useState<UserRole | null>(null);
const [authChecked, setAuthChecked] = useState(false);
const [setupRequired, setSetupRequired] = useState(false);
```

Replace the `getMe` handler in `useEffect`:
```typescript
getMe().then((data) => {
    setEmail(data?.email ?? null);
    if (data?.role) {
        setRole(data.role.replace(/^ROLE_/, '') as UserRole);
    } else {
        setRole(null);
    }
}).catch(() => {
    setEmail(null);
    setRole(null);
}),
```

With:
```typescript
getMe().then((data) => {
    setEmail(data?.email ?? null);
    setUserId(data?.id ?? null);
    if (data?.role) {
        setRole(data.role.replace(/^ROLE_/, '') as UserRole);
    } else {
        setRole(null);
    }
}).catch(() => {
    setEmail(null);
    setUserId(null);
    setRole(null);
}),
```

Replace the `setAuthenticated` function:
```typescript
const setAuthenticated = async (authenticated: boolean): Promise<void> => {
    if (!authenticated) {
        setEmail(null);
        setRole(null);
    } else {
        const data = await getMe().catch(() => null);
        setEmail(data?.email ?? null);
        if (data?.role) {
            setRole(data.role.replace(/^ROLE_/, '') as UserRole);
        } else {
            setRole(null);
        }
    }
};
```

With:
```typescript
const setAuthenticated = async (authenticated: boolean): Promise<void> => {
    if (!authenticated) {
        setEmail(null);
        setUserId(null);
        setRole(null);
    } else {
        const data = await getMe().catch(() => null);
        setEmail(data?.email ?? null);
        setUserId(data?.id ?? null);
        if (data?.role) {
            setRole(data.role.replace(/^ROLE_/, '') as UserRole);
        } else {
            setRole(null);
        }
    }
};
```

Replace the `AuthContext.Provider` line:
```tsx
<AuthContext.Provider value={{username: email, role, setAuthenticated}}>
```

With:
```tsx
<AuthContext.Provider value={{username: email, userId, role, setAuthenticated}}>
```

- [ ] **Step 4: Confirm TypeScript compiles**

```bash
cd frontend && npm run build 2>&1 | grep -E "error|warning|built in"
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useAuth.ts \
        frontend/src/api/client.ts \
        frontend/src/App.tsx
git commit -m "feat: add userId to auth context and new self-edit API functions"
```

---

## Task 7: `ProfilePage` component

**Files:**
- Create: `frontend/src/pages/ProfilePage.tsx`
- Modify: `frontend/src/pages/index.ts`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create `ProfilePage.tsx`**

```tsx
import React, {useEffect, useState} from "react";
import axios from "axios";
import {getUser, updateMe, changePassword} from "../api/client";
import {useAuth} from "../hooks";
import {Button} from "../components/ui/button";
import {Alert, AlertDescription} from "../components/ui/alert";

const ProfilePage = (): React.JSX.Element => {
    const {userId, setAuthenticated} = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
    const [profileSubmitting, setProfileSubmitting] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);

    useEffect(() => {
        if (!userId) return;
        getUser(userId)
            .then((data) => {
                setName(data.name);
                setEmail(data.email);
            })
            .catch(() => setProfileError("Failed to load your profile."))
            .finally(() => setProfileLoading(false));
    }, [userId]);

    const handleProfileSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setProfileError(null);
        setProfileSuccess(null);
        setProfileSubmitting(true);
        try {
            await updateMe({name, email});
            setProfileSuccess("Profile updated successfully.");
            await setAuthenticated(true);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data?.detail) {
                setProfileError(err.response.data.detail);
            } else {
                setProfileError("Failed to update profile. The email may already be in use.");
            }
        } finally {
            setProfileSubmitting(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        setPasswordSubmitting(true);
        try {
            await changePassword({currentPassword, newPassword});
            setPasswordSuccess("Password changed successfully.");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data?.detail) {
                setPasswordError(err.response.data.detail);
            } else {
                setPasswordError("Failed to change password. Please check your current password.");
            }
        } finally {
            setPasswordSubmitting(false);
        }
    };

    if (profileLoading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <p className="text-[var(--muted-foreground)]">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl space-y-8">
                <h1 className="text-2xl font-bold text-[var(--foreground)] pt-2">My Profile</h1>

                {/* Profile Details */}
                <div className="bg-[var(--card)] shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Profile Details</h2>

                    {profileError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{profileError}</AlertDescription>
                        </Alert>
                    )}
                    {profileSuccess && (
                        <Alert className="mb-4">
                            <AlertDescription>{profileSuccess}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        <Button type="submit" disabled={profileSubmitting}>
                            {profileSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-[var(--card)] shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Change Password</h2>

                    {passwordError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{passwordError}</AlertDescription>
                        </Alert>
                    )}
                    {passwordSuccess && (
                        <Alert className="mb-4">
                            <AlertDescription>{passwordSuccess}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        <Button type="submit" disabled={passwordSubmitting}>
                            {passwordSubmitting ? 'Changing...' : 'Change Password'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export {ProfilePage};
```

- [ ] **Step 2: Export `ProfilePage` from `pages/index.ts`**

Add this line to `frontend/src/pages/index.ts`:
```typescript
export {ProfilePage} from './ProfilePage';
```

- [ ] **Step 3: Add the `/profile` route to `App.tsx`**

In `App.tsx`, add `ProfilePage` to the import:
```typescript
import {
    AboutPage,
    CalendarPage,
    ContactPage,
    DashboardPage,
    EditEquipmentPage,
    EditProcedurePage,
    EditUserPage,
    EquipmentPage,
    EquipmentShowPage,
    HomePage,
    ImportEquipmentPage,
    LoginPage,
    NewEquipmentPage,
    NewProcedurePage,
    NewUserPage,
    PerformProcedurePage,
    ProfilePage,
    ProcedureHistoryPage,
    ProcedureShowPage,
    ProceduresPage,
    SetupPage,
    UsersPage
} from './pages';
```

Add the route after the `/users/:id/edit` route:
```tsx
<Route path="/profile" element={<ProtectedRoute email={email}><ProfilePage/></ProtectedRoute>}/>
```

- [ ] **Step 4: Confirm TypeScript compiles**

```bash
cd frontend && npm run build 2>&1 | grep -E "error|warning|built in"
```

Expected: build succeeds, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ProfilePage.tsx \
        frontend/src/pages/index.ts \
        frontend/src/App.tsx
git commit -m "feat: add ProfilePage with profile and password change forms"
```

---

## Task 8: Sidebar — "My Profile" nav link

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx`

- [ ] **Step 1: Add "My Profile" to the nav in `Sidebar.tsx`**

Add `UserRound` to the lucide-react import. Find this line:
```typescript
import {Calendar, CircleQuestionMark, LayoutDashboard, LogOut, Monitor, PhoneCall, Users} from 'lucide-react';
```

Replace it with:
```typescript
import {Calendar, CircleQuestionMark, LayoutDashboard, LogOut, Monitor, PhoneCall, UserRound, Users} from 'lucide-react';
```

Add a `profileNav` array after `mainNav`:
```typescript
const profileNav: NavItem[] = [
  {label: 'My Profile', href: '/profile', icon: UserRound},
];
```

In the JSX, add a new section for the profile link after the `mainNav` section (before the `<Separator/>` that introduces the Admin section). Find:

```tsx
{mainNav.map((item) => (
  <NavLink key={item.href} item={item} />
))}

<Separator className="my-3" />

<p className="px-3 pb-1 text-xs font-semibold uppercase tracking-widest" style={{color: 'var(--muted-foreground)'}}>
  Admin
</p>
```

Replace with:

```tsx
{mainNav.map((item) => (
  <NavLink key={item.href} item={item} />
))}

<Separator className="my-3" />

<p className="px-3 pb-1 text-xs font-semibold uppercase tracking-widest" style={{color: 'var(--muted-foreground)'}}>
  Account
</p>
{profileNav.map((item) => (
  <NavLink key={item.href} item={item} />
))}

<Separator className="my-3" />

<p className="px-3 pb-1 text-xs font-semibold uppercase tracking-widest" style={{color: 'var(--muted-foreground)'}}>
  Admin
</p>
```

- [ ] **Step 2: Confirm TypeScript compiles**

```bash
cd frontend && npm run build 2>&1 | grep -E "error|warning|built in"
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Sidebar.tsx
git commit -m "feat: add My Profile link to sidebar nav"
```

---

## Task 9: `EditUserPage` — self-edit guards

**Files:**
- Modify: `frontend/src/pages/EditUserPage.tsx`

When the admin navigates to their own user record (`/users/{id}/edit` where `id === userId`), the role select should be replaced with a read-only badge and no delete affordance should appear. The form otherwise works normally via the existing `updateUser` → `PUT /api/v1/users/{id}` path (which the backend still guards against role changes via the self-edit block — the UI just makes the constraint visible).

- [ ] **Step 1: Update `EditUserPage.tsx`**

Replace the entire file content with:

```tsx
import React, {useEffect, useState} from "react";
import axios from "axios";
import {Link, useNavigate, useParams} from "react-router-dom";
import type {User, UserRole} from "../types/user";
import {assignableRoles} from "../types/user";
import {getUser, updateUser} from "../api/client";
import {useAuth} from "../hooks";
import {Button} from "../components/ui/button";

const EditUserPage = (): React.JSX.Element => {
    const {id} = useParams() as { id: string };
    const navigate = useNavigate();
    const {role: callerRole, userId} = useAuth();
    const isSelf = id === userId;
    const roleOptions = assignableRoles(callerRole);

    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('USER');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getUser(id)
            .then((data) => {
                setUser(data);
                setName(data.name);
                setEmail(data.email);
                setRole(data.role);
            })
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await updateUser(id, {name, email, role});
            navigate('/users');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Failed to update user. The email may already be in use.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <p className="text-[var(--muted-foreground)]">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[var(--background)] py-8 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">User not found</h1>
                    <Link to="/users" className="text-[var(--primary)] hover:underline">
                        Back to Users
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">
                <div className="mb-6">
                    <Link
                        to="/users"
                        className="text-[var(--primary)] hover:opacity-80 flex items-center gap-2 font-medium"
                    >
                        ← Back to Users
                    </Link>
                </div>

                <div className="bg-[var(--card)] shadow rounded-lg p-6">
                    <h1 className="text-xl font-bold text-[var(--foreground)] mb-6">Edit User</h1>

                    {error && (
                        <div
                            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-[var(--destructive)] rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Role
                            </label>
                            {isSelf ? (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    role === 'SYSTEM_ADMIN'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        : role === 'ADMIN'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                            : role === 'EDIT'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                    {role}
                                </span>
                            ) : (
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                >
                                    {roleOptions.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export {EditUserPage};
```

- [ ] **Step 2: Confirm TypeScript compiles**

```bash
cd frontend && npm run build 2>&1 | grep -E "error|warning|built in"
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/EditUserPage.tsx
git commit -m "feat: disable role select and hide delete in EditUserPage when editing self"
```

---

## Task 10: Final verification

- [ ] **Step 1: Run the full backend test suite**

```bash
cd backend && ./mvnw test -q 2>&1 | grep -E "Tests run:|BUILD" | tail -5
```

Expected: `BUILD SUCCESS`, 0 failures.

- [ ] **Step 2: Run the frontend build**

```bash
cd frontend && npm run build 2>&1 | grep -E "error|built in"
```

Expected: clean build, no errors.

- [ ] **Step 3: Start the dev server and manually verify**

```bash
cd frontend && npm run dev
```

Verify the following in the browser:
- Log in as a non-admin user → "My Profile" appears in the sidebar
- Profile page loads with your name and email pre-populated
- Saving with a new name updates it and the sidebar email stays in sync
- Saving with an email already in use shows an error message
- Changing password with wrong current password shows an error
- Confirm passwords mismatch shows a client-side error without hitting the server
- Successful password change clears all three password fields and shows success
- Log in as an admin → navigate to `/users/{your-own-id}/edit` → role shows as a badge (not a select), no delete option

- [ ] **Step 4: Final commit if anything was adjusted during manual verification**

```bash
git add -p
git commit -m "fix: adjustments from manual verification"
```
