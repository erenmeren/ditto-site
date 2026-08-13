/* maratus — direction C.
 *
 * Three jobs, in this order of importance:
 *   1. feed the optical field with scroll progress and pointer position
 *   2. run the simulated trigger when the demo scrolls into view
 *   3. accept the pilot request
 *
 * None of it is load-bearing. Every state this file produces is also the
 * resting state in the stylesheet, so the page reads the same with the script
 * removed — minus the field, which is decoration and disappears with it. */

import { createField } from './art/field.js';

const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

root.classList.add('js');
window.__c = 1;               /* tells the head script the module arrived */

/* ── the optical field ─────────────────────────────────────────────────── */

const plates = Array.from(document.querySelectorAll('.plate[data-field]'));
const fields = [];

/* Two specimens of the same film. The slit is short and wide, so its ring
 * family is cropped to a set of vertical arcs; a coarser, calmer thickness map
 * keeps those arcs ordered instead of chopping them up. */
const PROFILE = {
  hero: {},
  band: { feature: 90, thickSwing: 200 }
};

if (plates.length && document.createElement('canvas').getContext) {
  root.classList.add('has-field');   /* the plates have a size only now */
  for (const plate of plates) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    plate.insertBefore(canvas, plate.firstChild);
    const opts = Object.assign({ seed: Number(plate.dataset.seed) || 7 }, PROFILE[plate.dataset.field] || {});
    fields.push({ plate, canvas, field: createField(canvas, opts) });
  }
}

if (fields.length) {
  if (reduced) {
    /* one frame, at a fixed phase, for ever */
    for (const f of fields) f.field.setScroll(0.35);
  } else {
    for (const f of fields) f.field.start();

    let queued = false;
    let pointer = null;

    const feed = () => {
      queued = false;
      const span = document.documentElement.scrollHeight - window.innerHeight;
      const t = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;
      for (const f of fields) {
        f.field.setScroll(t);
        if (pointer) {
          const r = f.canvas.getBoundingClientRect();
          if (r.width && r.height) {
            f.field.setPointer((pointer[0] - r.left) / r.width, (pointer[1] - r.top) / r.height);
          }
        }
      }
    };
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(feed); } };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('pointermove', (e) => { pointer = [e.clientX, e.clientY]; schedule(); }, { passive: true });
    feed();
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { for (const f of fields) f.field.resize(); }, 140);
  }, { passive: true });
}

/* ── arrivals ──────────────────────────────────────────────────────────── */
/* Three arrivals on the whole page, not one per block. This list used to hold
 * nineteen selectors — every heading, table, figure and form — which is the
 * blanket fade-up the spec exists to prevent: a motion that is not specific to
 * the thing it reveals is decoration, and decoration on this grid reads as a
 * template. What is left are the three objects whose arrival means something:
 * the two optical plates, which are drawn rather than laid out and would
 * otherwise pop in the frame the canvas becomes ready, and the beats, which is
 * where the credit changes state. Everything else is simply present.
 *
 * Three independent guarantees that nothing can be left stranded at opacity 0,
 * because that failure is invisible in a screenshot and fatal on the page:
 *   1. the armed state exists only while .armed is on <html>, which only this
 *      file sets, so no-script and pre-script are never hidden;
 *   2. a rect sweep — on load and on every scroll and resize — reveals
 *      anything that has reached the viewport, whether or not the observer
 *      fired, so the observer is an optimisation rather than a dependency;
 *   3. a hard timeout unarms the document outright.
 * A full-page screenshot tool that never scrolls will therefore capture a
 * complete page, and so will a reader who scrolls. */

const REVEAL = ['.plate--hero', '.beats', '.plate--band'].join(', ');

if (!reduced) {
  const items = Array.from(document.querySelectorAll(REVEAL));

  if (items.length) {
    /* No stagger: three arrivals on the whole page, each in its own section,
       so there is nothing to stagger against. */
    for (const el of items) el.classList.add('rv');

    root.classList.add('armed');
    void root.offsetHeight;   /* flush, so the first reveal transitions rather than snapping */

    const pending = new Set(items);
    const show = (el) => {
      if (!pending.delete(el)) return;
      el.classList.add('in');
    };
    const sweep = () => {
      const h = window.innerHeight || 0;
      for (const el of Array.from(pending)) {
        const r = el.getBoundingClientRect();
        if (r.top < h * 0.92 && r.bottom > -h * 0.25) show(el);
      }
    };

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.unobserve(entry.target);
          show(entry.target);
        }
      }, { rootMargin: '0px 0px -8% 0px' });
      for (const el of items) io.observe(el);
    }

    let armedFrame = false;
    const schedule = () => {
      if (armedFrame) return;
      armedFrame = true;
      requestAnimationFrame(() => { armedFrame = false; sweep(); });
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    requestAnimationFrame(sweep);          /* whatever is already in view, now */
    setTimeout(() => { for (const el of Array.from(pending)) show(el); }, 7000);
    setTimeout(() => root.classList.remove('armed'), 7400);   /* last resort */
  }
}

/* ── the simulated trigger ─────────────────────────────────────────────── */

const fig = document.querySelector('.demo-fig');
const steps = Array.from(document.querySelectorAll('#states li'));
const runBtn = document.getElementById('run');

if (fig && steps.length) {
  let timers = [];

  const clear = () => { for (const t of timers) clearTimeout(t); timers = []; };

  const settle = () => {
    clear();
    for (const li of steps) li.classList.add('on');
    fig.classList.add('armed', 'shown');
  };

  const run = () => {
    if (reduced) { settle(); return; }
    clear();
    for (const li of steps) li.classList.remove('on');
    fig.classList.remove('armed', 'shown');
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    at(120, () => { steps[0].classList.add('on'); fig.classList.add('armed'); });
    at(780, () => { steps[1].classList.add('on'); fig.classList.add('shown'); });
    at(1460, () => { steps[2].classList.add('on'); });
    at(2180, () => { steps[3].classList.add('on'); });
  };

  if (runBtn) runBtn.addEventListener('click', run);

  if (reduced) {
    settle();
  } else if ('IntersectionObserver' in window) {
    /* fires on arrival, not on load */
    const demoIo = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        demoIo.disconnect();
        run();
      }
    }, { threshold: 0.35 });
    demoIo.observe(document.getElementById('demo'));
  } else {
    settle();
  }
}

/* ── pilot request ─────────────────────────────────────────────────────── */

const form = document.getElementById('form');
const note = document.getElementById('note');

if (form && note) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    note.textContent = 'RECORDED IN THIS PAGE ONLY — NOTHING IS SENT. NOT SHIPPED: STATUS ENDPOINT, CALLBACK.';
  });
}
