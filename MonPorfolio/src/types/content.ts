export interface Profile {
  description: string;
  email: string;
  phone: string;
  photoUrl: string;
  github: string;
  linkedin: string;
  facebook: string;
  /** Empreinte de la photo (sert au cache du navigateur). */
  photoHash?: string;
}

export interface Competition {
  id: string;
  title: string;
  project: string;
  result: string;
  description: string;
  image: string;
  /** Empreinte de l'image (sert au cache du navigateur). */
  imageHash?: string;
  /** Mois de la compétition, "AAAA-MM" (vide si inconnu). */
  date?: string;
}

export interface Creation {
  id: string;
  title: string;
  category: string;
  color: string;
  image: string;
  /** Empreinte de l'image (sert au cache du navigateur). */
  imageHash?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tech: string[];
  accent: string;
  bg: string;
  textColor: string;
  isDark: boolean;
  year: string;
  category: string;
  github: string;
  link: string;
  image: string;
  /** Empreinte de l'image (sert au cache du navigateur). */
  imageHash?: string;
}

export interface SiteContent {
  profile: Profile;
  competitions: Competition[];
  creations: Creation[];
  projects: Project[];
}

export type ListResource = 'competitions' | 'creations' | 'projects';
