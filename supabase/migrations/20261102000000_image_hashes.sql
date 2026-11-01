-- Empreinte de chaque image, calculée par Postgres. L'Edge Function s'en sert pour
-- renvoyer /content sans les images (quelques Ko au lieu de plusieurs Mo) et pour
-- donner à chaque image une URL versionnée, mise en cache par le navigateur.
alter table competitions add column if not exists image_hash text generated always as (md5(coalesce(image, ''))) stored;
alter table creations add column if not exists image_hash text generated always as (md5(coalesce(image, ''))) stored;
alter table projects add column if not exists image_hash text generated always as (md5(coalesce(image, ''))) stored;
alter table profile add column if not exists photo_hash text generated always as (md5(coalesce(photo_url, ''))) stored;
