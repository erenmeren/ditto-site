/* ditto — redesign study.

   Three jobs. Everything hidden is scoped to .js in the stylesheet, so
   with scripting off the page still reads top to bottom. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- the drawing's QR block --------------------------------------
     Deterministic (FNV-1a seed + LCG), so the same cells every load —
     a drawing that reshuffles on refresh is a drawing nobody trusts. */
  const qr = document.getElementById('qr');
  if (qr) {
    let h = 2166136261;
    for (const ch of 'dev_8f21') { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    const rnd = () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
    const N = 11, S = 9.4, X0 = 240 - (N * S) / 2, Y0 = 118;
    const frag = document.createDocumentFragment();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (rnd() > 0.5) continue;
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      el.setAttribute('x', (X0 + c * S).toFixed(1));
      el.setAttribute('y', (Y0 + r * S).toFixed(1));
      el.setAttribute('width', S.toFixed(1));
      el.setAttribute('height', S.toFixed(1));
      el.setAttribute('class', 'qrcell');
      frag.appendChild(el);
    }
    qr.appendChild(frag);
  }

  /* ---- measure every stroke so it can draw itself -------------------
     --len is set from the real path length rather than a guess, so the
     dash never over- or under-runs on a resized viewBox. */
  document.querySelectorAll('.draw').forEach(el => {
    try {
      const len = Math.ceil(el.getTotalLength ? el.getTotalLength() : 0);
      if (len) el.style.setProperty('--len', len);
    } catch (_) { /* rect/line without getTotalLength — leave it to fade */ }
  });

  /* ---- reveal on entry ---------------------------------------------- */
  const targets = document.querySelectorAll('.up, .dwg, .seqsvg');
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    targets.forEach(el => io.observe(el));
  }

  /* ---- the narrative loop -------------------------------------------
     Five beats, driven by data-beat so every element and its caption
     stay in lockstep. It starts when it scrolls into view rather than on
     load — an explainer that has already finished by the time you reach
     it has explained nothing — and it stops when it leaves, so nothing
     runs off-screen. */
  const stage = document.querySelector('.stage');
  if (stage && !reduced) {
    const BEATS = [1250, 1450, 1500, 1000, 3000];  // ms each beat holds
    let timers = [], running = false;

    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    function play() {
      clear();
      running = true;
      stage.dataset.beat = '0';
      let t = 260;
      BEATS.forEach((hold, i) => {
        timers.push(setTimeout(() => { stage.dataset.beat = String(i + 1); }, t));
        t += hold;
      });
      timers.push(setTimeout(() => { running = false; }, t));
    }
    function stop() { clear(); running = false; }

    stage.querySelector('[data-replay]')?.addEventListener('click', play);

    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!running) play(); }
      else stop();
    }, { threshold: 0.35 }).observe(stage);
  } else if (stage) {
    stage.dataset.beat = '5';
  }

  /* ---- the scrub: scroll axis becomes the time axis -----------------
     One rAF loop drives every scroll-linked value on the page. Reading
     layout in the loop and writing in the same frame is deliberate:
     these are a handful of elements, and a second observer stack would
     cost more than it saved. */
  const scrub   = document.querySelector('.scrub');
  const svg     = document.querySelector('.seqsvg');
  const play    = document.querySelector('[data-play]');
  const clockEl = document.querySelector('[data-clock]');
  const statEl  = document.querySelector('[data-status]');
  const events  = svg ? [...svg.querySelectorAll('.ev')] : [];
  const tray    = document.querySelector('.tray');
  const trayImg = document.querySelector('.tray .plate img');
  const dwg     = document.querySelector('.hero .dwg');

  const X0 = 140, X1 = 880;          // the playhead's travel, in viewBox units
  /* The diagram is laid out for legibility, not to scale — everything
     interesting happens in the first two seconds and then the window is
     58 seconds of waiting. So the clock reads off the SAME anchors the
     drawn axis is ticked with, piecewise. Mapping it linearly made the
     readout say 30 s at the point the axis itself labels "≈ 2 s", which
     is the page contradicting its own drawing. */
  const AXIS = [[190, 0], [470, 2], [820, 60]];
  function clockAt(x) {
    if (x <= AXIS[0][0]) return 0;
    if (x >= AXIS[2][0]) return 60;
    for (let i = 0; i < AXIS.length - 1; i++) {
      const [xa, ta] = AXIS[i], [xb, tb] = AXIS[i + 1];
      if (x <= xb) return ta + (tb - ta) * ((x - xa) / (xb - xa));
    }
    return 60;
  }
  const STAGES = [                   // x threshold -> what the system is doing
    [190, 'queued'], [255, 'credit held'], [300, 'command out'],
    [430, 'code on screen'], [470, 'acknowledged'], [520, 'settled']
  ];

  // window fill sits behind everything, so it is inserted once, up front
  let fill = null;
  if (svg) {
    fill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    fill.setAttribute('class', 'winfill');
    fill.setAttribute('x', 300); fill.setAttribute('y', 36); fill.setAttribute('height', 176);
    fill.setAttribute('width', 0);
    svg.insertBefore(fill, svg.querySelector('.winln'));
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  let tx = 0, ty = 0, ptrX = 0, ptrY = 0;   // eased pointer, not bound directly
  let ticking = false;

  function frame() {
    ticking = false;
    if (!reduced) {
      /* --- the diagram --- */
      if (scrub && svg) {
        const r = scrub.getBoundingClientRect();
        const span = r.height - innerHeight;
        const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
        const x = lerp(X0, X1, p);
        if (play) play.style.transform = `translateX(${x.toFixed(1)}px)`;
        if (fill) fill.setAttribute('width', Math.max(0, Math.min(520, x - 300)).toFixed(1));
        events.forEach(el => el.classList.toggle('hit', x >= +el.dataset.at));
        scrub.classList.toggle('live', p > 0.002 && p < 0.999);
        scrub.classList.toggle('done', p > 0.05);
        if (clockEl) {
          const t = clockAt(x);
          clockEl.textContent = 't = ' + (t < 10 ? t.toFixed(1) : t.toFixed(0)) + ' s';
        }
        if (statEl) {
          let label = 'idle';
          for (const [at, name] of STAGES) if (x >= at) label = name;
          if (statEl.textContent !== label) statEl.textContent = label;
        }
      }
      /* --- two shallow planes, both well under ±16px --- */
      if (dwg) {
        const r = dwg.getBoundingClientRect();
        dwg.style.transform = `translateY(${(-(r.top + r.height / 2 - innerHeight / 2) * 0.022).toFixed(2)}px)`;
      }
      if (trayImg) {
        const r = trayImg.getBoundingClientRect();
        trayImg.style.transform = `translateY(${(-(r.top + r.height / 2 - innerHeight / 2) * 0.030).toFixed(2)}px) scale(1.06)`;
      }
      /* --- pointer tilt, eased toward rather than bound --- */
      if (tray) {
        tx = lerp(tx, ptrX, 0.09); ty = lerp(ty, ptrY, 0.09);
        tray.style.transform = `perspective(900px) rotateX(${(-ty * 3).toFixed(2)}deg) rotateY(${(tx * 3.4).toFixed(2)}deg)`;
        if (Math.abs(tx - ptrX) > 0.001 || Math.abs(ty - ptrY) > 0.001) request();
      }
    }
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  if (!reduced) {
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request, { passive: true });
    if (tray && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      tray.addEventListener('pointermove', e => {
        const r = tray.getBoundingClientRect();
        ptrX = (e.clientX - r.left) / r.width - .5;
        ptrY = (e.clientY - r.top) / r.height - .5;
        tray.classList.add('tilting');
        request();
      });
      tray.addEventListener('pointerleave', () => { ptrX = ptrY = 0; tray.classList.remove('tilting'); request(); });
    }
    request();
  }

  /* ---- the masthead only grows a rule once it has something to divide */
  const mast = document.getElementById('mast');
  if (mast) {
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px';
    document.body.prepend(sentinel);
    new IntersectionObserver(([e]) => {
      mast.classList.toggle('stuck', !e.isIntersecting);
    }).observe(sentinel);
  }
})();
