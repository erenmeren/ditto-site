/* Three explainers. One tiny engine: each film is a list of beat
   durations, driven by data-beat so the drawing and its captions can
   never drift apart. Films start when they scroll into view and stop
   when they leave — an explainer that finished before you arrived has
   explained nothing, and one that keeps running off-screen is just
   burning battery. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SCRIPTS = {
    a: { beats: [1100, 1500, 1400, 1900, 1800] },
    b: { beats: [1400, 1600, 1500, 2000] },
    c: { beats: [1500, 1500, 1400, 1600, 2200] }
  };

  document.querySelectorAll('.film').forEach(film => {
    const key = film.dataset.film;
    const spec = SCRIPTS[key];
    if (!spec) return;

    if (reduced) { film.dataset.beat = String(spec.beats.length); return; }

    let timers = [], running = false;
    const clear = () => { timers.forEach(clearTimeout); timers = []; };

    function play() {
      clear();
      running = true;
      film.dataset.beat = '0';
      let t = 240;
      spec.beats.forEach((hold, i) => {
        timers.push(setTimeout(() => { film.dataset.beat = String(i + 1); }, t));
        t += hold;
      });
      timers.push(setTimeout(() => { running = false; }, t));
      if (key === 'b') runClock(t);
    }

    /* --- B only: a clock that actually counts, and two endings ---------
       The numbers are not decoration. In the failing run it has to reach
       60 and stop there, because that is the promise being demonstrated:
       the window closes and the hold comes back. */
    let raf = 0;
    function runClock(total) {
      cancelAnimationFrame(raf);
      const out = film.querySelector('[data-bigclock]');
      const state = film.querySelector('[data-credit]');
      const modeLab = film.querySelector('[data-mode-lab]');
      const runner = film.querySelector('.runner');
      const stops = [...film.querySelectorAll('.stop')];
      const fail = film.dataset.mode === 'fail';
      // seconds the run represents, and where the runner ends up
      const END_T = fail ? 60 : 2.4;
      const END_X = fail ? 860 : 700;
      const t0 = performance.now();
      if (modeLab) modeLab.textContent = fail ? 'box unplugged' : 'box online';

      (function tick(now) {
        const p = Math.min(1, (now - t0) / total);
        // ease the clock the way the run feels: quick at first, then the wait
        const e = fail ? p * p * 0.6 + p * 0.4 : p;
        const t = END_T * e;
        const x = 300 + (END_X - 300) * e;
        if (out) out.textContent = (t < 10 ? t.toFixed(1) : t.toFixed(0)) + 's';
        if (runner) runner.setAttribute('cx', x.toFixed(1));
        stops.forEach(s => {
          const cx = +s.querySelector('circle').getAttribute('cx');
          const reached = x >= cx - 1 && !(fail && cx === 520) && !(fail && cx === 700);
          s.classList.toggle('on', reached);
        });
        if (state) {
          const b = +film.dataset.beat;
          state.textContent = fail
            ? (b >= 4 ? 'released in full' : b >= 1 ? 'on hold' : 'available')
            : (b >= 3 ? 'spent — paid on show' : b >= 1 ? 'on hold' : 'available');
        }
        if (p < 1) raf = requestAnimationFrame(tick);
      })(performance.now());
    }

    film.querySelector('[data-replay]')?.addEventListener('click', play);
    film.querySelectorAll('[data-mode-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        film.dataset.mode = btn.dataset.modeBtn;
        play();
      });
    });

    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!running) play(); }
      else { clear(); cancelAnimationFrame(raf); running = false; }
    }, { threshold: 0.3 }).observe(film);
  });
})();
