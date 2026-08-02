/* ditto site — QR fill, scroll story, live demo, theme picker.
   Vanilla JS; all visual states are CSS-driven via data-* attributes. */
(() => {
  'use strict';
  const rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Deterministic fake QR (FNV-1a seed + LCG), same trick as the design canvas. */
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  function fillQr(el, seed, fg, bg) {
    let h = hash(seed || 'x');
    const rnd = () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
    el.replaceChildren();
    for (let i = 0; i < 169; i++) {
      const d = document.createElement('div');
      d.style.background = rnd() > 0.52 ? (fg || '#111413') : (bg || '#ffffff');
      el.appendChild(d);
    }
  }
  document.querySelectorAll('.qr[data-seed]').forEach(el =>
    fillQr(el, el.dataset.seed, el.dataset.fg, el.dataset.bg));

  /* Scroll story: scroller position -> data-beat on .story (CSS does the rest). */
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

  /* Live demo: SEND -> staged data-step timeline + real-millisecond stopwatch. */
  document.querySelectorAll('.demo').forEach(demo => {
    const send = demo.querySelector('.keycap');
    const watch = demo.querySelector('.stopwatch');
    const urlEl = demo.querySelector('.demo-url');
    const note = demo.querySelector('.demo-note');
    const qr = demo.querySelector('.device-lg .qr');
    const pageTitle = demo.querySelector('.phone-overlay h4');
    const pageLine = demo.querySelector('.phone-overlay .line');
    const PAGES = {
      receipt: { title: 'Your receipt', line: 'total 7.00 · returns 30 days' },
      ticket: { title: 'Row F · Seat 12', line: 'doors 19:30' },
      menu: { title: "Today's menu", line: 'kitchen closes 21:00' }
    };
    let timers = [], tick = null, seed = 0;
    const kind = () => demo.dataset.kind || 'receipt';
    const setNote = t => { if (note) note.textContent = t; };

    demo.querySelectorAll('.kind').forEach(btn => btn.addEventListener('click', () => {
      demo.dataset.kind = btn.dataset.kind;
      demo.querySelectorAll('.kind').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      if (urlEl) urlEl.textContent = 'https://yourshop.example/' + btn.dataset.kind + '/8f21';
      const p = PAGES[btn.dataset.kind];
      if (pageTitle) pageTitle.textContent = p.title;
      if (pageLine) pageLine.textContent = p.line;
    }));

    function run() {
      if (demo.dataset.running === 'true') return;
      timers.forEach(clearTimeout); clearInterval(tick);
      seed++;
      if (qr) fillQr(qr, 'demo' + kind() + seed);
      const total = 900 + Math.floor(Math.random() * 300);
      if (rm) { demo.dataset.step = '4'; if (watch) watch.textContent = total + ' ms'; setNote('ack { ok:true } — 1 credit, charged only now'); return; }
      const t0 = performance.now();
      demo.dataset.step = '0';
      demo.dataset.running = 'true';
      setNote('in flight — nothing charged yet');
      tick = setInterval(() => { if (watch) watch.textContent = String(Math.round(performance.now() - t0)).padStart(3, '0') + ' ms'; }, 30);
      timers = [
        setTimeout(() => { demo.dataset.step = '1'; }, 30),
        setTimeout(() => { demo.dataset.step = '2'; }, 260),
        setTimeout(() => { demo.dataset.step = '3'; }, 640),
        setTimeout(() => {
          clearInterval(tick);
          demo.dataset.step = '4';
          demo.dataset.running = 'false';
          if (watch) watch.textContent = total + ' ms';
          setNote('ack { ok:true } — 1 credit, charged only now');
        }, total)
      ];
    }
    if (send) send.addEventListener('click', run);
    if (demo.dataset.autoplay === 'true') setTimeout(run, 900);
  });

  /* Theme picker: buttons set CSS variables on every .themed root on the page. */
  const THEMES = {
    'warm-cafe': { accent: '#B4541F', bg: '#FAF6F0', fg: '#2B211A', muted: '#9A8B7D' },
    'minimal-mono': { accent: '#111827', bg: '#FFFFFF', fg: '#111827', muted: '#9CA3AF' },
    'bold-retail': { accent: '#E5484D', bg: '#FFF8F7', fg: '#27191A', muted: '#A18C8D' },
    'fresh-market': { accent: '#3F9D4E', bg: '#F5FAF4', fg: '#1B2A1D', muted: '#87977F' }
  };
  function applyTheme(id) {
    const t = THEMES[id];
    if (!t) return;
    document.querySelectorAll('.themed').forEach(root => {
      root.style.setProperty('--t-bg', t.bg);
      root.style.setProperty('--t-fg', t.fg);
      root.style.setProperty('--t-accent', t.accent);
      root.style.setProperty('--t-muted', t.muted);
      root.querySelectorAll('.qr[data-themed]').forEach(el => fillQr(el, 'theme' + id + (el.classList.contains('small') ? 's' : ''), t.fg, t.bg));
    });
    document.querySelectorAll('.pill[data-theme]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.theme === id)));
  }
  document.querySelectorAll('.pill[data-theme]').forEach(btn =>
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme)));
  if (document.querySelector('.pill[data-theme]')) applyTheme('warm-cafe');
})();
