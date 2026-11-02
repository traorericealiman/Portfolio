import { useEffect, useState } from 'react';
import {
  createListItem as createListItemApi,
  deleteListItem as deleteListItemApi,
  fetchAllContent,
  loadImage,
  updateListItem as updateListItemApi,
  updateProfile as updateProfileApi,
} from '../services';
import type { Competition, ListResource, Profile, SiteContent } from '../types/content';

export type { Competition, Creation, ListResource, Profile, Project, SiteContent } from '../types/content';

// --- Valeurs par défaut ------------------------------------------------------
// Structure vide tant que l'API n'a pas encore répondu (ou si le backend est
// injoignable)  volontairement AUCUNE donnée statique ici : si la base est
// vide, l'affichage doit rester vide, jamais un faux contenu de secours.

export const DEFAULT_CONTENT: SiteContent = {
  profile: {
    description: '',
    email: '',
    phone: '',
    photoUrl: '',
    github: '',
    linkedin: '',
    facebook: '',
  },
  competitions: [],
  creations: [],
  projects: [],
};

// --- Liens sûrs -----------------------------------------------------------------
// Défense en profondeur : même si la base contenait un lien "javascript:...",
// il ne doit jamais arriver dans un href.

export function safeUrl(value: string | undefined): string {
  const v = (value ?? '').trim();
  return !v || v === '#' || /^\/(?!\/)/.test(v) || /^(https?:\/\/|mailto:)/i.test(v) ? v : '';
}

function sanitizeContent(data: Partial<SiteContent>): SiteContent {
  const profile = { ...DEFAULT_CONTENT.profile, ...(data.profile || {}) };
  return {
    profile: {
      ...profile,
      github: safeUrl(profile.github),
      linkedin: safeUrl(profile.linkedin),
      facebook: safeUrl(profile.facebook),
    },
    competitions: data.competitions ?? [],
    creations: data.creations ?? [],
    projects: (data.projects ?? []).map((p) => ({ ...p, github: safeUrl(p.github) || '#', link: safeUrl(p.link) || '#' })),
  };
}

// --- Ordre chronologique des compétitions -------------------------------------

const addedAt = (c: Competition) => Number(c.id.split('-').pop()) || 0;

/** Du plus récent au plus ancien ; sans date en dernier, puis par date d'ajout (la plus récente d'abord). */
export function sortCompetitionsByDate(list: Competition[]): Competition[] {
  return [...list].sort((a, b) => {
    const da = a.date ?? '';
    const db = b.date ?? '';
    if (da !== db) {
      if (!da) return 1;
      if (!db) return -1;
      return db.localeCompare(da);
    }
    return addedAt(b) - addedAt(a);
  });
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** "2026-03" -> "mars 2026" */
export function formatCompetitionDate(date?: string): string {
  const [y, m] = (date ?? '').split('-');
  if (!y) return '';
  return m ? `${MONTHS[Number(m) - 1] ?? ''} ${y}`.trim() : y;
}

// --- Cache local + notification de changement --------------------------------
// Le contenu est chargé une fois depuis l'API puis mis en cache en mémoire, afin
// que les composants puissent le lire de façon synchrone sans réafficher un
// écran vide à chaque re-render.

const CHANGE_EVENT = 'portfolio_content_change';

// Copie du dernier contenu reçu, gardée dans le navigateur : dès la 2e visite, le
// site s'affiche aussitôt avec ces données, puis se met à jour en arrière-plan.
// (Seulement le texte : les images ont leur propre cache, voir loadImage.)
const STORAGE_KEY = 'portfolio_content_v2';
const MAX_STORED_CHARS = 300_000;

function readStored(): SiteContent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeContent(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

const LIST_KEYS: ListResource[] = ['competitions', 'creations', 'projects'];

function withoutImages(c: SiteContent): SiteContent {
  return {
    profile: { ...c.profile, photoUrl: '' },
    competitions: c.competitions.map((it) => ({ ...it, image: '' })),
    creations: c.creations.map((it) => ({ ...it, image: '' })),
    projects: c.projects.map((it) => ({ ...it, image: '' })),
  };
}

function store(content: SiteContent) {
  try {
    const raw = JSON.stringify(withoutImages(content));
    if (raw.length <= MAX_STORED_CHARS) localStorage.setItem(STORAGE_KEY, raw);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* stockage indisponible (navigation privée...) : on s'en passe */
  }
}

let cache: SiteContent = readStored() ?? DEFAULT_CONTENT;
let hasLoaded = false;
let fetchPromise: Promise<SiteContent> | null = null;

function notifyChange() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** Donne le contenu actuellement en cache (peut être DEFAULT_CONTENT avant le premier chargement). */
export function getContent(): SiteContent {
  return cache;
}

// --- Images : chargées une par une après le texte -------------------------------

let notifyTimer = 0;
function scheduleNotify() {
  if (notifyTimer) return;
  notifyTimer = window.setTimeout(() => {
    notifyTimer = 0;
    notifyChange();
  }, 60);
}

let imagesRun = 0;
function loadImages() {
  const run = ++imagesRun;
  if (cache.profile.photoHash && !cache.profile.photoUrl) {
    loadImage('profile', 1, cache.profile.photoHash)
      .then((img) => {
        if (run !== imagesRun || !img) return;
        cache = { ...cache, profile: { ...cache.profile, photoUrl: img } };
        scheduleNotify();
      })
      .catch((err) => console.error('Photo de profil :', err));
  }
  for (const resource of LIST_KEYS) {
    for (const item of cache[resource] as { id: string; image: string; imageHash?: string }[]) {
      if (!item.imageHash || item.image) continue;
      loadImage(resource, item.id, item.imageHash)
        .then((img) => {
          if (run !== imagesRun || !img) return;
          cache = {
            ...cache,
            [resource]: (cache[resource] as { id: string }[]).map((it) => (it.id === item.id ? { ...it, image: img } : it)),
          } as SiteContent;
          scheduleNotify();
        })
        .catch((err) => console.error(`Image ${resource}/${item.id} :`, err));
    }
  }
}

/** Garde les images déjà chargées quand leur empreinte n'a pas changé. */
function keepLoadedImages(next: SiteContent): SiteContent {
  const reuse = <T extends { id: string; image: string; imageHash?: string }>(list: T[], prev: T[]) =>
    list.map((it) => {
      const old = prev.find((p) => p.id === it.id);
      return old && old.image && old.imageHash === it.imageHash ? { ...it, image: old.image } : it;
    });
  return {
    profile:
      cache.profile.photoUrl && cache.profile.photoHash === next.profile.photoHash
        ? { ...next.profile, photoUrl: cache.profile.photoUrl }
        : next.profile,
    competitions: reuse(next.competitions, cache.competitions),
    creations: reuse(next.creations, cache.creations),
    projects: reuse(next.projects, cache.projects),
  };
}

async function loadContent(): Promise<SiteContent> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetchAllContent()
    .then((data) => {
      cache = keepLoadedImages(sanitizeContent(data));
      hasLoaded = true;
      store(cache);
      notifyChange();
      loadImages();
      return cache;
    })
    .catch((err) => {
      console.error("Impossible de charger le contenu depuis l'API :", err);
      return cache;
    })
    .finally(() => {
      fetchPromise = null;
    });
  return fetchPromise;
}

// Contenu gardé de la visite précédente : ses images se chargent tout de suite (souvent depuis le cache).
loadImages();

// Le chargement démarre dès que le script s'exécute, en parallèle de l'animation
// de la porte, au lieu d'attendre le montage des composants.
loadContent();

/** Force un rechargement du contenu depuis l'API. */
export function refreshContent() {
  hasLoaded = false;
  return loadContent();
}

/** Hook React : charge le contenu au montage et se met à jour à chaque changement. */
export function useContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(cache);

  useEffect(() => {
    if (!hasLoaded) loadContent();
    const refresh = () => setContent(getContent());
    window.addEventListener(CHANGE_EVENT, refresh);
    return () => window.removeEventListener(CHANGE_EVENT, refresh);
  }, []);

  return content;
}

// --- Écriture : Profil --------------------------------------------------------

export async function updateProfile(profile: Profile): Promise<Profile> {
  const updated = await updateProfileApi(profile);
  cache = { ...cache, profile: updated };
  notifyChange();
  return updated;
}

// --- Écriture : listes (compétitions / créations / projets) ------------------

export async function createListItem<T extends { id: string }>(
  resource: ListResource,
  data: Omit<T, 'id'> & { id?: string }
): Promise<T> {
  const created = await createListItemApi<T>(resource, data);
  cache = { ...cache, [resource]: [...(cache[resource] as unknown as T[]), created] } as SiteContent;
  notifyChange();
  return created;
}

export async function updateListItem<T extends { id: string }>(
  resource: ListResource,
  id: string,
  data: T
): Promise<T> {
  const updated = await updateListItemApi<T>(resource, id, data);
  cache = {
    ...cache,
    [resource]: (cache[resource] as unknown as T[]).map((item) => (item.id === id ? updated : item)),
  } as SiteContent;
  notifyChange();
  return updated;
}

export async function deleteListItem(resource: ListResource, id: string): Promise<void> {
  await deleteListItemApi(resource, id);
  cache = {
    ...cache,
    [resource]: (cache[resource] as { id: string }[]).filter((item) => item.id !== id),
  } as SiteContent;
  notifyChange();
}
