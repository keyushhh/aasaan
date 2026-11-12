---
name: wozku-superadmin-revamp
description: MANDATE AND BUILD SYSTEM for the Wozku Super Admin revamp. Load this FIRST in any session, before reading files or answering, whenever the work touches this repo or the super-admin. It carries the redesign mandate, the finished design system in foundation/, the build command, and which phase is next, so nothing has to be re-explained. Use at the start of ANY task touching the super-admin: designing or redesigning a screen, building a prototype, auditing, picking colours or type, writing components, or planning phases. Also use whenever the user mentions super-admin, the admin panel, brand.wozku.com, or any of its screens (dashboard, admins, posts, media, studio templates, configs, form templates, reports, credits, allocation requests, audit log). Prevents the single most likely failure: treating this as a cleanup of the existing screens instead of a ground-up revamp.
---

# Wozku Super Admin revamp

## Rules learned the hard way

- **Every `<button>` needs an explicit `type="button"`.** The default is `submit`, which reloads the page the moment anyone clicks it. 93 buttons in the foundation were missing it.
- **Never animate `display` to swap two elements.** The keyframe flips leave a frame where neither is shown and the control collapses to an empty box. Use an explicit `data-state` attribute and let CSS select on it.
- **In a multi-column grid, place items explicitly.** DOM order fills tracks in order, so an aside written before the main content lands in the *content* column. Set `grid-column` on both, never rely on source order.
- **Verify layout by measuring the columns, not just by checking for overflow.** A completely inverted two-column layout passes an overflow check and a dead-link check while looking obviously wrong.
- **`white-space: nowrap` content ignores `min-width: 0` on its grid parent.** Segmented controls, toggles and chips need their own `max-width: 100%` plus wrapping or internal scroll, or they push the page sideways.

## Start here in a new session

The design system is **finished and lives in `foundation/`**. Never rebuild it, never
redefine a token, never hand-copy CSS between screens.

```bash
cp screens/_template.html screens/<name>.html      # edit the body fragment only
python3 foundation/build.py screens/<name>.html out/<name>.html
```

`build.py` injects `core.css`, `fonts.css`, `sprite.svg` and `shell.html`, then fails loudly on unknown icons, CDN references and hard-coded hex in markup. Output lands in `preview/<name>.html`.

**Every screen gets its own file.** Never build a new screen into an existing one, and never overwrite `preview/foundation.html`.

Builds are fully self-contained: Satoshi, Space Grotesk and JetBrains Mono are all inlined as woff2 data URIs, along with the icon sprite and logo. **Zero external requests.** So `preview/index.html` opens by double clicking it, and `python3 -m http.server 4319 --directory preview` is only for convenience. There is no npm, no node_modules and no build tooling to install.

Check `REDESIGN.md` for the current phase and tick it off when the screen ships.
`CLAUDE.md` carries the short version of all of this and loads automatically.

Ask the user only for genuinely new decisions. Everything already settled is in this
file: palette, type, radius, elevation, icons, motion, the shell, and the component set.

## The mandate, read this before anything else

This is a **REDESIGN and complete overhaul**. Not a cleanup, not an accessibility pass, not a fix-the-buttons pass.

The assignment is to revamp the super-admin into a brand new model.

**The existing UI is evidence, never a template.** When you look at a current screen, you are reading it to learn what the product *does*, never to learn what it should *look* like. Its layout, its component choices, its information hierarchy and its visual language are all anti-reference. They are the thing being replaced.

The failure mode this skill exists to prevent: opening the current screen, keeping its structure, and improving it. That produces a tidier version of a broken product. Do not do it.

### What is preserved and what is replaced

| Preserved | Replaced |
| --- | --- |
| What each screen is for | How it looks |
| The data and its real shapes | How that data is laid out and grouped |
| Functions and permissions that exist | The components those functions are expressed in |
| Route responsibilities | Route structure where it actively harms the task, for example the 88-field modal becoming a page |
| Real content and labels | Wording that is unclear, and every visual decision without exception |

Product truth is sacred. Visual and interaction decisions are all in scope.

## Working rules

1. **Deliverable is a clickable prototype**, not production code. Plain HTML and CSS assembled by `foundation/build.py`, published as an artifact. No CDN, no framework runtime: the sandbox does not reliably execute external scripts. The user is a product designer and hands off to engineers. Never propose edits to live production files as their task.
2. **No live changes, ever.** The audit and all future inspection are read-only. Navigate and read the DOM. Never click toggles, Save, delete, or Approve.
3. **Never open `/super-admin/changeadminlogin/{id}`.** It performs a live session swap in the user's own browser.
4. **One screen at a time, unrushed.** The user has asked for this explicitly. Do not batch screens to look productive.
5. **Black-box.** There is no code access. The working directory holds only planning files. Verify claims against the live site at `https://brand.wozku.com/super-admin`.
6. **No em dashes anywhere.** Not in code, comments, markup, copy, documentation or UI text. Use a comma, a colon, parentheses or a full stop. This applies to every file and every string the product renders.
7. **Comments are one line, or absent.** Write code that does not need explaining. When a comment is genuinely required, because the reason is not visible in the code, it gets **one line and no more**. Never a paragraph, never a block header spanning several lines, never a narrated walkthrough above a function. If one line cannot carry it, the code is wrong, not the comment.
8. **Use the `impeccable` skill** for any design work: new screens, redesigns, critique, layout, polish, accessibility. It is installed at `~/.claude/skills/impeccable` and mirrored into `.claude/skills/`. Operate mode governs every super-admin screen, since the user is completing a task rather than being persuaded.
9. **Use the `ponytail` skill** for every implementation decision. It is vendored into `.claude/skills/` (`ponytail`, plus `-audit`, `-debt`, `-gain`, `-help`, `-review`), and upstream is https://github.com/DietrichGebert/ponytail. Climb its ladder before writing anything: does this need to exist, does the codebase already have it, does the platform do it natively, can it be one line. The shortest working diff wins, but only after the problem is actually understood.

## Visual foundation

The shared Wozku brand, captured in full in `foundation/core.css`. Adopt it wholesale. This is the brand, not a suggestion.

### Type

| Role | Family |
| --- | --- |
| Display and headings | Space Grotesk |
| Body and UI | Satoshi (local woff2, 300 / 400 / 500 / 700 / 900) |
| Mono | JetBrains Mono. Reserved for things that are literally code or measurement: action keys, hex values, token names. **Not** badges, chips, table headers or UI labels, which all use Satoshi. |

### Colour, dark

Brand green ramp (occupies the `violet-*` slots in the source):
`#ecfdf5` `#d1fae5` `#a7f3d0` `#6ee7b7` `#34d399` `#10b981` `#059669` `#047857` `#022c22`

Neutral ramp (occupies the `emerald-*` slots):
`#f2f2f2` `#e2e2e2` `#c8c8c8` `#a8a8a8` `#8a8a8a` `#1a1a1a`

| Token | Value |
| --- | --- |
| `--surface-canvas` | `#0a0a0a` |
| `--surface-raised` | `#111111` |
| `--surface-panel` | `#1a1a1a` |
| `--surface-float`, `--surface-dialog` | `#1f1f1f` |
| `--surface-well` | `#2a2a2a` |
| `--border`, `--input` | `#2a2a2a` |
| `--foreground` | `#f2f2f2` |
| `--muted-foreground` | `#a8a8a8` |
| `--ring`, focus | `#34d399` |
| `--destructive` | `#ef4444` |
| `--ink` | `#ffffff`, used only as low-alpha washes |

Light variant darkens the green to `#059669` and `#047857` and moves surfaces to `#fbfbfb`, `#ffffff`, `#f5f5f5`. Dark ships first, light stays structurally supported from day one.

### Radius, ours alone

The shared brand is square at `0px`. **Super Admin is not.** Same token names, different values, so components port by swapping one block.

| Token | Value |
| --- | --- |
| `--r-inner` | `8px` |
| `--r-float` | `12px` |
| `--r-surface` | `16px` |
| `--r-pill` | `9999px` |

Never name another Wozku product in a deliverable, and never show a side-by-side against one. State it in words: shared token names, our own values.

The shared brand flattens shadows (`--lift-sm: 0 0 #0000`) and disables the press scale (`--press: 1`). **Super Admin does not.** Decided 2026-09-10: keep the three-step elevation scale, because soft corners with zero elevation read as unfinished.

| Token | Value |
| --- | --- |
| `--lift-sm` | `0 1px 2px rgba(0,0,0,.5)` |
| `--lift-md` | `0 1px 2px rgba(0,0,0,.5), 0 12px 32px -12px rgba(0,0,0,.7)` |
| `--lift-lg` | `0 2px 4px rgba(0,0,0,.5), 0 24px 48px -16px rgba(0,0,0,.8)` |

Press scale stays live too, at `0.95` on `--d-micro` with `--e-back`.

## Logo

Source files live in `assets/logo/`: `wozku_logo-black.svg` and `wozku_logo-white.svg`. Those are for **external use only**, such as decks, Figma and engineering handoff.

**In the product, never reference those files.** Both marks are inlined in `foundation/sprite.svg` with every fill rewritten to `currentColor`:

| Symbol | viewBox | Use |
| --- | --- | --- |
| `#wozku-lockup` | `0 0 2064 640` | Top bar, drawer header, anywhere the wordmark fits |
| `#wozku-mark` | `0 0 640 640` | Favicon, avatar, collapsed rail, tight squares only |

```html
<a class="brand" href="/" aria-label="Wozku">
  <svg class="logo"><use href="#wozku-lockup"/></svg>
</a>
```

`.logo` is `height:19px; width:auto; aspect-ratio:2064/640; fill:currentColor`, and `.brand` sets `color:var(--fg)`. **One asset serves both themes**: the lockup resolves to `#f2f2f2` in dark and `#171717` in light with no file swap, no duplicate markup and no theme-conditional CSS. Do not add a second `<img>` and toggle it, and do not hard-code white or black on the logo.

Never place the old placeholder back: the green circle with a "W" and a text "Wozku" beside it is gone, replaced by the real lockup.

## Icons

**Superseded 24 Sep 2026: Moving Icons (https://movingicons.dev) first, Heroicons outline (https://heroicons.com) for the gaps, generated by `npm run icons`. See CLAUDE.md. The Feather notes below are history.**

~~Feather only.~~ https://github.com/feathericons/feather

**Inline the SVG paths, never load the CDN.** Extract the real Feather paths into one `<symbol viewBox="0 0 24 24">` sprite at the top of the document, then reference with `<svg class="i"><use href="#i-name"/></svg>`. Presentation lives in CSS: `.i{fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}` with 14, 16, 19 and 22px size variants.

Extract the sprite from the library source rather than hand-copying:

```bash
curl -s https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.29.2/feather.min.js -o /tmp/f.js
# then regex each `name:'<paths>'` into <symbol id="i-name" viewBox="0 0 24 24">...</symbol>
```

Two failure modes, both already paid for:

1. **`<g id>` inside `<defs>`** carries no viewBox, so 24px artwork renders into a 16px box and every glyph is cropped. Use `<symbol viewBox>`, never `<g>`.
2. **A CDN `<script>`** is not reliable in the published artifact sandbox. Icons rendered locally and were missing or late in the artifact. Inline everything.

Never hand-author icon SVGs. If a glyph is missing from Feather, pick the nearest Feather glyph rather than drawing one, so stroke weight and optical size stay uniform.

Verify any new icon name against the library before shipping it, since an invalid name renders nothing:

```bash
curl -s https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.29.2/feather.min.js | grep -qE "[{,]\"?NAME\"?:'<" && echo ok || echo MISSING
```

## Motion

Reference the user chose: https://beui.dev/components/motion. That page ships no source, so the effects are reimplemented from scratch on our own tokens.

Everything animates from these eight tokens. No per-screen improvisation.

| Token | Value | Used for |
| --- | --- | --- |
| `--d-micro` | 120ms | Press, icon swap, tap feedback |
| `--d-fast` | 180ms | Hover, colour, focus ring |
| `--d-base` | 240ms | Menus, tabs, toggles, reveals |
| `--d-slow` | 340ms | Text reveal, check draw |
| `--d-panel` | 420ms | Drawer, modal morph, counters |
| `--e-out` | `cubic-bezier(.22,1,.36,1)` | Standard |
| `--e-back` | `cubic-bezier(.34,1.56,.64,1)` | Press and pop-in overshoot |
| `--e-spring` | 29-stop `linear()` | Tabs, toggles, counters |

**Author every animation in CSS.** The artifact sandbox cannot be relied on to execute page scripts, so a page whose content or motion depends on JS can render empty. Interactive demos use checkbox and radio state with sibling selectors, not event handlers. JavaScript is a progressive-enhancement layer only: the page must be complete and correct with the script tag deleted.

Only three effects genuinely need JS, and each is labelled as such in the UI: magnetic cursor-follow, the View Transition circle wipe, and live digit updates.

Implemented and living in the foundation artifact: spring press, stateful button with drawn check, magnetic button, expanding CTA, hold to confirm, chromatic sweep, spring pill tabs, spring underline tabs, select unfold with staggered items, morphing modal with blur cross-fade, popover scale-from-origin, sidebar fold to icon rail, count-up, rolling digit ticker, error shake, success check draw, per-character text reveal, shimmer, skeleton, four loader variants, row stagger, range slider thumb, View Transition theme wipe, live pulse.

### Charts

Five forms live in the foundation, ported from Spectrum UI: **histogram** (binned, with p50/p95/p99 pins), **bar**, **line**, **area** and **donut**, plus loading, empty and error states that reserve the same frame height.

Registry is `https://ui.spectrumhq.in/r/<type>-chart.json`. **Only the histogram is dependency free**; bar, line, pie and price all pull `recharts` + `framer-motion`. We cannot ship a framework runtime, so every mark is inline SVG. Their `EASE` is `cubic-bezier(.22,1,.36,1)`, already identical to `--e-out`, and their keyframes map onto ours: rise (`scaleY 0>1`), draw (`stroke-dashoffset`), fade, enter, grow, ping, sk-pulse.

Carried over: bars at `rx` 4 (2.5 when thin), 2px lines, the **text halo** (`paint-order:stroke` with a 3.5px stroke in the surface colour) so labels stay readable over marks, mono headers at 12px, and `intensityColor` mixing a hue into the track.

Rules, from the `dataviz` skill and enforced here:

- **One hue for magnitude.** A bar chart of one measure across categories takes its identity from the axis, not from colour. Categorical hues are only for overlapping series, assigned in fixed order and never cycled.
- **Never a dual axis.**
- **A single series gets no legend**; the title names it and the endpoint carries the value. Two or more always get one.
- **Leave room in the viewBox for the outermost labels and marks.** An endpoint dot at the plot's last x overhangs by its radius; inset the plot instead of clipping. Ours runs 0 to 620 inside a 640 viewBox for exactly this reason.
- Text wears text tokens, never the series colour. Digits are tabular. Grid and axes stay recessive.
- Status colours are reserved and never become a sixth series.

Chart data in the foundation is real: 20,969 shares, 427,228 reach, 337 templates split 317/19/1, 217 admins.

### Ported components and where the source lives

Both registries are public JSON, no login needed. The docs pages need one; the registry does not.

| Component | Source |
| --- | --- |
| Tree nav rail | `https://ui.spectrumhq.in/r/tree-nav.json` |
| Toast stack | `https://ui.spectrumhq.in/r/toast-stack.json` |
| Checkbox, radio, tooltip, theme toggle, file upload | `https://beui.dev/r/<name>.json` |

beui ships its motion tokens in `ease.ts`. Their springs, converted to CSS `linear()` from the actual physics rather than guessed:

| Spring | Physics | CSS token | Duration |
| --- | --- | --- | --- |
| `SPRING_PRESS` | k500 c30 m0.6, zeta 0.866 | `--e-press` | 260ms |
| `SPRING_LAYOUT` | k360 c32 m0.6, zeta 1.089 | `--e-layout` | 244ms |
| `STACK_SPRING` | k420 c34 m0.75, zeta 0.958 | `--e-stack` | 287ms |
| Tooltip spring | k380 c30 m0.7, zeta 0.92 | `--e-tip` | 303ms |

`EASE_OUT` is `cubic-bezier(.16,1,.3,1)`, bound to `--e-beui`.

To convert a spring: omega0 = sqrt(k/m), zeta = c/(2*sqrt(k*m)), then sample `1-e^(-zeta*w0*t)(cos(wd*t)+(zeta*w0/wd)sin(wd*t))` over roughly `6.5/(zeta*w0)` seconds into a 24-stop `linear()`. Never eyeball a spring as a cubic-bezier.

Component specs worth not re-deriving:

- **Checkbox** 20px, radius 6, border 2. Tap scale 0.92 on the press spring. Mark scales 0.5 to 1 and unblurs over 160ms, and the tick path draws by `stroke-dashoffset` over 300ms with a 40ms delay.
- **Radio** 20px circle, border 2. Inner dot scales from 0 on the layout spring.
- **Tooltip** 8px gap, 120ms open delay, opens from opacity 0 / scale 0.9 / blur 5px / 8px offset toward the trigger; opacity 140ms, filter 180ms, position on the tooltip spring. Closes in 120ms to scale 0.94 and blur 3px.
- **Toast** enters opacity 0 / y 22 / scale 0.96 / blur 10px on the stack spring; exits to x 32 / scale 0.96 / blur 8px over 180ms.
- **Theme toggle, circle-blur variant.** `::view-transition-new(root)` runs 700ms `cubic-bezier(.4,0,.2,1)` from `clip-path: circle(0% at var(--vt-origin))` with `blur(8px)` to `circle(150%)` and `blur(0)`; `::view-transition-old(root)` gets `animation:none`. Set `--vt-origin` from the clicked control's centre before calling `startViewTransition`.
- **File upload** is beui `attachment-upload`, not the simpler `file-upload`. Dropzone is 208px min-height at 32px radius, with a **dashed inner panel inset 8px at 24px radius** so the dashes never touch the outer corner. The 44px icon tile lifts 4px, scales 1.08 and inverts to `foreground` on hover or drag. Rows are 56px min-height at 16px radius holding an inner 12px panel. **Progress is a full-row background wash scaling from the left over 900ms, not a hairline bar.** Rows arrive on the layout spring at 55ms intervals, and the 36px trailing slot swaps between remove, uploading, complete and retry.

**Upload lifecycle** (`UPLOAD_PROGRESS_MS 900`, `UPLOAD_COMPLETE_HOLD_MS 1000`, `REMOVE_PENDING_MS 420`):

| State | Trailing slot | Row |
| --- | --- | --- |
| uploading | **empty spacer**, never a spinner | green wash scales from the left, **linear**, with a 2px leading edge |
| complete | green check, held 1000ms | wash held full |
| idle | remove (X) | no wash |
| failed | retry, destructive | red wash held |
| removing | spinner, 420ms, then the row leaves | wash held |

The spinner belongs to **removing only**. Putting one on uploading is wrong and, with no lifecycle behind it, spins forever.

**Progress fills are linear, never eased.** An ease-out curve like `cubic-bezier(.16,1,.3,1)` is 95% complete by 400ms of a 900ms animation, so the bar appears to snap full and reads as a solid colour rather than progress. Determinate progress represents a rate, so the timing function must be `linear` and slow enough for the leading edge to be legible; ours runs 1600ms (`--d-upload`). Easing curves are for things that move, not for things that measure.

**Bubble slider** (`beui.dev/r/range-slider-bubble.json`). Geometry: 80px wrapper with 20px padding, 8px track, 20px thumb with a 2px border scaling 1.25 on grab, 48px hit area, bubble 24px above the track at 12px radius with a rotated square tail.

The lean is driven by the velocity of the **SPRING_GLIDE-smoothed position** (k700 c50 m0.5), never the raw input value. This matters: between input events the raw velocity is zero, so the lean collapses and the bubble barely tilts. The smoothed value keeps moving, which sustains it. Then SPRING_TILT (k260 c22 m0.4) maps `-velocity/320` to lean, and `tilt = lean*16deg`, `squash = 1+|lean|*0.18`, `stretch = 1-|lean|*0.12`, origin bottom.

Both springs are integrated per frame in JS because velocity cannot be expressed in CSS. The slider is a real `<input type="range">` underneath, so it stays functional and accessible with the script removed; only the bubble physics are enhancement.

### beui theme layer

`beui.dev/docs/theme` is installed as **aliases onto the Wozku palette, not as a replacement**. beui's own `--accent` is cyan and its dark surfaces are `#151515` / `#1c1c1c`, which would repaint the brand. Instead the beui token *names* resolve to Wozku values, so any beui component pasted in works unchanged:

`--ease-out` `--ease-in-out` `--ease-drawer` `--border-strong` `--accent-fg` `--danger` `--success` `--warning` `--neon` `--violet` `--glass-bg` `--glass-border` `--glass-strong-bg` `--glass-thin-bg`

Utilities carried over verbatim: `.glass` (20px blur, 160% saturate, inset highlight), `.glass-strong`, `.glass-thin`, `.scrollbar-hide`, `.mask-radial-fade`, `.mask-b-fade`. Toasts use the real glass recipe.

Two mistakes worth not repeating:

- **Never scope a shared control class to one parent.** `.rm` was written as `.frow .rm`, so the same button inside a toast had no styles at all and rendered with the browser's default chrome. Shared controls get a bare class.
- **A bar pinned to the bottom edge needs `overflow:hidden` on its rounded parent**, or it squares off the corners it sits in.

Deliberately excluded, being marketing and mobile-consumer patterns that cost accuracy in an admin: Tilt Card with cursor glare, Wheel Picker, Cylinder Carousel, Bottom Sheet. The user has been told and can ask for them.

### Tree nav rail

The drawer navigation is a port of `spectrumui/tree-nav`. Source is public at
`https://ui.spectrumhq.in/r/tree-nav.json` (the docs page needs a login, the registry JSON does not).

Geometry, verified against the live component: row height 32, gap 2, gutter 24, rail x 10, marker 7 rotated 45 degrees, dot 4, row padding 12, text 13px, row radius 8.

Motion: one shared centre value drives the accent run scaleY, the diamond marker Y and the row background Y. Original uses a Motion spring at `visualDuration .22 / bounce 0`, so critically damped with no overshoot; the CSS equivalent is `--d-glide: 220ms` with a 19-stop `linear()` fitted to `1-(1+wt)e^(-wt)`. Opacity fades separately at 120ms. Hover retargets, leaving springs back to the active row.

**`--c` and `--vis` must be registered with `@property` as `<number>`.** Unregistered custom properties do not interpolate, so a `translate` derived from them jumps or drifts instead of gliding. Register them, transition `--c` on the container, and let the children read it each frame. That also mirrors the original's single-motion-value architecture.

Rows are selected with `:has(> li:nth-of-type(k):hover)`, which keeps the whole thing script free. Row centre is `(k-1)*34 + 16`.

**The active row's resting state is a `rest-N` class, never an inline `--c`.** An inline custom property outranks the `:has()` hover rules and freezes that tree completely: it renders but never responds to the pointer. This has now broken twice, both times because a generator wrote the resting value inline. Specificity: `.tree:has(> li:nth-of-type(k):hover)` is 0,3,1 and beats `.tree.rest-N` at 0,2,0. JS that tracks the active section must set `tree.className = 'tree rest-N'`, not `tree.style.setProperty('--c', ...)`.

**Scroll-spy has two cases people forget.** The URL hash must follow the section in view via `history.replaceState` (never `pushState`, or scrolling floods the back button), and the final section can never win an IntersectionObserver ratio test because the page runs out of room to scroll it into the band. Detect the bottom explicitly and force the last section active.

**Never lock background scroll by clipping the scroll container.** `overflow:hidden;height:100vh` on the page wrapper discards the scroll offset, so opening the drawer throws the reader back to the top. Use `overscroll-behavior:contain` on the drawer instead and let the background stay where it is.

The rail starts **8px above the first row centre**, not at it. Anchoring exactly on the centre makes the accent run compute to zero length whenever the marker sits on row one, so that group renders with no green at all while every other group shows a line. 8px is still inside the 32px row, so it does not hang above the first icon. Run scale is `(--c - 8) / (--end - 8)`.

Rules that hold regardless: motion conveys state, never decoration. Every looping animation stops under `prefers-reduced-motion`, which is already wired globally. Count-up runs once on first paint, never on re-render. Row stagger caps at 12 rows then goes instant.

## The shell

Ported from `src/components/shell/admin-shell.tsx`. The user chose to keep a top bar, and this pattern delivers that while removing dropdowns entirely, which is what fixes the current submenu overflow.

- Top bar 48px, inner content capped at 1280px and centred, bottom border `--ink` at 6 percent, background `--sink` at 14 percent
- Left: 32px hamburger opening a 240px left drawer, overlay `black/40` with 2px backdrop blur. Brand mark, then breadcrumbs behind a left divider
- Centre: dead-centred 280px search button with a `⌘K` keycap
- Right: utility slot, then account menu
- Hover: `--ink` at 5 to 6 percent as a background wash, 150ms on background, colour and scale, plus a small active press
- Drawer items: 36px, icon then label then optional count badge. Active is white at 10 percent, an inset ring, and the icon in brand green
- Primary and secondary groups split by a hairline, mapping onto the 13 routes in 3 groups

## Baseline being replaced

Audited 2026-09-10, scored **3/20 Critical**. Full report:
https://claude.ai/code/artifact/5a8290ba-45d4-41ad-b926-1d264c10266b

Root cause is structural, not aesthetic: 1,087 `!important` declarations across four competing stylesheets, DataTables' Bootstrap 4 theme on a Bootstrap 5 page, and four distinct design languages shipping at once. Nobody chose the current look. It is whatever won the specificity war.

Numbers worth keeping in mind, because the revamp is measured against them: 23 background colours, 13 text colours, 16 font sizes, 12 radii, 28 breakpoints, 0 `<h1>`, 0 landmarks, 114 of 184 inputs unlabelled, 50 unnamed icon-only controls, 23 contrast failures, 106 touch targets under 24px.

The three known worst offenders, all of which must be redesigned rather than patched:

1. **Credit System Settings** stores booleans as free-text inputs containing the typed word `Enabled`, with eight per-row Save buttons. These flags hard-block admins.
2. **The admin settings modal** is 88 fields across 24 tabs behind an unlabelled hamburger, with duplicated DOM panes and repeating Settings and History sub-tabs.
3. **Delete and impersonate** sit adjacent as unlabelled icons on every admin row, one click each, no confirmation.

## Phases

Tracker with checkboxes and the full screen inventory is `REDESIGN.md` in the repo root.

| Phase | Scope |
| --- | --- |
| 00 | Foundation: tokens plus a component sheet showing every element in every state |
| 01 | Shell: top bar, hamburger drawer, page header, breadcrumbs |
| 02 | Table primitive: one component covering nine screens |
| 03 | Dashboard: currently two other pages stacked, rebuild as a needs-attention surface |
| 04 | Admins, and breaking up the 88-field modal |
| 05 | Credits cluster, five screens, highest operational risk |
| 06 | Reports, three tabs onto one pattern |
| 07 | Media, Studio Templates, Configs, Form Templates |

Phases 00 to 02 are order-locked. Each removes work from every phase after it. Phases 03 to 07 can be reordered around the release calendar.

## Design skills to reach for

`.claude/skills/` holds 36 copied design skills. The ones that actually apply here:
`impeccable` (Operate mode, plus its layout, clarify, harden and adapt playbooks), `redesign-existing-projects`, `ui-ux-pro-max`, `design-system`, `accessibility`, `visual-redesign`.

Operate mode governs every screen: the user is in a task, so scanability, consistency and familiarity outrank expression. Brand lives in precise details, never in decoration.
