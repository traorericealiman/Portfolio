import { supabase, fail } from './supabaseClient';
import type { Competition, Creation, ListResource, Profile, Project, SiteContent } from '../types/content';

// --- Correspondance colonnes SQL <-> champs du site --------------------------

export const EMPTY_MD5 = 'd41d8cd98f00b204e9800998ecf8427e';

/** [champ du site, colonne SQL] — l'image est traitée à part (chargée séparément). */
export const LIST_FIELDS: Record<ListResource, [string, string][]> = {
  competitions: [
    ['title', 'title'], ['project', 'project'], ['result', 'result'], ['description', 'description'], ['date', 'date'],
  ],
  creations: [['title', 'title'], ['category', 'category'], ['color', 'color']],
  projects: [
    ['title', 'title'], ['description', 'description'], ['tech', 'tech'], ['accent', 'accent'], ['bg', 'bg'],
    ['textColor', 'text_color'], ['isDark', 'is_dark'], ['year', 'year'], ['category', 'category'],
    ['github', 'github'], ['link', 'link'],
  ],
};

const PROFILE_FIELDS: [string, string][] = [
  ['description', 'description'], ['email', 'email'], ['phone', 'phone'],
  ['github', 'github'], ['linkedin', 'linkedin'], ['facebook', 'facebook'],
];

/** Ligne SQL -> objet du site. Si la ligne contient l'image, on la garde ; sinon elle sera chargée à part. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromRow<T>(resource: ListResource, row: any): T {
  const item: Record<string, unknown> = { id: row.id };
  for (const [key, col] of LIST_FIELDS[resource]) item[key] = row[col] ?? (key === 'tech' ? [] : '');
  item.image = row.image ?? '';
  item.imageHash = row.image_hash ?? '';
  return item as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function profileFromRow(row: any): Profile {
  const p: Record<string, unknown> = {};
  for (const [key, col] of PROFILE_FIELDS) p[key] = row?.[col] ?? '';
  p.photoUrl = row?.photo_url ?? '';
  p.photoHash = row?.photo_hash ?? '';
  return p as unknown as Profile;
}

/** Objet du site -> colonnes SQL. Une image vide n'écrase jamais l'image existante. */
export function toRow(resource: ListResource, data: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  for (const [key, col] of LIST_FIELDS[resource]) if (data[key] !== undefined) row[col] = data[key];
  if (typeof data.image === 'string' && data.image) row.image = data.image;
  return row;
}

export function profileToRow(p: Profile) {
  const row: Record<string, unknown> = { id: 1 };
  const data = p as unknown as Record<string, unknown>;
  for (const [key, col] of PROFILE_FIELDS) row[col] = data[key] ?? '';
  if (p.photoUrl) row.photo_url = p.photoUrl;
  return row;
}

// --- Lecture du contenu -------------------------------------------------------
// Le texte arrive en une requête légère (sans les images, qui pèsent plusieurs Mo) ;
// chaque image est ensuite chargée à part, et gardée en cache dans le navigateur.

const lightColumns = (resource: ListResource) =>
  ['id', ...LIST_FIELDS[resource].map(([, col]) => col), 'image_hash'].join(',');

export async function fetchAllContent(): Promise<Partial<SiteContent>> {
  const list = async (resource: ListResource) => {
    const { data, error } = await supabase
      .from(resource)
      .select(lightColumns(resource))
      .order('position')
      .order('created_at');
    if (error) fail(error, `Lecture impossible (${resource})`);
    return (data ?? []).map((r) => fromRow(resource, r));
  };
  const [profile, competitions, creations, projects] = await Promise.all([
    supabase
      .from('profile')
      .select('id,description,email,phone,github,linkedin,facebook,photo_hash')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) fail(error, 'Lecture impossible (profil)');
        return profileFromRow(data);
      }),
    list('competitions') as Promise<Competition[]>,
    list('creations') as Promise<Creation[]>,
    list('projects') as Promise<Project[]>,
  ]);
  return { profile, competitions, creations, projects };
}

// --- Images ---------------------------------------------------------------------

const IMAGE_CACHE = 'portfolio-images-v1';
const IMAGE_COLUMN = { competitions: 'image', creations: 'image', projects: 'image', profile: 'photo_url' } as const;
export type ImageTable = keyof typeof IMAGE_COLUMN;

/** Image d'un élément (data URL). Gardée dans le cache du navigateur tant que son empreinte ne change pas. */
export async function loadImage(table: ImageTable, id: string | number, hash: string): Promise<string> {
  if (!hash || hash === EMPTY_MD5) return '';
  const cacheKey = `https://images.portfolio.local/${table}/${id}/${hash}`;
  let cache: Cache | null = null;
  try {
    cache = await caches.open(IMAGE_CACHE);
    const hit = await cache.match(cacheKey);
    if (hit) return await hit.text();
  } catch {
    cache = null; // Cache API indisponible (navigation privée...) : on s'en passe
  }
  const col = IMAGE_COLUMN[table];
  const { data, error } = await supabase.from(table).select(col).eq('id', id).maybeSingle();
  if (error) fail(error, 'Image introuvable');
  const value = ((data as Record<string, string> | null)?.[col] ?? '').trim();
  if (value && cache) cache.put(cacheKey, new Response(value)).catch(() => undefined);
  return value;
}
