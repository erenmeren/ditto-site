/* maratus · direction A — "The Display"
   ---------------------------------------------------------------------
   Three jobs, and no fourth:

     1. the fan raise — writes --open on #hero from the hero's scroll
        position. Nothing else in this file writes --open.
     2. the sequence scrub — writes --b on #beats and lights one beat.
     3. the demo — regenerates the same deterministic code that is already
        in the markup, then walks the four beats when the section arrives.

   Under prefers-reduced-motion none of the three moves anything: the page
   keeps the resting state the stylesheet already draws, which is the fan
   open, the four beats all visible, and the code on the box. */

(function () {
  'use strict';

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ── 1 · the fan raise ─────────────────────────────────────────────
     Folded at the top of the page, fully open — 44° a side — by the time
     the hero has travelled about two thirds of its own height. The value
     is chased rather than snapped, so a flicked scroll wheel still reads
     as one continuous opening. */

  var hero = document.getElementById('hero');

  if (hero && !reduce) {
    var REST = 0.1;
    var cur = REST;
    var goal = REST;
    var frame = 0;

    hero.style.setProperty('--open', REST.toFixed(4));

    var measure = function () {
      var box = hero.getBoundingClientRect();
      var travel = Math.max(1, box.height * 0.62);
      goal = REST + (1 - REST) * clamp01(-box.top / travel);
    };

    var step = function () {
      cur += (goal - cur) * 0.17;
      if (Math.abs(goal - cur) < 0.0009) { cur = goal; }
      hero.style.setProperty('--open', cur.toFixed(4));
      frame = cur === goal ? 0 : requestAnimationFrame(step);
    };

    var nudge = function () {
      measure();
      if (!frame) { frame = requestAnimationFrame(step); }
    };

    window.addEventListener('scroll', nudge, { passive: true });
    window.addEventListener('resize', nudge);
    nudge();
  }

  /* ── 2 · the sequence scrub ───────────────────────────────────────── */

  var beats = document.getElementById('beats');

  if (beats && !reduce) {
    var items = [].slice.call(beats.querySelectorAll('.beat'));
    beats.classList.add('is-live');

    var scrub = function () {
      var box = beats.getBoundingClientRect();
      var top = window.innerHeight * 0.78;
      var bottom = window.innerHeight * 0.22;
      var span = Math.max(1, box.height + (top - bottom));
      var p = clamp01((top - box.top) / span);
      var b = p * (items.length - 1);

      beats.style.setProperty('--b', b.toFixed(3));

      var lit = Math.round(b);
      for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle('is-on', i === lit);
      }
    };

    var pending = 0;
    var queue = function () {
      if (pending) { return; }
      pending = requestAnimationFrame(function () { pending = 0; scrub(); });
    };

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    scrub();
  }

  /* ── 3 · the demo ──────────────────────────────────────────────────
     The code is a deterministic drawing, not a valid code: FNV-1a over a
     fixed seed, then an LCG for the modules. The markup already carries
     the identical path, which is what the page shows with no JavaScript. */

  var SEED = 'https://your-shop.example/r/8f21';
  var MODULES = 29;

  function qrPath(seed, n) {
    var h = 2166136261, i;
    for (i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var s = h || 1, d = '';
    function rnd() { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }
    function finder(ox, oy) {
      d += 'M' + ox + ' ' + oy + 'h7v7h-7z';
      d += 'M' + (ox + 1) + ' ' + (oy + 1) + 'h5v5h-5z';
      d += 'M' + (ox + 2) + ' ' + (oy + 2) + 'h3v3h-3z';
    }
    var res = [], x, y, k;
    for (y = 0; y < n; y++) {
      res[y] = [];
      for (x = 0; x < n; x++) {
        var quiet = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9) ||
                    (x >= n - 9 && x <= n - 4 && y >= n - 9 && y <= n - 4);
        res[y][x] = quiet ? 0 : (rnd() > 0.52 ? 1 : 0);
      }
    }
    for (k = 8; k < n - 8; k++) { res[6][k] = k % 2 ? 0 : 1; res[k][6] = k % 2 ? 0 : 1; }
    for (y = 0; y < n; y++) { for (x = 0; x < n; x++) { if (res[y][x]) { d += 'M' + x + ' ' + y + 'h1v1h-1z'; } } }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    d += 'M' + (n - 9) + ' ' + (n - 9) + 'h5v5h-5z';
    d += 'M' + (n - 8) + ' ' + (n - 8) + 'h3v3h-3z';
    d += 'M' + (n - 7) + ' ' + (n - 7) + 'h1v1h-1z';
    return d;
  }

  var rig = document.getElementById('demo-rig');
  var qr = document.getElementById('qr-path');
  var fire = document.getElementById('fire');

  if (qr) { qr.setAttribute('d', qrPath(SEED, MODULES)); }

  if (rig) {
    var log = [].slice.call(rig.querySelectorAll('.demo__log li'));
    var clocks = [];

    var stop = function () {
      for (var i = 0; i < clocks.length; i++) { clearTimeout(clocks[i]); }
      clocks = [];
    };

    var run = function () {
      stop();

      if (reduce) {
        rig.classList.remove('is-live');
        rig.removeAttribute('data-qr');
        return;
      }

      rig.classList.add('is-live');
      rig.setAttribute('data-qr', 'off');
      log.forEach(function (li) { li.classList.remove('is-on'); });

      [40, 820, 1680, 2620].forEach(function (at, i) {
        clocks.push(setTimeout(function () {
          log[i].classList.add('is-on');
          if (i === 1) { rig.setAttribute('data-qr', 'on'); }
        }, at));
      });
    };

    if (fire) { fire.addEventListener('click', run); }

    /* fires when it scrolls into view, not on load */
    if (window.IntersectionObserver) {
      var eye = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { eye.disconnect(); run(); }
        });
      }, { threshold: 0.4 });
      eye.observe(rig);
    }
  }

  /* ── the request slip ─────────────────────────────────────────────── */

  var slip = document.getElementById('pilot-form');
  var note = document.getElementById('pilot-note');

  if (slip) {
    slip.addEventListener('submit', function (e) {
      e.preventDefault();
      if (note) { note.textContent = 'Nothing was sent. This page is a design study.'; }
    });
  }
}());
