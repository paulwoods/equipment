# 22. Markdown as the persistence format for procedure content

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

A maintenance procedure has rich textual content: a description, a
list of steps that maintainers follow, and a list of required tools.
Plain text is too poor (no lists, no emphasis, no images); HTML is
too rich (sanitization burden, editor complexity). The middle ground:
a markup language that round-trips through a simple editor and
renders consistently.

The frontend already pulls in `easymde` and `react-simplemde-editor`
(see `ProcedureForm.tsx`) and `react-markdown` (see
`ProcedureShowPage.tsx`). The schema's `procedure.description`,
`procedure.steps`, and `procedure.required_tools` columns are typed
`TEXT`.

## Decision

- **Storage:** procedure free-text fields are stored as Markdown
  source in `TEXT` columns. The database is unaware of the format —
  it's a contract between the editor and the renderer.
- **Editor:** `react-simplemde-editor` (EasyMDE) provides a
  WYSIWYG-ish Markdown experience for `steps` and `requiredTools`.
- **Renderer:** `react-markdown` renders the stored source on the
  show pages. No custom remark plugins; default GFM-ish behavior.
- **Sanitization:** relies on `react-markdown`'s default behavior of
  not rendering raw HTML. No additional sanitizer is wired in.

## Consequences

- **Positive:** content survives a round-trip through any plaintext
  tool — `pg_dump`, the email export, copy/paste — without losing
  structure.
- **Positive:** the weekly dashboard email
  (`MaintenanceScheduler.sendWeeklyDashboardEmail` →
  `EmailService.sendDashboardEmail`) can reuse the same Markdown
  source by rendering to HTML or by sending it as Markdown.
- **Negative:** the format is a *convention*, not enforced by the
  schema. A future contributor could store HTML or some other markup
  and the database would happily accept it; the renderer would then
  treat it as Markdown source and produce surprising output. A schema
  comment or a service-level validator could harden this if it ever
  becomes a real risk.
- **Negative:** Markdown's lenient parsing means malformed input
  renders silently rather than failing — easier to author, harder to
  catch errors at save time.
- **Negative:** if the application ever needs full-text search over
  procedures, Markdown markers (`#`, `*`, `-`) will pollute the index
  unless stripped. Postgres `tsvector` can handle this with a
  preprocessing function, but it's a future cost.
