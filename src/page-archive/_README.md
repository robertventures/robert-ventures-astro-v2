# Page archive

Retired page files kept for reference. This folder sits **outside** `src/pages/`,
so Astro does not turn anything here into a live route. Files are only here for
history and possible reuse. Git history is the canonical record.

## Contents

- `offer.astro` (archived 2026-06-25)
  - The original `/offer` page: a 7-section "Presentation" diligence page built
    from `PresFounder`, the `rational/*` sections, `ReviewsV3`, and
    `PresReviewBeforeInvest` (all still in `src/sections/presentation/`).
  - Retired because it converted poorly (~1.29% appointments, ~2.58% account
    creation). `/offer` now renders the introduction experience from
    `src/pages/offer.astro`, using its own editable copies in
    `src/sections/offer/`.
  - To restore: move this file back to `src/pages/offer.astro` (its relative
    imports already resolve from `src/pages/`).
