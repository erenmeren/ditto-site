/* field.js — the optical field.
 *
 * A thin-film interference model. Not a texture, not noise: the colour at every
 * point is computed from the optical path difference through a film of varying
 * thickness, integrated across the visible spectrum with CIE colour-matching
 * functions and converted to sRGB. Hues are therefore emergent — nothing here
 * samples a palette. What you see is the same physics that makes an oil slick,
 * a soap film and a beetle's shell shift colour as the surface tilts.
 *
 * The picture it has to produce is an ORDERED one: concentric families of
 * fringes, order after order, with the fringe sequence readable as a sequence.
 * That comes from the smooth curvature of the film (`lens`); the seeded
 * roughness (`thickSwing`) only distorts those families into something
 * organic. Roughness much larger than curvature is the failure mode — the
 * orders stop lining up and the plate degenerates into a coloured noise wash,
 * which is a heat map, not an interference pattern.
 *
 * Three inputs move the pattern:
 *   seed     the film's thickness map (fixed for the life of the page)
 *   scroll   a thickness grade, walking every fringe up through its orders
 *   pointer  the observer's position, so the viewing angle — and with it the
 *            path difference — changes across the surface
 *
 * Determinism: given a seed, a size, a scroll value and a pointer position, the
 * output is bit-identical. There is no time term and no Math.random anywhere.
 *
 *   const f = createField(canvas, { seed: 7 });
 *   f.setScroll(0.35);   // renders one frame immediately
 *   f.start();           // rAF loop; only redraws when an input has moved
 */

/* ---- seeded generator ------------------------------------------------- */

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Tileable value noise on a G x G lattice, smoothstep-interpolated. */
function lattice(rand, g) {
  const v = new Float32Array(g * g);
  for (let i = 0; i < v.length; i++) v[i] = rand();
  return v;
}

function smooth(t) { return t * t * (3 - 2 * t); }

function sampleLattice(v, g, x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = smooth(x - xi), fy = smooth(y - yi);
  const x0 = ((xi % g) + g) % g, y0 = ((yi % g) + g) % g;
  const x1 = (x0 + 1) % g, y1 = (y0 + 1) % g;
  const a = v[y0 * g + x0], b = v[y0 * g + x1];
  const c = v[y1 * g + x0], d = v[y1 * g + x1];
  return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy;
}

/* ---- spectrum -> sRGB lookup ------------------------------------------ */

/* Multi-lobe Gaussian fits to the CIE 1931 2-degree observer. */
function lobe(x, mu, s1, s2) {
  const t = (x - mu) / (x < mu ? s1 : s2);
  return Math.exp(-0.5 * t * t);
}
function cieX(l) { return 1.056 * lobe(l, 599.8, 37.9, 31.0) + 0.362 * lobe(l, 442.0, 16.0, 26.7) - 0.065 * lobe(l, 501.1, 20.4, 26.2); }
function cieY(l) { return 0.821 * lobe(l, 568.8, 46.9, 40.5) + 0.286 * lobe(l, 530.9, 16.3, 31.1); }
function cieZ(l) { return 1.217 * lobe(l, 437.0, 11.8, 36.0) + 0.681 * lobe(l, 459.0, 26.0, 13.8); }

const OPD_MAX = 20000;  /* nanometres of path difference the table covers.
                           Wide enough that the film never runs off the end of
                           it: a clamped table shows up as a flat white patch.
                           Twenty-odd orders fit inside this, which is what lets
                           a fringe sequence repeat across the plate instead of
                           one order filling it. */
const LUT_N = 10240;

/* reflectance of a thin film at path difference `opd`, integrated to sRGB.
 * Returns three Uint8 tables — one lookup per pixel at render time. */
function buildLut(gain, saturation, contrast, stack) {  /* gain is linear exposure */
  const R = new Uint8ClampedArray(LUT_N);
  const G = new Uint8ClampedArray(LUT_N);
  const B = new Uint8ClampedArray(LUT_N);

  const lam = [], wx = [], wy = [], wz = [];
  let norm = 0;
  /* 2 nm steps, not 5: at twenty orders the reflectance oscillates fast enough
     in wavelength that a coarse sum aliases, and aliasing here reads as false
     colour in the high fringes. */
  for (let l = 390; l <= 730; l += 2) {
    lam.push(l); wx.push(cieX(l)); wy.push(cieY(l)); wz.push(cieZ(l));
    norm += cieY(l);
  }

  for (let i = 0; i < LUT_N; i++) {
    const opd = (i / (LUT_N - 1)) * OPD_MAX;
    let X = 0, Y = 0, Z = 0;
    for (let k = 0; k < lam.length; k++) {
      /* half the phase difference; the pi shift on external reflection is
       * folded in, so a vanishing film is dark rather than white. */
      const s = Math.sin(Math.PI * opd / lam[k]);
      const s2 = s * s;
      /* Two surfaces give sin^2: a broad, sleepy fringe that spends half its
       * life half-lit, which is why a plain soap-film model averages to a grey
       * wash. What actually makes a spider, a beetle or a mussel shell
       * iridescent is a stack of many layers, and a stack resonates — the
       * maxima sit in exactly the same places, but each one is narrow. Raising
       * the fringe to a power is that narrowing: same physics, sharper stack.
       * It is also what keeps the plate dark, because a narrow peak has a low
       * mean, so the field reads as ruled bands of light over black. */
      const r = stack > 1 ? Math.pow(s2, stack) : s2;
      X += wx[k] * r; Y += wy[k] * r; Z += wz[k] * r;
    }
    X /= norm; Y /= norm; Z /= norm;

    /* XYZ -> linear sRGB */
    let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
    let g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
    let b = 0.0557 * X - 0.2040 * Y + 1.0570 * Z;
    r = Math.max(0, r); g = Math.max(0, g); b = Math.max(0, b);

    /* Higher orders wash out to grey — true of a real film, but this page is
     * dark, so the mid-tones are pushed down while the fringe peaks are kept.
     * Contrast and exposure in linear light, saturation about the luminance. */
    r = Math.pow(r, contrast) * gain;
    g = Math.pow(g, contrast) * gain;
    b = Math.pow(b, contrast) * gain;
    let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = Math.max(0, lum + (r - lum) * saturation);
    g = Math.max(0, lum + (g - lum) * saturation);
    b = Math.max(0, lum + (b - lum) * saturation);

    /* A spectral reflectance is regularly outside the sRGB gamut. Clipping it
     * channel by channel is what turns a film into poster paint, so instead
     * desaturate towards its own luminance until it fits. */
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const peak = Math.max(r, g, b);
    if (peak > 1) {
      if (lum >= 1) {
        const k = 1 / lum; r *= k; g *= k; b *= k; lum = 1;
      }
      const f = (1 - lum) / (Math.max(r, g, b) - lum);
      r = lum + (r - lum) * f; g = lum + (g - lum) * f; b = lum + (b - lum) * f;
    }

    const enc = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
    R[i] = enc(r); G[i] = enc(g); B[i] = enc(b);
  }
  return { R, G, B };
}

/* ---- the field --------------------------------------------------------- */

export function createField(canvas, opts = {}) {
  const o = Object.assign({
    seed: 7,
    scale: 1,           /* render resolution as a fraction of CSS pixels */
    maxWidth: 1600,     /* hard cap on the render buffer's width */
    index: 1.36,        /* refractive index of the film */
    thickBase: 30,      /* nm — the film thins to nothing in places, and goes black there */
    /* The balance between these two is the whole picture. `lens` is the smooth
       curvature of the film, and it is what produces ORDERED, concentric ring
       families — a real Newton's-rings figure, order after order. `thickSwing`
       is the seeded roughness on top, and it only distorts those rings into
       something organic. Roughness larger than curvature is the failure mode:
       the orders stop lining up and the plate collapses into a noise wash. */
    thickSwing: 220,    /* nm of thickness variation across the map */
    feature: 60,        /* CSS pixels per lattice cell at the first octave */
    lattice: 24,        /* noise lattice resolution */
    octaves: 4,
    lens: 9000,         /* nm of extra thickness at the far corner: Newton rings.
                           Sixteen-odd orders across the plate, so the fringe
                           sequence repeats and can be read as a sequence. */
    striae: 5,          /* nm of fine lamellar corrugation */
    striaePeriod: 4,    /* CSS pixels per lamella */
    gradeMin: 0.70,     /* the film is thinnest at the top of the page ... */
    gradeSpan: 0.55,    /* ... and this much thicker at the bottom of it */
    shape: 1.2,         /* biases the map thin, so the black regions are broad */
    gain: 0.30,       /* exposure in linear light: a real film is not a poster */
    saturation: 0.70,
    contrast: 2.30,   /* linear-light contrast: keeps the peaks, drops the wash */
    stack: 3,         /* 1 = two surfaces; higher = a multilayer stack, narrower fringes */
    ease: 0.11,
    pointer: [0.66, 0.34]  /* resting observer position, in unit coords */
  }, opts);

  const ctx = canvas.getContext('2d', { alpha: true });
  const buf = document.createElement('canvas');
  const bctx = buf.getContext('2d', { alpha: false });
  const lut = buildLut(o.gain, o.saturation, o.contrast, o.stack);

  let rw = 0, rh = 0, cw = 0, ch = 0, dpr = 1;
  let thickness = null;      /* Float32Array, nm, seed-dependent only */
  let image = null;
  let running = false, raf = 0, primed = false, dirty = true;

  let scrollTarget = 0, scrollNow = 0;
  let px = o.pointer[0], py = o.pointer[1];      /* eased, unit coords */
  let pxT = px, pyT = py;

  function cssSize() {
    const r = canvas.getBoundingClientRect();
    let w = Math.round(r.width) || canvas.width || 300;
    let h = Math.round(r.height) || canvas.height || 150;
    return [w, h];
  }

  /* The thickness map: a few octaves of seeded value noise. Depends on the
   * seed and the buffer size and nothing else, so it is built once. */
  function buildThickness() {
    const rand = mulberry32(o.seed * 2654435761 % 4294967296 | 0);
    /* `feature` is CSS pixels per lattice cell, not render pixels: the film has
       to look the same on a retina screen as on a plain one. */
    const cells = Math.max(1, cw || rw) / o.feature;
    const zoom = rw / Math.max(1, cw || rw);
    const layers = [];
    for (let k = 0; k < o.octaves; k++) {
      layers.push({
        v: lattice(rand, o.lattice),
        f: cells * Math.pow(2, k) * (0.9 + rand() * 0.3),
        a: Math.pow(0.42, k),
        ox: rand() * 100,
        oy: rand() * 100
      });
    }
    let amp = 0;
    for (const l of layers) amp += l.a;

    thickness = new Float32Array(rw * rh);
    const asp = rh / rw;   /* keep the noise square whatever shape the plate is */
    const striaeK = 2 * Math.PI / Math.max(1, o.striaePeriod * zoom);
    for (let y = 0; y < rh; y++) {
      const v = (y / rh) * asp;
      for (let x = 0; x < rw; x++) {
        const u = x / rw;
        let n = 0;
        for (const l of layers) {
          n += l.a * sampleLattice(l.v, o.lattice, u * l.f + l.ox, v * l.f + l.oy);
        }
        n = Math.pow(n / amp, o.shape);
        /* lamellar corrugation: the fine parallel structure that makes a
         * grating a grating. Small, but it is what stops this reading as a wash. */
        const lam = o.striae * Math.sin((y + x * 0.18) * striaeK);
        thickness[y * rw + x] = o.thickBase + n * o.thickSwing + lam;
      }
    }
  }

  function resize() {
    const [w, h] = cssSize();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (w === cw && h === ch) return;
    cw = w; ch = h;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    /* Render at the backing store's own resolution wherever that fits under
       the cap. An upscale here is a low-pass filter, and the thing it filters
       away first is the fringe — which is the whole picture. */
    rw = Math.max(1, Math.min(o.maxWidth, Math.round(canvas.width * o.scale)));
    rh = Math.max(1, Math.round(rw * (canvas.height / Math.max(1, canvas.width))));
    buf.width = rw; buf.height = rh;
    image = bctx.createImageData(rw, rh);
    buildThickness();
    dirty = true;
  }

  function render() {
    if (!thickness || !image) return;
    const data = image.data;
    const n = o.index;
    const cx = px * rw, cy = py * rh;
    /* observer distance, in render pixels: sets how fast the angle opens out */
    const dist = rw * 0.78;
    const dist2 = dist * dist;
    const lensK = o.lens / (rw * rw + rh * rh);
    const grade = o.gradeMin + scrollNow * o.gradeSpan;
    const last = LUT_N - 1;

    let i = 0;
    for (let y = 0; y < rh; y++) {
      const dy = y - cy, dy2 = dy * dy;
      for (let x = 0; x < rw; x++, i++) {
        const dx = x - cx;
        const r2 = dx * dx + dy2;

        /* viewing angle at this point, then Snell into the film */
        const cosI2 = dist2 / (dist2 + r2);
        const sinI2 = 1 - cosI2;
        const cosR = Math.sqrt(1 - sinI2 / (n * n));

        /* the grade multiplies the whole film, curvature included, so scroll
           walks every fringe up through its orders rather than only wobbling
           the noise on top of a fixed ring family */
        const d = (thickness[i] + lensK * r2) * grade;
        let opd = 2 * n * d * cosR;
        if (opd < 0) opd = 0;

        let k = (opd * (last / OPD_MAX)) | 0;
        if (k > last) k = last;

        const p = i << 2;
        data[p] = lut.R[k];
        data[p + 1] = lut.G[k];
        data[p + 2] = lut.B[k];
        data[p + 3] = 255;
      }
    }
    bctx.putImageData(image, 0, 0);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(buf, 0, 0, rw, rh, 0, 0, canvas.width, canvas.height);
    dirty = false;
  }

  function frame() {
    if (!running) return;
    const ds = scrollTarget - scrollNow;
    const dx = pxT - px, dy = pyT - py;
    if (Math.abs(ds) > 1e-4 || Math.abs(dx) > 1e-4 || Math.abs(dy) > 1e-4) {
      scrollNow += ds * o.ease;
      px += dx * o.ease;
      py += dy * o.ease;
      dirty = true;
    } else if (dirty) {
      scrollNow = scrollTarget; px = pxT; py = pyT;
    }
    if (dirty) render();
    raf = requestAnimationFrame(frame);
  }

  function prime() {
    if (primed) return;
    primed = true;
    resize();
  }

  return {
    /* t runs 0..1. Before start() this settles instantly and draws one frame,
     * which is what the reduced-motion path relies on. */
    setScroll(t, pointer) {
      prime();
      scrollTarget = Math.min(1, Math.max(0, t));
      if (pointer) this.setPointer(pointer[0], pointer[1]);
      if (!running) { scrollNow = scrollTarget; render(); }
    },
    /* x and y in unit coordinates over the canvas, 0..1 */
    setPointer(x, y) {
      prime();
      pxT = Math.min(1.4, Math.max(-0.4, x));
      pyT = Math.min(1.4, Math.max(-0.4, y));
      if (!running) { px = pxT; py = pyT; render(); }
    },
    resize() { prime(); const w = cw, h = ch; resize(); if (w !== cw || h !== ch || dirty) render(); },
    start() { prime(); if (running) return; running = true; raf = requestAnimationFrame(frame); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
    get size() { return [rw, rh]; }
  };
}

export default createField;
