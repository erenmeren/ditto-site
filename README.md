# maratus

A palm-sized touchscreen that sits on the counter by the till. Your system sends
a link, the box shows a code, the customer scans it. One credit per code actually
shown.

This repo is the marketing site for it — plain HTML, one stylesheet, one vanilla
JS file. No build step, no dependencies, no framework.

**Live:** https://erenmeren.github.io/ditto-site/

## This branch

`gh-pages` is what GitHub Pages serves, and it carries the site and nothing else.

| path | what it is |
|---|---|
| `index.html` | the whole site on one page — hero, `#how`, `#try`, `#brand`, `#price`, `#faq`, `#pilot` |
| `docs.html` | the API reference |
| `how-it-works.html` | a redirect into `#how`, kept so old links still land |
| `assets/` | `style.css`, `site.js`, the device photo, favicon, OG image |
| `.nojekyll` | stops Pages putting the files through Jekyll |

Serve it over HTTP rather than opening the file directly:

    python3 -m http.server --directory .

The page reads fine with JavaScript off — `site.js` only adds the scroll
reveals, the deterministic fake QR, the live trigger demo and the branding
replay. The four-beat story band under `#how` is a pure-CSS clock, so it also
holds still under `prefers-reduced-motion` and still tells the truth standing.

## Other branches

| branch | what it is |
|---|---|
| `maratus-site` | the working repo — design canvas, the copy fact sheet, and the three-direction study under `maratus/` |
| `maratus-a` | direction A, "the display" — metaphor led |
| `maratus-b` | direction B, "maratus" — character led |
| `maratus-c` | direction C, "structural colour" — generative optics, no figure |

Only `gh-pages` is deployed. The three directions are a comparison study; each
one is `noindex` and none of them is live.

## What the page is allowed to claim

Every fact on the site is checked against the product code, not written from
memory:

- `POST /api/v1/devices/{id}/trigger`, Bearer API key, required
  `Idempotency-Key`, body `{ action: "show_qr", payload: { url } }`.
- The answer is `202 { id, status: "queued" }` and one credit goes on hold.
- The box puts the QR up and confirms back, and **that confirmation settles the
  credit — paid on show**. Scanning is free and happens last.
- A trigger the box never confirms expires, the hold is released, and a late code
  never appears on screen.
- The QR carries the caller's URL straight through. We never see what is behind
  the link.
- Layout and branding are pushed org-wide from the console, never from the
  caller's request.

The full list lives in `maratus/content.md` on the `maratus-site` branch; copy
changes go through it.

The deployed page still carries the earlier codename — the rename lands with the
new site.
