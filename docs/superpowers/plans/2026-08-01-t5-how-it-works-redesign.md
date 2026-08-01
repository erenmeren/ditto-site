# t5 "How it works" Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add turn `t5` to the design canvas with three animation-first "how it works" options (5a scroll story, 5b cinematic loop, 5c interactive demo) telling the corrected trigger-only Ditto story.

**Architecture:** Everything lives in `Blip Site.dc.html` — a dc-runtime design doc: an HTML template rendered by React against the flat object returned by `renderVals()` of the single `Component` class. Each option is a `.dv-opt` card in a new `.dv-turn` section plus a namespaced state slice (`sa*`, `nb*`, `pd*`) in the logic class.

**Tech Stack:** dc-runtime (`support.js`, generated — never edit), React 18 UMD (loaded by runtime), Google Fonts, no build/test tooling.

**Spec:** `docs/superpowers/specs/2026-08-01-t5-how-it-works-redesign-design.md`

## Global Constraints

- **`{{ }}` is a path resolver, not JS** — identifiers, `.`/`[…]`, literals, `!`, `==`/`===`/`!=`/`!==` only. Every computed style string, label, and handler must be a flat key precomputed in `renderVals()`.
- Event attrs take handler references: `onClick="{{ pdSend }}"`. Per-index handlers are pre-bound keys (`stGo0` pattern).
- State-driven styling = append a precomputed CSS fragment: `style="…;{{ saPulse }}"`. Hover/active via `style-hover=` / `style-active=` attributes, never JS.
- New state prefixes: **`sa*`** (5a), **`nb*`** (5b), **`pd*`** (5c). Do not touch existing slices (`st*`, `ds*`, `b*`, `tx`, `log`, `token`, `colorway`, `explode`).
- Do not modify `support.js`, option 4a, turns t3/t2, or anything in the product repos.
- Copy is English, sentence case, plain verbs. Brand name via `{{ brandName }}`; its `data-props` default changes `"blip"` → `"ditto"`.
- All timers/listeners created for t5 are cleared in `componentWillUnmount`.
- Palettes (exact, per option) — 5a: paper `#fbfaf7`, ink `#111413`, emerald `#0f7a54`, grey `#8b9490`, warm `#f5b63f`. 5b: petrol `#0e141c`, panel `#161f2b`, glow white `#eef3f8`, amber `#e8a24b`, ack emerald `#2fbf83`, dim text `#5d6b7d`. 5c: bench `#eef1f4`, ink `#14181c`, cobalt `#1d4ed8`, cobalt-dark `#0a1e66`, ack emerald `#0f7a54`, outline `#c6cdd6`.
- Fonts — 5a: Space Grotesk (display) / Inter (body); 5b: Instrument Serif italic (subtitles); 5c: Bricolage Grotesque (display) / Inter; all options: IBM Plex Mono (annotations/telemetry).
- **Git:** this directory is not a git repo. Before Task 1's commit step, ask the user to approve `git init`; if declined, skip every commit step (they are marked *(conditional)*).
- Preview must be over HTTP (`python3 -m http.server 8765` from the project root), never `file://`. Needs network (React UMD from unpkg, Google Fonts).

## File Structure

- Modify: `Blip Site.dc.html` — helmet font link (line ~10), new `<section id="t5">` inserted directly after `<x-dc>` (before `<section id="t4">`, line ~12), logic-class additions inside the `data-dc-script` block (lines ~797–1097), `data-props` default (line ~796).
- Create: `<scratchpad>/check-canvas.mjs` — static checker: every `{{ key }}` referenced in the template resolves to a key produced by `renderVals()`/props/loop vars.
- This plan and the spec live in `docs/superpowers/`.

---

### Task 1: Checker script + t5 scaffold

**Files:**
- Create: `<scratchpad>/check-canvas.mjs`
- Modify: `Blip Site.dc.html` (helmet fonts, `data-props` default, t5 section shell)

**Interfaces:**
- Produces: `t5` section with three empty `.dv-opt` shells (`id="5a"`, `id="5b"`, `id="5c"`) that Tasks 2–4 fill; checker script used by every later task: `node <scratchpad>/check-canvas.mjs "Blip Site.dc.html"` exits 0 when all interpolation keys resolve.

- [ ] **Step 1: Write the checker script**

```js
// <scratchpad>/check-canvas.mjs — static key check for a .dc.html design doc
import { readFileSync } from 'node:fs';
const src = readFileSync(process.argv[2] ?? 'Blip Site.dc.html', 'utf8');
const tpl = src.slice(src.indexOf('<x-dc>') + 6, src.lastIndexOf('</x-dc>'));
const js = src.slice(src.indexOf('data-dc-script'));
// keys referenced in the template: first path segment of every {{ expr }}
const refs = new Set();
for (const m of tpl.matchAll(/\{\{([\s\S]+?)\}\}/g)) {
  for (const id of m[1].matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) {
    const w = id[0];
    if (!['true','false','null','undefined'].includes(w)) refs.add(w);
  }
}
// keys produced: `foo:` object literals in the script, sc-for loop vars, props, $index
const defs = new Set(['brandName', 'txMultiplier', '$index', 'c', 'item']);
for (const m of js.matchAll(/(?:^|[{,(\s])([A-Za-z_$][A-Za-z0-9_$]*)\s*[:=]/g)) defs.add(m[1]);
for (const m of tpl.matchAll(/as="([A-Za-z0-9_$]+)"/g)) defs.add(m[1]);
const DYN = ['ds_', 'dsDown_', 'dsVis_', 'dsPick_', 'dsOn_', 'dsRow_']; // computed-key families
const missing = [...refs].filter(r => !defs.has(r) && !DYN.some(p => r.startsWith(p)));
if (missing.length) { console.error('UNRESOLVED KEYS:', missing.join(', ')); process.exit(1); }
console.log('ok:', refs.size, 'referenced keys all resolve');
```

- [ ] **Step 2: Run the checker against the untouched file — must pass**

Run: `node <scratchpad>/check-canvas.mjs "Blip Site.dc.html"`
Expected: `ok: … referenced keys all resolve` (exit 0). If it reports false positives, loosen `defs` collection until the untouched file passes — the checker's contract is "clean file ⇒ exit 0".

- [ ] **Step 3: Extend the helmet fonts** — in the line-10 `<helmet>` block replace the Google Fonts href with:

```
https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Archivo+Black&family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&display=swap
```

- [ ] **Step 4: Change the brand default** — in the `data-props` attribute (line ~796): `&quot;default&quot;:&quot;blip&quot;` → `&quot;default&quot;:&quot;ditto&quot;` (the `brandName` entry only).

- [ ] **Step 5: Insert the t5 shell** directly after `<x-dc>` (before `<section class="dv-turn" id="t4">`):

```html
<section class="dv-turn" id="t5">
<div class="dv-thd"><a class="dv-tid" href="#t5">5</a><span class="dv-tname">How it works, retold — the trigger-only story, three ways</span></div>
<div class="dv-opts">

<div class="dv-opt" id="5a" data-screen-label="5a signal line">
<div class="dv-olabel"><a class="dv-oid" href="#5a">5a</a>The Signal Line — scroll-driven story, daylight retail, Space Grotesk</div>
<div class="dv-card" style="width:980px;height:640px;background:#fbfaf7"></div>
</div>

<div class="dv-opt" id="5b" data-screen-label="5b night shift">
<div class="dv-olabel"><a class="dv-oid" href="#5b">5b</a>Night Shift — cinematic auto loop, film subtitles + telemetry HUD</div>
<div class="dv-card" style="width:1040px;height:560px;background:#0e141c"></div>
</div>

<div class="dv-opt" id="5c" data-screen-label="5c press send">
<div class="dv-olabel"><a class="dv-oid" href="#5c">5c</a>Press Send — interactive live demo, workbench, real stopwatch</div>
<div class="dv-card" style="width:1040px;background:#eef1f4"></div>
</div>

</div>
<p class="dv-next">Three retellings of the same five beats — 5a reads at your pace, 5b performs by itself, 5c proves the speed. Say "go with 5_" and I'll build the full page around it. (4a below is the pre-pivot story, kept for comparison.)</p>
</section>
```

- [ ] **Step 6: Verify** — checker passes; serve (`python3 -m http.server 8765`) and open `http://localhost:8765/Blip%20Site.dc.html`: t5 renders at top with three empty colored cards, no new console errors, 4a unchanged below.

- [ ] **Step 7: Commit** *(conditional — see Global Constraints)*

```bash
git init && git add -A && git commit -m "chore: baseline canvas before t5"   # first time only, if approved
git add "Blip Site.dc.html" docs/ && git commit -m "feat(t5): scaffold turn t5 with three option shells, fonts, ditto default"
```

---

### Task 2: Option 5a — "The Signal Line" (scroll-driven story)

**Files:**
- Modify: `Blip Site.dc.html` — fill the `5a` card; add `saScroll` handler and `saVals()` to the logic class; spread `...this.saVals()` into the `renderVals()` return object.

**Interfaces:**
- Consumes: the `5a` card shell from Task 1.
- Produces: template keys `saScroll`, `saNode0..saNode3`, `saSeg0..saSeg2`, `saPulse`, `saAnn`, `saAnnPos`, `saQr` (169-entry color array), `saQrStyle`, `saPhoneStyle`, `saCredit`, `saCreditStyle`. Method `saVals()` returning that object; class field `saScroll`.

- [ ] **Step 1: Add the logic** — inside the `Component` class add:

```js
// ---- 5a: signal line (scroll story) ----
saScroll = e => {
  const t = e.target;
  const b = Math.max(0, Math.min(4, Math.round(t.scrollTop / t.clientHeight)));
  if (b !== (this.state.saBeat ?? 0)) this.setState({ saBeat: b });
};

saVals() {
  const b = this.state.saBeat ?? 0;
  const st = [0, 1, 2, 3, 1][b];           // beat -> active station (settle returns to cloud)
  const Y = [64, 196, 328, 460];           // station centers (px) in the 560px stage
  const ANN = [
    'POST /api/v1/devices/dev_8f21/trigger · { action:"show_qr", payload:{ url } } · Idempotency-Key',
    'api key · scope devices:trigger · device: online · credit: 1 reserved',
    'mqtt d/dev_8f21/cmd · ack: pending',
    'GET <your url> — their phone, their browser',
    'ack { ok:true } · credit: settled · late trigger → expired, released'
  ];
  const node = i => i === st
    ? 'border-color:#0f7a54;background:#fff;box-shadow:0 0 0 3px rgba(15,122,84,.15);color:#111413'
    : 'border-color:#d8ded9;background:#fff;color:#8b9490';
  const seg = i => 'background:' + (b >= i + 1 ? '#0f7a54' : '#e3e8e4');
  const qr = (() => { let h = this.hash('sa' + b); const o = []; for (let i = 0; i < 169; i++) { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; o.push(h / 4294967296 > 0.52 ? '#111413' : '#ffffff'); } return o; })();
  return {
    saScroll: this.saScroll,
    saNode0: node(0), saNode1: node(1), saNode2: node(2), saNode3: node(3),
    saSeg0: seg(0), saSeg1: seg(1), saSeg2: seg(2),
    saPulse: 'top:' + (Y[st] - 7) + 'px',
    saAnn: ANN[b],
    saAnnPos: 'top:' + (Y[st] + 26) + 'px',
    saQr: qr,
    saQrStyle: b >= 2 ? 'opacity:1;transform:scale(1)' : 'opacity:0;transform:scale(.85)',
    saPhoneStyle: b >= 3 ? 'opacity:1;transform:translateY(0)' : 'opacity:0;transform:translateY(14px)',
    saCredit: b < 1 ? 'no charge yet' : b < 4 ? '1 credit · held' : '1 credit · settled',
    saCreditStyle: b < 4 ? 'background:#fff;color:#8b9490;border-color:#e3e8e4' : 'background:#0f7a54;color:#fbfaf7;border-color:#0f7a54'
  };
}
```

Spread it into the `renderVals()` return: add `...this.saVals(),` as the first entry of the returned object literal.

- [ ] **Step 2: Fill the 5a card.** Inside the Task-1 `5a` `.dv-card` build (all inline styles, canvas idiom; polish within the 5a tokens is at your discretion but every element below must exist):

- Header strip (~80px): eyebrow `how it works — 01` (mono 10.5px uppercase, `#8b9490`), title `One request. One box. One scan.` (Space Grotesk 500, 30px, ink), right-aligned hint `scroll ↓` (mono 10px, warm `#f5b63f` on ink pill).
- Body grid `grid-template-columns:380px 1fr;height:560px`.
- **Left column** — the scroller: `overflow-y:auto;scroll-snap-type:y mandatory` with `onScroll="{{ saScroll }}"`. Five child blocks, each `height:100%;scroll-snap-align:start;box-sizing:border-box;padding:34px 30px;display:flex;flex-direction:column;justify-content:center`. Block content: big index numeral (Space Grotesk 700, 44px, emerald for the numeral only), headline (Space Grotesk 500 ~21px, ink), body (Inter 400 14.5px/1.55, `#5c645f`). The five blocks, verbatim:
  1. `You send a link` — `Your till, your booking system, your app — when it has something for the customer, it sends one request with your URL. We never see what's behind it.`
  2. `We check and hold a credit` — `Right key? Box online? Then one credit goes on hold. Not charged — held.`
  3. `The code appears on that box` — `One command lands on exactly the box you named, about a second later. The screen shows your QR.`
  4. `They scan it` — `The customer points their camera and your page opens on their phone. No app, no account, no email.`
  5. `Paid only when it worked` — `The box confirms it showed the code — only then is the credit charged. A late request never shows; it just expires.`
- **Right column** — the stage (`position:relative;border-left:1px solid #eceee9`):
  - Vertical rail at `left:64px`: three segment divs between station centers Y=[64,196,328,460], each `position:absolute;left:64px;width:2px;` spanning consecutive Y values, with `transition:background .5s;{{ saSeg0 }}` (`saSeg1`, `saSeg2`).
  - The **pulse**: `position:absolute;left:58px;width:14px;height:14px;border-radius:50%;background:#0f7a54;box-shadow:0 0 0 5px rgba(15,122,84,.18);transition:top .6s cubic-bezier(.4,0,.2,1);{{ saPulse }}`.
  - Four station cards anchored at the Y centers, `left:96px;right:40px;position:absolute;transform:translateY(-50%);border:1.5px solid;border-radius:10px;padding:12px 16px;transition:all .4s;{{ saNode0 }}` etc. Labels (mono 10px uppercase over Inter 13.5px): `your system` / `one request out`; `ditto cloud` / `key ✓ · box online ✓` plus a small credit chip `border:1px solid;border-radius:99px;padding:2px 9px;font:500 9.5px 'IBM Plex Mono';transition:all .4s;{{ saCreditStyle }}` with text `{{ saCredit }}`; `the box — till 2` / a 72px 13×13 QR grid `<sc-for list="{{ saQr }}" as="c" hint-placeholder-count="169"><div style="background:{{ c }}"></div></sc-for>` wrapped in `transition:all .4s;{{ saQrStyle }}`; `their phone` / mini page mock (logo dot + 3 skeleton bars) wrapped in `transition:all .4s;{{ saPhoneStyle }}`.
  - The floating **annotation**: `position:absolute;left:96px;right:40px;font:400 10px/1.6 'IBM Plex Mono';color:#8b9490;transition:top .6s cubic-bezier(.4,0,.2,1);{{ saAnnPos }}` with text `{{ saAnn }}`.

- [ ] **Step 3: Run the checker** — `node <scratchpad>/check-canvas.mjs "Blip Site.dc.html"` → exit 0.

- [ ] **Step 4: Browser-verify** — serve and check: scrolling the left column snaps block-to-block and drives pulse/segments/annotation; QR appears at beat 3, phone at beat 4, credit chip flips to emerald `settled` at beat 5; no dead scroll zones; no console errors; page scroll (outer canvas) unaffected when cursor is outside the scroller.

- [ ] **Step 5: Commit** *(conditional)* — `git add "Blip Site.dc.html" && git commit -m "feat(t5): 5a signal line — scroll-driven story"`

---

### Task 3: Option 5b — "Night Shift" (cinematic auto loop)

**Files:**
- Modify: `Blip Site.dc.html` — fill the `5b` card; add `nbVals()`, hover handlers, and the loop timer; extend `componentDidMount`/`componentWillUnmount`.

**Interfaces:**
- Consumes: `5b` card shell (Task 1).
- Produces: keys `nbEnter`, `nbLeave`, `nbTel`, `nbSub`, `nbKindLine`, `nbDot`, `nbBoxIdle`, `nbBoxQr`, `nbQr`, `nbPhone`, `nbPhoneTitle`, `nbAck`, `nbPauseLabel`. Class field `this.rm` (reduced-motion flag) that Task 4 also consumes; timer `this._nbT`.

- [ ] **Step 1: Add mount/unmount wiring.** In `componentDidMount` (after the existing `setTimeout(() => this.send(), 400)` line) add:

```js
this.rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
this._nbT = setInterval(() => {
  if (this.state.nbPaused || this.rm) return;
  this.setState(s => {
    const p = ((s.nbPhase ?? 0) + 1) % 5;
    return p === 0 ? { nbPhase: 0, nbCycle: ((s.nbCycle ?? 0) + 1) % 4 } : { nbPhase: p };
  });
}, 2400);
```

In `componentWillUnmount` add: `clearInterval(this._nbT);`

- [ ] **Step 2: Add `nbVals()`** to the class and spread `...this.nbVals(),` into the `renderVals()` return:

```js
// ---- 5b: night shift (cinematic loop) ----
nbHover = v => () => this.setState({ nbPaused: v });

nbVals() {
  const p = this.rm ? 2 : (this.state.nbPhase ?? 0);
  const cyc = this.state.nbCycle ?? 0;
  const KINDS = [
    { pos: 'receipt — table 9', phone: 'Your receipt', line: 'total 7.00 · returns 30 days' },
    { pos: 'ticket — row F seat 12', phone: 'Row F · Seat 12', line: 'doors 19:30' },
    { pos: "menu — table 4", phone: "Today's menu", line: 'kitchen closes 21:00' },
    { pos: 'warranty — 24 months', phone: 'Warranty · 24 mo', line: 'registered to this purchase' }
  ];
  const K = KINDS[cyc];
  const SUBS = [
    'One request leaves the till. The content stays theirs.',
    'The cloud holds one credit and finds the box.',
    'The box wakes — a code, addressed to one customer.',
    'A phone lifts. The page is already there.',
    'Confirmed shown. Only now does it cost a credit.'
  ];
  const TEL = [
    'POST /trigger · payload { url } · idem 9f3a',
    'key ok · scope devices:trigger · hold 1 credit',
    'd/dev_8f21/cmd · qos 1 · ack pending',
    'scan · GET their-url · no app, no account',
    'ack { ok:true } · 41 ms · credit settled'
  ];
  const XY = [[150, 372], [452, 168], [668, 320], [872, 296], [452, 168]]; // dot waypoints (px)
  const qr = (() => { let h = this.hash('nb' + cyc); const o = []; for (let i = 0; i < 169; i++) { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; o.push(h / 4294967296 > 0.52 ? '#0e141c' : '#eef3f8'); } return o; })();
  return {
    nbEnter: this.nbHover(true), nbLeave: this.nbHover(false),
    nbTel: TEL[p], nbSub: SUBS[p], nbKindLine: K.pos,
    nbDot: 'left:' + XY[p][0] + 'px;top:' + XY[p][1] + 'px;transition:all 2.1s linear;opacity:' + (this.rm ? 0 : 1),
    nbBoxIdle: p >= 2 ? 'opacity:0' : 'opacity:1',
    nbBoxQr: p >= 2 ? 'opacity:1;transform:scale(1)' : 'opacity:0;transform:scale(.9)',
    nbQr: qr,
    nbPhone: p >= 3 ? 'opacity:1;transform:translateY(0)' : 'opacity:.35;transform:translateY(22px)',
    nbPhoneTitle: K.phone, nbPhoneLine: K.line,
    nbAck: p === 4 ? 'opacity:1;color:#2fbf83' : 'opacity:0',
    nbPauseLabel: this.state.nbPaused ? 'paused — move away to resume' : ''
  };
}
```

- [ ] **Step 3: Fill the 5b card** (`width:1040px;height:560px;background:#0e141c;position:relative;overflow:hidden`, with `onMouseEnter="{{ nbEnter }}" onMouseLeave="{{ nbLeave }}"`). Required elements:

- **Telemetry strip** (top, full width): `font:500 10px 'IBM Plex Mono';letter-spacing:.08em;color:#5d6b7d;padding:14px 22px;border-bottom:1px solid #161f2b;display:flex;justify-content:space-between` — left `{{ nbTel }}`, right `{{ nbPauseLabel }}` then `ditto · night shift`.
- **Scene** (absolute, fills middle): left zone = counter silhouette: dark panel `#161f2b` counter top, a POS terminal mock (screen shows mono line `{{ nbKindLine }}`), the ditto box beside it (rounded 120px square, screen area holding two stacked layers: idle brand mark `transition:opacity .8s;{{ nbBoxIdle }}` and the QR grid `<sc-for list="{{ nbQr }}" as="c" hint-placeholder-count="169">…` inside `transition:all .8s;{{ nbBoxQr }}`); a warm lamp glow behind the counter: `background:radial-gradient(circle at 20% 30%, rgba(232,162,75,.16), transparent 60%)` overlay div.
- **Command path**: a faint dashed arc suggestion (three small `#5d6b7d` dots positioned along the waypoints) plus the traveling **light packet**: `position:absolute;width:10px;height:10px;border-radius:50%;background:#eef3f8;box-shadow:0 0 18px 6px rgba(238,243,248,.45);{{ nbDot }}`.
- Right zone: **phone** (88×170px, near-black bezel, screen with logo dot, `{{ nbPhoneTitle }}` (glow white, Inter 600 12px), `{{ nbPhoneLine }}` (dim, 10px), skeleton bars) wrapped in `transition:all .9s;{{ nbPhone }}`; below it the ack line `font:500 10px 'IBM Plex Mono';transition:all .6s;{{ nbAck }}` text `ack ok — 1 credit settled`.
- **Subtitle bar** (bottom, centered): `font:italic 400 21px 'Instrument Serif';color:#eef3f8;text-align:center;padding:18px 40px 22px;border-top:1px solid #161f2b` with `{{ nbSub }}`.

- [ ] **Step 4: Run the checker** → exit 0.

- [ ] **Step 5: Browser-verify** — loop advances every 2.4s through 5 phases; dot glides between waypoints; QR fades in at phase 3, phone lifts at 4, ack + subtitle settle at 5; a full cycle rotates the kind (receipt→ticket→menu→warranty, new QR); hover pauses (label shows), unhover resumes; with DevTools emulating `prefers-reduced-motion: reduce` and a reload, the card renders the static phase-2 frame, dot hidden.

- [ ] **Step 6: Commit** *(conditional)* — `git add "Blip Site.dc.html" && git commit -m "feat(t5): 5b night shift — cinematic auto loop"`

---

### Task 4: Option 5c — "Press Send" (interactive live demo)

**Files:**
- Modify: `Blip Site.dc.html` — fill the `5c` card; add `pdSend`, `pdPick`, `pdVals()`; extend mount/unmount.

**Interfaces:**
- Consumes: `5c` shell (Task 1); `this.rm` (Task 3).
- Produces: keys `pdSend`, `pdPickReceipt`, `pdPickTicket`, `pdPickMenu`, `pdKindReceipt/Ticket/Menu` (chip styles), `pdUrl`, `pdMsLabel`, `pdChip`, `pdHold`, `pdQr`, `pdQrStyle`, `pdPhone`, `pdPhoneTitle`, `pdPhoneLine`, `pdAckStyle`, `pdBtnStyle`, `pdNote`. Timers `this._pdTimers`, `this._pdTick`, `this._pdAuto`.

- [ ] **Step 1: Add the logic** (in the class), and spread `...this.pdVals(),` into `renderVals()`:

```js
// ---- 5c: press send (interactive demo) ----
pdPick = k => () => this.setState({ pdKind: k });

pdSend = () => {
  if (this.state.pdRunning) return;
  (this._pdTimers || []).forEach(clearTimeout); clearInterval(this._pdTick);
  const total = 900 + Math.floor(Math.random() * 300);
  const seed = (this.state.pdSeed ?? 0) + 1;
  if (this.rm) { this.setState({ pdSeed: seed, pdStep: 4, pdMs: total, pdRunning: false }); return; }
  const t0 = performance.now();
  this.setState({ pdSeed: seed, pdStep: 1, pdMs: 0, pdRunning: true });
  this._pdTick = setInterval(() => this.setState({ pdMs: Math.round(performance.now() - t0) }), 30);
  this._pdTimers = [
    setTimeout(() => this.setState({ pdStep: 2 }), 260),
    setTimeout(() => this.setState({ pdStep: 3 }), 640),
    setTimeout(() => { clearInterval(this._pdTick); this.setState({ pdStep: 4, pdMs: total, pdRunning: false }); }, total)
  ];
};

pdVals() {
  const step = this.state.pdStep ?? 0;
  const kind = this.state.pdKind ?? 'receipt';
  const PAGES = {
    receipt: { title: 'Your receipt', line: 'total 7.00 · returns 30 days' },
    ticket: { title: 'Row F · Seat 12', line: 'doors 19:30' },
    menu: { title: "Today's menu", line: 'kitchen closes 21:00' }
  };
  const chip = k => k === kind
    ? 'background:#14181c;color:#eef1f4;border-color:#14181c'
    : 'background:#fff;color:#14181c;border-color:#c6cdd6';
  const qr = (() => { let h = this.hash('pd' + kind + (this.state.pdSeed ?? 0)); const o = []; for (let i = 0; i < 169; i++) { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; o.push(h / 4294967296 > 0.52 ? '#14181c' : '#ffffff'); } return o; })();
  return {
    pdSend: this.pdSend,
    pdPickReceipt: this.pdPick('receipt'), pdPickTicket: this.pdPick('ticket'), pdPickMenu: this.pdPick('menu'),
    pdKindReceipt: chip('receipt'), pdKindTicket: chip('ticket'), pdKindMenu: chip('menu'),
    pdUrl: 'https://yourshop.example/' + kind + '/8f21',
    pdMsLabel: String(this.state.pdMs ?? 0).padStart(3, '0') + ' ms',
    pdChip: step >= 1 ? 'transform:translateX(224px);opacity:0' : 'transform:translateX(0);opacity:1',
    pdHold: step >= 2 ? 'border-color:#1d4ed8;color:#1d4ed8;background:#fff' : 'border-color:#c6cdd6;color:#8b95a1;background:#fff',
    pdQr: qr,
    pdQrStyle: step >= 3 ? 'opacity:1;transform:scale(1)' : 'opacity:0;transform:scale(.85)',
    pdPhone: step >= 4 ? 'opacity:1;transform:translateY(0)' : 'opacity:0;transform:translateY(26px)',
    pdPhoneTitle: PAGES[kind].title, pdPhoneLine: PAGES[kind].line,
    pdAckStyle: step >= 4 ? 'opacity:1' : 'opacity:0',
    pdBtnStyle: this.state.pdRunning ? 'opacity:.55;pointer-events:none' : 'opacity:1',
    pdNote: step >= 4 ? 'ack { ok:true } — 1 credit, charged only now' : step >= 1 ? 'in flight — nothing charged yet' : 'pick a kind, press send'
  };
}
```

In `componentDidMount` add `this._pdAuto = setTimeout(() => this.pdSend(), 900);` and in `componentWillUnmount` add `clearTimeout(this._pdAuto); (this._pdTimers || []).forEach(clearTimeout); clearInterval(this._pdTick);`

- [ ] **Step 2: Fill the 5c card** (`width:1040px;background:#eef1f4;padding:34px 30px 30px;box-sizing:border-box`). Required elements:

- Header row: eyebrow `how it works — live` (mono 10.5px uppercase `#8b95a1`), title `Try it. Right here.` (Bricolage Grotesque 800, 34px, ink), right: the **stopwatch** — `font:600 26px 'IBM Plex Mono';color:#1d4ed8` showing `{{ pdMsLabel }}` over a mono 9px `round trip` caption.
- Three-zone bench grid `grid-template-columns:300px 1fr 300px;gap:20px;align-items:stretch`:
  - **Left — "your system" console** (white card, `border:1.5px solid #c6cdd6;border-radius:12px;padding:18px`): kind chips row — three `cursor:pointer;border:1.5px solid;border-radius:99px;padding:6px 14px;font:500 11px 'IBM Plex Mono';transition:all .25s` divs labeled `receipt` / `ticket` / `menu`, styles `{{ pdKindReceipt }}` etc., clicks `{{ pdPickReceipt }}` etc.; URL row (mono 10.5px, `#8b95a1`) `{{ pdUrl }}`; the **SEND keycap**: `onClick="{{ pdSend }}"` div, `background:#1d4ed8;color:#fff;font:600 15px 'Bricolage Grotesque';letter-spacing:.06em;text-align:center;padding:18px;border-radius:10px;box-shadow:0 6px 0 #0a1e66;cursor:pointer;transition:all .12s;{{ pdBtnStyle }}` with `style-active="transform:translateY(4px);box-shadow:0 2px 0 #0a1e66"`, label `SEND`; the flying **request chip** positioned at the card's right edge: `border:1.5px solid #1d4ed8;color:#1d4ed8;border-radius:8px;padding:5px 10px;font:500 10px 'IBM Plex Mono';transition:all .5s cubic-bezier(.4,0,.2,1);{{ pdChip }}` label `{ url } →`.
  - **Middle — cloud gate**: outlined panel with mono caption `ditto cloud`, two check rows (`key ✓ scope devices:trigger`, `box online ✓`), and the credit chip `border:1.5px solid;border-radius:99px;padding:4px 12px;font:500 10px 'IBM Plex Mono';transition:all .3s;{{ pdHold }}` label `1 credit · held`; status line `{{ pdNote }}` (Inter 12px `#5c6570`).
  - **Right — box + phone**: device mock (white face, outline, screen area with the 84px QR grid `<sc-for list="{{ pdQr }}" …>` wrapped in `transition:all .4s;{{ pdQrStyle }}`, caption `till 2 · dev_8f21`); the **phone** sliding over its lower half, `transition:all .5s cubic-bezier(.4,0,.2,1);{{ pdPhone }}` (bezel + `{{ pdPhoneTitle }}` / `{{ pdPhoneLine }}` + skeleton bars); ack line under it `font:500 10px 'IBM Plex Mono';color:#0f7a54;transition:opacity .4s;{{ pdAckStyle }}` text `ack { ok:true } · settled`.

- [ ] **Step 3: Run the checker** → exit 0.

- [ ] **Step 4: Browser-verify** — card auto-plays once ~0.9s after load; pressing SEND: keycap depresses (`:active`), chip flies, hold chip lights cobalt, QR appears, stopwatch counts and stops at 900–1200ms, phone slides up with the chosen kind's page, ack settles; changing kind and re-sending yields a different QR and page copy; double-click during flight is ignored (`pdRunning` guard); reduced-motion emulation jumps straight to the final state.

- [ ] **Step 5: Commit** *(conditional)* — `git add "Blip Site.dc.html" && git commit -m "feat(t5): 5c press send — interactive live demo"`

---

### Task 5: Integration pass

**Files:**
- Modify: `Blip Site.dc.html` (fixes only)

- [ ] **Step 1: Cleanup audit** — confirm `componentWillUnmount` clears exactly: `_t`, `_stT`, mousemove listener (pre-existing), plus `_nbT`, `_pdAuto`, `_pdTimers[]`, `_pdTick`. Confirm no new `window` listeners were added without removal.

- [ ] **Step 2: Full checker + render pass** — checker exit 0; serve and load with console open: zero dc-runtime warnings (`[dc-runtime] … never resolved`), all three cards animate simultaneously without jank; 4a's own storyboard still runs below; anchors `#5a` `#5b` `#5c` scroll and highlight via `:target`.

- [ ] **Step 3: Spec verification checklist** — walk the spec's Verification section item by item (5a beat mapping, 5b loop/pause/kind rotation, 5c send/stopwatch/re-send, annotations legible at 100% zoom, reduced-motion static frames). Fix anything that fails, re-run Step 2.

- [ ] **Step 4: Commit** *(conditional)* — `git add -A && git commit -m "feat(t5): integration pass — cleanup, verification"`

---

## Self-Review (done at write time)

- **Spec coverage:** 5 beats + annotation table → Task 2 (5a copy/ANN), Task 3 (SUBS/TEL), Task 4 (pdNote/checks); two-layer audience → annotation/telemetry/mono layers in each; brandName default → Task 1; fonts → Task 1; reduced motion → Tasks 3–4 + Task 5 check; canvas conventions (`dv-*`, labels, `dv-next`) → Task 1; state prefixes/cleanup → Tasks 2–5. No gaps found.
- **Placeholder scan:** all copy, palettes, timings, and logic are concrete; markup steps enumerate required elements with exact styles/keys, visual polish is explicitly bounded latitude.
- **Type consistency:** key names in template steps match the `saVals`/`nbVals`/`pdVals` return objects; `hash()` reused from the existing class; `this.rm` defined in Task 3, consumed in Task 4 (execution order preserves this).
