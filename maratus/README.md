# maratus — three directions

A comparison study, not a deployment. Nothing here is live and every page is
`noindex`. The shipped site is `../site/`.

    python3 -m http.server --directory .    # then open /index.html

- `a/` — "The Display": metaphor led, the figure used once
- `b/` — "Maratus": character led
- `c/` — "Structural colour": no figure, generative optics

`index.html` is the chooser — three links, each with its thesis and its risk,
set in nothing that belongs to any of the three. `REVIEW.md` is the written pass
over all three: what works, what does not, and what was fixed.

`content.md` is the fact sheet all three obey. `tools/shoot.sh` screenshots a
direction under plain, reduced-motion, and no-JS conditions at three widths;
`tools/check.sh` greps for banned copy, easing, and cross-direction references.
Both must pass before a direction is called done.

`tools/shoot.sh` never scrolls, so a scroll-triggered reveal below the fold is
captured at `opacity: 0` — present in the DOM, invisible in the PNG. Do not
read that as a broken design and do not delete the motion; two directions
did exactly that before `scrollshot.py` existed. For any page with
scroll-driven motion use:

    URL=http://localhost:8940/a/index.html OUT=/tmp/x maratus/tools/scrollshot.py walk

which walks the page so every observer fires, returns to the top, takes one
full-page shot, and reports anything still stuck at `opacity: 0` — that
remainder is a real bug. `frames` mode takes viewport screenshots at chosen
scroll offsets, for judging a moment rather than a document.

A captured PNG whose width equals the window width does NOT prove there is no
sideways scroll — Firefox captures the viewport width however far the document
overflows, so that check passes a broken page. Measure it:

    URL=http://localhost:8940/a/index.html maratus/tools/scrollshot.py overflow

which compares `scrollWidth` against `clientWidth` and tries to scroll right,
at 390/768/1024/1440/1920, and exits non-zero if any width moves.
