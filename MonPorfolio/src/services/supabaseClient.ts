import { createClient } from '@supabase/supabase-js';

/**
 * Le site parle directement à Supabase. La clé utilisée ici est la clé PUBLIQUE
 * (faite pour être visible dans le navigateur) : ce sont les règles d'accès de la
 * base (RLS, voir supabase/connexion-directe.sql) qui décident qui peut lire ou écrire.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquant dans .env');
}

export const supabase = createClient(url ?? '', key ?? '', {
  auth: { persistSession: true, storageKey: 'portfolio_admin_session' },
});

/** Message d'erreur lisible à partir d'une erreur Supabase. */
export function fail(error: { message: string; code?: string } | null, fallback: string): never {
  if (error?.code === '42501' || /row-level security|permission denied/i.test(error?.message ?? '')) {
    throw new Error("Action refusée : connecte-toi avec le compte admin.");
  }
  throw new Error(error?.message || fallback);
}
