import { Injectable } from '@angular/core';

import { SingleObjectType } from '$types/player.types';

@Injectable({
  providedIn: 'root',
})
export class ObjectsService {
  protected imageExtensions = ['jpg', 'giff', 'png'];
  protected videoExtensions = ['mp4', 'avi', 'ogg'];

  constructor(
  ) {
  }

  public determineSingleObjectExtension(path: string): string {
    return path.substring(path.lastIndexOf('.') + 1, path.length) || path;
  }

  public determineSingleObjectType(path: string): SingleObjectType {
    const extension = path.substring(path.lastIndexOf('.') + 1, path.length) || path;

    return this.videoExtensions.includes(extension) ? 'video' : 'image';
  }
}
