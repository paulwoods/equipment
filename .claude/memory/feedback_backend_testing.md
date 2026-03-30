---
name: Backend Testing Conventions
description: How to write unit and integration tests for the backend
type: feedback
---

Unit tests: use Mockito (`@ExtendWith(MockitoExtension.class)`), no `@SpringBootTest` or other Spring context
annotations. Use `MockMvcBuilders.standaloneSetup()` for controller tests. Spring Boot 4 compatible (no `@WebMvcTest` —
it was removed).

Integration tests: use `@SpringBootTest`. Name the file `*IT.java`.

**Why:** User's explicit convention for this project.

**How to apply:** Any time a backend test is created — check the filename and annotations before writing.
