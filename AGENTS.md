# Aasaan

Independent prototype of a citizen-services app. Not a government app; all data is sample data.

This project does NOT use BoardUI or Tailwind (ignore any parent AGENTS.md that says otherwise).

- Stack: React, TypeScript, Vite, React Router (hash URLs), TanStack Query, CSS Modules.
- Every colour, radius, shadow, motion and type value lives in `src/tokens/tokens.css`. Components use tokens, never literals.
- Visual world: the audit console. A near-black ground (pale grey in light) with one still deep-teal glow at the top, flat surfaces a shade lighter than the ground, rows divided by dotted hairlines, round department-tinted markers, white (ink in light) pill actions, amber for anything worth checking and green for anything confirmed. Geist throughout; labels are sentence case, never uppercase or mono. Home: greeting, a tinted label, the count, a chip, two white quick actions, then the queue as rows. Sheets rise from the bottom edge with their own teal glow and a close button.
- `reference/index.html` is the behaviour and copy baseline. Never edit it. The visual design no longer follows it, so `npm run parity` is a before/after viewer, not a pass/fail gate.
- Copy lives in `src/i18n/strings.ts`, word for word from the reference: sentence case, verb + object buttons, no em dashes, no exclamation marks.
- One filled (primary) button per view, except Home's two quick-action pills. Hover effects only under `(hover:hover) and (pointer:fine)`. Nothing animates on scroll. Reduced motion means fully still.
- UI talks to departments only through `src/data` (hooks in `src/data/hooks.ts`). Outage, cache fallback and the outbox live there, never in components.
- Checks: `npm test`, `npm run e2e`, `npm run parity`.
