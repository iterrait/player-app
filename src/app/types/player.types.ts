export type MediaType = 'slot' | 'video' | 'image' | 'hls-stream';
export type ProjectType = 'dosaaf' | 'vBaikale' | 'siberianСharacter' | 'iterra';
export type SingleObjectType = 'image' | 'video';
export type WidgetType = 'posting' | 'emoji';

export interface PlayerSettings {
  address: string | null;
  anydeskId: string | null;
  iterraToken: string | null;
  organization: string | null;
  playerNumber: string | null;
  phone: number | null;
  project: ProjectType | null;
  responsible: string | null;
  telegramBotToken: string | null;
  telegramChatID: string | null;
}

export interface PlaylistSettings {
  start: string;
  end: string;
  media: PlayerMedia[];
}

export interface PlayerConfig {
  playerSettings: PlayerSettings;
  playlistSettings: PlaylistSettings;
}

export interface PlayerMedia {
  objectType: MediaType;
  objectValue: string | number;
  time: number;
}

export interface FileType {
  canceled: boolean;
  filePaths: string[];
  uuid: string;
}

export interface Player {
  id: number | null;
  name: string | null;
  address: string | null;
  description: string | null;
  capsule: Capsule;
  location: Location;
}

export interface Location {
  id: number | null;
  name: string | null;
}

export interface Capsule {
  id: number | null;
  name: string | null;
}

export interface Project {
  id: number | null;
  domain: string | null;
  systemName: string | null;
}
