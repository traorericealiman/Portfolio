import { supabase, fail } from './supabaseClient';
import { profileFromRow, profileToRow } from './contentService';
import type { Profile } from '../types/content';

export async function updateProfile(profile: Profile): Promise<Profile> {
  const { data, error } = await supabase.from('profile').upsert(profileToRow(profile)).select('*').single();
  if (error) fail(error, 'Enregistrement du profil impossible');
  return profileFromRow(data);
}
