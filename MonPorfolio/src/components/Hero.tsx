import { useState, useEffect } from 'react';
import AiLineArt from './ai/AiLineArt';

// Mots-clés IA : peu nombreux, rangés en deux rangées (au-dessus et au-dessous du
// terminal) pour qu'ils restent toujours entiers et jamais cachés, même sur mobile.
const TOP_WORDS = ['Intelligence Artificielle', 'Machine Learning', 'NLP', 'Deep Learning'];
const BOTTOM_WORDS = ['Data', 'Réseaux de neurones', 'LLM', 'Python'];

const WELCOME = 'Bienvenue sur le portfolio de TRAORE RICE-ALIMAN';
const BAR_CELLS = 16;

/** Étapes du terminal : 0 commande saisie · 1 chargement du modèle · 2 domaine affiché · 3 message d'accueil. */
type Step = 0 | 1 | 2 | 3;

function WordRow({ words, offset, className = '' }: { words: string[]; offset: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none grid grid-cols-2 items-center gap-x-4 gap-y-3 px-1 sm:flex sm:flex-wrap sm:justify-between sm:gap-x-6 ${className}`}
    >
      {words.map((w, i) => (
        <span
          key={w}
          className={`hero-word whitespace-nowrap font-black text-[13px] text-blue-300/60 sm:text-lg lg:text-xl ${
            i % 2 ? 'justify-self-end' : 'justify-self-start'
          } ${(i + offset) % 2 ? 'sm:mt-6' : ''}`}
          style={{ animationDelay: `${(i + offset) * 0.6}s` }}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

/** `preview` : version figée (miniature de l'intro) — aucune animation ni interaction. */
export default function Hero({ preview = false }: { preview?: boolean }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [step, setStep] = useState<Step>(0);
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (preview) return;
    const handleMouse = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [preview]);

  // Séquence du terminal : barre de chargement, ligne « domaine », puis frappe du message.
  useEffect(() => {
    if (preview) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let interval: ReturnType<typeof setInterval>;

    timers.push(
      setTimeout(() => {
        setStep(1);
        let p = 0;
        interval = setInterval(() => {
          p = Math.min(100, p + 5);
          setProgress(p);
          if (p === 100) {
            clearInterval(interval);
            timers.push(setTimeout(() => setStep(2), 200));
            timers.push(
              setTimeout(() => {
                setStep(3);
                let i = 0;
                interval = setInterval(() => {
                  i++;
                  setText(WELCOME.substring(0, i));
                  if (i >= WELCOME.length) clearInterval(interval);
                }, 45);
              }, 650)
            );
          }
        }, 40);
      }, 350)
    );

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [preview]);

  useEffect(() => {
    if (preview) return;
    const blink = setInterval(() => setShowCursor((prev) => !prev), 500);
    return () => clearInterval(blink);
  }, [preview]);

  const filled = Math.round((progress / 100) * BAR_CELLS);
  const cursor = (
    <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} ml-1 text-cyan-300 transition-opacity`}>▋</span>
  );

  return (
    <div className="relative min-h-screen bg-zinc-950 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black"></div>

      {/* Filigranes IA : cerveau-circuit et réseau de neurones */}
      <AiLineArt
        variant="brain"
        tone="dark"
        animated={!preview}
        className="absolute right-[-22%] top-[30%] w-[72vw] max-w-[680px] sm:right-[-4%] sm:top-[4%] sm:w-[50vw]"
      />
      <AiLineArt
        variant="network"
        tone="dark"
        animated={!preview}
        className="absolute bottom-[-7%] left-[-16%] w-[40vw] max-w-[420px] sm:left-[-3%] sm:bottom-[3%] sm:w-[32vw]"
      />

      {/* Moving background glow - disabled on mobile for performance */}
      <div
        className="absolute inset-0 opacity-30 transition-transform duration-700 ease-out pointer-events-none hidden md:block"
        style={{
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
          background: 'radial-gradient(circle at 50% 50%, rgba(10, 102, 194, 0.1) 0%, transparent 50%)',
        }}
      />

      <style>{`
        @keyframes hero-word-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .hero-word { animation: hero-word-float 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .hero-word { animation: none; } }
      `}</style>

      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pb-8 pt-24 sm:pb-12">
          <div className="w-full max-w-5xl space-y-8 sm:space-y-10">
            <WordRow words={TOP_WORDS} offset={0} />

            {/* Terminal */}
            <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-zinc-700/50 bg-zinc-800/50 px-3 py-2 sm:px-4 sm:py-3">
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/80 sm:h-3 sm:w-3"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80 sm:h-3 sm:w-3"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/80 sm:h-3 sm:w-3"></div>
                </div>
                <span className="font-mono text-xs text-zinc-500 sm:text-sm">ia-profile — python</span>
              </div>

              <div className="bg-zinc-900/40 p-5 font-mono text-sm sm:p-8 sm:text-base lg:p-12 lg:text-lg">
                <p className="mb-1.5">
                  <span className="text-blue-400">$</span> <span className="text-zinc-500">whoami</span>
                </p>
                <p className="mb-5 ml-4 text-zinc-300 sm:mb-6">traore-rice-aliman</p>

                <p className="mb-1.5">
                  <span className="text-blue-400">$</span> <span className="text-zinc-500">python profil_ia.py</span>
                  {step === 0 && cursor}
                </p>

                <div className="ml-4 space-y-1.5">
                  {step >= 1 && (
                    <p className="text-zinc-400">
                      <span className="hidden sm:inline">Chargement du modèle </span>
                      <span className="sm:hidden">Modèle </span>
                      <span className="text-cyan-300">
                        [{'█'.repeat(filled)}
                        <span className="text-zinc-700">{'░'.repeat(BAR_CELLS - filled)}</span>]
                      </span>{' '}
                      <span className="tabular-nums text-zinc-300">{progress}%</span>
                    </p>
                  )}
                  {step >= 2 && (
                    <p className="text-zinc-400">
                      <span className="text-green-400">✓</span> Domaine :{' '}
                      <span className="text-blue-300">Intelligence artificielle · Data · Web &amp; mobile</span>
                    </p>
                  )}
                </div>

                {step >= 3 && (
                  <p className="mt-5 min-h-[1.5em] break-words text-base font-light leading-relaxed text-white sm:mt-6 sm:text-xl md:text-2xl lg:text-3xl">
                    {text}
                    {cursor}
                  </p>
                )}
              </div>
            </div>

            {/* marge à droite : le bouton WhatsApp flotte dans ce coin */}
            <WordRow words={BOTTOM_WORDS} offset={1} className="pr-14 sm:pr-24" />
          </div>
        </div>
      </div>

      {/* Background Blur Accents - reduced on mobile */}
      <div
        className="absolute top-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-blue-500/10 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px] animate-pulse pointer-events-none"
        style={{
          transform: `translate(${mousePos.x * 2}px, ${mousePos.y * 2}px)`,
          animationDuration: '4s',
        }}
      />
      <div
        className="absolute bottom-1/4 left-1/3 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-blue-500/10 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px] animate-pulse pointer-events-none"
        style={{
          transform: `translate(${-mousePos.x * 2}px, ${-mousePos.y * 2}px)`,
          animationDuration: '5s',
        }}
      />
    </div>
  );
}
