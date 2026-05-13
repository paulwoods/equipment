---
name: project-run-frontend
description: How to run the equipment-frontend Vite + React app locally
metadata: 
  node_type: memory
  type: project
  originSessionId: 9a30bb4b-74d9-4705-a202-94f333c47fe7
---

The frontend ([[project-modules]]) is a Vite + React 19 app. Run it with:

```bash
cd equipment-frontend && npm run dev
```

Other scripts in `package.json`:
- `npm run build` — `tsc -b && vite build`
- `npm test` — vitest run
- `npm run lint` — eslint

A `Dockerfile` (nginx-based) exists for containerized serving.

**Why:** User asked and confirmed they want this remembered.
**How to apply:** Use this when the user asks to start, build, or test the frontend locally.
