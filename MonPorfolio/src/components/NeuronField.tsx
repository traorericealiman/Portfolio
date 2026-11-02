import { RefObject, useEffect, useRef } from 'react';
import { offsetBox } from '../lib/useFloatingWords';

/**
 * Neurones dessinés à la main par le code, à la manière des planches de
 * Ramón y Cajal : corps cellulaires irréguliers, dendrites courbes qui
 * s'affinent en se ramifiant, et un axone qui file vers une cible (la porte,
 * puis le terminal de l'accueil). De petits influx nerveux le parcourent en
 * continu ; approcher la souris d'un neurone le fait s'activer davantage.
 *
 * Tout est généré à partir d'une graine fixe : le dessin est toujours le même
 * (comme une illustration), mais il s'adapte à la taille de l'écran.
 */

type Pt = { x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };
type Seg = { a: Pt; c: Pt; b: Pt; w: number; alpha: number; t0: number; dur: number };
type Soma = { x: number; y: number; r: number; outline: Pt[]; t0: number };
type Route = { pts: Pt[]; acc: number[]; length: number; neuron: number; axon: boolean };
type Pulse = { route: Route; pos: number; speed: number };

export type Blocked = (b: Box) => boolean;

const SEED = 20260211;
const GROW_DELAY = 300; // ms : laisse l'encadrement de la porte apparaître d'abord
const MAX_PULSES = 16;
const CELL = 6; // taille d'une case de la carte d'occupation (px)

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

export type NeuronVariant = 'door' | 'hero';

function spotsFor(variant: NeuronVariant, small: boolean) {
  if (variant === 'door') {
    return small
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
  }
  // Accueil : les neurones encadrent le terminal, leurs axones y aboutissent.
  return small
    ? [
        { x: 0.86, y: 0.2, k: 1 },
        { x: 0.14, y: 0.86, k: 1 },
      ]
    : [
        { x: 0.07, y: 0.42, k: 0.9 },
        { x: 0.93, y: 0.6, k: 0.9 },
        { x: 0.82, y: 0.14, k: 0.65 },
        { x: 0.2, y: 0.9, k: 0.65 },
      ];
}

function build(W: number, H: number, target: Box | null, variant: NeuronVariant) {
  const rng = mulberry32(SEED + (variant === 'hero' ? 7 : 0) + Math.round(W / 200));
  const segs: Seg[] = [];
  const somas: Soma[] = [];
  const routes: Route[] = [];
  const boutons: { p: Pt; r: number; t0: number }[] = [];

  const small = W < 640;
  const scale = small ? 0.58 : 0.9 * Math.min(1.25, Math.max(0.8, Math.min(W / 1280, H / 800)));
  const dc = target ? { x: target.x + target.w / 2, y: target.y + target.h / 2 } : { x: W / 2, y: H / 2 };
  const pad = 18;
  const inTarget = (p: Pt) =>
    !!target && p.x > target.x - pad && p.x < target.x + target.w + pad && p.y > target.y - pad && p.y < target.y + target.h + pad;

  spotsFor(variant, small).forEach((spot, n) => {
    const s = scale * spot.k;
    const soma: Pt = { x: spot.x * W, y: spot.y * H };
    const out = Math.atan2(soma.y - dc.y, soma.x - dc.x); // direction qui s'éloigne de la cible
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
      if (inTarget(end)) return;
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
        const tip = { x: base.x + Math.cos(sa) * sl, y: base.y + Math.sin(sa) * sl };
        segs.push({ a: base, c: lerp(base, tip, 0.5), b: tip, w: w * 0.45, alpha: 0.2, t0: start + seg.dur * t, dur: sl * 7 });
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

    // Axone : long fil ondulant du corps cellulaire jusqu'au bord de la cible.
    if (target) {
      const tgt = {
        x: Math.max(target.x - 10, Math.min(target.x + target.w + 10, soma.x)),
        y: Math.max(target.y - 10, Math.min(target.y + target.h + 10, soma.y + (rng() - 0.5) * target.h * 0.4)),
      };
      if (soma.x < target.x) tgt.x = target.x - 10;
      else if (soma.x > target.x + target.w) tgt.x = target.x + target.w + 10;
      const from = { x: soma.x - Math.cos(out) * r, y: soma.y - Math.sin(out) * r };
      const steps = 9;
      const dir = Math.atan2(tgt.y - from.y, tgt.x - from.x);
      const dist = Math.hypot(tgt.x - from.x, tgt.y - from.y);
      const amp = Math.min(26, dist * 0.06) * (0.6 + rng() * 0.6);
      const phase = rng() * Math.PI;
      let prev = from;
      let trail: Pt[] = [from];
      let start = t0 + 420;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const wave = Math.sin(t * Math.PI * 2.2 + phase) * amp * Math.sin(t * Math.PI);
        const base = lerp(from, tgt, t);
        const p = { x: base.x + Math.cos(dir + Math.PI / 2) * wave, y: base.y + Math.sin(dir + Math.PI / 2) * wave };
        const seg: Seg = { a: prev, c: lerp(prev, p, 0.5), b: p, w: 1.4 * s * (1 - t * 0.45), alpha: 0.36, t0: start, dur: (dist / steps) * 5 };
        segs.push(seg);
        trail = trail.concat(sampleSeg(seg, 4));
        start += seg.dur;
        prev = p;
      }
      // Terminaisons : quelques boutons au contact de la cible
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
  // Moment où le dernier axone touche la cible
  const connectAt = boutons.length ? Math.max(...boutons.map((b) => b.t0)) : growEnd;

  // Carte d'occupation : quelles zones de l'écran sont traversées par une fibre.
  const cols = Math.ceil(W / CELL);
  const rows = Math.ceil(H / CELL);
  const grid = new Uint8Array(cols * rows);
  const mark = (p: Pt, radius: number) => {
    const c0 = Math.max(0, Math.floor((p.x - radius) / CELL));
    const c1 = Math.min(cols - 1, Math.floor((p.x + radius) / CELL));
    const r0 = Math.max(0, Math.floor((p.y - radius) / CELL));
    const r1 = Math.min(rows - 1, Math.floor((p.y + radius) / CELL));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) grid[r * cols + c] = 1;
  };
  for (const s of segs) {
    const len = Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);
    const n = Math.max(2, Math.ceil(len / 3));
    for (let i = 0; i <= n; i++) mark(quad(s.a, s.c, s.b, i / n), s.w / 2 + 2);
  }
  for (const so of somas) mark(so, so.r * 2.4);
  const blocked: Blocked = (b) => {
    const c0 = Math.max(0, Math.floor(b.x / CELL));
    const c1 = Math.min(cols - 1, Math.floor((b.x + b.w) / CELL));
    const r0 = Math.max(0, Math.floor(b.y / CELL));
    const r1 = Math.min(rows - 1, Math.floor((b.y + b.h) / CELL));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (grid[r * cols + c]) return true;
    return false;
  };

  return { segs, somas, routes, boutons, growEnd, connectAt, blocked };
}

interface Props {
  rootRef: RefObject<HTMLElement>;
  /** Élément vers lequel convergent les axones (la porte, le terminal). */
  targetRef: RefObject<HTMLElement>;
  variant: NeuronVariant;
  /** false : plus de nouveaux influx (ex. pendant l'ouverture de la porte). */
  active: boolean;
  /** Croissance animée au chargement (sinon le dessin est complet d'emblée). */
  grow?: boolean;
  /** Influx animés (false : dessin figé, ex. miniature de l'intro). */
  animated?: boolean;
  /** Passe directement à la fin de la croissance. */
  fastForward?: boolean;
  /** Appelé quand le dernier axone touche la cible. */
  onConnected?: () => void;
  /** Transmet la carte des zones occupées par les fibres (pour placer les mots). */
  onOccupancy?: (blocked: Blocked) => void;
}

export default function NeuronField({
  rootRef,
  targetRef,
  variant,
  active,
  grow = true,
  animated = true,
  fastForward = false,
  onConnected,
  onOccupancy,
}: Props) {
  const baseRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const callbacks = useRef({ onConnected, onOccupancy });
  callbacks.current = { onConnected, onOccupancy };
  const skipRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (fastForward) skipRef.current();
  }, [fastForward]);

  useEffect(() => {
    const root = rootRef.current;
    const base = baseRef.current;
    const top = pulseRef.current;
    if (!root || !base || !top) return;
    const bctx = base.getContext('2d');
    const pctx = top.getContext('2d');
    if (!bctx || !pctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const live = animated && !reduce;
    let scene = build(1, 1, null, variant);
    let W = 0;
    let H = 0;
    let dpr = 1;
    let t0 = performance.now();
    let grown = false;
    let connected = false;
    let raf = 0;
    let pulses: Pulse[] = [];
    let lastSpawn = 0;
    const pointer = { x: -9999, y: -9999 };

    const connect = () => {
      if (connected) return;
      connected = true;
      callbacks.current.onConnected?.();
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
        const first = lerp(pts[pts.length - 1], pts[0], 0.5);
        bctx.beginPath();
        bctx.moveTo(first.x, first.y);
        for (let i = 0; i < pts.length; i++) {
          const m = lerp(pts[i], pts[(i + 1) % pts.length], 0.5);
          bctx.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y);
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

    const finishGrowth = () => {
      grown = true;
      drawBase(Infinity);
      connect();
    };
    skipRef.current = () => {
      if (!grown) finishGrowth();
    };

    const setup = () => {
      W = root.offsetWidth;
      H = root.offsetHeight;
      if (!W || !H) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const c of [base, top]) {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
        c.style.width = `${W}px`;
        c.style.height = `${H}px`;
      }
      const target = targetRef.current ? offsetBox(targetRef.current, root) : null;
      scene = build(W, H, target, variant);
      pulses = [];
      t0 = performance.now();
      callbacks.current.onOccupancy?.(scene.blocked);
      if (!grow || reduce || grown) finishGrowth();
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
      const route =
        axons.length && Math.random() < 0.4
          ? axons[Math.floor(Math.random() * axons.length)]
          : pool[Math.floor(Math.random() * pool.length)];
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
        if (t >= scene.connectAt) connect();
        if (t > scene.growEnd + 100) finishGrowth();
      }
      if (live && (grown || t > GROW_DELAY + 900)) spawn(now);
      if (live) drawPulses(dt);
    };

    setup();
    const loop = live || (grow && !reduce);
    if (loop) raf = requestAnimationFrame(frame);

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setup, 150);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(root);
    if (targetRef.current) ro.observe(targetRef.current);
    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onVisibility = () => {
      if (!loop) return;
      if (document.hidden) cancelAnimationFrame(raf);
      else {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    window.addEventListener('pointermove', onMove);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [rootRef, targetRef, variant, grow, animated]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <canvas ref={baseRef} className="absolute left-0 top-0" />
      <canvas ref={pulseRef} className="absolute left-0 top-0" />
    </div>
  );
}
