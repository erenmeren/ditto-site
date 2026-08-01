# t5 — "How it works" redesign (three options: 5a / 5b / 5c)

*Date: 2026-08-01 · Status: approved by user (structure, styles, story). Supersedes the
story told by 4a, which describes the pre-pivot ingest model.*

## Context

`Blip Site.dc.html` is the design canvas for the marketing site of **Ditto**
(`~/projects/ditto-admin`, `~/projects/ditto-firmware`). Option 4a explains how the
system works, but (a) the user finds it flat — wants startup-grade, animation-driven
storytelling that viewers understand immediately, and (b) its content is **outdated**:
it describes an ingest/render/store/token flow, while the product pivoted to a
**trigger-only** model (see `ditto-admin/docs/DEVELOPMENT.md`, `device-protocol.md`):
Ditto never sees content; the caller passes a URL, the device shows a QR for it.

## Goal

Add one new turn **`t5`** at the top of the canvas (`<section class="dv-turn" id="t5">`,
before `t4`), containing **three self-contained design options** for the "how it
works" section. Each option tells the same corrected story with a different animation
mechanic **and** a different visual language. 4a stays untouched.

## The story (shared by all three) — 5 beats

1. **Send** — Your system has something for the customer. One request carrying only
   *your* URL. Ditto never sees what's behind it.
2. **Check** — Cloud verifies the API key, confirms the device is online, reserves
   **1 credit**.
3. **Land** — One command drops onto exactly that box (~1 s). The QR appears.
4. **Scan** — Customer points their camera; your page opens on their phone. No app,
   no account.
5. **Settle** — The box acks; the credit is charged **only now**. A late trigger
   expires silently — nobody ever sees a stranger's code.

### Two audience layers in one scene

The animation reads for everyone. Technical depth lives in a thin **mono annotation
layer** over each scene — small labels the non-technical eye skips:

| Beat | Annotation copy (IBM Plex Mono, small) |
|---|---|
| 1 | `POST /api/v1/devices/dev_8f21/trigger` · `{ action:"show_qr", payload:{ url } }` · `Idempotency-Key` |
| 2 | `api key · scope devices:trigger` · `device: online` · `credit: 1 reserved` |
| 3 | `mqtt d/dev_8f21/cmd` · `ack: pending` |
| 4 | `GET <your url> — their phone, their browser` |
| 5 | `ack { ok:true }` · `credit: settled` / `late trigger → expired, released` |

### Copy rules

English, sentence case, plain verbs, no jargon in the primary layer. Brand name stays
the `brandName` prop, **default changes `"blip"` → `"ditto"`** (naming decision is
deferred upstream; the prop keeps it editable).

## Option 5a — "The Signal Line" · scroll-driven story

- **Mechanic:** a fixed-height card (~640px) with its own internal scroll container.
  Left column: five scene blocks that scroll by. Right column: a **sticky stage**.
  A single **vertical signal line** is the spine — as the visitor scrolls, a pulse
  travels down it: your code → cloud → box → phone. The active segment lights up;
  scenes snap (`scroll-snap`), each scroll position maps to a beat.
- **Style — daylight retail:** paper `#fbfaf7`, ink `#111413`, emerald `#0f7a54`
  (the real admin-console brand token), grey `#8b9490`, warm highlight `#f5b63f`.
- **Type:** Space Grotesk (display) · Inter (body) · IBM Plex Mono (annotations).
- **Signature:** the signal line itself — one request, one wire, one box.

## Option 5b — "Night Shift" · cinematic auto loop

- **Mechanic:** one wide diorama, no interaction required: night-time counter with
  POS + ditto box (left), arcing command path (middle), phone (right). A light packet
  travels the path on a ~12 s loop; each cycle rotates the content kind
  (receipt → ticket → menu → warranty). Hover pauses.
- **Style — night shift:** deep petrol `#0e141c`, screen-glow white, shop-light amber
  `#e8a24b`, ack emerald `#2fbf83`. No acid yellow.
- **Type:** narration as **film subtitles** — Instrument Serif italic, bottom bar;
  a thin mono **telemetry strip** along the top (topic · ack · ms) is the dev layer.
- **Signature:** subtitle bar + telemetry HUD — the same frame reads as film to one
  viewer and as a console to the other.

## Option 5c — "Press Send" · interactive live demo

- **Mechanic:** visitor picks a content kind (receipt / ticket / menu), presses a big
  **SEND** keycap. The request card flies to the box, a deterministic fake QR appears
  (existing `hash()`/`matrix()` infra), a phone slides up showing the "scanned" page.
  A **ms stopwatch** counts in real time (~0.9–1.2 s simulated round trip), then an
  ack chip settles: *"1 credit — charged only now."* Auto-plays once on first view.
- **Style — workbench:** bench `#eef1f4`, ink `#14181c`, cobalt `#1d4ed8`, ack
  emerald, visible outlines + tactile shadows (pressed states physically depress).
- **Type:** Bricolage Grotesque (display) · Inter (body) · IBM Plex Mono.
- **Signature:** the physical SEND keycap + live latency stopwatch — the speed claim,
  demonstrated instead of stated.

## Technical constraints & implementation notes

- **DSL:** `{{ }}` resolves paths only. Every computed style/label/handler is
  precomputed in `renderVals()` as flat keys. New state prefixes to avoid collisions
  with existing slices (`st*`, `ds*`, `b*`): **`sa*`** (5a), **`nb*`** (5b),
  **`pd*`** (5c).
- **Scroll (5a):** inner scroller div with `onScroll="{{ saScroll }}"`; handler maps
  `scrollTop` → beat index → precomputed segment/scene styles. No IntersectionObserver
  needed.
- **Loop (5b):** one `setInterval` (cleared in `componentWillUnmount`), pause-on-hover
  via `onMouseEnter`/`onMouseLeave` like the existing `st*` flow.
- **Demo (5c):** SEND handler seeds token → QR redraw (canvas `ref`s created in
  `componentDidMount`), stopwatch `setInterval` (~30 ms tick) stopped at simulated
  ack; timers cleared on unmount.
- **Fonts:** extend the existing `<helmet>` Google Fonts link with Space Grotesk,
  Inter, Instrument Serif, Bricolage Grotesque (weights actually used only).
- **Hover styling** via `style-hover` attribute (runtime pseudo-class sheet), not JS.
- **Reduced motion:** in `componentDidMount`, check
  `matchMedia('(prefers-reduced-motion: reduce)')`; if set, 5b renders a static
  mid-loop frame and 5c skips the flight animation (jump-cut to result).
- **Canvas conventions:** turn header `dv-thd` numbered 5; options `5a`/`5b`/`5c`
  with `data-screen-label`; closing `.dv-next` paragraph asks the user to pick a
  direction for the full page build.
- **Card widths:** ~1040px like 4a (5a may be narrower, ~980px, since it's a
  vertical composition).

## Out of scope

- No changes to 4a, t3, t2, or the product repos.
- No real network calls; everything simulated in the logic class.
- Full-page builds (home/pricing/docs) come after the user picks a winner.

## Verification

Serve over HTTP (`python3 -m http.server`), open the canvas, and check: all three
options render without console errors from the dc-runtime; 5a scroll maps cleanly to
the five beats (no dead zones); 5b loops and pauses on hover; 5c SEND produces QR +
phone + settled ack and repeated sends re-randomize; annotations legible at 100% zoom;
reduced-motion path renders static frames.
