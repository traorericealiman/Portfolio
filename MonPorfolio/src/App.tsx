import { useEffect, useLayoutEffect, useState } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Competitions from './components/Competitions';
import VisualCreations from './components/VisualCreations';
import Projects from './components/Projects';
import Technologies from './components/Technologies';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import { motion } from 'framer-motion';
import DoorIntro from './components/DoorIntro';
import { recordVisit } from './lib/analytics';

function App() {
  const [revealed, setRevealed] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  // L'intro doit toujours démarrer en haut de page (pas de position restaurée, pas d'ancre)
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
    recordVisit();
  }, []);

  return (
    <div className="min-h-screen">
      {!introDone && (
        <DoorIntro onReveal={() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
            setRevealed(true);
          }} onDone={() => setIntroDone(true)} />
      )}
      {/* La page est montée dès le départ (sous l'intro) pour éviter tout à-coup à la bascule */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.8, delay: revealed ? 0.35 : 0 }}
      >
        <Navigation />
      </motion.div>
      <div className={revealed ? undefined : 'hero-freeze'}>
        <Hero preview={!revealed} />
      </div>
      <About />
      <Experience />
      <Competitions />
      <VisualCreations />
      <Projects />
      <Technologies />
      <Footer />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.8, delay: revealed ? 0.5 : 0 }}
      >
        <FloatingWhatsApp />
      </motion.div>
    </div>
  );
}

export default App;
