import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft, UserCircle2 } from 'lucide-react';
import { useContent } from '../lib/contentStore';
import { loginAdmin } from '../services/authService';

// Connexion avec le compte admin de Supabase (email + mot de passe). Même en
// contournant cet écran, les règles d'accès de la base refusent toute écriture
// à qui n'est pas connecté avec ce compte.
export const SESSION_KEY = 'portfolio_admin_unlocked';

export default function Lockscreen({ onUnlock }: { onUnlock: () => void }) {
  const { profile } = useContent();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await loginAdmin(username, password);
      sessionStorage.setItem(SESSION_KEY, '1');
      onUnlock();
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex overflow-hidden">
      {/* --- PANNEAU GAUCHE : BRANDING (masqué en mobile) --- */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-14 overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        {/* Grille décorative */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#0A66C2 1px, transparent 1px), linear-gradient(90deg, #0A66C2 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Halos lumineux */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-blue-500/20 blur-[120px] pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-700/20 blur-[120px] pointer-events-none"
        />

        <motion.a
          href="/"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors w-fit text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Retour au site
        </motion.a>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl flex-shrink-0 bg-zinc-900 flex items-center justify-center">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="Photo de profil" className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 className="text-zinc-600" size={28} />
              )}
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">Traoré Rice-Aliman</p>
              <p className="text-zinc-500 text-sm">Développeuse créative</p>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tighter leading-[1.05] mb-4">
            Espace <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Administration</span>
          </h1>
          <p className="text-zinc-400 text-base max-w-md font-light leading-relaxed">
            Gère le contenu de ton portfolio  profil, compétitions, créations, projets  et suis les
            statistiques du site, le tout depuis un seul endroit.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 flex items-center gap-2 text-xs text-zinc-600 font-mono"
        >
        </motion.div>
      </div>

      {/* --- PANNEAU DROIT : FORMULAIRE --- */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-16 relative">
        {/* Décor mobile uniquement */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950" />

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={submit}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="lg:hidden mb-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-zinc-900 flex items-center justify-center">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="Photo de profil" className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 className="text-zinc-600" size={20} />
              )}
            </div>
            <span className="text-white font-black tracking-tight">PORTFOLIO ADMIN</span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
            <Lock className="text-blue-400" size={20} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            Bienvenue de retour
          </h2>
          <p className="text-zinc-500 text-sm mb-8">
            Entre ton email et ton mot de passe pour continuer.
          </p>

          <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">
            Email
          </label>
          <div
            className={`relative rounded-xl border transition-colors mb-4 ${
              error ? 'border-red-500/60' : 'border-zinc-800 focus-within:border-blue-500'
            } bg-zinc-900`}
          >
            <UserCircle2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="email"
              inputMode="email"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              autoFocus
              autoComplete="username"
              placeholder="toi@exemple.com"
              className="w-full bg-transparent pl-11 pr-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none text-sm tracking-wide"
            />
          </div>

          <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">
            Mot de passe
          </label>
          <div
            className={`relative rounded-xl border transition-colors ${
              error ? 'border-red-500/60' : 'border-zinc-800 focus-within:border-blue-500'
            } bg-zinc-900`}
          >
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              autoComplete="current-password"
              placeholder="••••••••••"
              className="w-full bg-transparent px-4 py-3.5 pr-12 text-white placeholder-zinc-600 focus:outline-none text-sm tracking-wide"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-sm mt-2.5"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full mt-6 py-3.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-70 text-zinc-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full"
              />
            ) : (
              <>
                Accéder au tableau de bord
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>

          <a
            href="/"
            className="lg:hidden mt-6 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
          >
            <ArrowLeft size={14} />
            Retour au site
          </a>
        </motion.form>
      </div>
    </div>
  );
}
