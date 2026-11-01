import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useContent } from '../lib/contentStore';
import type { Project } from '../types/content';

const ease = [0.76, 0, 0.24, 1] as const;

export default function Projects() {
  const { projects } = useContent();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const goTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(projects.length - 1, index));
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el) setCurrentIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const current = projects[currentIndex] || projects[0];

  if (!current) {
    return (
      <div id="projects" className="flex w-full items-center justify-center bg-zinc-950 py-24 text-zinc-500">
        Aucun projet à afficher pour le moment.
      </div>
    );
  }

  const fg = current.textColor;
  const hair = current.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)';
  const multiple = projects.length > 1;

  return (
    <section
      id="projects"
      className="relative w-full scroll-mt-12"
      style={{ background: current.bg, color: fg, transition: 'background 0.6s ease, color 0.6s ease' }}
    >
      {/* En-tête : titre à gauche, sélecteur de projet à droite */}
      <div className="mx-auto max-w-[1400px] px-6 pt-16 sm:px-10 md:px-16 md:pt-24">
        <div
          className="flex flex-col gap-8 border-b pb-8 md:flex-row md:items-end md:justify-between"
          style={{ borderColor: hair }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl font-black leading-none tracking-tighter md:text-7xl"
          >
            MES <span style={{ opacity: 0.25 }}>PROJETS.</span>
          </motion.h2>

          {multiple && (
            <div className="flex items-center justify-between gap-8 md:justify-end">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {projects.map((p, i) => {
                  const on = i === currentIndex;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => goTo(i)}
                      className="relative pb-2 text-sm font-semibold transition-opacity hover:opacity-100"
                      style={{ color: fg, opacity: on ? 1 : 0.4 }}
                    >
                      {p.title}
                      <motion.span
                        className="absolute bottom-0 left-0 h-[2px]"
                        style={{ background: current.accent }}
                        animate={{ width: on ? '100%' : '0%' }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="flex shrink-0 items-center gap-5">
                {[
                  { label: 'Projet précédent', Icon: ArrowLeft, to: currentIndex - 1, off: currentIndex === 0, move: -4 },
                  { label: 'Projet suivant', Icon: ArrowRight, to: currentIndex + 1, off: currentIndex === projects.length - 1, move: 4 },
                ].map(({ label, Icon, to, off, move }) => (
                  <motion.button
                    key={label}
                    type="button"
                    aria-label={label}
                    disabled={off}
                    onClick={() => goTo(to)}
                    whileHover={off ? undefined : { x: move }}
                    className="disabled:cursor-not-allowed disabled:opacity-25"
                    style={{ color: fg }}
                  >
                    <Icon size={24} strokeWidth={1.5} />
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {projects.map((project) => (
          <div key={project.id} className="w-full shrink-0 snap-center">
            <Slide project={project} />
          </div>
        ))}
      </div>

    </section>
  );
}

function Slide({ project }: { project: Project }) {
  const muted = project.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const hair = project.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)';

  const rows: { label: string; value: string }[] = [
    { label: 'Année', value: project.year },
    { label: 'Catégorie', value: project.category },
    { label: 'Technologies', value: (project.tech || []).join(', ') },
  ].filter((r) => r.value);

  const words = project.title.split(' ');

  return (
    <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-6 py-12 sm:px-10 md:grid-cols-12 md:gap-14 md:px-16 md:py-16">
      {/* Texte */}
      <div className="md:col-span-5">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.4 }}
          className="mb-8 font-bold leading-[0.98] tracking-tight"
          style={{ fontSize: 'clamp(30px, 3.4vw, 50px)' }}
        >
          {words.map((w, i) => (
            <span key={i} className="mr-[0.25em] inline-block overflow-hidden align-bottom pb-[0.08em]">
              <motion.span
                className="inline-block"
                custom={i}
                variants={{
                  hidden: { y: '110%' },
                  show: (n: number) => ({ y: '0%', transition: { duration: 0.9, delay: 0.1 + n * 0.08, ease } }),
                }}
              >
                {w}
              </motion.span>
            </span>
          ))}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 0.8, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 max-w-md text-[17px] leading-relaxed"
        >
          {project.description}
        </motion.p>

        <dl className="max-w-md">
          {rows.map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-baseline justify-between gap-6 border-t py-3.5 text-[15px]"
              style={{
                borderColor: hair,
                ...(i === rows.length - 1 ? { borderBottomWidth: 1, borderBottomStyle: 'solid' } : {}),
              }}
            >
              <dt style={{ color: muted }}>{r.label}</dt>
              <dd className="text-right font-medium">{r.value}</dd>
            </motion.div>
          ))}
        </dl>
      </div>

      {/* Image : révélée par un balayage, sans cadre */}
      <motion.div
        className="md:col-span-7"
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.25 }}
      >
        <motion.div
          variants={{
            hidden: { clipPath: 'inset(0 0 100% 0)' },
            show: { clipPath: 'inset(0 0 0% 0)', transition: { duration: 1.1, delay: 0.1, ease } },
          }}
          className="h-[clamp(300px,58vh,540px)] w-full overflow-hidden rounded-[20px]"
          style={{ background: project.isDark ? '#141416' : '#ffffff' }}
        >
          {project.image ? (
            <motion.img
              src={project.image}
              alt={project.title}
              draggable={false}
              variants={{
                hidden: { scale: 1.12 },
                show: { scale: 1, transition: { duration: 1.4, delay: 0.1, ease } },
              }}
              className="block h-full w-full object-contain"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: `linear-gradient(145deg, ${project.accent}22, ${project.accent}08)` }}
            >
              <span className="text-8xl font-bold tracking-tighter" style={{ color: project.accent, opacity: 0.5 }}>
                {project.title.charAt(0)}
              </span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
