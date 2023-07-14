export interface SlotWidget {
  id: number;
  slotId: number;
  locationId?: number;
  widget: string;
  isActive: boolean;
  manifest?: SlotManifest | null;
}

export interface SlotManifest {
  position: {
    top: number;
    left: number;
  };
  size: {
    height: number;
    width: number;
  }
}

export interface SlotWidgetConfig {
  id: number;
  slotId: number;
  channelId: number;
  locationId: number;
  syncedAt: number;
  data: SlotWidgetConfigData;
}

export interface SlotWidgetConfigData {
  displayMode: 'absolute' | 'relative';
  refreshTimeSec: number;
  offset: number;
  limit: number;
  index: number;
  height: number;
  width: number;
  top: number;
  left: number;
  items: number[];
  hasBackground?: boolean;
  backgroundPostHeight?: number;
  backgroundPostWidth?: number;
  fitIntoScreen?: boolean;
  marquee?: boolean;
  path?: string;
  postTimeMs?: number;
  postTimeSec?: number;
  rotation: 'manual' | 'auto';
  rubric: 'default' | 'photo' | 'news' | 'events' | 'ads' | 'theme-day';
  theme: 'light' | 'dark';
  backgroundWidth?: number;
  backgroundHeight?: number;
  backgroundTop?: number;
  backgroundLeft?: number;
  backgroundLayer?: 'front' | 'back';
  backgroundType?: 'image' | 'video' | 'animation';
  backgroundPath?: string;
  backgroundAnimationChannel?: string;
  backgroundAnimationLogo?: string;
  backgroundAnimationQr?: string;
}

export interface Post {
  id: number;
  userId: number;
  channelId: number;
  locationId: number;
  isAnonymous: boolean;
  isPriority: boolean;
  isApproved?: boolean;
  state: 'not_posted' | 'planned' | 'posted';
  title?: string;
  data?: {
    blocks?: Record<string, any>;
    version?: string;
  };
  messageId?: number;
  publishedAt?: string;
  createdAt: string;
}


