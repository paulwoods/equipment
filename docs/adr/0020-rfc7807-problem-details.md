# 20. RFC 7807 `application/problem+json` for API error responses

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

A REST API has to commit to *one* error envelope, and the choice
shapes every client integration. Common alternatives:

- Ad-hoc `{ "error": "..." }` JSON — easy, but each service invents its
  own shape.
- GraphQL-style `{ "errors": [{...}, {...}] }` — flexible but heavy
  for REST.
- **RFC 7807 `application/problem+json`** — IETF-standardized envelope
  with `type`, `title`, `status`, `detail`, `instance`, plus arbitrary
  extension members.

The codebase has internal validation errors, not-found errors, import
errors, rate-limit responses, and generic 500s — five distinct error
shapes that need to be representable consistently.

## Decision

Use Spring's `org.springframework.http.ProblemDetail` (RFC 7807) as
the API's only error envelope. Enforce it via two mechanisms:

1. **`ProblemDetails.of(status, detail, title, uri)`**
   (`backend/.../exception/ProblemDetails.java`) — a thin factory that
   sets `title` and `instance` on top of
   `ProblemDetail.forStatusAndDetail(...)`. Keeps the construction
   pattern identical at every call site.
2. **`GlobalExceptionHandler`** (`@RestControllerAdvice`) maps every
   well-known exception to a `ProblemDetail`:
   - `NotFoundException` → 404 "Resource Not Found"
   - `ImportEquipmentException` → 400 "Import Error"
   - `MethodArgumentNotValidException` → 400 "Validation Error" with
     a per-field `errors` extension (`Map<String, String>`)
   - `ResponseStatusException` → status from the exception
   - `Exception` (catch-all) → 500 "Internal Server Error" with
     a generic message (no internals leaked)
3. The non-MVC error path — `ApiRateLimitFilter` for 429 responses —
   uses the same `ProblemDetails.of(...)` factory, so even responses
   that bypass `@ControllerAdvice` keep the envelope consistent.

## Consequences

- **Positive:** every error a client receives has the same top-level
  fields (`type`, `title`, `status`, `detail`, `instance`). Client
  error handling can be one function, not five.
- **Positive:** validation errors carry structured field information
  via the `errors` extension member without abandoning the envelope.
- **Positive:** the catch-all 500 handler scrubs the exception
  message, so stack traces and internal details never reach the client.
- **Negative:** the frontend currently does not parse `ProblemDetail`
  shape — it inspects HTTP status codes only (see
  `api/client.ts.postWithStatus`). The structured payload is available
  for richer error UX whenever someone wires it up, but until then the
  envelope is being under-used.
- **Negative:** `instance` is set to `request.getRequestURI()`. This
  is convenient but reveals the requested path back to the client;
  acceptable here because the API is first-party.
