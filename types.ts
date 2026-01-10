
export type MediaType = 'audio' | 'video';

export type SkinId = 'neon' | 'gold' | 'cyber' | 'vintage' | 'arctic' | 'obsidian' | 'emerald' | 'amber';

export interface SkinConfig {
  id: SkinId;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  cardBg: string;
  border: string;
  text: string;
  glow: string;
}

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  folder: string;
  file: File;
  coverUrl?: string;
  customCoverUrl?: string;
  metadata?: {
    artist?: string;
    album?: string;
    year?: string;
    genre?: string;
    description?: string;
    searchUrls?: { title: string; uri: string }[];
  };
}

export interface FolderGroup {
  name: string;
  files: MediaFile[];
}
