# maratus — marketing site & design canvas

Design home of the marketing site for **maratus**, the digital-receipt box
(product implementation: [`erenmeren/ditto-admin`](https://github.com/erenmeren/ditto-admin) —
not modified from here). The shipped site is `site/`; everything else in this
repo is the room it was designed in.

**Live site:** https://erenmeren.github.io/ditto-site/ — the `gh-pages` branch of
this repo's remote, `erenmeren/ditto-site`.

## Layout

| Path | What it is |
|---|---|
| `site/` | The shipped static site — single-page `index.html` + `docs.html` (API reference). No build step. |
| `maratus/` | The three-direction study: `a/` the display, `b/` the character, `c/` structural colour, plus `content.md` (the copy fact sheet all three obey) and `tools/` (screenshot + copy lint). A comparison, not a deployment — every page is `noindex`. |
| `Blip Site.dc.html` | The design canvas — every design iteration as review turns, newest first ("blip" was an early codename). |
| `device-photos/` | Source sheets for the device image + the idle-screen HTML used in the composite. |
| `github.md` | Sync log against the product repo. |
| `docs/superpowers/` | Specs and plans behind the bigger turns. |
| `docs/reviews/` | Internal review notes (gitignored, never pushed). |

## Working on it

```sh
# preview the shipped site
python3 -m http.server --directory site

# preview the three directions, then open /a/, /b/, /c/
python3 -m http.server --directory maratus

# preview the canvas (needs network for React UMD + fonts)
python3 -m http.server
```

A direction is only done once `maratus/tools/check.sh` (banned copy, easing,
cross-direction references) and a scrolled screenshot pass agree:

```sh
URL=http://localhost:8940/a/index.html OUT=/tmp/x maratus/tools/scrollshot.py walk
URL=http://localhost:8940/a/index.html maratus/tools/scrollshot.py overflow
```

`shoot.sh` never scrolls, so a reveal below the fold is captured at `opacity: 0` —
that is the harness, not a broken design. `overflow` measures sideways scroll for
real; a PNG cannot prove its absence.

## Branches

`main` and the canvas stay local. `maratus-site` and `maratus-a/b/c` are pushed
to the public remote; `gh-pages` is the deployed site and holds `site/*` plus
`.nojekyll` and nothing else. To deploy, put the contents of `site/` on
`gh-pages` (a `git worktree` on that branch is the easiest way) and push.

## House rules

- Everything tracked here is **English-only**; Turkish notes live untracked in `docs/reviews/`.
- Site copy must match the code-verified product facts (trigger-only, one credit on hold, paid on show, the URL passes straight through) — the full list is `maratus/content.md`, and `CLAUDE.md` carries the rest of the working rules.
- No platform-speak: the expansion story is told with concrete objects only (see the positioning rule in `CLAUDE.md`).
