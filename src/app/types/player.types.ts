import { Post, SlotManifest, SlotWidgetConfigData } from './slot.types';

export type MediaType = 'slot' | 'file';
export type ProjectType = 'dosaaf' | 'vBaikale' | 'siberianСharacter' | 'iterra';
export type SingleObjectType = 'image' | 'video';
export type WidgetType = 'posting' | 'emoji';

export interface PlayerSettings {
  playerNumber: string | null;
  organization: string | null;
  address: string | null;
  responsible: string | null;
  phone: number | null;
  anydeskId: string | null;
  telegramBotToken: string | null;
  telegramChatID: string | null;
  iterraToken: string | null;
  project: ProjectType | null;
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

export interface PlaylistMedia {
  type: 'slot' | 'file';
  slotId?: number;
  slotManifest?: SlotManifest | null;
  slotConfigData?: SlotWidgetConfigData | null;
  slotPosts?: Post[];
  singleMediaPath?: string;
  singleObjectType?: SingleObjectType;
  singleObjectExtension?: string;
}

export interface FileType {
  canceled: boolean;
  filePaths: string[];
  uuid: string;
}
