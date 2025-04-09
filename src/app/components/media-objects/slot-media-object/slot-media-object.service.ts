import { Injectable } from '@angular/core';

import { Post, SlotManifest, SlotWidgetConfigData } from '$types/slot.types';

@Injectable()
export class SlotMediaObjectService {
  // данные о слоте по slotId
  public postsData: Record<string, {
    config: SlotWidgetConfigData | null,
    manifest: SlotManifest | null,
    posts: Post[],
    queue?: number,
  }> = {};
}
