## Tech Stack

- **Framework**: Astro 5 (SSR mode, `output: "server"`) with TypeScript
- **Hosting**: Netlify (adapter: `@astrojs/netlify`, `functionPerRoute: true`)
- **Styling**: Scoped CSS with CSS variables defined in `src/styles/global.css` — no Tailwind
- **Animations**: GSAP (marked as external in Netlify adapter config)
- **Validation**: Zod (request body schemas in `src/lib/schemas/`)
- **Database**: Supabase (analytics/tracking data)
- **Content**: MDX for blog articles via Astro Content Collections
- **Testing**: Vitest (unit tests in `src/lib/__tests__/`)
- **Linting**: ESLint (flat config) + Prettier + `eslint-plugin-astro` + `eslint-plugin-unused-imports`
- **CI**: GitHub Actions on PRs to `main`

## Project Structure

```
src/
├── components/    # Reusable UI pieces (Header, Footer, FormWebinar, BaseHead, etc.)
├── sections/      # Large page sections (Herobox, FAQ, Calculator, etc.)
├── pages/         # Pages (.astro) + API routes in pages/api/
├── layouts/       # MainLayout, Page, BlogPost
├── lib/           # Utilities: formHelpers, supabase, notifySlack, getRequestCountry
│   ├── schemas/   # Zod schemas for API request validation
│   └── __tests__/ # Vitest unit tests
├── styles/        # global.css (CSS variables system)
├── content/       # MDX articles collection
└── middleware.ts  # Security headers (X-Frame-Options, CSP)
netlify/
└── edge-functions/  # geo-block.js (US-only gating on registration routes)
```

**Key distinctions:**
- `components/` = reusable across pages (Header, Footer, form components)
- `sections/` = large, page-specific blocks composed into pages
- `pages/api/` = server-side API routes (all use `export const prerender = false`)

## Code Conventions

### Naming
- **Components & Sections**: PascalCase `.astro` files (e.g., `FormWebinar.astro`, `HeroboxV2.astro`)
- **Pages**: kebab-case (e.g., `about-us.astro`, `webinar-follow-up.astro`)
- **Utilities**: camelCase `.ts` files (e.g., `formHelpers.ts`, `notifySlack.ts`)
- **Schemas**: kebab-case with `.schema.ts` suffix (e.g., `create-account.schema.ts`)

### Astro-only components
- No React, Vue, or other UI frameworks — everything is `.astro` files
- Client-side interactivity uses vanilla `<script>` tags or GSAP

### CSS
- Scoped `<style>` blocks in `.astro` files — styles do not leak between components
- Global design tokens live in `src/styles/global.css` as CSS custom properties
- Responsive breakpoints: `600px` (mobile/tablet), `1136px` (desktop), `1920px` (large screens)

### TypeScript
- `strictNullChecks: false` in tsconfig
- `@typescript-eslint/no-explicit-any` is a warning, not an error
- Environment variables accessed via `import.meta.env.VARIABLE_NAME`
- Public env vars prefixed with `PUBLIC_` (Astro convention)

## Writing Style

- **Never use em-dashes (`—`)** anywhere: in user-facing copy (page content, headlines, subtitles, CTAs), in code comments, in commit messages, in PR descriptions, or in chat responses. Use a period, comma, colon, or parentheses instead, or split into two sentences.
  - Bad: `Predictable income from tangible investments — exactly what you came to see.`
  - Good: `Predictable income from tangible investments.`
  - Bad: `Scoped CSS with CSS variables — no Tailwind`
  - Good: `Scoped CSS with CSS variables. No Tailwind.`

## Git Conventions

- **Commit messages**: Present-tense imperative verb, 60-80 characters
  - Good: `Add 5-second timeout to Senja API fetch`
  - Good: `Remove unnecessary Bash commands from settings`
  - Verbs: Add, Enhance, Refactor, Implement, Remove, Fix, Update
- **Main branch**: `main`
- **PR workflow**: All PRs target `main`, CI must pass before merge

## Quality Checks

**Only run quality checks when preparing changes to go live (before committing or opening a PR).** During prototyping, experimentation, or testing ideas — skip linting/formatting and focus on iterating fast.

**Before committing, run:**
```bash
npm run check    # format:check + lint + typecheck (all three)
npm run test     # Vitest unit tests
npm run build    # SSR build compiles successfully
```

**CI runs all of the above on every PR to `main`.** A failing step blocks the merge.

**Individual commands:**
- `npm run format:check` — Prettier formatting (fix with `npm run format`)
- `npm run lint` — ESLint errors/warnings (fix with `npm run lint:fix`)
- `npm run typecheck` — `astro check` for type errors
- `npm run test` — Vitest unit tests

## Error Handling Patterns

### API routes (`src/pages/api/`)
Every API route follows this structure:
1. `export const prerender = false` — ensures server-side rendering
2. **Zod validation** — parse request body with a schema from `src/lib/schemas/`
3. **Honeypot check** — reject if hidden field (`website` or `company`) is filled
4. **Geo check** — `getRequestCountry()` blocks non-US requests (fail-open when no geo data)
5. **Business logic** — forward to external API or process data
6. **Slack notification** — `notifySlack()` on failures (never throws, silently fails if webhook missing)
7. **try-catch wrapper** — top-level catch returns generic 500 + notifies Slack

### External API calls
- Use `AbortController` with 5-second timeout on external fetches
- Graceful degradation when external services are unavailable
- Slack notifications on upstream failures (include status code + truncated response)

## External Services

| Service | Purpose | Env Variable(s) |
|---------|---------|-----------------|
| Go High Level (GHL) | CRM — contact creation, lead tracking | `GHL_API_KEY` |
| WebinarKit | Webinar scheduling and registration | `WEBINARKIT_API_KEY` |
| Meta Conversions API | Server-side Facebook event tracking | `META_ACCESS_TOKEN`, `META_TEST_EVENT_CODE` |
| Senja | Testimonial aggregation | `SENJA_API_KEY` |
| Supabase | Analytics data storage | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| Slack | Error notifications | `SLACK_WEBHOOK_URL` |
| RedTrack | Ad attribution tracking | (proxied via `/rtk/*` in netlify.toml) |
| PostHog | Product analytics | (client-side) |
| GA4/GTM | Google Analytics | (client-side) |

## Working with the Developer

The developer is a junior learning to code. The goal is understanding, not just getting things done.

- Before making any change, explain **what** the change does and **why** it works in plain language
- Use analogies and step-by-step traces when explaining bugs — walk through the problem like a teacher
- When something breaks, explain the root cause before jumping to the fix
- After fixing, explain what was wrong and how the solution addresses it
- Never make a change silently — every edit deserves a plain-language explanation
- When asked a question (e.g. "why does this…", "what happens if…"), **explain first, do not touch code** until explicitly told to
- The developer wants to understand what is going on at every step — avoid "vibe coding" where changes appear without explanation

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately – don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution

### 3. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 4. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes – don't over-engineer
- Challenge your own work before presenting it

### 5. Collaborative Bug Fixing
- When given a bug report: investigate first, then explain what's broken and why
- Propose a fix with clear reasoning — do not apply changes until the user approves
- Walk through the fix step by step so the user understands the root cause and the solution
- After fixing, verify together — run tests, check behavior, confirm the issue is resolved

## Task Management

1. **Verify Plan**: Check in before starting implementation
2. **Track Progress**: Mark items complete as you go
3. **Explain Changes**: High-level summary at each step

## Local Documentation

- `docs/analytics/posthog.md` — PostHog implementation reference (events, person properties, questions page values)
- `docs/analytics/ga4.md` — GA4/GTM implementation reference (dataLayer events, triggers, properties)
- When making changes related to PostHog tracking (adding/removing/modifying events, changing questions, updating person properties), **update `docs/analytics/posthog.md`** to keep it in sync
- When making changes related to GA4 tracking (adding/removing/modifying dataLayer events, changing GTM triggers, updating event properties), **update `docs/analytics/ga4.md`** to keep it in sync
- This folder is gitignored — it stays local, never pushed to GitHub

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
