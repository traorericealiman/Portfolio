/**
 * Filigranes « fils neuronaux » : dessins au trait fin (cerveau-circuit, robot,
 * réseau de neurones, profil humain/machine) parcourus par de petites impulsions,
 * comme des signaux qui circulent. Purement décoratifs : couleur héritée
 * (currentColor), aucun clic intercepté, immobiles si l'utilisateur réduit les animations.
 */

export type AiVariant = 'brain' | 'robot' | 'network' | 'profile' | 'circuit';

/** Fond sur lequel le dessin est posé : règle les couleurs pour qu'il reste bien visible. */
export type AiTone = 'dark' | 'light' | 'current';

interface Props {
  variant: AiVariant;
  tone?: AiTone;
  className?: string;
  /** Impulsions lumineuses le long des fils (désactivées dans la miniature de l'intro). */
  animated?: boolean;
}

const stroke = {
  fill: 'none',
  style: { stroke: 'var(--ai-line)' },
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  vectorEffect: 'non-scaling-stroke' as const,
};

/** Nœud : petit cercle, avec un battement décalé. */
function Node({ x, y, r = 2.6, i = 0 }: { x: number; y: number; r?: number; i?: number }) {
  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      className="ai-node"
      {...stroke}
      style={{ stroke: 'var(--ai-node)', fill: 'var(--ai-node-fill)', animationDelay: `${(i * 0.37) % 3}s` }}
    />
  );
}

/** Fil : trait fixe + impulsion qui le parcourt. */
function Wire({ d, i = 0, animated }: { d: string; i?: number; animated: boolean }) {
  return (
    <>
      <path d={d} {...stroke} />
      {animated && (
        <path
          d={d}
          pathLength={100}
          className="ai-pulse"
          {...stroke}
          style={{ stroke: 'var(--ai-pulse)', animationDelay: `${(i * 0.9) % 6}s` }}
          strokeWidth={2.6}
        />
      )}
    </>
  );
}

function Brain({ animated }: { animated: boolean }) {
  // Moitié gauche, puis la même en miroir : un cerveau dont les circonvolutions sont des pistes de circuit.
  const half = (
    <>
      <path
        d="M100 28 C84 16 58 20 50 38 C32 40 20 58 26 76 C12 88 14 112 30 122 C28 142 46 160 68 156 C76 170 94 172 100 164"
        {...stroke}
      />
      <Wire animated={animated} i={0} d="M100 52 H84 L72 40" />
      <Wire animated={animated} i={1} d="M100 74 H78 L64 60 H46" />
      <Wire animated={animated} i={2} d="M100 98 H70 L58 110 H36" />
      <Wire animated={animated} i={3} d="M100 122 H82 L70 136 V148" />
      <Wire animated={animated} i={4} d="M78 74 V92 L64 92" />
      <Node x={72} y={40} i={1} />
      <Node x={46} y={60} i={2} />
      <Node x={36} y={110} i={3} />
      <Node x={70} y={148} i={4} />
      <Node x={64} y={92} r={2} i={5} />
    </>
  );
  return (
    <svg viewBox="0 0 200 190">
      {half}
      <g transform="translate(200 0) scale(-1 1)">{half}</g>
      <path d="M100 28 V164" {...stroke} strokeDasharray="2 5" />
    </svg>
  );
}

function Robot({ animated }: { animated: boolean }) {
  return (
    <svg viewBox="0 0 200 200">
      <path d="M100 42 V24" {...stroke} />
      <Node x={100} y={19} r={4.5} />
      <rect x={52} y={42} width={96} height={84} rx={20} {...stroke} />
      <rect x={38} y={70} width={14} height={28} rx={5} {...stroke} />
      <rect x={148} y={70} width={14} height={28} rx={5} {...stroke} />
      <circle cx={80} cy={78} r={11} {...stroke} />
      <circle cx={120} cy={78} r={11} {...stroke} />
      <Node x={80} y={78} r={3.5} i={1} />
      <Node x={120} y={78} r={3.5} i={2} />
      <rect x={76} y={102} width={48} height={11} rx={4} {...stroke} />
      {[86, 96, 104, 114].map((x) => (
        <path key={x} d={`M${x} 102 V113`} {...stroke} />
      ))}
      <path d="M88 126 V138 H112 V126" {...stroke} />
      <path d="M44 182 C44 158 68 140 100 140 C132 140 156 158 156 182" {...stroke} />
      <Wire animated={animated} i={0} d="M100 140 V160 H76 L66 170" />
      <Wire animated={animated} i={2} d="M100 160 H124 L134 170" />
      <Node x={100} y={160} r={4} i={3} />
    </svg>
  );
}

function Network({ animated }: { animated: boolean }) {
  const layers = [
    [50, 100, 150],
    [30, 76, 124, 170],
    [30, 76, 124, 170],
    [70, 130],
  ];
  const xs = [24, 80, 136, 184];
  const wires: string[] = [];
  layers.forEach((col, l) => {
    if (l === layers.length - 1) return;
    col.forEach((y1) => layers[l + 1].forEach((y2) => wires.push(`M${xs[l]} ${y1} L${xs[l + 1]} ${y2}`)));
  });
  return (
    <svg viewBox="0 0 208 200">
      {wires.map((d, i) => (
        <Wire key={d} d={d} i={i} animated={animated && i % 3 === 0} />
      ))}
      {layers.map((col, l) => col.map((y, j) => <Node key={`${l}-${j}`} x={xs[l]} y={y} r={5} i={l * 4 + j} />))}
    </svg>
  );
}

function Profile({ animated }: { animated: boolean }) {
  // Profil d'un visage tracé d'un seul fil ; l'arrière du crâne devient un réseau de neurones.
  return (
    <svg viewBox="0 0 200 220">
      <path
        d="M112 20 C72 20 46 48 46 86 C46 104 40 112 30 126 C26 132 30 136 38 137 L40 150 C40 156 44 158 50 157 L48 166 C48 176 56 180 70 177 L84 175 L86 204"
        {...stroke}
      />
      <path d="M112 20 C150 20 176 50 176 92 C176 122 160 142 140 152 L142 204" {...stroke} />
      <Wire animated={animated} i={0} d="M96 60 L122 48 L150 66 L138 98 L108 92 Z" />
      <Wire animated={animated} i={1} d="M108 92 L120 124 L150 118 L138 98" />
      <Wire animated={animated} i={2} d="M122 48 L138 98 M96 60 L120 124" />
      <Node x={96} y={60} r={3.5} i={0} />
      <Node x={122} y={48} r={3.5} i={1} />
      <Node x={150} y={66} r={3.5} i={2} />
      <Node x={138} y={98} r={3.5} i={3} />
      <Node x={108} y={92} r={3.5} i={4} />
      <Node x={120} y={124} r={3.5} i={5} />
      <Node x={150} y={118} r={3.5} i={6} />
    </svg>
  );
}

function Circuit({ animated }: { animated: boolean }) {
  const paths = [
    'M0 30 H60 L80 50 H140 L160 30 H240',
    'M0 80 H40 L60 100 H120',
    'M120 100 H180 L200 80 H240',
    'M90 0 V40 M150 50 V120 L170 140 H240',
    'M0 140 H70 L90 120 H150',
  ];
  const nodes: [number, number][] = [[60, 30], [140, 50], [120, 100], [90, 40], [150, 120], [70, 140], [40, 80]];
  return (
    <svg viewBox="0 0 240 160">
      {paths.map((d, i) => (
        <Wire key={d} d={d} i={i} animated={animated} />
      ))}
      {nodes.map(([x, y], i) => (
        <Node key={i} x={x} y={y} r={3} i={i} />
      ))}
    </svg>
  );
}

const ART = { brain: Brain, robot: Robot, network: Network, profile: Profile, circuit: Circuit };

export default function AiLineArt({ variant, tone = 'dark', className = '', animated = true }: Props) {
  const Art = ART[variant];
  return (
    <div aria-hidden data-tone={tone} className={`ai-art pointer-events-none select-none ${className}`}>
      <Art animated={animated} />
    </div>
  );
}
