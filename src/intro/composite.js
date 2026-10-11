// Photographic intro scene (replaces the 3D barrel scene): real sky footage, a real oak barrel with the
// shining gold Veritas brand, two real crystal glasses. The wine (body, surface, stream, drops) is drawn
// in SVG on top of the photos, so the pour can follow the real loading progress.
//   barrel descends → pours the LEFT glass → moves → pours the RIGHT glass → leaves → toast → onContact
import { gsap } from 'gsap';
import { asset, logo } from '../render/picture.js';

// Glass photo geometry (public/intro/glass.png, 767 × 1100 px).
const G = { w: 767, h: 1100, mouthX: 382, rimY: 14, bottomY: 640, fullY: 468, rimHalf: 127 };
const BOWL =
  'M256 300 L247 350 L240 400 L235 450 L230 500 L238 525 L245 550 L262 580 L300 615 L345 640 L380 646 L415 640 L460 615 L497 580 L512 550 L519 525 L526 500 L526 450 L522 400 L517 350 L509 300 L509 0 L256 0 Z';
const MIN_GLASS = 1.3; // seconds per glass at least
const clamp01 = (x) => Math.min(1, Math.max(0, x));

function glassHtml(side) {
  return `<div class="ic__glass ic__glass--${side}">
    <svg class="ic__wine" viewBox="0 0 ${G.w} ${G.h}" aria-hidden="true">
      <defs>
        <clipPath id="bowl-${side}"><path d="${BOWL}"/></clipPath>
        <linearGradient id="wine-${side}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#2a0309"/><stop offset=".35" stop-color="#6b0d1f"/><stop offset=".6" stop-color="#7d1226"/><stop offset="1" stop-color="#2a0309"/>
        </linearGradient>
        <radialGradient id="surf-${side}" cx=".45" cy=".4" r=".7">
          <stop offset="0" stop-color="#b8283f"/><stop offset=".7" stop-color="#5c0a18"/><stop offset="1" stop-color="#2a0309"/>
        </radialGradient>
      </defs>
      <g clip-path="url(#bowl-${side})"><g class="ic__liquid">
        <rect class="ic__body" x="0" y="${G.bottomY}" width="${G.w}" height="${G.h}" fill="url(#wine-${side})"/>
        <ellipse class="ic__surface" cx="${G.mouthX}" cy="${G.bottomY}" rx="0" ry="0" fill="url(#surf-${side})"/>
        <ellipse class="ic__rim" cx="${G.mouthX}" cy="${G.bottomY}" rx="0" ry="0" fill="none" stroke="rgba(255,190,200,.35)" stroke-width="3"/>
      </g></g>
    </svg>
    <img class="ic__glass-img" src="${asset('/intro/glass.webp')}" alt="" draggable="false">
  </div>`;
}

export function createCompositeIntro(root, o) {
  const sky = o.sky || {};
  const el = document.createElement('div');
  el.className = 'ic';
  el.innerHTML = `
    <video class="ic__sky" muted playsinline loop preload="auto"${sky.poster ? ` poster="${asset(sky.poster)}"` : ''}>${(sky.sources || [])
      .map(([src, type]) => `<source src="${asset(src)}" type="${type}">`)
      .join('')}</video>
    <div class="ic__stage">
      <div class="ic__barrel">
        <img class="ic__barrel-img" src="${asset('/intro/barrel.webp')}" alt="" draggable="false">
        <div class="ic__brand-wrap">${logo({ variant: 'white', className: 'ic__brand-burn', label: '' })}${logo({ variant: 'white', className: 'logo--gold ic__brand', label: '' })}</div>
        <span class="ic__tap" aria-hidden="true"></span>
      </div>
      ${glassHtml('l')}${glassHtml('r')}
    </div>
    <svg class="ic__fx" aria-hidden="true">
      <defs><linearGradient id="stream-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a0610"/><stop offset=".45" stop-color="#8e1830"/><stop offset=".6" stop-color="#b42a44"/><stop offset="1" stop-color="#3a0610"/></linearGradient></defs>
      <path class="ic__stream" fill="none" stroke="url(#stream-g)" stroke-linecap="round"/>
      <path class="ic__stream-hi" fill="none" stroke="rgba(255,170,185,.55)" stroke-linecap="round"/>
      <g class="ic__drops"></g>
    </svg>
    <canvas class="ic__sparks" aria-hidden="true"></canvas>`;
  root.querySelector('.intro__canvas').after(el);

  const $ = (s) => el.querySelector(s);
  const skyVideo = $('.ic__sky');
  const barrel = $('.ic__barrel');
  const tap = $('.ic__tap');
  const glasses = { l: $('.ic__glass--l'), r: $('.ic__glass--r') };
  const stream = $('.ic__stream');
  const streamHi = $('.ic__stream-hi');
  const dropsG = $('.ic__drops');
  const sparks = $('.ic__sparks');
  const fx = $('.ic__fx');
  const fill = { l: 0, r: 0 };
  const slosh = { l: { a: 0, v: 0 }, r: { a: 0, v: 0 } };
  const drops = [];
  let raf = 0;
  let stopped = false;
  let shown = 0; // displayed loading progress 0..1
  let phase = 'enter';
  let phaseT = 0;
  let last = 0;
  let side = 0; // barrel over left (0) / right (1)
  let barrelX = 0;

  const rect = (n) => n.getBoundingClientRect();
  // Hidden until the scene starts (the layer slides in during the whip-tilt).
  gsap.set(barrel, { yPercent: -160 });
  gsap.set([glasses.l, glasses.r], { opacity: 0 });

  // Wine level in a glass (SVG units), keeping the surface horizontal when the glass tilts.
  const drawWine = (k, angle = 0) => {
    const g = glasses[k];
    const f = clamp01(fill[k]);
    const y = G.bottomY - (G.bottomY - G.fullY) * Math.pow(f, 0.62);
    const liquid = g.querySelector('.ic__liquid');
    g.querySelector('.ic__body').setAttribute('y', y);
    // bowl half-width at this level (from the measured profile)
    const half = 18 + 128 * Math.sin(Math.min(1, (G.bottomY - y) / 175) * Math.PI * 0.5);
    for (const sel of ['.ic__surface', '.ic__rim']) {
      const e = g.querySelector(sel);
      e.setAttribute('cy', y);
      e.setAttribute('rx', f > 0.01 ? half : 0);
      e.setAttribute('ry', f > 0.01 ? half * 0.16 : 0);
    }
    liquid.setAttribute('transform', `rotate(${-angle + slosh[k].a} ${G.mouthX} ${y})`);
    liquid.style.opacity = f > 0.005 ? 1 : 0;
  };

  // Surface point of the wine in a glass, in screen px.
  const surfacePoint = (k) => {
    const r = rect(glasses[k]);
    const f = clamp01(fill[k]);
    const y = G.bottomY - (G.bottomY - G.fullY) * Math.pow(f, 0.62);
    return { x: r.left + (G.mouthX / G.w) * r.width, y: r.top + (y / G.h) * r.height, mouthY: r.top + (G.rimY / G.h) * r.height };
  };

  const drawStream = (k, t) => {
    const a = rect(tap);
    const x0 = a.left + a.width / 2;
    const y0 = a.top + a.height * 0.8;
    const s = surfacePoint(k);
    const wob = Math.sin(t * 38) * 1.2;
    const d = `M${x0} ${y0} C ${x0 + 2} ${y0 + (s.y - y0) * 0.35}, ${s.x + wob} ${s.y - (s.y - y0) * 0.4}, ${s.x + wob * 0.5} ${s.y}`;
    const w = Math.max(3, rect(glasses[k]).width * 0.022);
    stream.setAttribute('d', d);
    stream.setAttribute('stroke-width', w);
    streamHi.setAttribute('d', d);
    streamHi.setAttribute('stroke-width', w * 0.28);
    streamHi.style.transform = `translateX(${-w * 0.18}px)`;
    // splash drops
    if (Math.random() < 0.7) drops.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 70, vy: -60 - Math.random() * 90, life: 0.35 + Math.random() * 0.25, r: w * (0.15 + Math.random() * 0.2) });
  };

  const updateDrops = (dt) => {
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.life -= dt;
      d.vy += 420 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.life <= 0) drops.splice(i, 1);
    }
    dropsG.innerHTML = drops.map((d) => `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.r.toFixed(1)}" fill="#8e1830"/>`).join('');
  };

  // Keep the tap exactly over the glass being filled.
  const alignBarrel = (k, ease) => {
    const a = rect(tap);
    const s = surfacePoint(k);
    const want = s.x - (a.left + a.width / 2);
    barrelX += want * ease;
    gsap.set(barrel, { x: barrelX });
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    sparks.width = innerWidth * dpr;
    sparks.height = innerHeight * dpr;
    fx.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
  };
  window.addEventListener('resize', resize);
  resize();

  // ---------- Gold spark burst ----------
  const burst = (x, y) => {
    const ctx = sparks.getContext('2d');
    const dpr = sparks.width / innerWidth;
    const P = Array.from({ length: 140 }, () => {
      const a = Math.random() * Math.PI * 2;
      const v = 80 + Math.random() * 380;
      return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0.7 + Math.random() * 0.8, r: 1 + Math.random() * 2.4 };
    });
    let t0 = performance.now();
    const step = (now) => {
      const dt = Math.min(0.05, (now - t0) / 1000);
      t0 = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalCompositeOperation = 'lighter';
      let alive = 0;
      for (const p of P) {
        p.life -= dt;
        if (p.life <= 0) continue;
        alive++;
        p.vx *= 1 - 2.2 * dt;
        p.vy = p.vy * (1 - 2.2 * dt) + 60 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `rgba(255,240,200,${Math.min(1, p.life)})`);
        g.addColorStop(1, 'rgba(198,161,91,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (alive && !stopped) requestAnimationFrame(step);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    requestAnimationFrame(step);
  };

  // ---------- Timeline ----------
  const ENTER = 1.1;
  const MOVE = 0.75;
  const LEAVE = 0.6;
  const TOAST = 1.0;
  let contactDone = false;

  const frame = (now) => {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000 || 0);
    last = now;
    phaseT += dt;
    const t = now / 1000;
    // floating bob of the barrel
    gsap.set(barrel, { y: Math.sin(t * 1.3) * 6 });
    ['l', 'r'].forEach((k) => {
      const s = slosh[k];
      s.v += (-s.a * 60 - s.v * 5) * dt;
      s.a += s.v * dt;
    });

    if (phase === 'enter') {
      if (phaseT >= ENTER) {
        phase = 'pourL';
        phaseT = 0;
      }
    } else if (phase === 'pourL' || phase === 'pourR') {
      const k = phase === 'pourL' ? 'l' : 'r';
      const end = k === 'l' ? 0.5 : 1;
      alignBarrel(k, 0.25);
      const real = clamp01(o.progress());
      shown = Math.min(real, end, shown + (dt * 0.5) / MIN_GLASS);
      fill.l = clamp01(shown * 2);
      fill.r = clamp01(shown * 2 - 1);
      o.onPercent(shown, true, rect(glasses.l).bottom);
      const pouring = shown < end - 1e-4;
      stream.style.opacity = streamHi.style.opacity = pouring ? 1 : 0;
      if (pouring) {
        drawStream(k, t);
        slosh[k].v += (Math.random() - 0.5) * 4 * dt;
      }
      if (!pouring) {
        phase = k === 'l' ? 'move' : 'leave';
        phaseT = 0;
        if (phase === 'move') gsap.to(barrel, { rotation: -4, duration: 0.3 });
        if (phase === 'leave') {
          gsap.to(barrel, { yPercent: -170, rotation: 6, duration: LEAVE, ease: 'power2.in' });
        }
      }
    } else if (phase === 'move') {
      alignBarrel('r', Math.min(1, dt * 5));
      if (phaseT >= MOVE) {
        gsap.to(barrel, { rotation: -14, duration: 0.3 });
        phase = 'pourR';
        phaseT = 0;
      }
    } else if (phase === 'leave') {
      o.onPercent(1, false);
      if (phaseT >= LEAVE * 0.7) {
        phase = 'toast';
        phaseT = 0;
        toast();
      }
    }
    updateDrops(dt);
    drawWine('l', Number(gsap.getProperty(glasses.l, 'rotation')) || 0);
    drawWine('r', Number(gsap.getProperty(glasses.r, 'rotation')) || 0);
  };

  // Glasses rise, tilt towards each other and clink at the rims.
  const toast = () => {
    const rl = rect(glasses.l);
    const rr = rect(glasses.r);
    const rim = (G.rimHalf / G.w) * rl.width;
    const gap = rr.left + (G.mouthX / G.w) * rr.width - (rl.left + (G.mouthX / G.w) * rl.width);
    const move = (gap - rim * 2) / 2 + rim * 0.12; // rims just touch (tilt brings the tops in)
    const tl = gsap.timeline();
    tl.to(glasses.l, { x: move, y: -rl.height * 0.08, rotation: 9, duration: TOAST, ease: 'power3.inOut' }, 0);
    tl.to(glasses.r, { x: -move, y: -rr.height * 0.08, rotation: -9, duration: TOAST, ease: 'power3.inOut' }, 0);
    tl.add(() => {
      if (contactDone) return;
      contactDone = true;
      slosh.l.v += 2.5;
      slosh.r.v -= 2.5;
      const a = rect(glasses.l);
      const pt = { x: (a.right + rect(glasses.r).left) / 2, y: a.top + a.height * 0.03 };
      burst(pt.x, pt.y);
      o.onClink?.();
      o.onContact(pt);
    }, TOAST);
    tl.to(glasses.l, { x: move - 6, rotation: 7.5, duration: 0.35, ease: 'power2.out' }, TOAST);
    tl.to(glasses.r, { x: -move + 6, rotation: -7.5, duration: 0.35, ease: 'power2.out' }, TOAST);
  };

  // Entrance after the whip-tilt: barrel floats down from the sky, glasses rise in.
  const enter = () => {
    gsap.fromTo(barrel, { yPercent: -160, rotation: 4 }, { yPercent: 0, rotation: -14, duration: ENTER, ease: 'power3.out' });
    gsap.fromTo([glasses.l, glasses.r], { yPercent: 35, opacity: 0 }, { yPercent: 0, opacity: 1, duration: ENTER * 0.9, ease: 'power3.out', stagger: 0.08 });
    gsap.fromTo(el.querySelector('.ic__brand'), { backgroundPosition: '140% 0' }, { backgroundPosition: '-60% 0', duration: 2.4, ease: 'power1.inOut', delay: 0.5, repeat: -1, repeatDelay: 0.9 });
  };

  return {
    el,
    // Called before the whip so the sky is already moving when it slides in.
    prepare() {
      skyVideo.play().catch(() => {});
    },
    start() {
      stream.style.opacity = streamHi.style.opacity = 0;
      drawWine('l');
      drawWine('r');
      enter();
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
    },
    dispose() {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      skyVideo.pause();
      el.remove();
    },
  };
}
