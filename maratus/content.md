# maratus — the fact sheet and three voices

This is the single source of copy truth for directions A, B and C. Three agents
build three complete sites from this file without talking to each other, so
everything either of them needs is here.

**How to read it.** Each of the seven sections states a **claim** — what must be
true on the page regardless of styling — and then three **treatments**, A, B and
C. The claim is identical in all three directions. Only the telling changes. A
treatment that drops part of its claim produces an incomplete direction, so each
treatment carries the whole substance of its section.

**Literals belong to the claim, not the voice.** Endpoint paths, JSON bodies,
status codes and numbers are quoted once under the claim and are used verbatim by
all three directions. Do not paraphrase them into prose.

**You may re-break the copy.** Headings, sub-headings, captions and button labels
are given, but a treatment's paragraph may be split across a page's composition.
Do not add claims that are not here.

---

## Locked facts

Everything the site says lives inside this list. It is code-verified. No
direction invents a claim, and no direction states one of these more loosely than
it is written here.

- The call is `POST /api/v1/devices/{id}/trigger`, authenticated with a Bearer API
  key, with a required `Idempotency-Key` header, body
  `{ action: "show_qr", payload: { url } }`.
- The answer is `202 { id, status: "queued" }`, and one credit goes on hold at
  that moment. The other documented answers are `401`, `403`
  (`insufficient_scope`), `409` (`device_offline`, raised before any hold is
  taken) and `429`.
- The box puts the QR on screen and confirms back. **That confirmation settles the
  credit — paid on show.** It takes a couple of seconds.
- If the box never confirms, the trigger expires, the hold is released, and a late
  code never appears on screen. **No duration is printed.**
- The QR carries the caller's URL directly. maratus never fetches, renders or
  stores what is behind it. The URL string itself *is* stored — so the site says
  **"we never see what's behind the link"**, and never "we don't store the link".
- Scanning is free and happens last. It does not settle the credit.
- `POST /api/v1/devices/{id}/pin` exists for durable codes; a pinned code spends a
  credit immediately, with no hold. `GET /api/v1/usage` exists. There is no status
  endpoint and no callback yet — say so plainly.
- Screen layout and branding are pushed org-wide from the console — every claimed
  box in every store — never from the caller's request.
- New organisations get a 50-credit starter grant. Per-device `flat` and
  `base_usage` subscription plans also exist, so never claim credits are the only
  path.
- Setup is zero-touch auto-claim only for factory-allocated serials; otherwise a
  six-character pairing code is typed into the console.

---

## Copy rules

These are gates, not preferences. A direction that breaks one is not done.

1. **British spelling throughout** — colours, organisation, recognise, behaviour,
   customise, catalogue, centre.
2. **Never print a duration.** Not in digits, not in words, not anywhere: no
   number of seconds, no "a minute", no countdown figure. There is no such rule in
   the product to state — how long a code stays on screen is a per-organisation
   setting, not a promise. Write the consequence instead: **if the box cannot put
   the code on screen, the credit comes back.** That sentence is true under every
   configuration and it is the part a shop owner cares about.
   - The fact sheet above records that the confirmation "takes a couple of
     seconds" because that is the verified round-trip. In page copy, state it as
     speed without a unit — "confirmation comes straight back", "the credit
     settles as the code lands" — never as a figure, and never as a claim about
     how long the code is up.
3. **Banned words.** The list below is written with a middle dot (U+00B7) through
   each word so that this file passes the same grep it imposes on the pages.

   ```text
   a·ck   a·cknowledgement   T·TL   p·latform
   e·xperience   i·nteraction   p·rogrammable   s·tateless
   ```

   **This block is guidance and is never page content.** Do not paste it, or any
   dotted word from it, into HTML, CSS, JS or a code comment — shipping U+00B7 to
   a browser is a worse defect than the one it prevents. Remove the dot to read
   each word, then never write it. In place of the first two, write "the box
   confirms" and "confirmation". `MQTT` may appear only in the `request` section,
   where the reader is explicitly a developer.
4. **Never mention NFC, cameras or scanners.** That hardware does not exist. The
   customer's own phone does the scanning.
5. **The privacy sentence is fixed in meaning.** "We never see what's behind the
   link." The pronoun may change to suit a voice — "maratus never sees what's
   behind the link" is fine — but it is never inverted into a storage claim. The
   link is stored, because the box has to be given something to show.
6. **No emoji anywhere.**
7. **No generic marketing register.** No "seamless", no "effortless", no
   "revolutionise", no three-adjective stacks, no rhetorical questions used as
   headings, no "unlock" or "supercharge".
8. **The name is lowercase** — `maratus` — including at the start of a sentence.
   The genus, when referred to as an animal, is *Maratus*, capitalised and
   italicised. The product is never "Maratus Ltd", never "the Maratus device"; it
   is "maratus", or "the box".
9. **The spider is a spine, not a mascot for every paragraph.** *Maratus* is the
   genus of the peacock spider; what earns the name is the behaviour — it raises
   an iridescent fan, performs a short and deliberate display, then folds it away.
   The box does the same: it raises a display, shows a code for a bounded moment,
   returns to idle, and the credit is paid for the display rather than for the
   scan. Name it explicitly only where a line genuinely earns it. **Direction A
   names it exactly once, in the specimen caption in `hero`, and nowhere else** —
   that caption is written out below, so A does not have to invent one. Direction
   B names it once, in the opening line of `hero`, and then lets the character do
   the work. Direction C never names it at all and carries it only in the optics.

## The three voices

- **A — The Display.** Measured, editorial, third person. Short declaratives, full
  stops where a lesser voice would use a dash. It describes; it does not sell. No
  exclamation, no second person, no "you". It is allowed one figurative line per
  section and no more.
- **B — Maratus.** Warm, second person, a little wry. It addresses the shop owner
  directly and is comfortable with a joke about till roll. The character may be
  referred to in the third person — "it opens its fan" — but never speaks in the
  first person and is never cute about money or failure.
- **C — Structural colour.** Terse, technical, near-caption. Sentence fragments
  are correct here. Numbers, endpoint names and state labels carry the weight.
  No metaphor at all. It uses the second person only possessively and only for
  things the reader's system owns — "your system", "your URL", "your keys" —
  never to address the reader as a person, and never with a verb of benefit or
  feeling. There is no "you get", no "you'll love", no "imagine".

---

## 1. `hero`

**Claim — locked.**

- The name is maratus. It is a palm-sized touchscreen that sits on the counter by
  the till, facing the customer.
- The shop's own system sends a link. The box shows a QR code. The customer scans
  it and keeps what is behind the link on their own phone.
- What is behind the link is a concrete object: a receipt, a ticket, a warranty, a
  menu. Never a category word.
- Nothing is printed. Instead of handing over paper, you hand over the thing
  itself.
- The display is bounded: it goes up, it does its work, it folds away, the box
  returns to idle.
- Two calls to action: a primary one to `pilot`, a secondary one down to
  `sequence`.

*Not a claim, a placement note: this is the section where the name gets explained,
and each direction does it differently under rule 9. A carries a specimen caption
beneath its drawing. B names the genus in its opening line. C does not name it at
all.*

**A — The Display**

> **Shown once, then folded away.**

maratus is a small touchscreen that sits on the counter, facing the customer. The
shop's own system sends it a link. The box raises a QR code on its screen, the
customer scans it with their own phone, and what was behind the link — a receipt,
a ticket, a warranty, a menu — is on that phone and stays there. Nothing is
printed. The display is bounded: it goes up, it does its work, it folds away, and
the box returns to idle.

- Primary: `Start a pilot` · Secondary: `See the sequence`
- Under-line, small: `a counter display for shops · trigger-only`
- Specimen caption, set beneath the drawing in the hero — **the one place
  direction A names the genus, and it is not repeated anywhere else on the page:**
  `*Maratus* · the peacock spider raises a fan, displays, folds it away.`

**B — Maratus**

> **Hand it over. Don't print it.**

There is a spider called *Maratus* that raises a fan of structural colour, holds
it up for exactly as long as the moment needs, and folds it away again. Your
counter can have one. You send the box a link — the receipt, the ticket, the
warranty, today's menu — and it raises a QR code for the customer standing in
front of it. They scan, they keep it, they leave. You keep a counter free of
curling till roll, and the box goes back to sitting there quietly.

- Primary: `Put one on your counter` · Secondary: `Watch it work`
- Under-line, small: `the small screen by your till`

**C — Structural colour**

> **maratus — counter display. trigger-only.**

Palm-sized touchscreen. Sits by the till, faces the customer. One POST from your
system, one QR on the glass, one scan by the customer's phone. Behind the code:
your URL — receipt, ticket, warranty, menu. On screen: for a bounded moment, then
idle. Paper: none.

- Primary: `PILOT` · Secondary: `SEQUENCE ↓`
- Under-line, small: `POST /trigger → QR → confirm → scan`

---

## 2. `object`

**Claim — locked.**

- The physical thing: a palm-sized touchscreen, on the counter, angled at the
  customer. It replaces the receipt printer's job, not the till.
- When it is not showing a code it shows the shop's own idle screen.
- Screen layout and branding are pushed org-wide from the console — every claimed
  box in every store at once — and never come from the caller's request. A
  developer cannot restyle the screen by changing the API call, and a shop cannot
  end up with one box looking different from another.
- The box has one job: display. It does not read, print, e-mail or store what the
  customer receives.
- No hardware beyond the screen is claimed. The customer's own phone does the
  scanning.

**A — The Display**

> **The object on the counter.**

The box is palm-sized, angled at the customer, and sits where the receipt printer
would sit. Between sales it shows the shop's own idle screen. That screen — the
layout, the logo, the colours — is set once in the console and pushed to every
claimed box in every store, so the boxes stay identical to each other. It never
comes from the call that triggers a code, which means no change to a developer's
request can alter what the shop looks like. The box does one thing. It displays —
a screen and nothing else. Reading the code is the customer's own phone's job, and
what the customer receives is never read, printed, e-mailed or kept by the box.

**B — Maratus**

> **It sits where the printer used to.**

It is small enough to palm and it points at whoever is paying. Between sales it
shows your idle screen — your name, your colours, whatever you set in the console
— and it holds that pose without being asked. Set the screen once and every
claimed box in every shop you run changes together; nobody has to walk round with
a laptop. The trigger your system sends cannot restyle anything, which is a
polite way of saying your developer cannot accidentally redesign your shop on a
Friday afternoon. It shows things. That is the whole job — it is a screen, nothing
more, and the reading is done by the phone already in your customer's hand. It
does not read, print, e-mail or keep what they walk out with.

**C — Structural colour**

> **The object.**

Palm-sized touchscreen. Counter-mounted, customer-facing. Occupies the receipt
printer's footprint, not the till's. Idle state: the organisation's own screen.
Layout and branding: set in the console, pushed org-wide to every claimed box in
every store. Not settable per request — the trigger carries a URL and nothing
else. Output: display only. No print path, no capture path, no delivery path.
Hardware: the screen. Reading is done by the customer's own phone. What the
customer receives is never read, printed, sent or retained by the device.

---

## 3. `sequence`

**Claim — locked.**

Four beats, in this order, with the credit's state at each one. No duration is
printed at any beat.

1. **trigger** — the shop's system POSTs to the box. The answer is
   `202 { id, status: "queued" }`. One credit goes **on hold**. Credit: held.
2. **show** — the command reaches the box and the box puts the QR on its screen.
   The QR carries the caller's URL directly. Credit: still held.
3. **confirm** — the box confirms back that the code is up. That confirmation is
   what settles the credit. **Paid on show.** Credit: spent.
4. **scan** — the customer scans and keeps what is behind the link. Scanning is
   free, happens last, and does not settle the credit. Credit: already spent.

Plus, stated on the same screen and not buried:

- If the box cannot put the code on screen, the trigger expires, the hold is
  released, and a late code never appears. **The credit comes back.**
- The customer scans with their own phone.
- Under reduced motion all four beats are visible at once; the story never depends
  on the animation running.

**A — The Display**

> **Four beats.**

The shop's system posts a trigger and the answer comes straight back: queued, with
one credit placed on hold. The command travels to the box, and the box raises the
code on its screen. The box then confirms that the code is up, and that
confirmation — not the sale, not the scan — is what settles the credit. Paid on
show. The customer scans last, with their own phone, and scanning costs nothing.
Nothing on the counter reads the code; the phone does. If the box cannot put
the code on screen, the trigger expires, the hold is released, the credit comes
back, and a late code never appears in front of somebody who has already left.

- Step labels: `trigger` · `show` · `confirm` · `scan`
- Credit labels: `held` · `held` · `spent` · `spent`
- Failure line: `no display, no charge — the hold is released and the code never
  appears late`

**B — Maratus**

> **What happens between the till and the phone.**

You send the trigger and you get an answer immediately: queued, one credit set
aside. The box wakes up and opens the code on its screen. Then it confirms back
that the code is really up — and that is the moment you are charged. Not when you
asked, and not when the customer scans. Paid on show, which is the only version
of this that is fair to you: if the box cannot put the code on screen, the trigger
expires, your credit comes back, and no code turns up later in front of nobody.
The customer lifting their own phone to the screen is the last thing that happens,
and it is free — you are not buying a scan, and there is nothing on your counter
doing the reading.

- Step labels: `you send` · `it opens` · `it confirms` · `they scan`
- Credit labels: `set aside` · `set aside` · `paid` · `paid — nothing further`
- Failure line: `nothing shown, nothing charged`

**C — Structural colour**

> **Sequence.**

`01 TRIGGER` — POST from your system. `202 { id, status: "queued" }`. Credit:
hold. `02 SHOW` — command reaches the device; QR on the glass, carrying your URL
directly. Credit: hold. `03 CONFIRM` — device confirms the display. Credit:
settled. Paid on show. `04 SCAN` — customer's phone, free, terminal. Credit:
unchanged. Failure path: no confirmation → trigger expires → hold released → no
late display.

- Step labels: `01 TRIGGER` · `02 SHOW` · `03 CONFIRM` · `04 SCAN`
- Credit labels: `HOLD` · `HOLD` · `SETTLED` · `SETTLED`
- Failure line: `NO DISPLAY → HOLD RELEASED → NO LATE CODE`

---

## 4. `demo`

**Claim — locked.**

- A working demonstration on the page: firing a trigger and watching a code land
  on a drawing of the box.
- It runs when it scrolls into view, not on page load.
- The QR is generated in the page and is deterministic. It is **not** a real code
  and no real device is involved. Say so, in the section, in plain words.
- The demo walks the same four beats as `sequence` and shows the credit changing
  from held to spent at the confirmation.
- No duration is shown or counted down.
- With JavaScript off, the section still shows a code on the box and reads as
  complete.

**A — The Display**

> **A trigger, on this page.**

The box below is a drawing and the code on it is generated here in the browser,
so nothing is triggered on real hardware and no credit is spent. Everything else
matches: the request goes out, the answer comes back queued with a credit held,
the code appears, the box confirms, and the credit settles on that confirmation.
The scan at the end is the customer's part and it is free.

- Button: `Fire a trigger`
- State captions: `queued — one credit held` · `on screen` · `confirmed — credit
  settled` · `scanned — free`
- Disclaimer: `Simulated. The code is drawn in your browser; no device is
  triggered and no credit is spent.`

**B — Maratus**

> **Try it here first.**

Press the button and watch the box do its one trick. It is a drawing, and the code
is made up on the spot in your browser — no real box wakes up and nothing comes
out of your balance. The order is the real order, though: the request goes, the
answer comes back with a credit set aside, the code opens on the screen, the box
confirms it is up, and that is the moment you would have paid. The scan is the
customer's job, and it is free.

- Button: `Show me`
- State captions: `queued — credit set aside` · `code's up` · `confirmed — that's
  the charge` · `scanned — free`
- Disclaimer: `A simulation. The code is drawn in your browser. No box is
  triggered, no credit is spent.`

**C — Structural colour**

> **Demo. Simulated.**

Fires on scroll into view. QR generated in-page, deterministic, from a fixed seed
— not a valid code, not a real device, no credit consumed. Beats and credit
states are the production ones: queued/hold, display, confirm/settled, scan/free.

- Button: `RUN TRIGGER`
- State captions: `202 QUEUED · HOLD` · `ON SCREEN` · `CONFIRMED · SETTLED` ·
  `SCANNED · FREE`
- Disclaimer: `SIMULATED — in-page QR, deterministic seed, no device, no credit.`

---

## 5. `request`

**Claim — locked.**

Developer-facing. This is the only section where `MQTT` may appear.

Shared literals, used verbatim by all three directions:

```http
POST /api/v1/devices/{id}/trigger
Authorization: Bearer <api-key>
Idempotency-Key: <your-key>
Content-Type: application/json

{ "action": "show_qr", "payload": { "url": "https://your-shop.example/r/8f21" } }
```

```json
202 { "id": "trg_...", "status": "queued" }
```

| code | meaning |
| --- | --- |
| `202` | queued, one credit on hold |
| `401` | no or bad API key |
| `403` | `insufficient_scope` — the key is not allowed to trigger this device |
| `409` | `device_offline` — raised before any hold is taken |
| `429` | too many requests |

- The `Idempotency-Key` header is required, not optional. A retry with the same
  key does not fire a second display.
- The command travels over MQTT to the box; the box puts the QR up and confirms
  back. That confirmation settles the credit.
- The QR carries the caller's URL directly. **We never see what's behind the
  link.** maratus does not fetch it, render it or store it. The link itself is
  held, because the box has to be given something to show.
- `POST /api/v1/devices/{id}/pin` pins a durable code. A pinned code spends a
  credit immediately, with no hold.
- `GET /api/v1/usage` reports what has been spent.
- **There is no status endpoint and no callback yet.** State it plainly, do not
  soften it, do not promise a date.

**A — The Display**

> **One call.**

One authenticated POST, one required idempotency key, one URL in the body. The
answer is immediate — queued, with a credit held — and the command travels over
MQTT to the box, which puts the code up and confirms. A `409 device_offline` is
raised before any hold is taken, so an unreachable box never costs anything. The
QR carries the caller's URL directly; maratus never sees what's behind the link,
and never fetches or renders it. `pin` puts up a durable code, which spends a
credit immediately rather than holding one. `usage` reports what has been spent.
There is no status endpoint and no callback yet: today, a caller triggers and does
not receive a result.

**B — Maratus**

> **What your developer has to write.**

One POST with your key, an idempotency key so a retry cannot show the same code
twice, and the link you want on screen. The answer comes back immediately —
queued, a credit set aside — and the command goes over MQTT to the box, which puts
the code up and confirms. If the box is offline you get a `409` before anything is
held, so an unplugged box never costs you. The code carries your link exactly as
you sent it: we never see what's behind it, we do not open it, and we do not draw
it. If you need a code that stays put rather than one shown for a moment, `pin`
does that and takes its credit straight away. `usage` tells you what you have
spent. Two honest gaps: there is no status endpoint and no callback yet, so once
you have triggered, we do not call you back.

**C — Structural colour**

> **The request.**

`POST /api/v1/devices/{id}/trigger`. Bearer key. `Idempotency-Key` required —
retry-safe, no double display. Body: `{ action, payload.url }`. Answer:
`202 { id, status: "queued" }`, credit held. `401` bad key. `403`
`insufficient_scope`. `409` `device_offline`, raised pre-hold — offline costs
nothing. `429` rate-limited. Transport: MQTT to the device. Device displays,
device confirms, credit settles. URL passed through to the code verbatim; never
fetched, never rendered — we never see what's behind the link. Also:
`POST /api/v1/devices/{id}/pin`, durable, credit spent immediately, no hold.
`GET /api/v1/usage`. Not shipped: status endpoint, callback. Trigger is
fire-and-confirm, one way.

---

## 6. `terms`

**Claim — locked.**

- **Paid on show.** A credit is held when the trigger is accepted and settles when
  the box confirms the display. That is the only thing that settles it.
- Scanning is free. A code that is scanned ten times costs the same as one that is
  scanned never.
- If the code cannot be shown, the hold is released and the credit comes back.
- A pinned code is the exception: it spends a credit immediately, with no hold,
  because it is meant to stay up.
- New organisations start with a **50-credit starter grant**.
- Credits are not the only path. Per-device subscription plans exist — `flat` and
  `base_usage` — for boxes that run all day.
- `GET /api/v1/usage` shows what has been spent.

**A — The Display**

> **Paid on show.**

A credit is held when the trigger is accepted and settles when the box confirms
that the code is on screen. Nothing else settles it. A code nobody scans costs the
same as a code scanned ten times, and a code that never reaches the screen costs
nothing at all — the hold is released and the credit comes back. Pinned codes are
the exception: they are meant to stay up, so they spend their credit immediately.
New organisations start with fifty credits. For boxes that run all day there are
per-device subscription plans, `flat` and `base_usage`, so credits are not the
only way to pay. What has been spent is readable at any time from
`GET /api/v1/usage`.

**B — Maratus**

> **You pay when it's on the glass.**

The credit is set aside when you trigger and taken when the box confirms the code
is actually up. That is the only thing that takes it. Nobody scanned it? Same
price. Scanned five times? Same price. Box could not show it? The hold is released
and you have your credit back — you are never billed for a display that did not
happen. The one exception is a pinned code, which is meant to stay up, so it takes
its credit there and then. You start with fifty credits to spend on finding out
whether this suits you, and if a box ends up busy all day there are per-device
plans — `flat` and `base_usage` — that work out better than counting. Either way,
`GET /api/v1/usage` tells you what you have spent whenever you want to know.

**C — Structural colour**

> **Credit.**

Hold on `202`. Settle on confirmation. Paid on show. Scan: free, unmetered, does
not settle. No display → hold released → balance restored. `pin`: immediate spend,
no hold, durable. New organisation: 50-credit starter grant. Alternative to
credits: per-device subscription plans, `flat` and `base_usage`. Reporting:
`GET /api/v1/usage`.

---

## 7. `pilot`

**Claim — locked.**

- The call to action: run a pilot on one counter.
- What arrives: a box, a console login, and API keys.
- Setup: boxes with factory-allocated serials claim themselves with no touch;
  otherwise a six-character pairing code is typed into the console.
- The 50-credit starter grant means the first pilot costs nothing to run.
- Branding is set in the console and pushed org-wide, so a second and third box
  match the first without a second setup.
- One honest note carried through: there is no status endpoint or callback yet.
- The form or contact route is the direction's own call, but the button label and
  the fields are given per voice.

**A — The Display**

> **Run it on one counter.**

A pilot is one box, one console login and a set of API keys. Boxes with
factory-allocated serials claim themselves as soon as they are powered up; any
other box is paired by typing a six-character code into the console. The starter
grant covers the first fifty displays, which is enough to find out whether
customers take the code without being asked twice. When a second box arrives, the
screen it shows is the one already set in the console.

- Button: `Request a pilot`
- Field labels: `Name` · `Organisation` · `Email` · `What would be behind the
  link?`
- Note: `No status endpoint or callback yet — worth knowing before you build
  against it.`

**B — Maratus**

> **Start with one counter.**

Tell us where the till is and we will get a box to it, with a console login and
your keys. If it came from us with its serial already allocated, it claims itself
the moment you plug it in; if not, you type a six-character pairing code into the
console and that is the setup finished. Your fifty starter credits cover the first
fifty displays, which is plenty to learn whether people scan without being nudged.
Add a second box later and it wakes up wearing the screen you already set.

- Button: `Ask for a box`
- Field labels: `Your name` · `Your shop` · `Email` · `What would you put behind
  the link?`
- Note: `Fair warning: no status endpoint and no callback yet.`

**C — Structural colour**

> **Pilot.**

One device. One console login. API keys. Factory-allocated serial: zero-touch
auto-claim on power-up. Otherwise: six-character pairing code, typed into the
console. Starter grant: 50 credits, covers the pilot. Branding: set once, pushed
org-wide — device two matches device one with no second setup. Known gap: no
status endpoint, no callback.

- Button: `REQUEST DEVICE`
- Field labels: `NAME` · `ORGANISATION` · `EMAIL` · `URL BEHIND THE CODE`
- Note: `NOT SHIPPED: status endpoint, callback.`

---

## Appendix — nav, footer, meta

Small strings each direction needs. Same rules apply; no new claims.

**Nav labels**

| | A | B | C |
| --- | --- | --- | --- |
| `object` | The object | The box | OBJECT |
| `sequence` | The sequence | How it works | SEQUENCE |
| `demo` | Demo | Try it | DEMO |
| `request` | The request | For developers | API |
| `terms` | Credit | What it costs | CREDIT |
| `pilot` | Pilot | Get one | PILOT |

**Footer line**

- A — `maratus — a counter display for shops. Shown once, then folded away.`
- B — `maratus — the small screen by your till.`
- C — `maratus — counter display. trigger-only. paid on show.`

**Page title and meta description** (each page also carries
`<meta name="robots" content="noindex">`)

- A — `maratus — shown once, then folded away` /
  `A counter display for shops. Your system sends a link, the box shows a QR code,
  the customer keeps it.`
- B — `maratus — hand it over, don't print it` /
  `The small screen by your till. Send it a link and it shows your customer a code
  to scan.`
- C — `maratus — counter display, trigger-only` /
  `POST a URL, the device displays a QR code, the credit settles when the display
  is confirmed.`
