-- ============================================================================
-- Connexion directe du site à Supabase — à coller UNE FOIS dans
-- Supabase > SQL Editor > New query, puis « Run ».
--
-- Règles :
--   - tout le monde peut LIRE le contenu du site (profil, compétitions, créations, projets) ;
--   - seul le compte admin peut le MODIFIER ;
--   - les visiteurs peuvent seulement incrémenter les compteurs de visite ;
--   - seules l'admin peut lire ou remettre à zéro les statistiques.
--
-- L'admin est reconnue par son email : change-le ci-dessous si besoin, c'est l'email
-- du compte que tu crées dans Supabase > Authentication > Users > Add user.
-- ============================================================================

create or replace function public.is_admin() returns boolean
language sql stable set search_path = public as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'traorericealiman@gmail.com'
$$;
-- Les règles ci-dessous appellent cette fonction : elle doit être exécutable.
grant execute on function public.is_admin() to anon, authenticated;

-- Colonnes utilisées par le site (sans effet si elles existent déjà)
alter table competitions add column if not exists date text not null default '';
alter table competitions add column if not exists image_hash text generated always as (md5(coalesce(image, ''))) stored;
alter table creations add column if not exists image_hash text generated always as (md5(coalesce(image, ''))) stored;
alter table projects add column if not exists image_hash text generated always as (md5(coalesce(image, ''))) stored;
alter table profile add column if not exists photo_hash text generated always as (md5(coalesce(photo_url, ''))) stored;

-- Repart d'une feuille blanche pour les règles de ces tables
do $$
declare p record;
begin
  for p in
    select tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('profile', 'competitions', 'creations', 'projects', 'daily_stats')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

alter table profile enable row level security;
alter table competitions enable row level security;
alter table creations enable row level security;
alter table projects enable row level security;
alter table daily_stats enable row level security;

-- Droits de base (les règles ci-dessous filtrent ensuite ligne par ligne)
grant select on profile, competitions, creations, projects to anon, authenticated;
grant insert, update, delete on profile, competitions, creations, projects to authenticated;
grant select, delete on daily_stats to authenticated;

-- Contenu : lecture pour tous, écriture pour l'admin
create policy "lecture publique" on profile for select using (true);
create policy "lecture publique" on competitions for select using (true);
create policy "lecture publique" on creations for select using (true);
create policy "lecture publique" on projects for select using (true);

create policy "ajout admin" on profile for insert to authenticated with check (public.is_admin());
create policy "modif admin" on profile for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "suppression admin" on profile for delete to authenticated using (public.is_admin());
create policy "ajout admin" on competitions for insert to authenticated with check (public.is_admin());
create policy "modif admin" on competitions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "suppression admin" on competitions for delete to authenticated using (public.is_admin());
create policy "ajout admin" on creations for insert to authenticated with check (public.is_admin());
create policy "modif admin" on creations for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "suppression admin" on creations for delete to authenticated using (public.is_admin());
create policy "ajout admin" on projects for insert to authenticated with check (public.is_admin());
create policy "modif admin" on projects for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "suppression admin" on projects for delete to authenticated using (public.is_admin());

-- Statistiques : lecture et remise à zéro réservées à l'admin
create policy "stats admin (lecture)" on daily_stats for select to authenticated using (public.is_admin());
create policy "stats admin (remise a zero)" on daily_stats for delete to authenticated using (public.is_admin());

-- Compteurs : les visiteurs peuvent incrémenter (et seulement ça)
create or replace function public.increment_stat(metric text, for_day date default current_date) returns void
language plpgsql security definer set search_path = public as $$
begin
  if metric not in ('visits', 'cv_downloads', 'whatsapp_clicks', 'github_clicks', 'linkedin_clicks', 'facebook_clicks') then
    raise exception 'Métrique inconnue : %', metric;
  end if;
  execute format(
    'insert into daily_stats (day, %1$I) values ($1, 1)
     on conflict (day) do update set %1$I = daily_stats.%1$I + 1', metric)
  using for_day;
end;
$$;
revoke execute on function public.increment_stat(text, date) from public;
grant execute on function public.increment_stat(text, date) to anon, authenticated;
