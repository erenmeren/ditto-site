/* maratus — direction B.
   Motion here is explanatory: it shows the order of the four beats. Every
   resting state that matters is already correct in app.css, so this file only
   ever *takes things away* and gives them back. With scripting off, the demo
   already shows a code on the box and the character with its fan open. */

/* The one function the character exposes. `name` is 'idle' | 'display' | 'paid'.
   All three drawings are inlined and stacked; this only swaps which one is
   opaque, and the wrapper carries a small shared lift so the three never
   drift out of register with each other. */
function setState(name) {
  var mar = document.getElementById('mar');
  if (!mar) return;
  if (name !== 'idle' && name !== 'display' && name !== 'paid') return;
  mar.setAttribute('data-state', name);
}

(function () {
  'use strict';

  var root = document.documentElement;
  var quiet = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var device = document.getElementById('demo-device');
  var log = document.getElementById('demo-log');
  var runBtn = document.getElementById('demo-run');
  var stage = document.querySelector('.stage');
  var lines = log ? [].slice.call(log.querySelectorAll('.log-line')) : [];
  var timers = [];
  var running = false;

  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

  function clearTimers() {
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    timers = [];
  }

  function light(step) {
    for (var i = 0; i < lines.length; i++) {
      if (Number(lines[i].getAttribute('data-step')) <= step) lines[i].classList.add('is-on');
      else lines[i].classList.remove('is-on');
    }
  }

  /* ── the demo ─────────────────────────────────────────────────────────── */

  function run() {
    if (!device || !log) return;
    clearTimers();
    running = true;

    log.classList.add('is-armed');
    light(-1);
    device.setAttribute('data-screen', 'idle');
    setState('idle');

    /* you send — the answer is immediate, the credit is set aside */
    at(360, function () { light(0); });

    /* it opens — the code lands and the fan goes up with it */
    at(1150, function () {
      device.setAttribute('data-screen', 'code');
      setState('display');
      light(1);
    });

    /* it confirms — the charge, and the fan settles */
    at(2050, function () {
      setState('paid');
      light(2);
    });

    /* they scan — free, and last */
    at(2900, function () {
      light(3);
      running = false;
    });
  }

  if (runBtn) runBtn.addEventListener('click', function () { run(); });

  /* ── arming ───────────────────────────────────────────────────────────── */

  /* Taking the page down to its starting state must not itself be an
     animation — a fade on load is a glitch, not motion. `is-instant` zeroes
     the durations until the browser has painted the armed state once. */
  if (!quiet && 'IntersectionObserver' in window) {
    root.classList.add('is-instant');
    root.classList.add('has-motion');

    if (device && log) {
      log.classList.add('is-armed');
      light(-1);
      device.setAttribute('data-screen', 'idle');
      setState('idle');
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.remove('is-instant'); });
    });

    /* Fires when it scrolls into view, not on load — and not at all when the
       reader has asked for less motion, which leaves the section at its
       resting state: code on the glass, fan open. */
    if (device && log && stage) {
      var demoWatch = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting && !running) {
            demoWatch.disconnect();
            run();
          }
        }
      }, { threshold: 0.4 });
      demoWatch.observe(stage);
    }
  }
})();
