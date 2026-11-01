import { motion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCompetitionDate, sortCompetitionsByDate, useContent } from '../lib/contentStore';
import AiLineArt from './ai/AiLineArt';

export default function Competitions() {
  const content = useContent();
  const competitions = useMemo(() => sortCompetitionsByDate(content.competitions), [content.competitions]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('[data-card]')?.clientWidth || 300;
    el.scrollBy({ left: direction === 'left' ? -(cardWidth + 24) : cardWidth + 24, behavior: 'smooth' });
  };

  return (
    <section className="relative py-16 sm:py-20 md:py-24 bg-zinc-50 text-zinc-900 overflow-hidden">
      <AiLineArt
        variant="circuit"
        className="absolute -left-10 top-6 w-[340px] text-blue-600/[0.10] sm:w-[440px]"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-14"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter">
              Compétitions <span className="font-bold">& Hackathons</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-zinc-500 font-light text-sm sm:text-base max-w-xs">
              {competitions.length} victoires en hackathons nationaux et internationaux.
            </p>
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Précédent"
                className="w-11 h-11 rounded-full border border-zinc-200 bg-white flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Suivant"
                className="w-11 h-11 rounded-full border border-zinc-200 bg-white flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* --- BANDEAU DÉFILABLE MANUELLEMENT --- */}
      <div className="relative max-w-7xl mx-auto">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-zinc-50 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-zinc-50 to-transparent z-10" />

        <div
          ref={scrollRef}
          onScroll={updateArrows}
          className="scroll-track flex gap-4 sm:gap-6 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-2 snap-x snap-mandatory cursor-grab active:cursor-grabbing"
        >
          {competitions.map((comp) => (
            <div
              key={comp.id}
              data-card
              className="flex-shrink-0 w-[260px] sm:w-[320px] snap-start p-5 sm:p-6 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300"
            >
              {/* --- PETIT CADRE PHOTO --- */}
              <div className="relative mb-5 rounded-xl overflow-hidden border border-zinc-100 aspect-[16/10] bg-zinc-50 flex items-center justify-center">
                <img
                  src={comp.image}
                  alt={comp.title}
                  loading="lazy"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide bg-blue-500 text-white px-2.5 py-1 rounded-full whitespace-nowrap">
                  {comp.result}
                </span>
                {comp.date && (
                  <span className="text-[10px] sm:text-xs font-medium text-zinc-400 whitespace-nowrap">
                    {formatCompetitionDate(comp.date)}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-zinc-900 text-sm sm:text-base mb-1 leading-snug">
                {comp.title}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-blue-600 mb-2">
                {comp.project}
              </p>
              <p className="text-xs sm:text-sm font-light text-zinc-500 leading-relaxed">
                {comp.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .scroll-track {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scroll-track::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
