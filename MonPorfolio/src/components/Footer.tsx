import { motion } from 'framer-motion';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { useContent } from '../lib/contentStore';
import { recordSocialClick, type SocialPlatform } from '../lib/analytics';

const ease = [0.22, 1, 0.36, 1] as const;

export default function Footer() {
  const { profile } = useContent();

  const socials = [
    profile.github && { name: 'GitHub', platform: 'github' as SocialPlatform, link: profile.github },
    profile.linkedin && { name: 'LinkedIn', platform: 'linkedin' as SocialPlatform, link: profile.linkedin },
    profile.facebook && { name: 'Facebook', platform: 'facebook' as SocialPlatform, link: profile.facebook },
  ].filter(Boolean) as { name: string; platform: SocialPlatform; link: string }[];

  return (
    <footer id="contact" className="relative bg-zinc-950 px-6 pb-8 pt-20 text-white sm:px-10 sm:pt-28 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-16 md:grid-cols-2 md:gap-24">
          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
          >
            <h3 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">Contact</h3>
            <p className="mb-10 max-w-md text-lg font-light leading-relaxed text-zinc-400">
              Pour un stage, une mission ou une collaboration, vous pouvez m’écrire ou m’appeler directement.
            </p>

            <div className="space-y-4">
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="group relative block w-fit break-all text-xl font-medium sm:text-2xl"
                >
                  {profile.email}
                  <span className="absolute -bottom-1 left-0 h-px w-full bg-zinc-700" />
                  <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-blue-400 transition-transform duration-500 group-hover:scale-x-100" />
                </a>
              )}
              {profile.phone && (
                <a
                  href={`tel:${profile.phone.replace(/[^0-9+]/g, '')}`}
                  className="block w-fit text-xl text-zinc-400 transition-colors hover:text-white sm:text-2xl"
                >
                  {profile.phone}
                </a>
              )}
            </div>
          </motion.div>

          {/* Réseaux */}
          {socials.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15, ease }}
            >
              <p className="mb-6 text-sm font-medium text-zinc-500">Réseaux</p>
              <ul className="border-t border-zinc-800">
                {socials.map((s) => (
                  <li key={s.name} className="border-b border-zinc-800">
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => recordSocialClick(s.platform)}
                      className="group flex items-center justify-between py-5 text-2xl font-medium transition-colors hover:text-blue-400 sm:text-3xl"
                    >
                      <span className="transition-transform duration-300 group-hover:translate-x-2">{s.name}</span>
                      <ArrowUpRight
                        size={26}
                        className="text-zinc-600 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-blue-400"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        <div className="mt-20 flex items-center justify-between gap-4 text-sm text-zinc-600">
          <p>© {new Date().getFullYear()} Traoré Rice-Aliman</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex items-center gap-2 transition-colors hover:text-white"
          >
            Retour en haut
            <ArrowUp size={16} className="transition-transform duration-300 group-hover:-translate-y-1" />
          </button>
        </div>
      </div>
    </footer>
  );
}
