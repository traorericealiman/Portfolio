-- ============================================================================
-- Durcissement — à coller UNE FOIS dans Supabase > SQL Editor, APRÈS la mise en
-- ligne de la version « connexion directe » du site.
-- ============================================================================

-- 1. L'admin est reconnue par son compte réel (identifiant + email confirmé),
--    et plus seulement par l'email écrit dans son jeton de connexion.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and u.email = 'traorericealiman@gmail.com'
      and u.email_confirmed_at is not null
  )
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 2. Anciennes tables de l'ancien backend, devenues inutiles : admin_users contient
--    encore le hash de ton ancien mot de passe. Moins il reste de données, moins il y a de risque.
drop table if exists public.login_attempts;
drop table if exists public.admin_users;
