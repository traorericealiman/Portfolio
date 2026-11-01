import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Fil conducteur du site : il part de la sortie « Solutions IA » du réseau de
 * l'accueil, descend puis longe la marge gauche, et relie le titre de chaque
 * section (éléments marqués `data-thread`). En défilant, une impulsion parcourt
 * le fil et allume les nœuds un à un.
 */

interface Geo {
  width: number;
  height: number;
  ox: number;
  oy: number;
  elbowY: number;
  lx: number;
  endY: number;
  nodes: { y: number; hx: number }[];
}

export default function NeuralThread() {
  const ref = useRef<SVGSVGElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [py, setPy] = useState(0); // position de lecture, en px depuis le haut du conteneur

  // Mesure des positions (origine, bas de l'accueil, titres) relativement au conteneur.
  useLayoutEffect(() => {
    const root = ref.current?.parentElement;
    if (!root) return;

    const measure = () => {
      const rr = root.getBoundingClientRect();
      // La miniature de l'accueil dans la porte d'intro a aussi ces repères : on prend
      // toujours le dernier, celui de la vraie page.
      const origin = [...document.querySelectorAll('[data-thread-origin]')].pop();
      const hero = [...document.querySelectorAll('[data-thread-hero]')].pop();
      const heads = [...document.querySelectorAll<HTMLElement>('[data-thread]')];
      if (!origin || !hero || heads.length === 0) return;

      const o = origin.getBoundingClientRect();
      const h = hero.getBoundingClientRect();
      const nodes = heads
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { y: r.top - rr.top + Math.min(r.height, 64) / 2, hx: r.left - rr.left };
        })
        .sort((a, b) => a.y - b.y);
      // Le fil passe dans la marge, toujours à gauche des titres (40 px avant le plus à gauche).
      const lx = Math.max(8, Math.min(...nodes.map((n) => n.hx)) - 40);

      setGeo({
        width: rr.width,
        height: rr.height,
        ox: o.left + o.width / 2 - rr.left,
        oy: o.top + o.height / 2 - rr.top,
        elbowY: h.bottom - rr.top + 28,
        lx,
        endY: nodes[nodes.length - 1].y,
        nodes,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    // Fin de l'intro, contenu chargé... : tout ajout/retrait d'élément peut décaler les titres.
    const mo = new MutationObserver(measure);
    mo.observe(root, { childList: true });
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Position de lecture : un peu au-dessus du milieu de l'écran.
  useEffect(() => {
    const root = ref.current?.parentElement;
    if (!root) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      setPy(window.innerHeight * 0.6 - root.getBoundingClientRect().top);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  if (!geo) return <svg ref={ref} className="hidden" aria-hidden />;

  const { ox, oy, elbowY, lx, endY, nodes } = geo;
  const l1 = elbowY - oy;
  const l2 = Math.abs(ox - lx);
  const total = l1 + l2 + (endY - elbowY);
  const d = `M${ox} ${oy} V${elbowY} H${lx} V${endY}`;

  // Longueur parcourue : on descend jusqu'au coude, on traverse vers la marge, puis on descend.
  const len = Math.max(0, Math.min(total, py <= elbowY ? py - oy : l1 + l2 + (py - elbowY)));
  const head =
    len <= l1
      ? { x: ox, y: oy + len }
      : len <= l1 + l2
      ? { x: ox - Math.sign(ox - lx) * (len - l1), y: elbowY }
      : { x: lx, y: elbowY + (len - l1 - l2) };

  return (
    <svg
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-20 overflow-visible"
      width={geo.width}
      height={geo.height}
    >
      <defs>
        <linearGradient id="thread-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      {/* Fil au repos */}
      <path d={d} fill="none" stroke="rgba(59,130,246,0.28)" strokeWidth={2} />

      {/* Partie déjà parcourue */}
      <path
        d={d}
        fill="none"
        stroke="#22d3ee"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={total}
        strokeDashoffset={total - len}
        style={{ filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.8))' }}
      />

      {/* Un nœud par section, relié à son titre */}
      {nodes.map((n, i) => {
        const on = py >= n.y;
        const reach = n.hx - 14;
        return (
          <g key={i}>
            {reach > lx + 14 && (
              <path
                d={`M${lx + 8} ${n.y} H${reach}`}
                fill="none"
                stroke={on ? '#22d3ee' : 'rgba(59,130,246,0.3)'}
                strokeWidth={on ? 2 : 1.5}
                strokeDasharray={on ? undefined : '3 5'}
                style={{ transition: 'stroke 0.4s' }}
              />
            )}
            <circle
              cx={lx}
              cy={n.y}
              r={on ? 7 : 6}
              fill={on ? '#22d3ee' : 'rgba(59,130,246,0.15)'}
              stroke={on ? '#a5f3fc' : 'rgba(59,130,246,0.55)'}
              strokeWidth={2}
              style={{
                transition: 'all 0.4s',
                filter: on ? 'drop-shadow(0 0 6px rgba(34,211,238,0.9))' : undefined,
              }}
            />
          </g>
        );
      })}

      {/* Tête de l'impulsion */}
      {len > 0 && len < total && (
        <circle
          cx={head.x}
          cy={head.y}
          r={5}
          fill="#cffafe"
          style={{ filter: 'drop-shadow(0 0 8px rgba(34,211,238,1))' }}
        />
      )}
    </svg>
  );
}
