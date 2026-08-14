/* ditto — site behaviour. Shared by index.html and docs.html.

   Four jobs only. The storyboard clock is deliberately NOT here: it is
   pure CSS, so it keeps running off the main thread and cannot drift.

   1. deterministic fake QR fill
   2. scroll reveals (IntersectionObserver, once, staggered per group)
   3. the live trigger demo (staged log lines, real request shape)
   4. the branding-studio replay */
(() => {
  'use strict';

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- deterministic fake QR: FNV-1a seed + LCG ---------- */
  const hash = s => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  function fillQr(el, seed, fg, bg) {
    let h = hash(seed || 'x');
    const rnd = () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 169; i++) {
      const d = document.createElement('div');
      d.style.background = rnd() > 0.52 ? (fg || '#16150f') : (bg || '#ffffff');
      frag.appendChild(d);
    }
    el.replaceChildren(frag);
  }
  document.querySelectorAll('.qr[data-seed]').forEach(el => fillQr(el, el.dataset.seed));

  /* ---------- scroll reveals ----------
     Elements carrying .rv / .rv-x / .rv-drop resolve once, when they cross
     into view. Siblings inside a [data-stagger] group get 60 ms steps —
     long enough to read as a cascade, short enough not to feel slow. */
  const revealables = document.querySelectorAll('.rv, .rv-x, .rv-drop');
  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(el => el.classList.add('in'));
  } else {
    document.querySelectorAll('[data-stagger]').forEach(group => {
      const step = Number(group.dataset.stagger) || 60;
      group.querySelectorAll(':scope > .rv, :scope > .rv-x, :scope > .rv-drop')
        .forEach((el, i) => { if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i * step) + 'ms'); });
    });
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealables.forEach(el => io.observe(el));
  }

  /* ---------- the live trigger demo ----------
     The log narrates in plain English with the raw request kept as one dim
     line. Ack latency is randomised around the ~1.9 s measured in
     production, so the number on screen is never a rounder lie than the
     real thing. */
  document.querySelectorAll('.demo').forEach(band => {
    const log = band.querySelector('.terminal-log');
    const msEl = band.querySelector('[data-ms]');
    const kindEl = band.querySelector('[data-kind]');
    const qr = band.querySelector('.panel-qr .qr');
    const send = band.querySelector('.keycap');
    if (!log || !send) return;

    const KINDS = ['receipt', 'ticket', 'menu', 'warranty'];
    let n = 0, timers = [];

    function put(lines) {
      const frag = document.createDocumentFragment();
      lines.forEach(([actor, text, cls]) => {
        const row = document.createElement('div');
        if (cls) row.className = cls;
        const a = document.createElement('span');
        a.className = 'actor';
        a.textContent = actor;
        row.appendChild(a);
        row.appendChild(document.createTextNode(text));
        frag.appendChild(row);
      });
      log.replaceChildren(frag);
    }

    function run() {
      timers.forEach(clearTimeout);
      n++;
      const kind = KINDS[n % KINDS.length];
      const ms = 1500 + Math.floor(Math.random() * 700);
      if (kindEl) kindEl.textContent = kind;

      const lines = [
        ['you', '$ show this ' + kind + ' on till 2'],
        ['', 'POST /api/v1/devices/dev_8f21/trigger · 202 queued', 'dim'],
        ['cloud', 'your key ✓ · till 2 is on ✓ · 1 credit on hold'],
        ['box', 'code on screen — confirming…'],
        ['cloud', '✓ shown · ' + ms + ' ms · credit spent — paid on show', 'ok']
      ];
      const showQr = () => { if (qr) { fillQr(qr, 'demo' + n); qr.classList.add('shown'); } };
      const settle = () => {
        put(lines);
        if (msEl) msEl.textContent = ms + ' ms';
        showQr();
      };

      if (reduced) { settle(); return; }

      put(lines.slice(0, 2));
      if (qr) qr.classList.remove('shown');
      timers = [
        setTimeout(() => put(lines.slice(0, 3)), 350),
        setTimeout(() => { put(lines.slice(0, 4)); showQr(); }, 850),
        setTimeout(settle, ms)
      ];
    }

    send.addEventListener('click', run);
    /* Fire once when the demo first scrolls into view, not on page load —
       otherwise the whole thing has already played by the time you reach it. */
    if (reduced || !('IntersectionObserver' in window)) {
      run();
    } else {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          obs.disconnect();
          setTimeout(run, 250);
        });
      }, { threshold: 0.35 });
      io.observe(band);
    }
  });

  /* ---------- branding studio ----------
     A looping replay of an editing session: logo and text dragged onto the
     screen, then real console presets repainting background, text and accent
     together. Hovering pauses it; clicking a theme hands control over for
     good. The hex values are the actual presets from the console, not
     invented ones. */
  const THEMES = {
    'warm-cafe':    { accent: '#B4541F', bg: '#FAF6F0', fg: '#2B211A', muted: '#9A8B7D' },
    'minimal-mono': { accent: '#111827', bg: '#FFFFFF', fg: '#111827', muted: '#9CA3AF' },
    'midnight':     { accent: '#9B8CFF', bg: '#121217', fg: '#F2F1FA', muted: '#8E8CA3' },
    'espresso':     { accent: '#E8A33D', bg: '#1A1410', fg: '#F5EFE6', muted: '#9C8E7C' }
  };
  const ORDER = ['warm-cafe', 'midnight', 'espresso', 'minimal-mono'];

  document.querySelectorAll('.studio').forEach(studio => {
    const screen = studio.querySelector('.studio-screen');
    const ghost = studio.querySelector('.drag-ghost');
    const status = studio.querySelector('[data-status]');
    const logo = studio.querySelector('.pc-logo');
    const text = studio.querySelector('.pc-text');
    const pills = document.querySelectorAll('.theme-pill');
    if (!screen || !logo || !text) return;

    let timers = [], userTook = false, paused = false;

    const applyTheme = id => {
      const t = THEMES[id];
      if (!t) return;
      screen.style.setProperty('--p-bg', t.bg);
      screen.style.setProperty('--p-fg', t.fg);
      screen.style.setProperty('--p-accent', t.accent);
      screen.style.setProperty('--p-muted', t.muted);
      pills.forEach(p => p.setAttribute('aria-pressed', String(p.dataset.theme === id)));
    };
    const say = t => { if (status) status.textContent = t; };

    function fly(fromSel, label, done) {
      const from = studio.querySelector(fromSel);
      if (!from || !ghost) { done(); return; }
      const a = from.getBoundingClientRect();
      const b = screen.getBoundingClientRect();
      const s = studio.getBoundingClientRect();
      ghost.textContent = label;
      ghost.style.transition = 'none';
      ghost.style.transform = 'translate(' + (a.left - s.left) + 'px,' + (a.top - s.top) + 'px)';
      ghost.classList.add('flying');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        ghost.style.transition = '';
        ghost.style.transform = 'translate(' + (b.left - s.left + b.width / 2 - 24) + 'px,'
          + (b.top - s.top + b.height / 2 - 12) + 'px) rotate(-4deg)';
      }));
      timers.push(setTimeout(() => { ghost.classList.remove('flying'); done(); }, 750));
    }

    function reset() {
      logo.classList.remove('on');
      text.classList.remove('on');
      studio.dataset.step = '0';
    }

    function loop() {
      if (userTook) return;
      if (paused) { timers.push(setTimeout(loop, 800)); return; }
      reset();
      applyTheme(ORDER[0]);
      say('the studio, replaying —');
      timers.push(
        setTimeout(() => { studio.dataset.step = '1'; say('drag the logo anywhere on the 720 × 720 canvas');
          fly('.tray-chip[data-obj="logo"]', 'logo', () => logo.classList.add('on')); }, 900),
        setTimeout(() => { studio.dataset.step = '2'; say('drop text — it snaps where you put it');
          fly('.tray-chip[data-obj="text"]', 'text', () => text.classList.add('on')); }, 3100),
        setTimeout(() => { studio.dataset.step = '3'; say('a theme repaints background, text and accent together');
          applyTheme(ORDER[1]); }, 5400),
        setTimeout(() => applyTheme(ORDER[2]), 6700),
        setTimeout(() => { studio.dataset.step = '4'; say('saved → every box across your stores repaints'); }, 8000),
        setTimeout(loop, 10600)
      );
    }

    studio.addEventListener('mouseenter', () => { paused = true; });
    studio.addEventListener('mouseleave', () => { paused = false; });
    pills.forEach(p => p.addEventListener('click', () => {
      userTook = true;
      timers.forEach(clearTimeout);
      if (ghost) ghost.classList.remove('flying');
      studio.dataset.step = '0';
      logo.classList.add('on');
      text.classList.add('on');
      applyTheme(p.dataset.theme);
      say('your theme — one save away from every box');
    }));

    if (reduced) {
      logo.classList.add('on');
      text.classList.add('on');
      applyTheme(ORDER[0]);
      say('a theme repaints background, text and accent together');
      return;
    }
    loop();
  });
})();
