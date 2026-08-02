/* ditto site — hybrid voice. QR fill, scroll story, live trigger demo,
   brand colour picker. States are CSS-driven via data-* attributes. */
(() => {
  'use strict';
  const rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Deterministic fake QR (FNV-1a seed + LCG). */
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  function fillQr(el, seed, fg, bg) {
    let h = hash(seed || 'x');
    const rnd = () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
    el.replaceChildren();
    for (let i = 0; i < 169; i++) {
      const d = document.createElement('div');
      d.style.background = rnd() > 0.52 ? (fg || '#16150f') : (bg || '#ffffff');
      el.appendChild(d);
    }
  }
  document.querySelectorAll('.qr[data-seed]').forEach(el => fillQr(el, el.dataset.seed));

  /* Scroll story -> data-beat on .story. */
  document.querySelectorAll('.story').forEach(story => {
    const sc = story.querySelector('.story-scroller');
    if (!sc) return;
    sc.addEventListener('scroll', () => {
      const beats = sc.children.length - 1;
      const b = Math.max(0, Math.min(beats, Math.round(sc.scrollTop / sc.clientHeight)));
      if (String(b) !== story.dataset.beat) {
        story.dataset.beat = String(b);
        const qr = story.querySelector('.box-mock .qr');
        if (qr) fillQr(qr, 'story' + b);
      }
    }, { passive: true });
  });

  /* Live trigger demo: staged log lines + real request shape, ~1.5-2.2 s ack
     (measured production ack latency is ~1.9 s). */
  document.querySelectorAll('.demo-band').forEach(band => {
    const log = band.querySelector('.terminal-log');
    const msEl = band.querySelector('[data-ms]');
    const kindEl = band.querySelector('[data-kind]');
    const qr = band.querySelector('.panel-qr .qr');
    const send = band.querySelector('.keycap');
    if (!log || !send) return;
    const KINDS = ['receipt', 'ticket', 'menu', 'warranty'];
    let n = 0, timers = [];
    /* Each line: [actor, text, extra css class]. Actor-labelled plain English,
       with the raw request kept as one dim line for developers. */
    function put(lines) {
      log.replaceChildren();
      lines.forEach(([a, t, cls]) => {
        const d = document.createElement('div');
        if (cls) d.className = cls;
        const s = document.createElement('span');
        s.className = 'actor';
        s.textContent = a;
        d.appendChild(s);
        d.appendChild(document.createTextNode(t));
        log.appendChild(d);
      });
    }
    function run() {
      timers.forEach(clearTimeout);
      n++;
      const kind = KINDS[n % 4];
      const ms = 1500 + Math.floor(Math.random() * 700);
      if (kindEl) kindEl.textContent = kind;
      const L = [
        ['you', '$ show this ' + kind + ' on till 2'],
        ['', 'POST /api/v1/devices/dev_8f21/trigger · 202 queued', 'dim'],
        ['cloud', 'your key ✓ · till 2 is on ✓ · 1 credit on hold'],
        ['box', 'code on screen — confirming…'],
        ['cloud', '✓ shown · ' + ms + ' ms · credit spent — paid on show', 'ok']
      ];
      const showQr = () => { if (qr) { fillQr(qr, 'demo' + n); qr.classList.add('shown'); } };
      const done = () => {
        put(L);
        if (msEl) msEl.textContent = ms + ' ms';
        showQr();
      };
      if (rm) { done(); return; }
      put(L.slice(0, 2));
      if (qr) qr.classList.remove('shown');
      timers = [
        setTimeout(() => put(L.slice(0, 3)), 350),
        setTimeout(() => { put(L.slice(0, 4)); showQr(); }, 850),
        setTimeout(done, ms)
      ];
    }
    send.addEventListener('click', run);
    setTimeout(run, 700);
  });

  /* Branding studio: a looping replay of an editing session — logo and text
     dragged onto the screen, then real console theme presets repainting
     background, text and accent together. A theme click hands control over. */
  const THEMES = {
    'warm-cafe': { accent: '#B4541F', bg: '#FAF6F0', fg: '#2B211A', muted: '#9A8B7D' },
    'minimal-mono': { accent: '#111827', bg: '#FFFFFF', fg: '#111827', muted: '#9CA3AF' },
    'midnight': { accent: '#9B8CFF', bg: '#121217', fg: '#F2F1FA', muted: '#8E8CA3' },
    'espresso': { accent: '#E8A33D', bg: '#1A1410', fg: '#F5EFE6', muted: '#9C8E7C' }
  };
  const ORDER = ['warm-cafe', 'midnight', 'espresso', 'minimal-mono'];
  document.querySelectorAll('.studio').forEach(studio => {
    const screen = studio.querySelector('.studio-screen');
    const ghost = studio.querySelector('.drag-ghost');
    const status = studio.querySelector('[data-status]');
    const logo = studio.querySelector('.pc-logo');
    const text = studio.querySelector('.pc-text');
    const pills = document.querySelectorAll('.theme-pill');
    let timers = [], userTook = false, paused = false;

    function applyTheme(id) {
      const t = THEMES[id];
      if (!t) return;
      screen.style.setProperty('--p-bg', t.bg);
      screen.style.setProperty('--p-fg', t.fg);
      screen.style.setProperty('--p-accent', t.accent);
      screen.style.setProperty('--p-muted', t.muted);
      pills.forEach(p => p.setAttribute('aria-pressed', String(p.dataset.theme === id)));
    }
    function say(t) { if (status) status.textContent = t; }
    function fly(fromSel, label, done) {
      const from = studio.querySelector(fromSel);
      if (!from || !ghost) { done(); return; }
      const a = from.getBoundingClientRect(), b = screen.getBoundingClientRect(), s = studio.getBoundingClientRect();
      ghost.textContent = label;
      ghost.style.transition = 'none';
      ghost.style.transform = 'translate(' + (a.left - s.left) + 'px,' + (a.top - s.top) + 'px)';
      ghost.classList.add('flying');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        ghost.style.transition = '';
        ghost.style.transform = 'translate(' + (b.left - s.left + b.width / 2 - 24) + 'px,' + (b.top - s.top + b.height / 2 - 12) + 'px) rotate(-4deg)';
      }));
      timers.push(setTimeout(() => { ghost.classList.remove('flying'); done(); }, 750));
    }
    function reset() {
      logo.classList.remove('on'); text.classList.remove('on');
      logo.style.opacity = ''; text.style.opacity = '';
      studio.dataset.step = '0';
    }
    function loop() {
      if (userTook) return;
      if (paused) { timers.push(setTimeout(loop, 800)); return; }
      reset();
      applyTheme(ORDER[0]);
      say('the studio, replaying —');
      timers.push(
        setTimeout(() => { studio.dataset.step = '1'; say('drag the logo anywhere on the 720 × 720 canvas'); fly('.tray-chip[data-obj="logo"]', 'logo', () => logo.classList.add('on')); }, 900),
        setTimeout(() => { studio.dataset.step = '2'; say('drop text — it snaps where you put it'); fly('.tray-chip[data-obj="text"]', 'text', () => text.classList.add('on')); }, 3100),
        setTimeout(() => { studio.dataset.step = '3'; say('a theme repaints background, text and accent together'); applyTheme(ORDER[1]); }, 5400),
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
      logo.classList.add('on'); text.classList.add('on');
      applyTheme(p.dataset.theme);
      say('your theme — one save away from every box');
    }));
    if (rm) {
      logo.classList.add('on'); text.classList.add('on');
      applyTheme(ORDER[0]);
      say('a theme repaints background, text and accent together');
      return;
    }
    loop();
  });
})();
