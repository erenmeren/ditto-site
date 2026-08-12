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

/* Two specimens of the same film. The slit is short and wide, so it is given a
 * finer thickness map and a lower grade — otherwise it crops one broad zone
 * and the fringes never get to repeat inside it. */
const PROFILE = {
  hero: {},
  band: { gradeMin: 0.42, gradeSpan: 0.5, feature: 120, lens: 240, shape: 1.9, contrast: 2.6 }
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
