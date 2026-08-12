# maratus Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three complete, independent art directions for the maratus marketing site under `maratus/`, so they can be judged as real pages side by side.

**Architecture:** Three self-contained static sites (`maratus/a`, `/b`, `/c`) sharing a content spine and nothing else — no shared stylesheet, font stack, palette, or JavaScript. A chooser page links them. A screenshot harness under `maratus/tools/` proves every direction under three browser conditions and three widths before it is called done.

**Tech Stack:** Plain HTML, CSS, and vanilla JS. No build step, no package manager, no framework. Google Fonts is the only external dependency, matching the existing site. Verification uses headless Firefox 153 and ImageMagick, both already installed.

**Spec:** `docs/superpowers/specs/2026-08-12-maratus-site-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **Language:** all tracked content is English. Site copy is English with British spelling — "colours", "organisation", "recognise".
- **No duration is printed anywhere.** There is no sixty-second rule. Never write "60 seconds", "60s", "a minute", or any other display duration in any direction. State the consequence instead: if the box cannot put the code on screen, the credit comes back.
- **Banned words in site copy:** `ack`, `acknowledgement`, `TTL`, `platform`, `experience`, `interaction`, `programmable`, `stateless`. Write "the box confirms" / "confirmation". `MQTT` may appear only in an API section addressed to developers.
- **Never mention unshipped hardware:** NFC, camera, scanner.
- **Banned visual defaults:** emoji, a row of three rounded-corner feature cards, soft gradient blobs as background decoration, stock icon sets, the generic indigo-to-violet SaaS gradient. Violet as a hue is fine where it is doing optical work.
- **Banned easing:** bare `ease`, `ease-in-out`, `ease-in`, `ease-out`, `linear` on anything the eye tracks. Every direction defines its own cubic-bezier tokens.
- **Accessibility floor:** every page is fully readable with JavaScript disabled, and tells its whole story under `prefers-reduced-motion: reduce` from resting state. No horizontal page scroll at any width.
- **Isolation:** a direction may reference only its own directory and `maratus/assets/`. Never `../b/` or `../c/`.
- **`site/` is not modified by any task in this plan.** Neither is `redesign/`, `Blip Site.dc.html`, or `CLAUDE.md`.
- **Every page carries** `<meta name="robots" content="noindex">`.
- **Product facts** are fixed by `maratus/content.md` (Task 2). No direction invents a claim.

---

### Task 1: Verification harness and skeleton

Nothing else can be verified until this exists, so it comes first.

**Files:**
- Create: `maratus/tools/shoot.sh`
- Create: `maratus/tools/check.sh`
- Create: `maratus/assets/.gitkeep`
- Create: `maratus/README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `shoot.sh <path> <outdir>` writes 5 PNGs — `plain-1440.png`, `plain-768.png`, `plain-390.png`, `rm-1440.png`, `nojs-1440.png`. `check.sh <dir>` greps a direction's HTML/CSS/JS for banned words, banned easing, and printed durations, exiting non-zero on any hit. Both are used as the gate in Tasks 4–7.

- [ ] **Step 1: Write the screenshot harness**

Create `maratus/tools/shoot.sh`:

```bash
#!/usr/bin/env bash
# Screenshot one page under the three browser conditions that matter and the
# three widths we support. The reduced-motion and no-JS profiles are real:
# they were proven with a colour probe before this script was written.
#
#   ./shoot.sh a /tmp/shots        -> shoots maratus/a/index.html
#   ./shoot.sh . /tmp/shots        -> shoots maratus/index.html
set -euo pipefail

TARGET="${1:?usage: shoot.sh <path-under-maratus> <outdir>}"
OUT="${2:?usage: shoot.sh <path-under-maratus> <outdir>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8940}"
PROFS="$(mktemp -d)"

mkdir -p "$OUT"

# One profile per condition. user.js is read at profile start.
mkdir -p "$PROFS/plain" "$PROFS/rm" "$PROFS/nojs"
echo 'user_pref("ui.prefersReducedMotion", 1);' > "$PROFS/rm/user.js"
echo 'user_pref("javascript.enabled", false);'  > "$PROFS/nojs/user.js"

python3 -m http.server "$PORT" --directory "$ROOT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true; rm -rf "$PROFS"' EXIT
sleep 2

URL="http://localhost:$PORT/${TARGET#./}/index.html"
URL="${URL//\/\/index.html/\/index.html}"

shoot() { # profile  width  height  name
  timeout 120 firefox --headless --profile "$PROFS/$1" \
    --window-size="$2,$3" --screenshot "$OUT/$4.png" "$URL" >/dev/null 2>&1 || true
  if [ ! -s "$OUT/$4.png" ]; then echo "FAIL: no screenshot for $4" >&2; exit 1; fi
}

shoot plain 1440 2600 plain-1440
shoot plain  768 2600 plain-768
shoot plain  390 2600 plain-390
shoot rm    1440 2600 rm-1440
shoot nojs  1440 2600 nojs-1440

echo "shot $URL"
magick identify "$OUT"/*.png | sed 's/^/  /'
```

- [ ] **Step 2: Write the copy and style linter**

Create `maratus/tools/check.sh`:

```bash
#!/usr/bin/env bash
# Grep gate. Fails a direction that prints a duration, uses banned jargon,
# uses a banned easing keyword, or reaches into a sibling direction.
set -uo pipefail

DIR="${1:?usage: check.sh <direction-dir>}"
FAIL=0

hit() { echo "FAIL [$1] $2"; FAIL=1; }

FILES=$(find "$DIR" -maxdepth 2 -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' \))
[ -z "$FILES" ] && { echo "FAIL no files under $DIR"; exit 1; }

# Durations, in digits or words. There is no sixty-second rule to print.
# The leading (^|[^0-9.]) guard keeps legitimate CSS timings out of this —
# a bare \b matches the "60s" inside "0.60s" and would fail every stylesheet.
if grep -nEi '(^|[^0-9.])(60|sixty|30|thirty|90|ninety) ?(s\b|sec|second)' $FILES; then
  hit duration "a display duration is printed"
fi

# Jargon the site never uses.
for w in '\back\b' '\backs\b' 'acknowledg' '\bTTL\b' '\bplatform\b' '\bprogrammable\b' '\bstateless\b'; do
  if grep -nEi "$w" $FILES | grep -viE 'feedback|tracking'; then hit jargon "$w"; fi
done

# Unshipped hardware.
if grep -nEi '\b(NFC|scanner|camera)\b' $FILES; then hit hardware "unshipped hardware named"; fi

# Lazy easing. Custom cubic-beziers only.
# The (^|[^-a-zA-Z]) guard matters: a bare \b treats the "ease" inside
# var(--ease-soft) as a boundary match, which would fail every transition in
# direction B, whose token is named --ease-soft. Longest alternative first so
# ease-in-out is not reported as a bare "ease".
if grep -nE '(transition|animation)[^;]*(^|[^-a-zA-Z])(ease-in-out|ease-in|ease-out|ease|linear)([^-a-zA-Z]|$)' $FILES; then
  hit easing "a default easing keyword is used"
fi

# Cross-direction references.
SELF=$(basename "$DIR")
for other in a b c; do
  [ "$other" = "$SELF" ] && continue
  if grep -nE "\.\./$other/" $FILES; then hit isolation "references ../$other/"; fi
done

# noindex is required on every page.
for f in $(find "$DIR" -maxdepth 2 -name '*.html'); do
  grep -q 'name="robots" content="noindex"' "$f" || hit noindex "$f lacks the noindex meta"
done

[ "$FAIL" -eq 0 ] && echo "OK $DIR"
exit "$FAIL"
```

- [ ] **Step 3: Make both executable and prove the harness runs**

```bash
chmod +x maratus/tools/shoot.sh maratus/tools/check.sh
mkdir -p maratus/assets && touch maratus/assets/.gitkeep
```

`shoot.sh` resolves its document root from its own location, so it cannot be pointed at `site/` as a dry run. Its first real exercise is Task 4 Step 6, against direction A. Here, verify only that both scripts parse:

Run: `bash -n maratus/tools/shoot.sh && bash -n maratus/tools/check.sh && echo "syntax ok"`
Expected: `syntax ok`

- [ ] **Step 4: Prove check.sh actually catches violations**

A linter nobody has seen fail is not a linter. Create a deliberate violation and confirm it is caught:

```bash
mkdir -p /tmp/lintprobe
cat > /tmp/lintprobe/index.html <<'EOF'
<html><body><p>The code stays up for 60 seconds and the box sends an ack.</p>
<style>a{transition:color .2s ease-in-out}</style></body></html>
EOF
bash maratus/tools/check.sh /tmp/lintprobe; echo "exit=$?"
```

Expected: three FAIL lines — duration, jargon (`\back\b`), easing — plus a noindex failure, and `exit=1`.

Then confirm a clean directory passes:

```bash
mkdir -p /tmp/lintclean
printf '%s' '<html><head><meta name="robots" content="noindex"></head><body><p>The credit comes back.</p></body></html>' > /tmp/lintclean/index.html
bash maratus/tools/check.sh /tmp/lintclean; echo "exit=$?"
```

Expected: `OK /tmp/lintclean` and `exit=0`.

- [ ] **Step 5: Write `maratus/README.md`**

```markdown
# maratus — three directions

A comparison study, not a deployment. Nothing here is live and every page is
`noindex`. The shipped site is `../site/`.

    python3 -m http.server --directory .    # then open /index.html

- `a/` — "The Display": metaphor led, the figure used once
- `b/` — "Maratus": character led
- `c/` — "Structural colour": no figure, generative optics

`content.md` is the fact sheet all three obey. `tools/shoot.sh` screenshots a
direction under plain, reduced-motion, and no-JS conditions at three widths;
`tools/check.sh` greps for banned copy, easing, and cross-direction references.
Both must pass before a direction is called done.
```

- [ ] **Step 6: Commit**

```bash
git add maratus/tools maratus/README.md maratus/assets/.gitkeep
git commit -m "build(maratus): screenshot harness and copy linter, both proven to fail"
```

---

### Task 2: The fact sheet and three voices

**Files:**
- Create: `maratus/content.md`

**Interfaces:**
- Consumes: nothing.
- Produces: the single source of copy truth for Tasks 4, 5, 6. Section ids referenced by every direction: `hero`, `object`, `sequence`, `demo`, `request`, `terms`, `pilot`. Each section has a locked *claim* (what must be true) and three *voices* (how each direction says it).

- [ ] **Step 1: Write the fact sheet**

Create `maratus/content.md` containing, verbatim, these locked facts:

- `POST /api/v1/devices/{id}/trigger`, Bearer API key, required `Idempotency-Key`, body `{ action: "show_qr", payload: { url } }`.
- Answers: `202 { id, status: "queued" }` and one credit goes on hold; also 401, 403 (`insufficient_scope`), 409 (`device_offline`, raised before any hold), 429.
- The box puts the QR on screen and confirms back. **The confirmation settles the credit — paid on show.** It takes a couple of seconds.
- If the box never confirms, the trigger expires, the hold is released, and a late code never appears. **No duration is printed.**
- The QR carries the caller's URL directly. maratus never fetches, renders, or stores what is behind it. The URL string itself *is* stored — so write "we never see what's behind the link", never "we don't store the link".
- Scanning is free and happens last. It does not settle the credit.
- `POST /api/v1/devices/{id}/pin` for durable codes — a pinned code spends a credit immediately, with no hold. `GET /api/v1/usage` exists. There is no status endpoint and no callback yet; say so plainly.
- Screen layout and branding are pushed org-wide from the console — every claimed box in every store — never from the caller's request.
- New organisations get a 50-credit starter grant. Per-device `flat` and `base_usage` subscription plans also exist, so never claim credits are the only path.
- Setup: zero-touch auto-claim only for factory-allocated serials; otherwise a six-character pairing code typed into the console.

- [ ] **Step 2: Write the section spine with three voices**

For each of the seven sections, write the locked claim once, then three one-paragraph treatments labelled A, B, C. The voices differ; the claims do not.

- **A — The Display:** measured, editorial, third person. Short declaratives. No exclamation, no second-person selling.
- **B — Maratus:** warm, second person, a little wry. The character may be referred to but never speaks in first person.
- **C — Structural colour:** terse, technical, near-caption. Fragments allowed. Numbers and endpoint names carry the weight.

- [ ] **Step 3: Verify the fact sheet passes its own linter**

Run: `bash maratus/tools/check.sh maratus 2>&1 | head -20`

Expected: `content.md` is markdown, not html/css/js, so `check.sh` skips it by design. Instead grep it directly:

```bash
grep -nEi '\b(60|sixty) ?(s\b|sec|second)|\back\b|\bTTL\b' maratus/content.md; echo "exit=$?"
```

Expected: no output and `exit=1` from grep finding nothing.

- [ ] **Step 4: Commit**

```bash
git add maratus/content.md
git commit -m "docs(maratus): one fact sheet, three voices, no durations"
```

---

### Task 3: The drawings

Directions A and B both depend on this task; C does not.

**Files:**
- Create: `maratus/a/art/specimen.svg`
- Create: `maratus/b/art/maratus-idle.svg`
- Create: `maratus/b/art/maratus-display.svg`
- Create: `maratus/b/art/maratus-paid.svg`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `specimen.svg` — a single inline-able SVG with `viewBox="0 0 800 600"` and these exact group ids, because `a/app.css` animates them by id: `#fan-left`, `#fan-right`, `#fan-centre`, `#body`, `#legs`, `#plate-rules`. Each fan group must have `transform-box: fill-box` set in the file and a `transform-origin` attribute at the fan's hinge, so a CSS `rotate()` opens it rather than swinging it off-canvas.
  - Three `maratus-*.svg` character files, same `viewBox="0 0 400 400"`, same subject at the same scale and position, differing only in fan and posture — so `b/app.js` can cross-fade between them without the figure jumping.

- [ ] **Step 1: Draw the specimen plate for A**

Hand-authored SVG in the manner of a natural-history specimen plate: fine stroked linework, no fills except the fan, a hairline rule and a scale bar. The fan is the only place colour appears, and it uses A's iridescent ramp (Task 4 Step 1 defines the exact stops — use `#2B6BE4`, `#7A3CF0`, `#14B6A6` here).

Constraints: no `<image>`, no embedded raster, no external references. Stroke widths between 0.75 and 2. The closed (resting) state is what the file draws — the open state is produced by CSS rotation of `#fan-left` and `#fan-right`, so draw the fan folded.

- [ ] **Step 2: Verify it renders and has the required ids**

```bash
for id in fan-left fan-right fan-centre body legs plate-rules; do
  grep -q "id=\"$id\"" maratus/a/art/specimen.svg && echo "ok $id" || echo "MISSING $id"
done
magick maratus/a/art/specimen.svg -resize 400x /tmp/specimen-check.png && magick identify /tmp/specimen-check.png
```

Expected: six `ok` lines, and a PNG that is not blank. Confirm visually by reading `/tmp/specimen-check.png`.

- [ ] **Step 3: Draw the three character states for B**

Same subject in all three, drawn in a warmer, rounder register than A's plate — this is a character, not a specimen. States: `idle` (fan folded, at rest), `display` (fan fully open, raised), `paid` (fan half-folded, settled). Registration must match: the body's centre point sits at the same coordinates in all three files.

- [ ] **Step 4: Verify registration across the three states**

```bash
for s in idle display paid; do
  magick "maratus/b/art/maratus-$s.svg" -resize 400x400 "/tmp/mar-$s.png"
done
magick identify /tmp/mar-idle.png /tmp/mar-display.png /tmp/mar-paid.png
```

Expected: three PNGs, all 400x400. Read all three and confirm the body sits in the same place in each — if it jumps, fix the SVGs, not the CSS.

- [ ] **Step 5: Commit**

```bash
git add maratus/a/art maratus/b/art
git commit -m "feat(maratus): the specimen plate and the three character states"
```

---

### Task 4: Direction A — "The Display"

**Files:**
- Create: `maratus/a/index.html`
- Create: `maratus/a/app.css`
- Create: `maratus/a/app.js`

**Interfaces:**
- Consumes: `maratus/content.md` voice A; `maratus/a/art/specimen.svg` ids from Task 3.
- Produces: a complete standalone page. Nothing later depends on its internals.

**Locked system** — record these at the top of `app.css` as a token block:

- Fonts: `Archivo` (variable `wdth` 75–125, `wght` 400–700) for display, `Newsreader` (variable `opsz` 6–72) for text. One Google Fonts link, both faces.
- Ground `#0E0F12`, paper `#EDEAE3`, muted `#6B7076`, hairline `#23262B`.
- Iridescent ramp, used only in the fan and in exactly one rule elsewhere: `#2B6BE4` → `#7A3CF0` → `#14B6A6`.
- Easing tokens: `--fold: cubic-bezier(.16,.84,.24,1)` and `--settle: cubic-bezier(.34,1.26,.48,1)`. No other curves.

**Signature motion:** the fan raise. As the hero scrolls, `#fan-left` and `#fan-right` rotate open about their hinges and the iridescent ramp resolves from grey. It is driven by scroll position, not a timer, so the reader controls it.

- [ ] **Step 1: Build the page structure and the token block**

Write `index.html` with the seven sections from `content.md` in spine order, ids `hero`, `object`, `sequence`, `demo`, `request`, `terms`, `pilot`, plus `<meta name="robots" content="noindex">` and the Google Fonts link. Inline `specimen.svg` directly into the hero — it must be inline for CSS to reach its ids.

Write the `app.css` token block with the exact values above.

- [ ] **Step 2: Verify it is readable with no CSS decisions yet**

Run: `bash maratus/tools/check.sh maratus/a`
Expected: `OK maratus/a`

- [ ] **Step 3: Compose the page**

Type scale, grid, spacing, and section composition. Constraints from the spec that apply here: asymmetric composition, real empty space, at least one element that deliberately breaks the grid, tracking that changes with size, and a measure no wider than 68 characters on body text.

- [ ] **Step 4: Build the scroll-driven fan raise**

In `app.js`, drive a single CSS custom property `--open` on the hero from the hero's scroll progress, clamped 0 to 1, updated inside `requestAnimationFrame`. `app.css` maps `--open` onto the fan rotations and the ramp's saturation. Nothing else in the file may write to `--open`.

The resting state in `app.css` — the value that applies with no JS and under reduced motion — is the fan **open**, because an open fan is the state that tells the story. JS only makes it move.

- [ ] **Step 5: Re-cut the sequence scrubber**

The sequence section scrubs trigger → show → confirm → scan with the credit's state at each step (held → held → spent → spent). It prints no duration. Under reduced motion it renders as a static four-step diagram with all four states visible at once.

- [ ] **Step 6: Verify under all three conditions**

```bash
bash maratus/tools/check.sh maratus/a
bash maratus/tools/shoot.sh a /tmp/shots-a
```

Expected: `OK maratus/a`, then five PNGs. Read all five. Confirm:
- `nojs-1440.png` — every section's text is present and the fan is open.
- `rm-1440.png` — the sequence shows all four steps at once.
- `plain-390.png` — no content is clipped and nothing overflows sideways.

- [ ] **Step 7: Confirm there is no horizontal scroll**

```bash
grep -nE 'width: ?100vw|overflow-x: ?visible' maratus/a/app.css || echo "no 100vw offenders"
```

Expected: `no 100vw offenders`. `100vw` includes the scrollbar and is the usual cause of sideways scroll — this project has already shipped that bug once.

- [ ] **Step 8: Commit**

```bash
git add maratus/a
git commit -m "feat(maratus): direction A — the fan opens as you read"
```

---

### Task 5: Direction B — "Maratus"

**Files:**
- Create: `maratus/b/index.html`
- Create: `maratus/b/app.css`
- Create: `maratus/b/app.js`

**Interfaces:**
- Consumes: `maratus/content.md` voice B; the three character SVGs from Task 3.
- Produces: a complete standalone page.

**Locked system:**

- Fonts: `Fraunces` (variable `opsz`, `SOFT`, `WONK`) for display, `Public Sans` for text.
- Paper `#FFF8F0`, ink `#2A2118`, coral `#FF5A36`, fan teal `#17A8A0`, gold `#F0B429`.
- Easing tokens: `--spring: cubic-bezier(.22,1.4,.36,1)` and `--ease-soft: cubic-bezier(.4,.02,.2,1)`.

**Signature motion:** the character's state changes. It is idle until the demo fires, opens its fan as the code appears, and settles against the credit pill when the box confirms. The three SVGs cross-fade; the figure never jumps.

- [ ] **Step 1: Build structure and token block**

Same seven sections and ids as Task 4, voice B copy, `noindex` meta, Fraunces + Public Sans link, token block with the exact values above.

- [ ] **Step 2: Verify the copy gate**

Run: `bash maratus/tools/check.sh maratus/b`
Expected: `OK maratus/b`

- [ ] **Step 3: Compose the page**

Warmer and rounder than A, but the same discipline applies: asymmetric composition, deliberate empty space, one deliberate grid break, no row of three feature cards.

- [ ] **Step 4: Wire the character states**

`app.js` exposes one function, `setState(name)` where `name` is `'idle' | 'display' | 'paid'`, which cross-fades the three inlined SVGs by toggling a class on a wrapper. All three SVGs are inlined and stacked; only opacity and transform change. The demo section calls `setState` as it advances.

Resting state with no JS and under reduced motion: `display`, fan open — the state that shows what the product does.

- [ ] **Step 5: Verify under all three conditions**

```bash
bash maratus/tools/check.sh maratus/b
bash maratus/tools/shoot.sh b /tmp/shots-b
```

Expected: `OK maratus/b`, five PNGs. Read all five. Confirm the character is present and fan-open in `nojs-1440.png` and `rm-1440.png`, and that it does not shift position between states — compare `plain-1440.png` against the Task 3 registration check.

- [ ] **Step 6: Confirm no horizontal scroll**

```bash
grep -nE 'width: ?100vw|overflow-x: ?visible' maratus/b/app.css || echo "no 100vw offenders"
```

Expected: `no 100vw offenders`.

- [ ] **Step 7: Commit**

```bash
git add maratus/b
git commit -m "feat(maratus): direction B — the character opens its fan for the code"
```

---

### Task 6: Direction C — "Structural colour"

**Files:**
- Create: `maratus/c/index.html`
- Create: `maratus/c/app.css`
- Create: `maratus/c/app.js`
- Create: `maratus/c/art/field.js`

**Interfaces:**
- Consumes: `maratus/content.md` voice C. No drawings — this direction has no figure.
- Produces: a complete standalone page. `art/field.js` exposes `createField(canvas, opts)` returning `{ start(), stop(), setScroll(t) }` where `t` is 0–1.

**Locked system:**

- Fonts: `Anybody` (variable `wdth`) for display, `IBM Plex Mono` for data and labels.
- Ground `#08090B`, foreground `#D6D9DE`, dim `#71767E`, signal `#3DF5C5`.
- The optical field generates its own hues from an interference model — it does not sample a fixed palette.
- Easing tokens: `--snap: cubic-bezier(.2,.9,.1,1)` and `--drift: cubic-bezier(.5,0,.5,1)`.

**Signature motion:** the optical field. A canvas renders a thin-film interference pattern whose phase shifts with scroll position and cursor, the way structural colour shifts with viewing angle. This is the direction where the `algorithmic-art` skill applies — seeded, deterministic, parameterised.

- [ ] **Step 1: Write the field generator standalone**

`art/field.js` must work before it is wired to anything. It is deterministic: given a seed, the same pattern every time. No `Math.random()` without a seeded generator.

- [ ] **Step 2: Verify the field renders in isolation**

Create a throwaway probe page that imports `field.js`, renders at a fixed seed and `setScroll(0.5)`, and screenshot it:

```bash
mkdir -p /tmp/fieldprobe && cp maratus/c/art/field.js /tmp/fieldprobe/
cat > /tmp/fieldprobe/index.html <<'EOF'
<!doctype html><meta charset=utf-8><meta name="robots" content="noindex">
<canvas id=c width=800 height=400></canvas>
<script type=module>
import { createField } from './field.js';
const f = createField(document.getElementById('c'), { seed: 7 });
f.setScroll(0.5); f.start();
</script>
EOF
(python3 -m http.server 8942 --directory /tmp/fieldprobe >/dev/null 2>&1 &) ; sleep 2
timeout 90 firefox --headless --screenshot /tmp/field.png --window-size=820,420 http://localhost:8942/index.html >/dev/null 2>&1
magick identify /tmp/field.png
```

Expected: an 820x420 PNG. Read it and confirm it shows an interference pattern, not a blank canvas or a noise wash.

Then prove determinism — shoot it twice and compare:

```bash
timeout 90 firefox --headless --screenshot /tmp/field2.png --window-size=820,420 http://localhost:8942/index.html >/dev/null 2>&1
magick compare -metric AE /tmp/field.png /tmp/field2.png null: 2>&1; echo
```

Expected: `0` differing pixels. A non-zero result means the seed is not controlling everything — fix it before wiring it in.

- [ ] **Step 3: Build structure and token block**

Same seven sections and ids, voice C copy, `noindex`, Anybody + IBM Plex Mono, token block with the exact values above.

- [ ] **Step 4: Compose the page**

Severe grid, monospaced data, high contrast, dark. The discipline from the spec still applies — one deliberate grid break, real empty space.

- [ ] **Step 5: Wire the field to scroll and cursor**

`app.js` calls `setScroll(t)` from page scroll progress inside `requestAnimationFrame`, and passes cursor position as a second parameter to the field. Under `prefers-reduced-motion: reduce`, the field renders **one static frame** at `t = 0.35` and never animates — call `setScroll(0.35)` once, do not call `start()`. With JS disabled the canvas is absent and the page must still be complete; the field is decoration, never content.

- [ ] **Step 6: Verify under all three conditions**

```bash
bash maratus/tools/check.sh maratus/c
bash maratus/tools/shoot.sh c /tmp/shots-c
```

Expected: `OK maratus/c`, five PNGs. Read all five. Confirm `nojs-1440.png` is a complete, readable page with no empty hole where the canvas would be, and `rm-1440.png` shows a still field.

- [ ] **Step 7: Confirm no horizontal scroll**

```bash
grep -nE 'width: ?100vw|overflow-x: ?visible' maratus/c/app.css || echo "no 100vw offenders"
```

Expected: `no 100vw offenders`.

- [ ] **Step 8: Commit**

```bash
git add maratus/c
git commit -m "feat(maratus): direction C — colour that behaves like light on a surface"
```

---

### Task 7: The chooser

**Files:**
- Create: `maratus/index.html`
- Create: `maratus/chooser.css`

**Interfaces:**
- Consumes: the three finished directions.
- Produces: the page the user actually opens first.

- [ ] **Step 1: Build it deliberately plain**

Three links, each with the direction's name, its one-sentence thesis, and one honest line about its risk — the same three lines from the spec. Neutral typography that belongs to none of the three directions, so it does not tilt the comparison. `noindex`.

- [ ] **Step 2: Verify**

```bash
bash maratus/tools/check.sh maratus
bash maratus/tools/shoot.sh . /tmp/shots-index
```

Expected: `OK maratus`, five PNGs, and all three links resolving.

- [ ] **Step 3: Commit**

```bash
git add maratus/index.html maratus/chooser.css
git commit -m "feat(maratus): the chooser, deliberately plain so it does not tilt the comparison"
```

---

### Task 8: Review pass

**Files:**
- Modify: whichever files the review finds fault with.
- Create: `maratus/REVIEW.md`

**Interfaces:**
- Consumes: all three finished directions.
- Produces: an honest report, and fixes for what it finds.

- [ ] **Step 1: Re-shoot everything from clean**

```bash
rm -rf /tmp/shots-final && for d in a b c .; do
  bash maratus/tools/shoot.sh "$d" "/tmp/shots-final/$d"
done
bash maratus/tools/check.sh maratus/a && bash maratus/tools/check.sh maratus/b && bash maratus/tools/check.sh maratus/c
```

Expected: 20 PNGs and three `OK` lines.

- [ ] **Step 2: Read every screenshot and judge against the spec's motion rules**

For each direction, answer in writing: does it have exactly one signature motion? Is any motion generic fade-up that could be cut? Is any banned visual default present? Does the reduced-motion render tell the whole story? Does the no-JS render?

- [ ] **Step 3: Check the facts survived three rewrites**

```bash
grep -rniE 'paid on show|credit|starter grant|50' maratus/*/index.html | head -30
```

Confirm each direction states: paid on show, the credit returns if the box cannot display, the 50-credit starter grant, that plans also exist, and that maratus never sees what is behind the link. A direction missing one of these is incomplete, not stylistically different.

- [ ] **Step 4: Write `maratus/REVIEW.md`**

Per direction: what works, what does not, and what was fixed. Report failures plainly — a direction that did not meet the bar is more useful reported than quietly patched.

- [ ] **Step 5: Commit**

```bash
git add maratus
git commit -m "docs(maratus): review pass across the three directions"
```

---

## Self-Review

**Spec coverage:** brand spine → Tasks 3, 4, 5, 6 (each direction's signature motion is the spine made visible). Locked facts → Task 2, enforced in Task 8 Step 3. The sixty seconds → Global Constraints plus `check.sh` duration grep. Words the site does not use → `check.sh` jargon grep. Three directions → Tasks 4, 5, 6. Page spine → identical section ids in all three. Motion system → per-direction signature motion plus the easing grep. File layout → Tasks 1, 4, 5, 6, 7. Team → the handoff below. Verification → Task 1 harness, used as the gate in every later task. Out of scope → no task touches `site/`, the canvas, or `gh-pages`.

**Known gap, accepted:** `check.sh` cannot judge whether a design is good, only whether it broke a rule. Taste is gated by a human reading Task 8's screenshots. That is the correct division.

**Correction made during review:** Task 1 Step 3 originally asked the harness to be proven against `site/`, which cannot work because `shoot.sh` resolves its root from its own location. The step now verifies syntax only and defers the real proof to Task 4, where a real target exists. Task 1 Step 4 was added so `check.sh` is proven to fail before it is trusted.

---

## Execution Handoff

Task order and parallelism:

```
Task 1 (harness) ─┐
Task 2 (copy) ────┼─→ Task 4 (A) ─┐
Task 3 (art) ─────┘   Task 5 (B) ─┼─→ Task 7 (chooser) → Task 8 (review)
                      Task 6 (C) ─┘
```

Tasks 1, 2, and 3 must finish first — 4 and 5 need the drawings, all three need the fact sheet, and every task needs the harness. Tasks 4, 5, and 6 then run in parallel; they touch disjoint directories and cannot conflict.

Skills per agent, from the spec: designer-A uses apple-design, emil-design-eng, soft-skill, animate, frontend-design. designer-B uses brand, design-system, ui-ux-pro-max, animate. designer-C uses brutalist-skill, minimalist-skill, algorithmic-art, animate. The illustrator uses algorithmic-art. The reviewer uses code-review and review-animations.
