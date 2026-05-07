# 21. UUID primary keys on every entity

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

Every domain entity uses a primary key. The two reasonable choices
in a Postgres + JPA stack are:

- **`bigserial`** (auto-incrementing 64-bit integer) — fast inserts,
  best index locality, dense small numbers in URLs.
- **UUID** (random 128-bit) — globally unique without coordination,
  non-enumerable in URLs, larger index footprint, slightly worse
  cache behavior.

URLs in the SPA expose IDs (`/equipment/:id`, `/equipment/:id/procedures/:procedureId`),
so the choice has security and UX implications, not just storage ones.

## Decision

Use UUIDs for **every** primary key in the schema. Implementation:

- All migration tables declare `id UUID PRIMARY KEY` with
  `DEFAULT gen_random_uuid()` for tables created by the database
  (`users`, `refresh_token`, `password_reset_token`, `roles`,
  `user_roles`).
- For tables populated by the application (`equipment`, `procedure`,
  `perform`), the JPA side handles ID generation. A shared
  `UuidEntity` base class
  (`backend/.../entity/UuidEntity.java`) annotates `@Id private UUID
  id` and uses a `@PrePersist` hook to call `UUID.randomUUID()` if
  the ID is unset before insert. All entities extend `UuidEntity`,
  so no entity reinvents the pattern.

## Consequences

- **Positive:** IDs in URLs are non-enumerable. `/equipment/3` would
  let an attacker walk the catalog; `/equipment/8a91f2c0-...` does
  not. This is a meaningful defence-in-depth even with proper
  authorization in place.
- **Positive:** entities can be created on the JPA side without a
  database round-trip to allocate the ID — useful for batch imports
  and tests.
- **Positive:** future cross-system data merges (e.g. importing
  equipment from another deployment) cannot collide.
- **Negative:** larger primary key (16 bytes vs 8) — modestly larger
  indexes and B-tree leaves. At this domain's scale, immaterial.
- **Negative:** random UUIDs cause B-tree fragmentation on insert
  compared to monotonic IDs. If write throughput ever becomes a
  bottleneck, UUIDv7 (time-ordered) would be a drop-in replacement
  via a different default.
- **Negative:** UUIDs are awkward to type in support contexts
  ("read me the equipment ID over the phone"). Mitigated by the SPA
  always copy/paste-driven, never typed.
