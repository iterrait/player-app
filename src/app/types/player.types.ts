import { Post, SlotManifest, SlotWidgetConfigData } from './slot.types';

export type MediaType = 'slot' | 'file';

export interface PlayerConfig {
  start: string;
  end: string;
  media: PlayerMedia[];
  token: string;
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
}

export interface FileType {
  canceled: boolean;
  filePaths: string[];
  uuid: string;
}
