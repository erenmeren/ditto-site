# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **design canvas**, not a deployed site. `Blip Site.dc.html` is a single design doc holding proposed marketing-site designs for "blip" — the digital-receipt product whose real implementation lives in `erenmeren/ditto-admin` (see `github.md`). Nothing here ships; the artifact is the design doc itself. The product is not modified from this project.

Files:
- `Blip Site.dc.html` — the design doc (template + one logic class). This is the only file to edit.
- `support.js` — **generated**, do not edit ("GENERATED from dc-runtime/src/*.ts"). The dc runtime.
- `github.md` — sync log against the product repo, with a screen map (screen → source of truth).
- `.thumbnail` — WebP preview image, tooling-generated.

There is no build, no tests, no lint, no package manager. To preview, serve the directory over HTTP (`python3 -m http.server`) and open the file — `file://` breaks sibling `.dc.html` fetches. Requires network: the runtime pulls React 18 UMD from unpkg and fonts from Google Fonts.

## Product model (what the designs describe)

One `POST /api/ingest` with a device key in the header → key is compared as a SHA-256 hash → resolves org/store/device → image rendered into private storage with a presigned 300 s URL and a 40-char capability token → MQTT `d/{deviceId}/cmd` publishes `show_qr`, device acks → customer scans, `GET /r/<token>` serves the page. No SDK on the device, no account for the customer. Screen layout/branding is a separate flow driven from the admin console, never from the caller's request. Keep any new copy consistent with this.

## Design-doc format

```
<x-dc>  … template …  </x-dc>
<script type="text/x-dc" data-dc-script data-props="{…}">
  class Component extends DCLogic { … renderVals() { … } }
</script>
```

The template renders through React against the **flat object returned by `renderVals()`**, merged over props. `data-props` declares editor-exposed props (`brandName`, default `"ditto"`; `txMultiplier`) reachable as `this.props.x`. The brand name is deliberately a prop — the product's naming decision is deferred (see `ditto-admin/docs/naming-candidates.md`); never hardcode it in new copy.

**`{{ }}` is a path resolver, not JS.** It supports identifiers, `.` / `[…]` access, string/number/bool literals, `!`, and `==`/`===`/`!=`/`!==` — nothing else. No calls, no arithmetic, no ternaries. This is why `renderVals()` is huge: every computed style string, label, and handler is precomputed there and exposed as a flat key (`stNode0`…`stNode5`, `ds_head`, `dsDown_qr`, `stDot`). Adding interactive UI means adding keys to `renderVals()`, not logic to the markup.

Template features:
- `{{ }}` inside any attribute or text. A whole-attribute `{{ x }}` passes the raw value (functions, refs, arrays); mixed text interpolates to a string.
- Event attributes take handlers by reference: `onClick="{{ stPlay }}"`, `onMouseEnter="{{ stEnter }}"`. Handler factories (`stGo = i => () => …`) are pre-bound in `renderVals()` as `stGo0`, `stGo1`, ….
- `style="…;{{ stNode0 }}"` — inline style strings are parsed into React style objects, so state-driven styling is done by appending a precomputed CSS fragment.
- `style-hover="border-color:#16150f"` (any `style-<pseudo>`) compiles to a generated class in an injected stylesheet, `!important`-ified. Use this for hover, not JS.
- `<sc-for list="{{ arr }}" as="c" hint-placeholder-count="169">` and `<sc-if value="{{ x }}">`.
- `<helmet>` in the template head-block carries `<meta name="design_doc_mode" content="canvas">`, fonts, and the `dv-*` canvas CSS.
- `ref="{{ qr2a }}"` wires React refs created in `componentDidMount` for canvas drawing (`draw()` on `componentDidUpdate`).
- `<dc-import name="X">` / `<x-import>` fetch sibling `./X.dc.html` files — relevant only if the doc is ever split.

## Canvas structure and conventions

The doc is a review canvas: newest turn first. Each `<section class="dv-turn" id="tN">` is one conversation turn (currently t7, t6, t5, t4, t3, t2 top-to-bottom; t7 is the winning direction — the full novice-first page in the daylight dialect), containing `.dv-opt` design options with ids like `4a`, `2a`, `2c`, a `data-screen-label`, a fixed-width `.dv-card`, and a closing `.dv-next` paragraph proposing what to build next. New work goes in as a **new turn section at the top of `<x-dc>`**, with the next turn number.

One `Component` class backs every option on the canvas, so state is namespaced by prefix: `st*` = the six-step flow storyboard (auto-advances on a 3.2 s interval, pauses on hover, clickable steps), `ds*` = the screen-designer mock (drag/resize/visibility per element, `code` vs `idle` page, page-vs-store scope), `b*` + `logoOn` = brand editor, `colorway`/`shell*` = device colourways, `explode`/`layer*` = the exploded-device view, `tx`/`log`/`token` = the live ingest demo, `sa*` = 5a scroll story, `nb*` = 5b auto loop, `pd*` = 5c interactive demo (`this.rm` class field = reduced-motion flag), `ta*`/`tb*` = t6 branding pickers (themes from `ditto-admin/lib/branding-presets.ts`, real preset hexes), `qd*` = t7's daylight demo twin of `pd*` (own timers `_qdTimers`/`_qdTick`), `hw*` = t7's 4-beat story fork of `sa*`. t7 still shares `ta*` (theme picker) with t6's 6a card — harmless on a review canvas.

**Credit timing (the user corrected this — don't regress):** the credit settles when the box ACKS THE DISPLAY (story beat 3, "paid on show"), not when the customer scans. Scanning is free and last. t5's archived 5-beat card intentionally keeps the old wording. Brand mock-ups use the generic "Your shop", never a concrete merchant name. Keep new options in their own prefix, and clear any timers in `componentWillUnmount`.

**t4 vs t5:** t4's copy describes the pre-pivot ingest model and is kept only for comparison. t5 tells the current **trigger-only** story (caller passes a URL; Ditto never sees content; 1 credit reserved → settled on ack) — new work must follow t5's story, sourced from `ditto-admin/docs/DEVELOPMENT.md` and `device-protocol.md`.

**Verification without a browser:** every `{{ }}` key must resolve to a `renderVals()` key — the plan doc `docs/superpowers/plans/2026-08-01-t5-how-it-works-redesign.md` (Task 1) contains a small `check-canvas.mjs` static checker for this; headless `firefox --screenshot` (write to /tmp, then copy) or a Marionette script gives real render/screenshot verification, and `magick` is available for cropping.

QR codes are fake — deterministic FNV-1a hash + LCG (`hash()`, `matrix()`, `brandQr`, `tinyQr`), rendered either to canvas or as a 13×13 grid of divs. Don't reach for a QR library.

Visual language (2a "quiet engineering" / 2c "hybrid"): ink `#16150f`, paper `#f4f3ee`, panel `#eae7de`, rules `#c3bfb3`/`#d8d5cc`, muted `#8a8577`, acid accent `#e8ff2f` used sparingly. Type is Helvetica Neue for headings/body with tight negative tracking, IBM Plex Mono for labels (uppercase, letter-spaced) and code, Archivo Black only in 2c. Copy is lowercase-leaning, plain-language, British spelling ("colours", "organisation"). The t5 options each carry their own palette/type system (5a daylight retail/Space Grotesk+Inter, 5b night petrol/Instrument Serif subtitles, 5c workbench cobalt/Bricolage Grotesque) — spec: `docs/superpowers/specs/2026-08-01-t5-how-it-works-redesign-design.md`.
