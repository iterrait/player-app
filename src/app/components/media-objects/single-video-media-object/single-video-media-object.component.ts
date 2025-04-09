import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { BaseComponent } from '$directives/base.component';
import { PlayerMedia } from '$types/player.types';

@Component({
  selector: 'single-video-media-object',
  standalone: true,
  templateUrl: './single-video-media-object.component.html',
  styleUrls: ['./single-video-media-object.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleVideoMediaObjectComponent extends BaseComponent {
  public currentMedia = input<PlayerMedia | null>(null);
  public videoDurationChanged = output<number>();

  protected loadedSingleData(singleVideo: HTMLVideoElement): void {
    this.videoDurationChanged.emit(singleVideo?.duration * 1000 ?? 0);
  }
}
