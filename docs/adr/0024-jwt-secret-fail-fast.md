# 24. Fail-fast on weak `APP_JWT_SECRET` at application startup

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06
- **Related:** ADR-0003 (JWT cookies)

## Context

The JWT secret signs every access token. If it is weak (placeholder,
short, low-entropy), an attacker can forge tokens for any user. The
common failure modes are:

1. The placeholder default never gets replaced in deployment.
2. A short string ("password", a name) is set instead of a real key.
3. A long-but-low-entropy string ("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
   is set, satisfying length checks but not entropy.

The library minimum for HS256 is 32 bytes (256 bits). Spring will
not by itself reject a weak secret — it will boot and silently sign
tokens with whatever string is provided.

## Decision

Fail at startup, loudly, if the secret is suspect.
`JwtSecretValidator` (`backend/.../config/JwtSecretValidator.java`)
implements `CommandLineRunner` and validates `app.jwt-secret`
against four rules:

| Rule | Threshold | Why |
|------|-----------|-----|
| Not null/blank | — | catches missing env var |
| Not equal to the built-in placeholder `changeme-use-a-32-char-secret-here!!!!` | — | catches "forgot to set it" |
| `getBytes(UTF_8).length >= 32` | 32 bytes | HS256 minimum |
| `chars().distinct() >= 16` | 16 distinct chars | catches low-entropy long strings |

Any failing rule throws `IllegalStateException` with a remediation
hint: `"Generate a strong secret with: openssl rand -base64 48"`.
Because `CommandLineRunner` runs after the context is built, the
exception aborts startup — the application never serves a request
with a weak secret.

## Consequences

- **Positive:** removes the most common JWT-misconfiguration
  vulnerability ("we forgot to change the placeholder") at the
  cheapest possible point — boot.
- **Positive:** the error message tells the operator how to fix it,
  which means SREs without security context can still resolve the
  failure correctly.
- **Positive:** the distinct-character check catches the long-but-weak
  case that pure length validation misses — a real-world failure mode
  when operators try to satisfy a length requirement quickly.
- **Negative:** the entropy heuristic (16 distinct characters) is
  rough — a generated key with 32 distinct characters but
  pathological structure (e.g. ASCII-art) would pass. Acceptable: the
  goal is to catch obvious misuse, not to grade keys cryptographically.
- **Negative:** failing at startup means a misconfigured deploy is
  *visible* (container restart loop, healthcheck red) but still
  causes downtime. That's the right trade-off — silent acceptance of
  a weak secret is strictly worse than a noisy failure.
- **Negative:** the validator only runs once at startup. If the
  secret were rotated by editing the env file without restarting,
  the running process would keep the old (now possibly weak) value.
  A non-issue under the current deploy model (`docker compose up -d`
  always restarts containers when env changes).
