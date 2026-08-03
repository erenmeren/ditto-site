# ditto — marketing site & design canvas

Design home of the marketing site for **ditto**, the digital-receipt box (product implementation: [`erenmeren/ditto-admin`](https://github.com/erenmeren/ditto-admin)). This repo is local-only; nothing in it is published except the contents of `site/`.

**Live site:** https://erenmeren.github.io/ditto-site/ — served from the `gh-pages` branch of the separate public repo `erenmeren/ditto-site`.

## Layout

| Path | What it is |
|---|---|
| `site/` | The shipped static site — single-page `index.html` + `docs.html` (API reference). No build step. |
| `Blip Site.dc.html` | The design canvas — every design iteration as review turns, newest first ("blip" was an early codename). |
| `device-photos/` | Source sheets for the device image + the idle-screen HTML used in the composite. |
| `github.md` | Sync log against the product repo. |
| `docs/reviews/` | Internal review notes (gitignored, never pushed). |

## Working on it

```sh
# preview the site
python3 -m http.server --directory site

# preview the canvas (needs network for React UMD + fonts)
python3 -m http.server
```

Deploy = copy `site/*` into a temp clone of `erenmeren/ditto-site`'s `gh-pages` branch, commit, push.

## House rules

- Everything tracked here is **English-only**; Turkish notes live untracked in `docs/reviews/`.
- Site copy must match the code-verified product facts (trigger-only model, 60 s TTL, paid on show) — see `CLAUDE.md`.
- The brand name is a placeholder (`ditto`) — the naming decision is deferred.
- No platform-speak on the site: the expansion story is told with concrete objects only (see the positioning rule in `CLAUDE.md`).
