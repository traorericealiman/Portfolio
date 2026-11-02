import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Github, Linkedin, Mail } from 'lucide-react';
import { useFloatingWords } from '../lib/useFloatingWords';
import NeuronField, { type Blocked } from './NeuronField';

/** `preview` : version figée (miniature de l'intro) — aucune animation ni interaction. */
export default function Hero({ preview = false }: { preview?: boolean }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [text, setText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  
  const fullText = 'Bienvenue sur le portfolio de TRAORE RICE-ALIMAN';
  
  const floatingWords = [
    { text: 'Deep Learning', x: 14, y: 18, delay: 0 },
    { text: 'Design', x: 84, y: 20, delay: 0.5 },
    { text: 'Intelligence Artificielle', x: 50, y: 12, delay: 1 },
    { text: 'Machine Learning', x: 18, y: 86, delay: 1.5 },
    { text: 'Data', x: 82, y: 84, delay: 2.5 },
  ];

  // Les mots restent entiers et visibles : jamais coupés par les bords ni cachés
  // derrière le terminal ou la barre de menu, quelle que soit la taille d'écran.
  const rootRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const blockedRef = useRef<Blocked | null>(null);
  const [fibersVersion, setFibersVersion] = useState(0);
  const { wordRefs, positions } = useFloatingWords(rootRef, [terminalRef], floatingWords, {
    top: 96, // barre de menu (84 px) + flottement des mots (10 px)
    margin: 14,
    gap: 12,
    blockedRef,
    version: fibersVersion,
  });

  useEffect(() => {
    if (preview) return;
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [preview]);

  useEffect(() => {
    if (preview) return;
    let i = 0;
    let typingTimer: ReturnType<typeof setInterval>;
    // petite pause pour laisser l'arrivée sur la page se terminer avant de taper
    const start = setTimeout(() => {
      typingTimer = setInterval(() => {
        if (i <= fullText.length) {
          setText(fullText.substring(0, i));
          i++;
        } else {
          clearInterval(typingTimer);
        }
      }, 50);
    }, 350);

    return () => {
      clearTimeout(start);
      clearInterval(typingTimer);
    };
  }, [preview]);

  useEffect(() => {
    if (preview) return;
    const blink = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(blink);
  }, [preview]);

  return (
    <div ref={rootRef} className="relative min-h-screen bg-zinc-950 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black"></div>
      
      {/* Les neurones de la porte continuent ici : leurs axones aboutissent au terminal */}
      <NeuronField
        rootRef={rootRef}
        targetRef={terminalRef}
        variant="hero"
        grow={false}
        animated={!preview}
        active={!preview}
        onOccupancy={(blocked) => {
          blockedRef.current = blocked;
          setFibersVersion((v) => v + 1);
        }}
      />

      {/* Moving background glow - disabled on mobile for performance */}
      <div 
        className="absolute inset-0 opacity-30 transition-transform duration-700 ease-out pointer-events-none hidden md:block"
        style={{
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
          background: 'radial-gradient(circle at 50% 50%, rgba(10, 102, 194, 0.1) 0%, transparent 50%)'
        }}
      />

      {/* Floating Background Words */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
        style={{ transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)` }}
      >
        {floatingWords.map((word, i) => (
          <div
            key={i}
            ref={(el) => (wordRefs.current[i] = el)}
            className="absolute text-blue-400/20 sm:text-blue-400/25 md:text-blue-400/20 lg:text-blue-400/15 font-black text-sm max-[359px]:text-[11px] sm:text-lg md:text-xl lg:text-2xl xl:text-3xl whitespace-nowrap"
            style={{
              left: positions[i]?.left ?? 0,
              top: positions[i]?.top ?? 0,
              visibility: positions[i] ? 'visible' : 'hidden',
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${word.delay}s`,
            }}
          >
            {word.text}
          </div>
        ))}
      </div>
      
      {/* Keyframes for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-6xl w-full">

            {/* Terminal Window */}
            <div ref={terminalRef} className="bg-zinc-900/90 backdrop-blur-sm rounded-lg border border-zinc-800 shadow-2xl overflow-hidden mb-8 sm:mb-12 max-w-5xl mx-auto relative">
              {/* Terminal Header */}
              <div className="bg-zinc-800/50 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 border-b border-zinc-700/50">
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-zinc-500 text-xs sm:text-sm font-mono">bash  profile</span>
              </div>
              
              {/* Terminal Content */}
              <div className="p-6 sm:p-8 lg:p-12 font-mono bg-zinc-900/40">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-blue-400 text-sm sm:text-base lg:text-lg">$</span>
                  <span className="text-zinc-500 text-sm sm:text-base lg:text-lg">whoami</span>
                </div>
                <div className="text-zinc-400 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 ml-4">
                  traore-rice-aliman
                </div>
                
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-blue-400 text-sm sm:text-base lg:text-lg">$</span>
                  <span className="text-zinc-500 text-sm sm:text-base lg:text-lg">cat welcome.txt</span>
                </div>
                {/* Le texte complet, invisible, réserve la place : le terminal ne change pas de taille pendant la frappe. */}
                <div className="grid text-white text-base sm:text-xl md:text-2xl lg:text-3xl font-light ml-4 leading-relaxed min-h-[1.5em] break-words">
                  <span aria-hidden className="invisible col-start-1 row-start-1">
                    {fullText}
                    <span className="ml-1">|</span>
                  </span>
                  <span className="col-start-1 row-start-1">
                    {text}
                    <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity text-blue-400 ml-1`}>|</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Blur Accents - reduced on mobile */}
      <div 
        className="absolute top-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-blue-500/10 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px] animate-pulse pointer-events-none"
        style={{
          transform: `translate(${mousePos.x * 2}px, ${mousePos.y * 2}px)`,
          animationDuration: '4s'
        }}
      />
      <div 
        className="absolute bottom-1/4 left-1/3 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-blue-500/10 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px] animate-pulse pointer-events-none"
        style={{
          transform: `translate(${-mousePos.x * 2}px, ${-mousePos.y * 2}px)`,
          animationDuration: '5s'
        }}
      />
    </div>
  );
}