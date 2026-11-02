import { RefObject, useEffect, useRef } from 'react';
import { offsetBox } from '../lib/useFloatingWords';

/**
 * Neurones dessinés à la main par le code, à la manière des planches de
 * Ramón y Cajal : corps cellulaires irréguliers, dendrites courbes qui
 * s'affinent en se ramifiant, et un axone qui file vers la porte. De petits
 * influx nerveux le parcourent en continu ; approcher la souris d'un neurone
 * le fait s'activer davantage.
 *
 * Tout est généré à partir d'une graine fixe : le dessin est toujours le même
 * (comme une illustration), mais il s'adapte à la taille de l'écran.
 */

type Pt = { x: number; y: number };
type Seg = { a: Pt; c: Pt; b: Pt; w: number; alpha: number; t0: number; dur: number };
type Soma = { x: number; y: number; r: number; outline: Pt[]; t0: number };
type Route = { pts: Pt[]; acc: number[]; length: number; neuron: number; axon: boolean };
type Pulse = { route: Route; pos: number; speed: number };

const SEED = 20260211;
const GROW_DELAY = 300; // ms : laisse l'encadrement de la porte apparaître d'abord
const MAX_PULSES = 16;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
};
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

function sampleSeg(s: Seg, n = 8): Pt[] {
  return Array.from({ length: n }, (_, i) => quad(s.a, s.c, s.b, (i + 1) / n));
}

function makeRoute(pts: Pt[], neuron: number, axon: boolean): Route {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, acc, length: acc[acc.length - 1], neuron, axon };
}

function pointAt(r: Route, d: number): Pt {
  const dist = Math.max(0, Math.min(r.length, d));
  let i = 1;
  while (i < r.acc.length - 1 && r.acc[i] < dist) i++;
  const span = r.acc[i] - r.acc[i - 1] || 1;
  return lerp(r.pts[i - 1], r.pts[i], (dist - r.acc[i - 1]) / span);
}

type Box = { x: number; y: number; w: number; h: number };

function build(W: number, H: number, door: Box | null) {
  const rng = mulberry32(SEED + Math.round(W / 200));
  const segs: Seg[] = [];
  const somas: Soma[] = [];
  const routes: Route[] = [];
  const boutons: { p: Pt; r: number; t0: number }[] = [];

  const small = W < 640;
  const scale = small ? 0.58 : 0.9 * Math.min(1.25, Math.max(0.8, Math.min(W / 1280, H / 800)));
  const dc = door ? { x: door.x + door.w / 2, y: door.y + door.h / 2 } : { x: W / 2, y: H / 2 };
  const pad = 18;
  const inDoor = (p: Pt) =>
    !!door && p.x > door.x - pad && p.x < door.x + door.w + pad && p.y > door.y - pad && p.y < door.y + door.h + pad;

  const spots: { x: number; y: number; k: number }[] = small
    ? [
        { x: 0.12, y: 0.13, k: 1 },
        { x: 0.88, y: 0.87, k: 1 },
      ]
    : [
        { x: 0.12, y: 0.64, k: 1 },
        { x: 0.87, y: 0.34, k: 1 },
        { x: 0.25, y: 0.15, k: 0.7 },
        { x: 0.78, y: 0.88, k: 0.7 },
      ];

  spots.forEach((spot, n) => {
    const s = scale * spot.k;
    const soma: Pt = { x: spot.x * W, y: spot.y * H };
    const out = Math.atan2(soma.y - dc.y, soma.x - dc.x); // direction qui s'éloigne de la porte
    const t0 = GROW_DELAY + n * 180;

    // Corps cellulaire : contour irrégulier, jamais un cercle parfait.
    const r = 7.5 * s;
    const outline = Array.from({ length: 11 }, (_, i) => {
      const a = (i / 11) * Math.PI * 2;
      const rr = r * (0.78 + rng() * 0.45);
      return { x: soma.x + Math.cos(a) * rr, y: soma.y + Math.sin(a) * rr };
    });
    somas.push({ ...soma, r, outline, t0 });

    // Dendrites : se ramifient en s'affinant.
    const grow = (p: Pt, angle: number, len: number, w: number, depth: number, start: number, trail: Pt[]) => {
      const bend = (rng() - 0.5) * 1.1;
      const end = { x: p.x + Math.cos(angle + bend * 0.45) * len, y: p.y + Math.sin(angle + bend * 0.45) * len };
      if (inDoor(end)) return;
      const mid = lerp(p, end, 0.5);
      const perp = angle + Math.PI / 2;
      const c = { x: mid.x + Math.cos(perp) * bend * len * 0.32, y: mid.y + Math.sin(perp) * bend * len * 0.32 };
      const seg: Seg = { a: p, c, b: end, w, alpha: 0.15 + Math.min(0.38, w * 0.16), t0: start, dur: len * 7 };
      segs.push(seg);
      const path = trail.concat(sampleSeg(seg));

      if (depth === 0 || len < 9 * s) {
        routes.push(makeRoute([...path].reverse(), n, false)); // influx : de la pointe vers le corps
        return;
      }
      // Petites épines, de temps en temps
      if (rng() < 0.45) {
        const t = 0.3 + rng() * 0.5;
        const base = quad(p, c, end, t);
        const sa = angle + (rng() < 0.5 ? 1 : -1) * (0.9 + rng() * 0.6);
        const sl = len * (0.12 + rng() * 0.12);
        segs.push({
          a: base,
          c: lerp(base, { x: base.x + Math.cos(sa) * sl, y: base.y + Math.sin(sa) * sl }, 0.5),
          b: { x: base.x + Math.cos(sa) * sl, y: base.y + Math.sin(sa) * sl },
          w: w * 0.45,
          alpha: 0.2,
          t0: start + seg.dur * t,
          dur: sl * 7,
        });
      }
      const kids = rng() < 0.28 ? 3 : 2;
      for (let k = 0; k < kids; k++) {
        const spread = (k / (kids - 1) - 0.5) * (0.75 + rng() * 0.45);
        grow(end, angle + spread, len * (0.6 + rng() * 0.2), w * 0.68, depth - 1, start + seg.dur, path);
      }
    };

    const nDend = 5 + Math.floor(rng() * 2);
    for (let i = 0; i < nDend; i++) {
      const a = out + (i / (nDend - 1) - 0.5) * Math.PI * 1.55 + (rng() - 0.5) * 0.35;
      const p = { x: soma.x + Math.cos(a) * r * 0.8, y: soma.y + Math.sin(a) * r * 0.8 };
      grow(p, a, (52 + rng() * 34) * s, 2.3 * s, small ? 3 : 4, t0 + 220, [soma]);
    }

    // Axone : long fil ondulant du corps cellulaire jusqu'au bord de la porte.
    if (door) {
      const target = {
        x: Math.max(door.x - 10, Math.min(door.x + door.w + 10, soma.x)),
        y: Math.max(door.y - 10, Math.min(door.y + door.h + 10, soma.y + (rng() - 0.5) * door.h * 0.4)),
      };
      if (soma.x < door.x) target.x = door.x - 10;
      else if (soma.x > door.x + door.w) target.x = door.x + door.w + 10;
      const from = { x: soma.x - Math.cos(out) * r, y: soma.y - Math.sin(out) * r };
      const steps = 9;
      const dir = Math.atan2(target.y - from.y, target.x - from.x);
      const dist = Math.hypot(target.x - from.x, target.y - from.y);
      const amp = Math.min(26, dist * 0.06) * (0.6 + rng() * 0.6);
      const phase = rng() * Math.PI;
      let prev = from;
      let trail: Pt[] = [from];
      let start = t0 + 420;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const wave = Math.sin(t * Math.PI * 2.2 + phase) * amp * Math.sin(t * Math.PI);
        const base = lerp(from, target, t);
        const p = { x: base.x + Math.cos(dir + Math.PI / 2) * wave, y: base.y + Math.sin(dir + Math.PI / 2) * wave };
        const c = lerp(prev, p, 0.5);
        const seg: Seg = { a: prev, c, b: p, w: 1.4 * s * (1 - t * 0.45), alpha: 0.36, t0: start, dur: (dist / steps) * 5 };
        segs.push(seg);
        trail = trail.concat(sampleSeg(seg, 4));
        start += seg.dur;
        prev = p;
      }
      // Terminaisons : quelques boutons au contact de la porte
      for (let k = 0; k < 3; k++) {
        const a = dir + (k - 1) * 0.55;
        const l = (9 + rng() * 6) * s;
        const b = { x: prev.x + Math.cos(a) * l, y: prev.y + Math.sin(a) * l };
        segs.push({ a: prev, c: lerp(prev, b, 0.5), b, w: 0.8 * s, alpha: 0.4, t0: start, dur: l * 7 });
        boutons.push({ p: b, r: 1.8 * s, t0: start + l * 7 });
      }
      routes.push(makeRoute(trail, n, true));
    }
  });

  const growEnd = Math.max(...segs.map((s) => s.t0 + s.dur), 0);
  return { segs, somas, routes, boutons, growEnd };
}

interface Props {
  rootRef: RefObject<HTMLElement>;
  doorRef: RefObject<HTMLElement>;
  /** false pendant l'ouverture de la porte : plus de nouveaux influx. */
  active: boolean;
}

export default function NeuronField({ rootRef, doorRef, active }: Props) {
  const baseRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const root = rootRef.current;
    const base = baseRef.current;
    const top = pulseRef.current;
    if (!root || !base || !top) return;
    const bctx = base.getContext('2d');
    const pctx = top.getContext('2d');
    if (!bctx || !pctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let scene = build(1, 1, null);
    let W = 0;
    let H = 0;
    let dpr = 1;
    let t0 = performance.now();
    let grown = false;
    let raf = 0;
    let pulses: Pulse[] = [];
    let lastSpawn = 0;
    const pointer = { x: -9999, y: -9999 };

    const setup = () => {
      W = root.offsetWidth;
      H = root.offsetHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const c of [base, top]) {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
        c.style.width = `${W}px`;
        c.style.height = `${H}px`;
      }
      const door = doorRef.current ? offsetBox(doorRef.current, root) : null;
      scene = build(W, H, door);
      pulses = [];
      grown = reduce;
      t0 = performance.now();
      if (reduce) drawBase(Infinity);
    };

    const drawBase = (now: number) => {
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.clearRect(0, 0, W, H);
      bctx.lineCap = 'round';
      bctx.shadowColor = 'rgba(56, 189, 248, 0.55)';
      bctx.shadowBlur = 4;
      for (const s of scene.segs) {
        if (now < s.t0) continue;
        const f = Math.min(1, (now - s.t0) / s.dur);
        const c = f < 1 ? lerp(s.a, s.c, f) : s.c;
        const b = f < 1 ? quad(s.a, s.c, s.b, f) : s.b;
        bctx.strokeStyle = `rgba(147, 197, 253, ${s.alpha})`; // bleu doux, comme une encre lumineuse
        bctx.lineWidth = s.w;
        bctx.beginPath();
        bctx.moveTo(s.a.x, s.a.y);
        bctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
        bctx.stroke();
      }
      for (const so of scene.somas) {
        const g = Math.min(1, Math.max(0, (now - so.t0) / 500));
        if (g <= 0) continue;
        const halo = bctx.createRadialGradient(so.x, so.y, 0, so.x, so.y, so.r * 3.2 * g);
        halo.addColorStop(0, 'rgba(165, 243, 252, 0.35)');
        halo.addColorStop(1, 'rgba(56, 189, 248, 0)');
        bctx.fillStyle = halo;
        bctx.beginPath();
        bctx.arc(so.x, so.y, so.r * 3.2 * g, 0, Math.PI * 2);
        bctx.fill();
        // contour irrégulier lissé
        const pts = so.outline.map((p) => lerp(so, p, g));
        bctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          const q = pts[(i + 1) % pts.length];
          const m = lerp(p, q, 0.5);
          if (i === 0) bctx.moveTo(lerp(pts[pts.length - 1], p, 0.5).x, lerp(pts[pts.length - 1], p, 0.5).y);
          bctx.quadraticCurveTo(p.x, p.y, m.x, m.y);
        }
        bctx.closePath();
        bctx.fillStyle = 'rgba(14, 116, 144, 0.55)';
        bctx.fill();
        bctx.strokeStyle = 'rgba(165, 243, 252, 0.7)';
        bctx.lineWidth = 1.1;
        bctx.stroke();
        bctx.fillStyle = 'rgba(207, 250, 254, 0.85)';
        bctx.beginPath();
        bctx.arc(so.x + so.r * 0.15, so.y - so.r * 0.1, so.r * 0.28 * g, 0, Math.PI * 2);
        bctx.fill();
      }
      for (const bt of scene.boutons) {
        if (now < bt.t0) continue;
        bctx.fillStyle = 'rgba(165, 243, 252, 0.75)';
        bctx.beginPath();
        bctx.arc(bt.p.x, bt.p.y, bt.r, 0, Math.PI * 2);
        bctx.fill();
      }
    };

    const spawn = (now: number) => {
      if (!activeRef.current || pulses.length >= MAX_PULSES || scene.routes.length === 0) return;
      // Neurone le plus proche de la souris : il s'active davantage.
      let near = -1;
      let best = 170;
      scene.somas.forEach((so, i) => {
        const d = Math.hypot(so.x - pointer.x, so.y - pointer.y);
        if (d < best) {
          best = d;
          near = i;
        }
      });
      const interval = near >= 0 ? 140 : 420;
      if (now - lastSpawn < interval) return;
      lastSpawn = now;
      const pool = near >= 0 ? scene.routes.filter((r) => r.neuron === near) : scene.routes;
      const axons = pool.filter((r) => r.axon);
      const route = axons.length && Math.random() < 0.4 ? axons[Math.floor(Math.random() * axons.length)] : pool[Math.floor(Math.random() * pool.length)];
      if (route) pulses.push({ route, pos: 0, speed: route.axon ? 0.17 : 0.11 + Math.random() * 0.05 });
    };

    const drawPulses = (dt: number) => {
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pctx.clearRect(0, 0, W, H);
      pctx.globalCompositeOperation = 'lighter';
      pctx.lineCap = 'round';
      pulses = pulses.filter((p) => p.pos < p.route.length + 30);
      for (const p of pulses) {
        p.pos += p.speed * dt;
        const tail = 28;
        const steps = 7;
        for (let i = 0; i < steps; i++) {
          const a = pointAt(p.route, p.pos - tail + (tail / steps) * i);
          const b = pointAt(p.route, p.pos - tail + (tail / steps) * (i + 1));
          pctx.strokeStyle = `rgba(103, 232, 249, ${((i + 1) / steps) * 0.75})`;
          pctx.lineWidth = 1.6;
          pctx.beginPath();
          pctx.moveTo(a.x, a.y);
          pctx.lineTo(b.x, b.y);
          pctx.stroke();
        }
        if (p.pos <= p.route.length) {
          const h = pointAt(p.route, p.pos);
          const g = pctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, 7);
          g.addColorStop(0, 'rgba(236, 254, 255, 0.95)');
          g.addColorStop(0.4, 'rgba(103, 232, 249, 0.5)');
          g.addColorStop(1, 'rgba(103, 232, 249, 0)');
          pctx.fillStyle = g;
          pctx.beginPath();
          pctx.arc(h.x, h.y, 7, 0, Math.PI * 2);
          pctx.fill();
        }
      }
      pctx.globalCompositeOperation = 'source-over';
    };

    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(48, now - last);
      last = now;
      const t = now - t0;
      if (!grown) {
        drawBase(t);
        if (t > scene.growEnd + 600) {
          drawBase(Infinity);
          grown = true;
        }
      }
      if (t > GROW_DELAY + 900) spawn(now);
      drawPulses(dt);
    };

    setup();
    if (!reduce) raf = requestAnimationFrame(frame);

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        setup();
        if (!reduce) {
          grown = true;
          drawBase(Infinity);
        }
      }, 150);
    };
    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduce) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [rootRef, doorRef]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <canvas ref={baseRef} className="absolute left-0 top-0" />
      <canvas ref={pulseRef} className="absolute left-0 top-0" />
    </div>
  );
}
