import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Check, Mail, Phone, Github, Linkedin, Facebook, ImageOff } from 'lucide-react';
import { useContent } from '../lib/contentStore';
import { recordSocialClick } from '../lib/analytics';

interface Logo {
  src: string;
  alt: string;
  zoom?: boolean;
}

const PARCOURS: {
  period: string;
  title: string;
  place: string;
  logos: Logo[];
  detail: string | null;
  current: boolean;
}[] = [
  {
    period: '2022',
    title: 'Baccalauréat série D',
    place: 'Institut Raggi Anne Marie, Grand-Bassam',
    logos: [{ src: '/logos/irma.png', alt: 'Institution Raggi Anne-Marie (IRMA)', zoom: true }],
    detail: null,
    current: false,
  },
  {
    period: '2022 — 2025',
    title: 'Licence en Science Informatique',
    place: 'Institut Ivoirien de Technologie',
    logos: [{ src: '/logos/iit.png', alt: 'Institut Ivoirien de Technologie' }],
    detail: null,
    current: false,
  },
  {
    period: '',
    title: 'Master BIHAR',
    place: 'ESATIC, en partenariat avec l’ESTIA',
    logos: [
      { src: '/logos/esatic.png', alt: 'ESATIC' },
      { src: '/logos/estia.png', alt: 'ESTIA' },
    ],
    detail: null,
    current: true,
  },
];

const chip =
  'group flex items-center gap-3 px-5 py-3 bg-zinc-50 hover:bg-zinc-900 rounded-full transition-colors duration-300';
const chipText = 'text-sm sm:text-base font-medium text-zinc-700 group-hover:text-white transition-colors';

export default function About() {
  const { profile } = useContent();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Parallaxe douce de la photo
  const imageY = useTransform(scrollYProgress, [0, 1], [-20, 20]);

  return (
    <section
      ref={containerRef}
      id="about"
      className="relative overflow-hidden bg-white py-16 text-zinc-900 sm:py-20 md:py-24 lg:py-28"
    >
      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-10">
        {/* ── Présentation : texte à gauche, photo à droite, alignés ── */}
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Texte */}
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6 flex items-center gap-4 text-sm font-bold uppercase tracking-[0.22em]"
            >
              À propos
              <span className="h-px w-16 bg-zinc-300" />
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8 text-4xl font-light leading-[1.05] tracking-tighter sm:text-5xl md:text-6xl"
            >
              Fusionner le <span className="font-serif italic">design</span>
              <br />
              et la <span className="font-bold">performance</span>.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mb-9 max-w-xl text-base font-light leading-relaxed text-zinc-600 sm:text-lg"
            >
              {profile.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="flex flex-wrap gap-3"
            >
              <a href={`mailto:${profile.email}`} className={chip}>
                <Mail className="flex-shrink-0 text-blue-500" size={18} />
                <span className={chipText}>{profile.email}</span>
              </a>
              <a href={`tel:${profile.phone.replace(/[^0-9+]/g, '')}`} className={chip}>
                <Phone className="flex-shrink-0 text-blue-500" size={18} />
                <span className={chipText}>{profile.phone}</span>
              </a>
              {profile.github && (
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordSocialClick('github')}
                  className={chip}
                >
                  <Github className="flex-shrink-0 text-blue-500" size={18} />
                  <span className={chipText}>GitHub</span>
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordSocialClick('linkedin')}
                  className={chip}
                >
                  <Linkedin className="flex-shrink-0 text-blue-500" size={18} />
                  <span className={chipText}>LinkedIn</span>
                </a>
              )}
              {profile.facebook && (
                <a
                  href={profile.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordSocialClick('facebook')}
                  className={chip}
                >
                  <Facebook className="flex-shrink-0 text-blue-500" size={18} />
                  <span className={chipText}>Facebook</span>
                </a>
              )}
            </motion.div>
          </div>

          {/* Photo */}
          <div className="relative lg:col-span-5">
            <motion.div style={{ y: imageY }} className="relative z-10 mx-auto w-full max-w-sm lg:max-w-none">
              <div className="absolute -right-4 -top-4 -z-10 h-full w-full rounded-2xl border-2 border-zinc-100 sm:-right-6 sm:-top-6" />
              <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-zinc-100 shadow-2xl">
                {profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt="Aliman"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <ImageOff className="text-zinc-300" size={40} />
                )}
              </div>
            </motion.div>
            <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-blue-50 opacity-60 blur-3xl" />
          </div>
        </div>

        {/* ── Parcours : frise horizontale sur toute la largeur ── */}
        <div className="mt-20 md:mt-28">
          <motion.h3
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 flex items-center gap-4 text-sm font-bold uppercase tracking-[0.22em]"
          >
            Parcours
            <span className="h-px flex-1 bg-zinc-200" />
          </motion.h3>

          <div className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            {/* ligne horizontale (desktop) */}
            <div className="absolute left-[11px] right-0 top-[11px] hidden h-px bg-zinc-200 md:block" />
            <motion.div
              className="absolute left-[11px] top-[11px] hidden h-px bg-emerald-500 md:block"
              initial={{ width: 0 }}
              whileInView={{ width: 'calc(66.6% + 4px)' }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* ligne verticale (mobile) */}
            <div className="absolute bottom-3 left-[11px] top-3 w-px bg-zinc-200 md:hidden" />

            {PARCOURS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="relative pl-10 md:pl-0 md:pt-12"
              >
                {/* repère */}
                {step.current ? (
                  <span className="absolute left-[5px] top-[5px] flex h-3 w-3 items-center justify-center md:left-[5px]">
                    <span className="h-3 w-3 rounded-full bg-blue-600" />
                    <motion.span
                      className="absolute h-3 w-3 rounded-full bg-blue-600"
                      animate={{ scale: [1, 2.8], opacity: [0.5, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    />
                  </span>
                ) : (
                  <span className="absolute left-0 top-0 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white">
                    <Check size={13} strokeWidth={3.5} className="text-white" />
                  </span>
                )}

                <p className="mb-2 flex h-6 items-center gap-2 text-sm font-semibold tabular-nums text-zinc-400">
                  {step.period}
                  {step.current && (
                    <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                      En cours
                    </span>
                  )}
                </p>
                <div className="mb-4 flex h-14 items-center gap-5">
                  {step.logos.map((logo) => (
                    <img
                      key={logo.src}
                      src={logo.src}
                      alt={logo.alt}
                      draggable={false}
                      className={`w-auto max-w-[150px] object-contain object-left ${logo.zoom ? '-my-3 h-[88px]' : 'h-full'}`}
                    />
                  ))}
                </div>
                <h4 className="text-xl font-bold leading-snug tracking-tight">{step.title}</h4>
                <p className="mt-1 text-zinc-500">{step.place}</p>
                {step.detail && <p className="mt-3 text-sm leading-relaxed text-zinc-500">{step.detail}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
