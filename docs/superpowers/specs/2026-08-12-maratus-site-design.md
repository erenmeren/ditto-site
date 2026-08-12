# maratus — marketing site design

Date: 2026-08-12
Status: approved (design), pending implementation plan

## What this is

A ground-up redesign of the marketing site under the new product name **maratus**
(previously "ditto"). Three complete, independent art directions are built side by
side so they can be compared as real pages, not as mockups. The shipped site in
`site/` is not touched by this work.

The product does not change. Everything the site claims must stay inside the
code-verified fact list below.

## Constraints carried over from the repo

- Everything tracked in this repo is English-only. Site copy is English, British
  spelling ("colours", "organisation").
- The positioning rule from the 2026-08-03 panel still holds: the platform vision
  enters only as concrete objects ("receipt, ticket, warranty, menu"). The words
  *platform, experience, interaction, programmable, stateless* and any unshipped
  hardware (NFC, camera, scanner) never appear in site copy.
- No build step, no package manager. Plain HTML/CSS/JS served over
  `python3 -m http.server`. External network is limited to Google Fonts, matching
  the current site.
- The page must be readable with JavaScript disabled, and meaningful under
  `prefers-reduced-motion: reduce`. Both are regressions the project has already
  paid to fix once.

### Locked product facts

Every direction states these identically. Wording may differ; substance may not.

- `POST /api/v1/devices/{id}/trigger`, Bearer API key, required `Idempotency-Key`,
  body `{ action: "show_qr", payload: { url } }`.
- Response `202 { id, status: "queued" }`. One credit goes **on hold** at this
  point. Other documented answers: 401, 409, 429.
- The command travels over MQTT to the box; the box displays the QR and acks.
  **The ack settles the credit — paid on show.** Typical ack is "a couple of
  seconds".
- 60 s TTL. No ack in time → the command expires, the hold is released, and a late
  code never appears on screen.
- The QR carries the caller's URL directly. Maratus never fetches, renders, or
  stores what is behind that URL.
- Scanning is free and happens last. It does not settle the credit.
- `POST /api/v1/devices/{id}/pin` exists for durable codes. `GET /api/v1/usage`
  exists. There is no status endpoint and no callback yet — say so plainly.
- Screen layout and branding are pushed org-wide from the admin console, never
  from the caller's request.
- New organisations get a 50-credit starter grant. Per-device plans exist.

## The brand spine

*Maratus* is the genus of the peacock spider. What matters is not the name but the
behaviour it points at: the spider raises an iridescent fan, performs a short,
high-stakes display, then folds it away.

That is the product. The box raises a display, shows a code for a bounded moment,
then returns to idle. The 60-second TTL is the display window. The credit is paid
for the display, not for the scan.

All three directions are built on this one idea — **the display** — and differ only
in how literally they draw it. This is what keeps the site from reading as
templated: the central metaphor is derived from the product's mechanics rather
than applied as decoration.

## The three directions

Each is a complete, standalone single-page site. They share **no** stylesheet,
font stack, palette, or JavaScript. A shared theme would pull them toward each
other and make the comparison worthless. They share only the content spine and the
device photograph.

### A — "The Display" (metaphor led, figure used sparingly)

Deep neutral ground. Iridescence — structural colour, blue/violet/teal shifting
with angle — used rarely and deliberately, never as a background wash. Editorial
typography: a wide grotesk display face against a neutral text face.

The spider appears exactly once, in the hero, as a bespoke SVG drawn in the manner
of a natural-history specimen plate. On scroll it **raises its fan**, and that
motion is tied to the product's display beat rather than running on its own timer.

The scrub-able 60-second timeline from the `redesign/` study is carried here — it
is the strongest existing idea in the repo and belongs to the direction that takes
the display literally.

Intended feel: precise, expensive, slightly uncanny. This is the direction closest
to the "$10K site" brief.

### B — "Maratus" (character led)

An illustrated character with three functional states — idle, displaying, paid —
acting as a guide through the page: it sits on the counter, opens its fan when the
QR appears, and settles against the credit pill when the ack lands.

Warmer palette, softer typography, spring-based micro-interactions.

Intended feel: memorable and unmistakably hand-made. Known risk: a character can
read as toy-like for counter hardware sold to shop owners. Building it is how we
find out whether that risk is real.

### C — "Structural colour" (no figure)

The spider never appears. The identity is pure optics: interference patterns,
diffraction, the way light behaves on the scales of a fan. A generative canvas
field shifts colour with scroll position and cursor. Severe Swiss grid,
monospaced data, dark and high contrast.

Intended feel: a serious hardware/infrastructure company, with one optical
signature layer that is not available off the shelf.

## Page spine (identical content in all three)

1. **hero** — the name, the one-line claim, the object
2. **the object** — what the box physically is, on the counter
3. **the sequence** — trigger → show → ack → scan, with the 60 s window
4. **live demo** — the deterministic fake QR, fired on scroll into view
5. **the request** — the actual API call and its answers
6. **terms and credit** — paid on show, starter grant, plans exist
7. **pilot** — the call to action
8. **footer**

The spine is fixed so the comparison is like for like. How each section is
composed, paced, and voiced is the art director's call.

## Motion system

Motion is implemented in CSS, SVG, and canvas. No animated GIF files are produced
or shipped — the same visual result is sharper and an order of magnitude smaller
as code, and blurry GIFs undercut the quality the brief is asking for.

Rules, applying to all three directions:

- No blanket fade-up on every block. Each motion must be specific to the thing it
  reveals, or it is cut.
- Each direction has exactly **one signature motion** that no template provides —
  A: the fan raise driven by scroll; B: the character's state changes; C: the
  optical field responding to scroll and cursor.
- Custom easing curves only. Bare `ease`, `ease-in-out`, and `linear` are not used
  for anything the eye tracks.
- Real typographic craft: optical sizing where the face supports it, tracking that
  changes with size, hanging punctuation, deliberate measure.
- Asymmetric composition, real empty space, and at least one element that breaks
  the grid on purpose.
- Banned, as reliable markers of generated work: emoji, a row of three
  rounded-corner feature cards, soft gradient blobs used as background
  decoration, stock icon sets, and the generic indigo-to-violet SaaS gradient.
  This is not a ban on violet as a hue — iridescence genuinely runs through
  blue, violet, and teal, and directions A and C depend on that. The
  distinction is physical: colour that behaves like light on a surface is the
  point; colour smeared behind content to fill space is the tell.
- Under `prefers-reduced-motion: reduce`, every direction still tells the whole
  story from its resting state. Inline resting values carry the truth, as the
  current site's storyboard already does.
- With JavaScript disabled, all content is present and readable.

## File layout

```
maratus/
  index.html          chooser page — three directions, links, one paragraph each
  content.md          the locked facts and the section-by-section content spine
  assets/             device photo, favicon — the only cross-direction files
  a/  index.html  app.css  app.js  art/     "The Display"
  b/  index.html  app.css  app.js  art/     "Maratus"
  c/  index.html  app.css  app.js  art/     "Structural colour"
```

`art/` holds that direction's own drawn assets — the illustrator's SVGs for A and
B, generated pattern sources for C. Nothing in `art/` is shared between
directions; the illustrator delivers two distinct drawings, not one reused twice.

A direction may reference `maratus/assets/` and its own directory, and nothing
else. No direction may reference `a/`, `b/`, or `c/` other than its own, so the
three designers can work in parallel without conflicting.

Every page carries `<meta name="robots" content="noindex">` — this tree is a
comparison study, not something to be indexed.

`site/` is not modified. `redesign/` stays where it is as reference.

## Team

Work is split across subagents. Dependencies run left to right.

| Agent | Deliverable | Skills |
|---|---|---|
| copy | Three voices over one fact set; `content.md` | — |
| illustrator | Peacock-spider SVGs: specimen-plate style for A, character with three states for B | algorithmic-art, hand-authored vector |
| designer-A | Direction A end to end | apple-design, emil-design-eng, soft-skill, animate, frontend-design |
| designer-B | Direction B end to end | brand, design-system, ui-ux-pro-max, animate |
| designer-C | Direction C end to end | brutalist-skill, minimalist-skill, algorithmic-art, animate |
| reviewer | Final pass across all three | code-review, review-animations |

`copy` and `illustrator` run first — A and B both depend on the illustrator, and
all three depend on the fact set. The three designers then run in parallel.
`reviewer` runs last.

Each designer owns its own directory and no other, so parallel work cannot
conflict.

## Verification

No direction is called done on assertion. For each:

- Headless Firefox screenshots at the key motion beats.
- The same page with `prefers-reduced-motion: reduce` forced.
- The same page with JavaScript disabled.
- Widths 390px, 768px, 1440px.
- No horizontal page scroll at any width.

The reviewer collects the evidence and reports what actually rendered, including
anything that failed.

## Out of scope

- Deploying anything. Nothing is copied into `site/` or pushed to the `gh-pages`
  branch of `erenmeren/ditto-site` as part of this work.
- A canvas turn. The canvas template engine resolves `{{ }}` paths against a flat
  `renderVals()` object and cannot carry scroll-scrubbed parallax, canvas fields,
  or per-direction JavaScript. This work is a deliberate, noted exception to the
  canvas-first rule; if a direction is chosen, backporting a static record of it
  to the canvas can be decided then.
- Renaming the product anywhere outside `maratus/`. The canvas `brandName` prop,
  `site/`, and `docs.html` keep saying "ditto" until a direction is picked.
- Producing shareable GIF or video assets for Slack, README, or social.
