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

  /* Brand colour picker: swatches set --b-color; the preview QR reseeds. */
  document.querySelectorAll('.swatch[data-color]').forEach(btn =>
    btn.addEventListener('click', () => {
      document.documentElement.style.setProperty('--b-color', btn.dataset.color);
      document.querySelectorAll('.swatch[data-color]').forEach(b =>
        b.setAttribute('aria-pressed', String(b === btn)));
      const hex = document.querySelector('[data-hex]');
      if (hex) hex.textContent = btn.dataset.color + ' · every box, one save';
      document.querySelectorAll('.panel-card .qr').forEach(el => fillQr(el, 'brand' + btn.dataset.color));
    }));
})();
