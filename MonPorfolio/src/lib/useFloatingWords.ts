import { RefObject, useLayoutEffect, useRef, useState } from 'react';

/**
 * Placement des mots flottants : chaque mot garde sa position préférée (en %)
 * quand c'est possible, sinon il est déplacé vers l'endroit libre le plus proche,
 * pour qu'il soit toujours entièrement visible :
 *  - jamais coupé par les bords de l'écran,
 *  - jamais caché derrière les obstacles (terminal, porte, invitation...),
 *  - jamais sous la barre de menu, et sans chevaucher les autres mots.
 *
 * Les mesures ignorent les transformations CSS (offsetLeft/offsetWidth), donc le
 * calcul est juste aussi dans la miniature de l'intro et pendant les animations.
 */

export interface FloatingWord {
  x: number; // position préférée, en % de la largeur
  y: number; // position préférée, en % de la hauteur
}

interface Options {
  /** Hauteur réservée en haut (barre de menu), en px. */
  top?: number;
  /** Marge autour des obstacles, en px (couvre le flottement et la parallaxe). */
  margin?: number;
  /** Espace minimal entre deux mots, en px. */
  gap?: number;
  /** Marge par rapport aux bords de l'écran, en px. */
  edge?: number;
}

type Box = { x: number; y: number; w: number; h: number };

/** Position d'un élément relativement à `ancestor`, sans tenir compte des transformations. */
function offsetBox(el: HTMLElement, ancestor: HTMLElement): Box | null {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  if (node !== ancestor) return null;
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

const overlaps = (a: Box, b: Box, pad: number) =>
  a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

export function useFloatingWords(
  rootRef: RefObject<HTMLElement>,
  obstacleRefs: RefObject<HTMLElement>[],
  words: FloatingWord[],
  { top = 0, margin = 16, gap = 10, edge = 12 }: Options = {}
) {
  const wordRefs = useRef<(HTMLElement | null)[]>([]);
  const [positions, setPositions] = useState<({ left: number; top: number } | null)[]>(() => words.map(() => null));

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const layout = () => {
      const W = root.offsetWidth;
      const H = root.offsetHeight;
      if (!W || !H) return;

      const obstacles = obstacleRefs
        .map((r) => (r.current ? offsetBox(r.current, root) : null))
        .filter((b): b is Box => !!b && b.w > 0)
        .map((b) => ({ x: b.x - margin, y: b.y - margin, w: b.w + 2 * margin, h: b.h + 2 * margin }));

      // Grille de positions candidates (coin haut-gauche du mot), assez fine pour bien remplir.
      const stepX = Math.max(8, W / 60);
      const stepY = Math.max(6, H / 80);
      const placed: Box[] = [];
      // Sur les tout petits écrans, on resserre un peu les mots pour qu'ils tiennent tous.
      const wordGap = Math.min(gap, Math.max(6, W / 40));

      const result = words.map((word, i) => {
        const el = wordRefs.current[i];
        if (!el) return null;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const minX = edge;
        const maxX = W - edge - w;
        const minY = Math.max(edge, top);
        const maxY = H - edge - h;
        if (maxX < minX || maxY < minY) return null;

        // Position préférée, ramenée dans l'écran.
        const px = Math.min(maxX, Math.max(minX, (word.x / 100) * W - w / 2));
        const py = Math.min(maxY, Math.max(minY, (word.y / 100) * H - h / 2));

        const free = (b: Box, avoidWords: boolean) =>
          !obstacles.some((o) => overlaps(b, o, 0)) && (!avoidWords || !placed.some((p) => overlaps(b, p, wordGap)));

        let best: Box | null = null;
        for (const avoidWords of [true, false]) {
          let bestDist = Infinity;
          const tryAt = (x: number, y: number) => {
            const b = { x, y, w, h };
            if (!free(b, avoidWords)) return;
            const d = (x - px) ** 2 + ((y - py) * 1.4) ** 2;
            if (d < bestDist) {
              bestDist = d;
              best = b;
            }
          };
          tryAt(px, py);
          if (best) break;
          for (let y = minY; y <= maxY; y += stepY) {
            for (let x = minX; x <= maxX; x += stepX) tryAt(x, y);
            tryAt(maxX, y);
          }
          if (best) break;
        }

        const chosen: Box = best ?? { x: px, y: py, w, h };
        placed.push(chosen);
        return { left: chosen.x, top: chosen.y };
      });

      setPositions(result);
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(root);
    obstacleRefs.forEach((r) => r.current && ro.observe(r.current));
    window.addEventListener('resize', layout);
    // Les polices peuvent finir de charger après le premier calcul (largeur des mots).
    document.fonts?.ready.then(layout).catch(() => undefined);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', layout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { wordRefs, positions };
}
