import { ArrowRight } from 'lucide-react';

// Réseau de neurones qui se lit de gauche à droite : ce que j'utilise (entrées)
// devient ce que je livre (sortie). De la sortie part le fil conducteur du site.
const INPUTS = [
  { label: 'Données', y: 60 },
  { label: 'Modèles', y: 130 },
  { label: 'Code', y: 200 },
];
const HIDDEN = [36, 98, 162, 224];
const OUT = { x: 344, y: 130 };
const X_IN = 96;
const X_HID = 222;

const EDGES = [
  ...INPUTS.flatMap((i) => HIDDEN.map((h) => `M${X_IN} ${i.y} L${X_HID} ${h}`)),
  ...HIDDEN.map((h) => `M${X_HID} ${h} L${OUT.x} ${OUT.y}`),
];

function Network({ animated }: { animated: boolean }) {
  return (
    <svg viewBox="0 0 420 270" className="h-auto w-full overflow-visible" role="img" aria-label="Données, modèles et code transformés en solutions IA">
      {EDGES.map((d, i) => (
        <g key={d}>
          <path d={d} fill="none" stroke="rgba(96,165,250,0.35)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
          {animated && i % 2 === 0 && (
            <path
              d={d}
              pathLength={100}
              className="ai-pulse"
              style={{
                animationDelay: `${(i * 0.35) % 3}s`,
                animationDuration: '2.8s',
                filter: 'drop-shadow(0 0 3px rgba(103,232,249,0.9))',
              }}
              fill="none"
              stroke="#67e8f9"
              strokeWidth={2.4}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </g>
      ))}

      {/* Entrées */}
      {INPUTS.map((n) => (
        <g key={n.label}>
          <circle cx={X_IN} cy={n.y} r={9} fill="#0b1220" stroke="#60a5fa" strokeWidth={1.6} />
          <circle cx={X_IN} cy={n.y} r={3.5} fill="#93c5fd" />
          <text x={X_IN - 18} y={n.y + 5} textAnchor="end" className="fill-zinc-300 font-mono text-[15px]">
            {n.label}
          </text>
        </g>
      ))}

      {/* Couche cachée */}
      {HIDDEN.map((y, i) => (
        <circle
          key={y}
          cx={X_HID}
          cy={y}
          r={7}
          fill="#0b1220"
          stroke="#38bdf8"
          strokeWidth={1.4}
          className="ai-node"
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}

      {/* Sortie : point de départ du fil conducteur */}
      <circle cx={OUT.x} cy={OUT.y} r={20} fill="rgba(34,211,238,0.12)" className="ai-node" />
      <circle cx={OUT.x} cy={OUT.y} r={12} fill="#0b1220" stroke="#22d3ee" strokeWidth={2} />
      <circle data-thread-origin cx={OUT.x} cy={OUT.y} r={5} fill="#a5f3fc" />
      <text x={OUT.x} y={OUT.y - 30} textAnchor="middle" className="fill-cyan-200 font-mono text-[15px] font-semibold">
        Solutions IA
      </text>
    </svg>
  );
}

/** `preview` : version figée (miniature de l'intro) — aucune animation ni interaction. */
export default function Hero({ preview = false }: { preview?: boolean }) {
  return (
    <div data-thread-hero className="relative min-h-screen overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(74,158,221,1) 1px, transparent 1px), linear-gradient(90deg, rgba(74,158,221,1) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 60% 50%, black 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 60% 50%, black 0%, transparent 70%)',
        }}
      />
      <div className="pointer-events-none absolute right-[10%] top-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-[100px] lg:h-96 lg:w-96" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-12 px-6 pb-16 pt-28 md:flex-row md:items-center md:gap-10 lg:px-10">
        {/* Texte */}
        <div className="md:w-1/2">
          <p className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-cyan-300/80 sm:text-sm">
            <span className="h-px w-10 bg-cyan-300/60" />
            Portfolio
          </p>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Traoré
            <br />
            Rice-Aliman
          </h1>
          <p className="mt-4 text-xl font-light text-blue-300 sm:text-2xl">
            Développeuse en intelligence artificielle
          </p>
          <p className="mt-6 max-w-md text-base font-light leading-relaxed text-zinc-400">
            Je transforme des données, des modèles et du code en solutions utiles : traitement du langage, applications web
            et mobiles.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#projects"
              tabIndex={preview ? -1 : undefined}
              className="group inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-blue-400"
            >
              Voir mes projets
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#contact"
              tabIndex={preview ? -1 : undefined}
              className="inline-flex items-center rounded-full border border-zinc-700 px-6 py-3 text-sm font-bold text-zinc-200 transition-colors hover:border-blue-400 hover:text-white"
            >
              Me contacter
            </a>
          </div>
        </div>

        {/* Réseau : entrées -> solutions */}
        <div className="mx-auto w-full max-w-[460px] md:w-1/2 md:max-w-none">
          <Network animated={!preview} />
        </div>
      </div>
    </div>
  );
}
