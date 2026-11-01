import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useContent } from '../lib/contentStore';

export default function VisualCreations() {
  const { creations } = useContent();
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<{ image: string; title: string } | null>(null);

  const nextCard = () => setIndex((prev) => (prev + 1) % creations.length);
  const prevCard = () => setIndex((prev) => (prev - 1 + creations.length) % creations.length);

  return (
    <section id="creations" className="relative scroll-mt-12 py-16 sm:py-20 md:py-24 bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #22d3ee 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">
        
        {/* Left Side: Content */}
        <div className="flex-1 text-white space-y-6 sm:space-y-8 text-center lg:text-left w-full">
          <div className="space-y-3 sm:space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 text-blue-400 font-mono justify-center lg:justify-start"
            >
            </motion.div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tighter">
              CRÉATIONS <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-500">
                VISUELLES
              </span>
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg max-w-md font-light leading-relaxed mx-auto lg:mx-0">
              Une immersion dans mon univers graphique où le code rencontre l'esthétique pure.
            </p>
          </div>

          {/* Custom Navigation */}
          <div className="flex gap-3 sm:gap-4 justify-center lg:justify-start">
            <button 
              onClick={prevCard} 
              className="p-3 sm:p-4 rounded-full border border-zinc-800 hover:bg-white hover:text-black transition-all group"
              aria-label="Projet précédent"
            >
              <ChevronLeft size={20} className="sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={nextCard} 
              className="p-3 sm:p-4 rounded-full bg-blue-500 text-black hover:bg-blue-400 transition-all group"
              aria-label="Projet suivant"
            >
              <ChevronRight size={20} className="sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Side: Animated Stack */}
        <div className="flex-1 relative w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[560px] mx-auto lg:mx-0" style={{ height: '640px', minHeight: '640px' }}>
          <AnimatePresence mode="popLayout">
            {creations.slice(index, index + 3).map((item, i) => {
              const isFirst = i === 0;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{
                    opacity: 1 - i * 0.15,
                    scale: 1 - i * 0.08,
                    y: i * 35,
                    x: i * 5,
                    zIndex: creations.length - i,
                  }}
                  exit={{
                    x: 300,
                    opacity: 0,
                    rotate: 15,
                    transition: { duration: 0.4 }
                  }}
                  className="absolute top-0 left-0 right-0"
                  style={{ height: '540px' }}
                >
                  <div className="w-full h-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                    {/* Header Style Terminal */}
                    <div className="p-3 sm:p-4 bg-zinc-800/50 flex items-center justify-between">
                      <div className="flex gap-1 sm:gap-1.5">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                      </div>
                      <Terminal size={14} className="sm:w-4 sm:h-4 text-zinc-500" />
                    </div>

                    {/* Image / Content Area */}
                    <div
                      className={`flex-1 relative group bg-black ${item.image ? 'cursor-zoom-in' : ''}`}
                      onClick={() => item.image && setLightbox({ image: item.image, title: item.title })}
                    >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className="absolute inset-0 opacity-40 transition-opacity group-hover:opacity-60"
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 sm:pb-10 p-6 sm:p-8 text-center pointer-events-none">
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 px-2">{item.title}</h3>
                            <span className="px-3 sm:px-4 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] sm:text-xs text-white uppercase tracking-widest font-bold backdrop-blur-sm">
                                {item.category}
                            </span>
                        </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Lightbox : image en taille réelle */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              aria-label="Fermer"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={lightbox.image}
              alt={lightbox.title}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}