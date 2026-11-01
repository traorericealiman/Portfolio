import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const STACK = [
  {
    category: 'Frontend',
    color: '#2563eb',
    tools: [
      { name: 'React', role: 'Interfaces dynamiques', logo: 'https://cdn.simpleicons.org/react/61DAFB' },
      { name: 'Next.js', role: 'Framework React', logo: 'https://cdn.simpleicons.org/nextdotjs/000000' },
      { name: 'TypeScript', role: 'JavaScript typé', logo: 'https://cdn.simpleicons.org/typescript/3178C6' },
      { name: 'Tailwind', role: 'CSS utilitaire', logo: 'https://cdn.simpleicons.org/tailwindcss/06B6D4' },
    ],
  },
  {
    category: 'Mobile',
    color: '#0891b2',
    tools: [
      { name: 'Flutter', role: 'Apps iOS et Android (Dart)', logo: 'https://cdn.simpleicons.org/flutter/02569B' },
      { name: 'React Native', role: 'Apps mobiles avec React', logo: 'https://cdn.simpleicons.org/react/61DAFB' },
    ],
  },
  {
    category: 'Backend',
    color: '#059669',
    tools: [
      { name: 'Node.js', role: 'Environnement JavaScript', logo: 'https://cdn.simpleicons.org/nodedotjs/339933' },
      { name: 'Express', role: 'APIs REST', logo: 'https://cdn.simpleicons.org/express/000000' },
      { name: 'Python', role: 'Scripts et services', logo: 'https://cdn.simpleicons.org/python/3776AB' },
    ],
  },
  {
    category: 'Database',
    color: '#4f46e5',
    tools: [
      { name: 'PostgreSQL', role: 'Base relationnelle', logo: 'https://cdn.simpleicons.org/postgresql/4169E1' },
      { name: 'Supabase', role: 'Backend as a service', logo: 'https://cdn.simpleicons.org/supabase/3ECF8E' },
      { name: 'MongoDB', role: 'Base NoSQL', logo: 'https://cdn.simpleicons.org/mongodb/47A248' },
    ],
  },
  {
    category: 'Design',
    color: '#db2777',
    tools: [
      { name: 'Figma', role: 'Maquettes et prototypes', logo: 'https://cdn.simpleicons.org/figma/F24E1E' },
      { name: 'Photoshop', role: 'Retouche et visuels', logo: '/icons/photoshop.svg' },
      { name: 'Illustrator', role: 'Illustration vectorielle', logo: '/icons/illustrator.svg' },
    ],
  },
  {
    category: 'DevOps',
    color: '#d97706',
    tools: [
      { name: 'Git', role: 'Gestion de versions', logo: 'https://cdn.simpleicons.org/git/F05032' },
      { name: 'Docker', role: 'Conteneurs', logo: 'https://cdn.simpleicons.org/docker/2496ED' },
      { name: 'Vercel', role: 'Déploiement', logo: 'https://cdn.simpleicons.org/vercel/000000' },
    ],
  },
];

const AUTOPLAY_MS = 5500;

export default function Technologies() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = STACK[active];

  // Défilement automatique des catégories, mis en pause quand on interagit
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % STACK.length), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [active, paused]);

  return (
    <section id="technologies" className="w-full bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 flex flex-col items-start justify-between gap-6 md:mb-16 md:flex-row md:items-end"
        >
          <h2 className="text-5xl font-black leading-none tracking-tighter text-zinc-900 md:text-7xl">
            TECH <span className="text-zinc-200">STACK.</span>
          </h2>
          <p className="max-w-[320px] text-base font-light leading-relaxed text-zinc-500">
            Les technologies que j'utilise pour concevoir, développer et déployer.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-8 lg:grid-cols-12 lg:gap-14"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Catégories */}
          <div
            role="tablist"
            aria-label="Catégories de technologies"
            className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 lg:col-span-4 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0"
          >
            {STACK.map((s, i) => {
              const on = i === active;
              return (
                <button
                  key={s.category}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  className={`group relative flex shrink-0 items-center gap-3 rounded-full border px-4 py-2 text-left text-sm font-semibold transition-colors lg:rounded-none lg:border-0 lg:border-b lg:border-zinc-100 lg:px-0 lg:py-5 lg:text-xl ${
                    on
                      ? 'border-zinc-900 bg-zinc-900 text-white lg:bg-transparent lg:text-zinc-900'
                      : 'border-zinc-200 text-zinc-500 hover:text-zinc-900 lg:text-zinc-300'
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId="tech-indicator"
                      className="absolute -left-4 top-1/2 hidden h-8 w-1 -translate-y-1/2 rounded-full lg:block"
                      style={{ background: s.color }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="hidden font-mono text-xs text-zinc-400 lg:block">0{i + 1}</span>
                  <span className="font-bold lg:tracking-tight">{s.category}</span>
                  <span className="ml-auto hidden font-mono text-xs text-zinc-300 lg:block">{s.tools.length}</span>
                  {on && (
                    <motion.span
                      key={`${i}-${paused}`}
                      className="absolute -bottom-px left-0 hidden h-px lg:block"
                      style={{ background: s.color }}
                      initial={{ width: paused ? '100%' : '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: paused ? 0 : AUTOPLAY_MS / 1000, ease: 'linear' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Panneau */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.category}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                role="tabpanel"
                className="lg:min-h-[280px]"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {current.tools.map((tool, j) => (
                    <motion.div
                      key={tool.name}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.08 + j * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -4 }}
                      className="group flex items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.18)]"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-50 ring-1 ring-zinc-100 transition-colors group-hover:bg-white">
                        <img src={tool.logo} alt="" draggable={false} className="h-7 w-7 object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-bold tracking-tight text-zinc-900">{tool.name}</p>
                        <p className="text-sm text-zinc-500">{tool.role}</p>
                      </div>
                      <span
                        className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ background: current.color }}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
