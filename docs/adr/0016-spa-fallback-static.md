# 16. SPA fallback served from Spring static resources

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

A client-routed SPA breaks if the server returns 404 for a URL that only
exists in the JavaScript router (e.g. a user shares a link to
`/equipment/abc-123/procedures`). The fix is "if the path doesn't match a
static asset, serve `index.html` and let the SPA route from there."

In production, the frontend container (nginx) handles this — see
`frontend/nginx.conf`. But the backend also bundles a static SPA fallback
so that a single Spring Boot jar can serve the whole stack standalone (no
separate frontend container needed in development setups).

## Decision

`WebConfig.addResourceHandlers` registers a custom
`PathResourceResolver`:

```java
registry.addResourceHandler("/**")
        .addResourceLocations("classpath:/static/")
        .resourceChain(true)
        .addResolver(new PathResourceResolver() {
            @Override
            protected Resource getResource(String path, Resource location) {
                Resource resource = location.createRelative(path);
                if (resource.exists() && resource.isReadable()) return resource;
                return new ClassPathResource("/static/index.html");
            }
        });
```

This means:

1. `/api/v1/**` is matched by Spring MVC handlers first (controllers
   take precedence over the static handler).
2. Any other path serves the matching file from `classpath:/static/` if it
   exists.
3. Otherwise the SPA's `index.html` is returned and React Router decides
   what to render.

## Consequences

- **Positive:** deep links work whether the client hits Caddy → frontend
  container → nginx, or Caddy → backend → static fallback.
- **Positive:** simplifies "single jar" demos and tests that don't run the
  frontend container.
- **Negative:** unknown URLs always return 200 + the SPA shell — there's
  no server-side 404 for genuinely-missing routes. The SPA must own
  rendering a not-found screen (see `NotFoundScreen.tsx`).
- **Negative:** the resolver does not distinguish API typos from SPA
  routes; a typo'd `/api/v2/foo` falls through to MVC's default 404
  handler (which is correct — it doesn't reach the resource resolver
  because the path is matched by MVC first), but anything else returns
  index.html. Document this when wiring up new top-level path prefixes.
