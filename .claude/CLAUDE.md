# Rules

# Backend

- The backend uses maven as the build tool.
- Use the `./mvnw` command to run maven.

# Frontend

- In the frontend, when you write tailwind CSS, make sure it follows Tailwind V4 semantic utilities.
- Avoid using arbitrary CSS variable values and instead use Tailwind's utility classes for consistent styling.

# E2E

- This module is a Playwright application used to fully test the project.
- Run e2e tests with `cd equipment-e2e && npm run e2e`.

# Backend tests

- Run backend tests with `cd equipment-backend && ./mvnw test`.

# Frontend tests

- Run frontend tests with `cd equipment-frontend && npm test` (or `npm run test:watch` for watch mode).

# Memory Index

- [Run tests after code changes](rules/feedback_run_tests_after_changes.md) — Run backend tests after backend changes; run frontend tests after frontend changes
- [Project modules](rules/project_modules.md) — Three modules: equipment-backend (Maven), equipment-frontend (Tailwind v4), equipment-e2e (Playwright)
- [Run backend](rules/project_run_backend.md) — Spring Boot app; `cd equipment-backend && ./mvnw spring-boot:run` (or docker-compose at repo root)
- [Run frontend](rules/project_run_frontend.md) — Vite + React; `cd equipment-frontend && npm run dev`
- [Run e2e](rules/project_run_e2e.md) — Playwright; `cd equipment-e2e && npm run e2e`
