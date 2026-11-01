import React, { useState, useEffect } from 'react';
import { ArrowRight, Github, Linkedin, Mail } from 'lucide-react';

/** `preview` : version figée (miniature de l'intro) — aucune animation ni interaction. */
export default function Hero({ preview = false }: { preview?: boolean }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [text, setText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  
  const fullText = 'Bienvenue sur le portfolio de TRAORE RICE-ALIMAN';
  
  const floatingWords = [
    { text: 'Innovation', x: 7, y: 15, delay: 0 },
    { text: 'Créativité', x: 85, y: 20, delay: 0.5 },
    { text: 'Passion', x: 80, y: 70, delay: 1.5 },
    { text: 'Design', x: 15, y: 45, delay: 2 },
    { text: 'Code', x: 75, y: 50, delay: 2.5 },
    { text: 'Performance', x: 10, y: 85, delay: 3 },
    { text: 'Vision', x: 90, y: 40, delay: 3.5 },
    { text: 'UX/UI', x: 12, y: 25, delay: 1 },
    { text: 'React', x: 70, y: 15, delay: 1.8 },
    { text: 'Next.js', x: 20, y: 65, delay: 2.2 },
    { text: 'Tailwind', x: 85, y: 55, delay: 2.8 },
    { text: 'TypeScript', x: 10, y: 55, delay: 0.8 },
    { text: 'Frontend', x: 60, y: 30, delay: 1.3 },
    { text: 'Animation', x: 40, y: 80, delay: 2.7 },
    { text: 'Responsive', x: 50, y: 10, delay: 0.3 },
    { text: 'Modern', x: 30, y: 90, delay: 3.2 },
    { text: 'Elegant', x: 65, y: 75, delay: 1.7 },
    { text: 'Web', x: 45, y: 35, delay: 0.6 },
    { text: 'Digital', x: 25, y: 20, delay: 2.4 },
    { text: 'Interface', x: 55, y: 60, delay: 3.1 }
  ];

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
    <div className="relative min-h-screen bg-zinc-950 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black"></div>
      
      {/* Moving background glow - disabled on mobile for performance */}
      <div 
        className="absolute inset-0 opacity-30 transition-transform duration-700 ease-out pointer-events-none hidden md:block"
        style={{
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
          background: 'radial-gradient(circle at 50% 50%, rgba(10, 102, 194, 0.1) 0%, transparent 50%)'
        }}
      />

      {/* Floating Background Words */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {floatingWords.map((word, i) => (
          <div
            key={i}
            className="absolute text-blue-400/20 sm:text-blue-400/25 md:text-blue-400/20 lg:text-blue-400/15 font-black text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl whitespace-nowrap"
            style={{
              left: `${word.x}%`,
              top: `${word.y}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${word.delay}s`,
              transform: `translate(-50%, -50%) translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`
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
            transform: translate(-50%, -50%) translateY(0px);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-20px);
          }
        }
      `}</style>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-6xl w-full">

            {/* Terminal Window */}
            <div className="bg-zinc-900/90 backdrop-blur-sm rounded-lg border border-zinc-800 shadow-2xl overflow-hidden mb-8 sm:mb-12 max-w-5xl mx-auto relative">
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
                <div className="text-white text-base sm:text-xl md:text-2xl lg:text-3xl font-light ml-4 leading-relaxed min-h-[1.5em] break-words">
                  {text}
                  <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity text-blue-400 ml-1`}>|</span>
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