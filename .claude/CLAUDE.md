# Rules

## Git Workflow

Always run the full test suite (backend and frontend) before committing. Only commit if all tests pass. Use descriptive commit messages. After pushing, verify the push landed on the remote.

## Backend

- The backend uses maven as the build tool.
- Use the `./mvnw` command to run maven.

## Frontend

- In the frontend, when you write tailwind CSS, make sure it follows Tailwind V4 semantic utilities.
- Avoid using arbitrary CSS variable values and instead use Tailwind's utility classes for consistent styling.

## E2E

- This module is a Playwright application used to fully test the project.
- Run e2e tests with `cd equipment-e2e && npm run e2e`.

## Backend tests

- Run backend tests with `cd equipment-backend && ./mvnw test`.

## Frontend tests

- Run frontend tests with `cd equipment-frontend && npm test` (or `npm run test:watch` for watch mode).

## Architecture Review Workflow

When asked to grill or review architecture: (1) Read the existing architecture/review docs first to find correct package paths, (2) Ask one question at a time — never pack multiple questions into a single prompt, (3) Wait for user's answer before proceeding, (4) Only implement after the user explicitly approves the design.

## Codebase Paths

Before exploring any package or module, verify the path exists with a quick `ls` or `find` command. Do not trust paths from documentation files blindly — docs may be stale or aspirational.

## UI Changes

When implementing UI or styling changes, verify the result by running the frontend dev server or build. Check for lint errors after CSS/HTML changes. Prefer hardcoded values over CSS var() inside data-URI url() — CSS variables inside url() don't work reliably across browsers.

## Memory Index

- [Run tests after code changes](rules/feedback_run_tests_after_changes.md) — Run backend tests after backend changes; run frontend tests after frontend changes
- [Project modules](rules/project_modules.md) — Three modules: equipment-backend (Maven), equipment-frontend (Tailwind v4), equipment-e2e (Playwright)
- [Run backend](rules/project_run_backend.md) — Spring Boot app; `cd equipment-backend && ./mvnw spring-boot:run` (or docker-compose at repo root)
- [Run frontend](rules/project_run_frontend.md) — Vite + React; `cd equipment-frontend && npm run dev`
- [Run e2e](rules/project_run_e2e.md) — Playwright; `cd equipment-e2e && npm run e2e`
