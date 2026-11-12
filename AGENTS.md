# Aasaan

Independent prototype of a citizen-services app. Not a government app; all data is sample data.

This project does NOT use BoardUI or Tailwind (ignore any parent AGENTS.md that says otherwise).

- Stack: React, TypeScript, Vite, React Router (hash URLs), TanStack Query, CSS Modules.
- Every colour, radius, shadow, motion and type value lives in `src/tokens/tokens.css`. Components use tokens, never literals.
- Visual world: warm-neutral surfaces with shadows tinted to them, one desaturated lime accent for the main action and selection, Geist (Geist Mono for reference numbers, Mukta for Devanagari). Hero cards and sheets use a double bezel (`.shell` > `.core`, concentric radii). Primary actions carry a trailing icon disc (`trail`). Department colours are squircle markers only. A faint fixed grain sits over everything.
- `reference/index.html` is the behaviour and copy baseline. Never edit it. The visual design no longer follows it, so `npm run parity` is a before/after viewer, not a pass/fail gate.
- Copy lives in `src/i18n/strings.ts`, word for word from the reference: sentence case, verb + object buttons, no em dashes, no exclamation marks.
- One filled (primary) button per view. Hover effects only under `(hover:hover) and (pointer:fine)`. Nothing animates on scroll. Reduced motion means fully still.
- UI talks to departments only through `src/data` (hooks in `src/data/hooks.ts`). Outage, cache fallback and the outbox live there, never in components.
- Checks: `npm test`, `npm run e2e`, `npm run parity`.
