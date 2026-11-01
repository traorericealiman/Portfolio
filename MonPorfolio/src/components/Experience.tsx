import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Exp {
  role: string;
  org: string;
  period: string;
  current: boolean;
  description: string | null;
  logo: string;
  /** début et fin (mois 1-12) ; fin absente = en cours */
  start: [number, number];
  end?: [number, number];
}

const EXPERIENCES: Exp[] = [
  {
    role: 'Développeuse',
    org: 'Orange Côte d’Ivoire',
    logo: '/logos/orange.png',
    period: 'Juil. 2026 — En cours',
    start: [2026, 7],
    current: true,
    description: 'Création d’un Agent Digital Intelligent pour améliorer l’expérience client.',
  },
  {
    role: 'Membre du comité communication',
    org: 'Association Estudiantine de l’ESATIC (A2E)',
    logo: '/logos/a2e.png',
    period: 'Fév. 2026 — En cours',
    start: [2026, 2],
    current: true,
    description: 'Participation à la stratégie de communication et à la création de contenus.',
  },
  {
    role: 'Responsable IT',
    org: 'Réseau International des Femmes Expertes du Numérique (RIFEN)',
    logo: '/logos/rifen.webp',
    period: 'Juil. 2025 — En cours',
    start: [2025, 7],
    current: true,
    description: 'Supervision de la gestion et de l’optimisation des outils informatiques.',
  },
  {
    role: 'Cheffe de projet',
    org: '10 000 Codeurs',
    logo: '/logos/10000-codeurs.png',
    period: 'Août 2024 — En cours',
    start: [2024, 8],
    current: true,
    description:
      'Pilotage des 2e et 3e éditions du Forum numérique à Grand-Bassam (équipes, logistique, communication partenaires).',
  },
  {
    role: 'Présidente du comité d’organisation',
    org: 'Bureau des étudiants IT 11',
    logo: '/logos/it11.png',
    period: 'Sept. 2025 — Juil. 2026',
    start: [2025, 9],
    end: [2026, 7],
    current: false,
    description: 'Coordination et supervision des activités afin d’assurer la bonne réalisation des projets.',
  },
  {
    role: 'Développeuse IT application',
    org: 'Ecobank Côte d’Ivoire',
    logo: '/logos/ecobank.png',
    period: 'Juil. 2025 — Sept. 2025',
    start: [2025, 7],
    end: [2025, 9],
    current: false,
    description: 'Stagiaire chargée de l’automatisation des processus.',
  },
  {
    role: 'Développeuse web et mobile',
    org: 'Iflysim',
    logo: '/logos/iflysim.png',
    period: 'Déc. 2024 — Mars 2025',
    start: [2024, 12],
    end: [2025, 3],
    current: false,
    description: null,
  },
  {
    role: 'Présidente du club informatique',
    org: 'Institut Ivoirien de Technologie',
    logo: '/logos/iit.png',
    period: 'Oct. 2023 — Juil. 2024',
    start: [2023, 10],
    end: [2024, 7],
    current: false,
    description: null,
  },
  {
    role: 'Stagiaire',
    org: 'Institut Ivoirien de Technologie',
    logo: '/logos/iit.png',
    period: 'Juil. 2023 — Août 2023',
    start: [2023, 7],
    end: [2023, 8],
    current: false,
    description: null,
  },
];

const N = EXPERIENCES.length;

/** Durée en mois « calendaires » (le mois de début et celui de fin comptent), jusqu'à aujourd'hui si la fin est absente. */
function duration(exp: Exp) {
  const now = new Date();
  const [sy, sm] = exp.start;
  const [ey, em] = exp.end ?? [now.getFullYear(), now.getMonth() + 1];
  const months = (ey - sy) * 12 + (em - sm) + 1;
  if (months < 12) return `${months} mois`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return `${y} an${y > 1 ? 's' : ''}${m ? ` ${m} mois` : ''}`;
}

function useSpread() {
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 1200 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  if (vw < 640) return { spread: 34, visible: 2 };
  if (vw < 1024) return { spread: 72, visible: 3 };
  return { spread: 112, visible: 4 };
}

/** Face d'une carte : sobre, comme une carte de visite. */
function CardFace({ exp }: { exp: Exp }) {
  return (
    <div className="flex h-full flex-col rounded-[22px] bg-white p-7">
      <div className="flex h-[72px] items-center">
        <img
          src={exp.logo}
          alt={exp.org}
          draggable={false}
          className="max-h-full max-w-[190px] object-contain object-left"
        />
      </div>

      <div className="my-5 h-px bg-zinc-200" />

      <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-zinc-500">
        {exp.current && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-label="en cours" />}
        <span>{exp.current ? `Depuis ${exp.period.split(' — ')[0]}` : exp.period}</span>
        <span aria-hidden>·</span>
        <span>{duration(exp)}</span>
      </p>

      <h3 className="mt-3 text-[25px] font-semibold leading-[1.15] tracking-tight text-zinc-900">{exp.role}</h3>
      <p className="mt-1.5 text-[15px] text-zinc-600">{exp.org}</p>

      {exp.description && (
        <p className="mt-4 text-sm leading-relaxed text-zinc-500">{exp.description}</p>
      )}
    </div>
  );
}

/** Une carte de l'éventail. Le placement (ressort) et le glissement sont portés par deux éléments distincts pour éviter toute vibration. */
function FanCard({
  exp,
  d,
  spread,
  hidden,
  onSelect,
  onSwipe,
}: {
  exp: Exp;
  d: number;
  spread: number;
  hidden: boolean;
  onSelect: () => void;
  onSwipe: (dir: 1 | -1) => void;
}) {
  const abs = Math.abs(d);
  const isActive = d === 0;
  const dragX = useMotionValue(0);
  const tilt = useTransform(dragX, [-300, 0, 300], [-9, 0, 9]);

  return (
    <motion.div
      animate={{
        x: d * spread,
        y: abs * abs * 8,
        rotate: d * 5.5,
        scale: 1 - abs * 0.05,
        opacity: hidden ? 0 : 1,
      }}
      transition={{ type: 'spring', stiffness: 170, damping: 24, mass: 1 }}
      style={{ zIndex: 100 - abs * 2 - (d > 0 ? 1 : 0), transformOrigin: '50% 120%' }}
      className={`absolute left-1/2 top-4 -ml-[150px] h-[430px] w-[300px] sm:-ml-[180px] sm:h-[450px] sm:w-[360px] ${
        hidden ? 'pointer-events-none' : ''
      }`}
    >
      <motion.div
        drag={isActive ? 'x' : false}
        dragMomentum={false}
        dragElastic={0.9}
        dragSnapToOrigin
        onDragEnd={(_, info) => {
          if (info.offset.x < -80 || info.velocity.x < -500) onSwipe(1);
          else if (info.offset.x > 80 || info.velocity.x > 500) onSwipe(-1);
        }}
        onClick={() => !isActive && onSelect()}
        whileHover={isActive ? undefined : { y: -12 }}
        whileDrag={{ scale: 1.02 }}
        style={{ x: dragX, rotate: tilt, touchAction: 'pan-y', userSelect: 'none', transformOrigin: '50% 120%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className={`relative h-full w-full rounded-[24px] border border-zinc-200 bg-white p-[1px] ${
          isActive
            ? 'cursor-grab shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] active:cursor-grabbing'
            : 'cursor-pointer shadow-[0_18px_40px_-26px_rgba(0,0,0,0.3)]'
        }`}
      >
        <CardFace exp={exp} />
        {/* voile sur les cartes de l'arrière */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[24px] bg-zinc-100 transition-opacity duration-500"
          style={{ opacity: isActive ? 0 : Math.min(0.3 + abs * 0.12, 0.75) }}
        />
      </motion.div>
    </motion.div>
  );
}

export default function Experience() {
  const [active, setActive] = useState(0);
  const { spread, visible } = useSpread();
  const lastWheel = useRef(0);

  const go = (to: number) => setActive(Math.max(0, Math.min(N - 1, to)));

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) < 25 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    const now = performance.now();
    if (now - lastWheel.current < 350) return;
    lastWheel.current = now;
    go(active + (e.deltaX > 0 ? 1 : -1));
  };

  return (
    <section id="experience" className="relative scroll-mt-12 overflow-hidden border-t border-zinc-200 bg-zinc-100 py-20 sm:py-28">
      <div className="mx-auto mb-6 flex max-w-6xl flex-col items-start justify-between gap-6 px-6 sm:mb-10 md:flex-row md:items-end lg:px-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl font-black leading-none tracking-tighter text-zinc-900 md:text-7xl"
        >
          EXPÉRIENCE <span className="text-zinc-300">PRO.</span>
        </motion.h2>

        <div className="flex items-center gap-3">
          {[
            { label: 'Carte précédente', Icon: ArrowLeft, to: active - 1, off: active === 0 },
            { label: 'Carte suivante', Icon: ArrowRight, to: active + 1, off: active === N - 1 },
          ].map(({ label, Icon, to, off }) => (
            <motion.button
              key={label}
              type="button"
              aria-label={label}
              disabled={off}
              onClick={() => go(to)}
              whileHover={off ? undefined : { scale: 1.08 }}
              whileTap={off ? undefined : { scale: 0.94 }}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors hover:border-blue-600 hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-zinc-300 disabled:hover:bg-white disabled:hover:text-zinc-700"
            >
              <Icon size={20} />
            </motion.button>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        tabIndex={0}
        role="group"
        aria-label="Expériences professionnelles"
        onWheel={onWheel}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(active + 1);
          if (e.key === 'ArrowLeft') go(active - 1);
        }}
        className="relative mx-auto h-[500px] w-full max-w-6xl outline-none sm:h-[520px]"
      >
        {EXPERIENCES.map((exp, i) => (
          <FanCard
            key={`${exp.role}-${exp.org}`}
            exp={exp}
            d={i - active}
            spread={spread}
            hidden={Math.abs(i - active) > visible}
            onSelect={() => go(i)}
            onSwipe={(dir) => go(active + dir)}
          />
        ))}
      </motion.div>

      <div className="mt-2 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          {EXPERIENCES.map((exp, i) => (
            <button
              key={exp.role + exp.org}
              type="button"
              aria-label={`Aller à : ${exp.role}`}
              onClick={() => go(i)}
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: i === active ? 32 : 8, background: i === active ? '#0A66C2' : '#d4d4d8' }}
            />
          ))}
        </div>
        <p className="text-sm text-zinc-400">Faites glisser la carte, ou cliquez sur celles de derrière</p>
      </div>
    </section>
  );
}
