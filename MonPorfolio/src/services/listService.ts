import { supabase, fail } from './supabaseClient';
import { fromRow, toRow } from './contentService';
import type { ListResource } from '../types/content';

/** CRUD générique pour les ressources en liste : compétitions, créations, projets. */

const PREFIX: Record<ListResource, string> = { competitions: 'comp', creations: 'creation', projects: 'project' };

export async function createListItem<T extends { id: string }>(
  resource: ListResource,
  data: Omit<T, 'id'> & { id?: string }
): Promise<T> {
  const { data: last, error: posError } = await supabase
    .from(resource)
    .select('position')
    .order('position', { ascending: false })
    .limit(1);
  if (posError) fail(posError, 'Création impossible');
  const position = last && last.length ? (last[0].position ?? -1) + 1 : 0;
  const id = data.id || `${PREFIX[resource]}-${Date.now()}`;
  const { data: row, error } = await supabase
    .from(resource)
    .insert({ id, position, ...toRow(resource, data as Record<string, unknown>) })
    .select('*')
    .single();
  if (error) fail(error, 'Création impossible');
  return fromRow<T>(resource, row);
}

export async function updateListItem<T extends { id: string }>(
  resource: ListResource,
  id: string,
  data: T
): Promise<T> {
  const { data: row, error } = await supabase
    .from(resource)
    .update(toRow(resource, data as unknown as Record<string, unknown>))
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) fail(error, 'Enregistrement impossible');
  if (!row) throw new Error("Enregistrement refusé : connecte-toi avec le compte admin.");
  return fromRow<T>(resource, row);
}

export async function deleteListItem(resource: ListResource, id: string): Promise<void> {
  const { data, error } = await supabase.from(resource).delete().eq('id', id).select('id');
  if (error) fail(error, 'Suppression impossible');
  if (!data?.length) throw new Error('Suppression refusée : connecte-toi avec le compte admin.');
}
