# maratus — review pass

Written after Task 8 of `docs/superpowers/plans/2026-08-12-maratus-site.md`, on
the three finished directions and the chooser. Everything below was measured,
not remembered: 20 full-page screenshots from `tools/shoot.sh` (four targets ×
plain-1440/768/390, reduced-motion, no-JS), one scrolled full-page capture per
direction from `tools/scrollshot.py walk`, the overflow probe at five widths, and
`tools/check.sh` on each direction.

## Harness results

| Check | a | b | c |
|---|---|---|---|
| `check.sh` | OK | OK | OK |
| Horizontal overflow, 390–1920 | none | none | none |
| Elements stuck at `opacity: 0` after a full scroll walk | 1 | 3 | 0 |
| Elements clipped horizontally by their own box | 1 | 1 → 0 | 1 |

`check.sh maratus` — which lints the chooser and all three directions in one
pass — is also OK.

**The stuck-opacity counts are not bugs.** Named, they are A's
`g.device__idle` and B's `.screen-idle`, `.mar-layer.mar-idle` and
`.mar-layer.mar-display`: the hidden halves of two- and three-state crossfades
(idle screen versus code, and the character's idle/displaying/paid layers). The
walk leaves each demo in its settled state, so the other states are correctly
invisible. No reveal is stranded in any direction.

**The clipped-box counts, named:** A's `section.plate.hero` runs 58 px past its
own edge under `overflow-x: clip` — the specimen plate bleeding off the page on
purpose, and the reason A no longer scrolls sideways. C's `#demo .grid` runs
49 px over because the device elevation is drawn to the page edge, also on
purpose. B's was real and is fixed below.

## Facts

All five load-bearing claims survive all three rewrites, checked line by line in
each `index.html`: paid on show, the hold released and the credit returned when
the box cannot display, the 50-credit starter grant, that per-device `flat` and
`base_usage` plans also exist, and that we never see what is behind the link.
No direction prints a duration. Each also carries the `409 device_offline`
before-any-hold nuance, `pin` spending immediately, and the missing status
endpoint stated plainly rather than skipped.

## A — "The Display"

**Works.** The strongest of the three at 1440. The specimen plate is a real
drawing, the iridescence appears only inside the fan and never as a background,
and the four beats carry `CREDIT HELD / HELD / SPENT / SPENT` as legible state
rather than decoration. One signature motion — the fan raising against scroll —
and no blanket reveal anywhere: eight transitions in the stylesheet, zero
keyframes. The paper-ground pilot section at the end is the only tonal switch on
the page and it lands.

**Does not work, or is at least a decision to make on purpose.** The empty left
column beside "One call." and "Paid on show." is a third of the page at 1440 —
deliberate asymmetry, but it is the same move three sections running. The
"no display, no charge" pull-quote and the paragraph beside it state the same
fact twice within one screen.

**With JavaScript off:** complete. The plate, the fan, all four beats, the QR
and the request literals are all present, because the drawing is SVG and the
demo's resting state is the whole story. This is the best-behaved of the three.

**Fixed this pass:** nothing. Nothing was found that needed it.

## B — "Maratus"

**Works.** Warmest and the easiest to read aloud — "hand it over, don't print
it" does more work than either sibling's hero line. The character has three
genuinely functional states rather than an idle loop, and it appears in the
demo doing the thing the copy describes. The `50` starter-credit roundel is the
clearest treatment of that fact in any direction.

**Does not work.** The stated risk is real, not hypothetical: at 1440 the
character reads toy-like next to counter hardware sold to shop owners, and it is
the first thing on the page. Composition is loose in the lower half — roughly a
quarter-screen of dead space between the demo legend and "For developers", and
the developer section's right column carries a large gap between the code block
and the answers table. Judge B on the hero and the dark band; that is where it
is actually good.

**With JavaScript off:** complete. Character, QR and all copy present.

**Fixed this pass:** `pre.code` was clipping. The block sits in a half-width
column — 532 px at 1440 — so the JSON body line ran past its right edge and was
reachable
only through an overlay scrollbar that never appears in a screenshot, in print,
or under a finger that is not already dragging. The stylesheet already wrapped
those literals below the mobile breakpoint, with a comment saying exactly why;
that rule is now the base rule (`maratus/b/app.css`, `.code`). Re-measured:
zero clipped elements, no horizontal overflow at any width, `check.sh` still OK.

## C — "Structural colour"

**Works.** The most disciplined page of the three and the most convincing as
infrastructure: severe grid, monospaced ledger, and every fact in the credit
table stated as a state rather than a sentence. The optical field is genuinely
generated — thin-film interference, captioned as a plate with a seed — and it
returns once more as a band later in the page, which is the right amount. Under
`prefers-reduced-motion` it draws a single still frame instead of stopping dead,
so the identity survives with motion off.

**Did not work, now fixed.** It broke one of the spec's own motion rules.
`app.js` applied the `.rv` arrival — `opacity` plus `translateY(14px)` — to
nineteen selectors covering effectively every block on the page. The spec says a
motion must be specific to the thing it reveals or be cut, and a 14 px drift on
every heading, table, figure and form is the blanket fade-up the rule exists to
prevent. The safety work around it was careful — three independent guarantees
against a stranded `opacity: 0`, which is why the walk found nothing hidden —
but careful is not the same as earned.

The list is now three selectors: `.plate--hero`, `.beats`, `.plate--band`. The
two plates are drawn rather than laid out and would otherwise pop in the frame
the canvas becomes ready, so their arrival is the drawing arriving; the beats
are where the credit changes state. Everything else on the page is simply
present. The per-section stagger went with it — three arrivals, one per section,
have nothing to stagger against. Re-measured: exactly three elements carry
`.rv`, all three resolve to `.in` during a scroll walk, nothing is left hidden,
no horizontal overflow, `check.sh` OK.

**With JavaScript off:** all content is present and readable, and the hero
recomposes to a full-twelve-column block rather than leaving four empty columns
— a deliberate fallback, written into the stylesheet. But the field is a canvas,
so with JavaScript off C has no identity left: what remains is a well-set
monospaced document that could belong to anyone.

## The chooser

`index.html` plus `chooser.css`, added this pass. System font stack, no colour
beyond ink on paper, no motion, no web font — it borrows nothing from A, B or C
so that whichever direction you open next is the first designed thing you see.
Three links, each with its thesis and one honest line about its risk.

## What is left

- Pick a direction. The three risks stated on the chooser are the three real
  questions; none of them is answerable from the screenshots alone.
- `assets/` is still empty. The spec reserved it for the device photograph and
  a favicon as the only cross-direction files; all three directions ended up
  drawing the box instead, and none of them sets a favicon.
