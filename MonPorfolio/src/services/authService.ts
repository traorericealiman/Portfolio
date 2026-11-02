import { supabase } from './supabaseClient';

/**
 * Connexion admin avec le système de comptes de Supabase (email + mot de passe).
 * Le compte se crée une fois dans Supabase > Authentication > Users.
 * Renvoie le jeton de session (géré ensuite automatiquement par Supabase).
 */
export async function loginAdmin(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.session) throw new Error('Email ou mot de passe incorrect.');
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) {
    await supabase.auth.signOut();
    throw new Error("Ce compte n'a pas les droits d'administration.");
  }
  return data.session.access_token;
}

/** Vérifie qu'une session admin est toujours ouverte (ex: au rechargement de la page). */
export async function verifyAdminSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  const { data: isAdmin } = await supabase.rpc('is_admin');
  return !!isAdmin;
}

export async function logoutAdmin(): Promise<void> {
  await supabase.auth.signOut();
}

export async function changeAdminPassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}
