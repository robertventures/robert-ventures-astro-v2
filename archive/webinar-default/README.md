# Archived: /webinar (default version)

Archived on 2026-04-21.

This was the production `/webinar` landing page prior to the cutover to the
`webinar-v1-cd` funnel (which is now the canonical `/webinar`).

## What's here

- `webinar.astro` — the page that used to live at `src/pages/webinar.astro`
- `sections/webinar/` — page-specific sections
- `sections/HeroboxWebinarV2.astro` — hero used only by this page
- `components/FormWebinarV2.astro` — form used only by this page

## How to restore

1. Move `webinar.astro` back to `src/pages/webinar.astro` (the current
   `/webinar` page will need to be archived or renamed first).
2. Move `sections/webinar/` back to `src/sections/webinar/`.
3. Move `sections/HeroboxWebinarV2.astro` back to `src/sections/`.
4. Move `components/FormWebinarV2.astro` back to `src/components/`.
5. Run `npm run build` to confirm nothing else depends on the current routing.
