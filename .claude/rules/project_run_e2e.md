---
name: project-run-e2e
description: How to run the equipment-e2e Playwright tests
metadata: 
  node_type: memory
  type: project
  originSessionId: 9a30bb4b-74d9-4705-a202-94f333c47fe7
---

The e2e module ([[project-modules]]) is a Playwright test suite. Run it with:

```bash
cd equipment-e2e && npm run e2e
```

Other scripts in `package.json`:
- `npm run e2e:headed` — visible browser with `SLOW_MO=1000`
- `npm run e2e:ui` — Playwright UI mode
- `npm run test:e2e` — runs with `.env` loaded via `node --env-file=.env`
- `npm run report` — open last HTML report
- `npm run trace` — open a Playwright trace

**Why:** User asked and confirmed they want this remembered.
**How to apply:** Use this when the user asks to run, debug, or view results from end-to-end tests.
