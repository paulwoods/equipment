---
name: Run tests after code changes
description: Always run backend unit tests after backend changes, and frontend unit tests after frontend changes
type: feedback
---

After any code changes to the backend, run the backend unit tests.
After any code changes to the frontend, run the frontend unit tests.

**Why:** User wants to ensure tests are verified after every change.
**How to apply:** Any time code is modified in the backend (Java/Spring Boot), run the backend tests. Any time code is modified in the frontend (React/Vite), run the frontend tests.
