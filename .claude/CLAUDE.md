# CLAUDE

## Backend

The backend is a REST API on Spring Boot 4 and Java 25.

### Tech Stack

- Use Spring boot 4.
- Use Java 25.
- Use Lombok.
- Use PostgreSQL 18
- Use Maven for dependency management.
- Use JUnit 5 for unit testing.
- Use Mockito for unit test mocking.

### Testing

- Create unit tests for all code changes.
- Use Mockito for unit test mocking.
    - Use `@ExtendWith(MockitoExtension.class)`
    - Use `MockMvcBuilders.standaloneSetup()` for controller tests. Spring Boot 4 compatible (no `@WebMvcTest` — it was
      removed).
- Do not use @SpringBootTest for unit tests.
- Name the unit tests `*Test.java`.
- For integration tests, always use @SpringBootTest.
- For integration tests, name the file `*IT.java`.
- Run all unit tests before accepting code changes.

## Frontend

The frontend is a React app running typescript and built using vite

### Tech Stack

- Use React 19.
- Use TypeScript.
- Use Vite for development.
- Use ESLint for linting.
