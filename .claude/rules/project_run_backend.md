---
name: project-run-backend
description: How to run the equipment-backend Spring Boot app locally
metadata: 
  node_type: memory
  type: project
  originSessionId: 9a30bb4b-74d9-4705-a202-94f333c47fe7
---

The backend ([[project-modules]]) is a Spring Boot app. Run it with:

```bash
cd equipment-backend && ./mvnw spring-boot:run
```

A `Dockerfile` exists in `equipment-backend/`, and the repo root has a `docker-compose.yml` for running it alongside Postgres.

**Why:** User asked and confirmed they want this remembered.
**How to apply:** Use this when the user asks to start, restart, or test the backend locally.
