import { supabase, fail } from './supabaseClient';
import { METRIC_KEYS } from '../types/stats';
import type { DayEntry, MetricKey, Stats } from '../types/stats';

// camelCase (site) -> snake_case (colonne SQL)
const METRIC_TO_COLUMN: Record<MetricKey, string> = {
  visits: 'visits',
  cvDownloads: 'cv_downloads',
  whatsappClicks: 'whatsapp_clicks',
  githubClicks: 'github_clicks',
  linkedinClicks: 'linkedin_clicks',
  facebookClicks: 'facebook_clicks',
};
const MAX_HISTORY_DAYS = 400;

/** Réservé à l'admin (règles d'accès de la base). */
export async function fetchStats(): Promise<Stats> {
  const { data, error } = await supabase.from('daily_stats').select('*').order('day', { ascending: false });
  if (error) fail(error, 'Lecture des statistiques impossible');
  const rows = (data ?? []) as Record<string, number | string>[];
  const totals = Object.fromEntries(
    METRIC_KEYS.map((k) => [k, rows.reduce((s, r) => s + (Number(r[METRIC_TO_COLUMN[k]]) || 0), 0)])
  ) as Record<MetricKey, number>;
  const last = rows.find((r) => Number(r.visits) > 0);
  const history: DayEntry[] = rows
    .slice(0, MAX_HISTORY_DAYS)
    .reverse()
    .map((r) => ({
      date: String(r.day),
      ...(Object.fromEntries(METRIC_KEYS.map((k) => [k, Number(r[METRIC_TO_COLUMN[k]]) || 0])) as Record<MetricKey, number>),
    }));
  return { ...totals, lastVisit: last ? `${last.day}T00:00:00.000Z` : null, history };
}

/** Ouvert à tous les visiteurs : la base n'autorise que l'incrément d'un compteur connu. */
export async function incrementMetric(metric: MetricKey): Promise<void> {
  const { error } = await supabase.rpc('increment_stat', { metric: METRIC_TO_COLUMN[metric] });
  if (error) fail(error, "Impossible d'enregistrer la statistique");
}

/** Réservé à l'admin. */
export async function resetStats(): Promise<void> {
  const { error } = await supabase.from('daily_stats').delete().not('day', 'is', null);
  if (error) fail(error, 'Remise à zéro impossible');
}
