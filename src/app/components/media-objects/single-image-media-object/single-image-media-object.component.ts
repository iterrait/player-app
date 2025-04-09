import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { BaseComponent } from '$directives/base.component';
import { PlayerMedia } from '$types/player.types';

@Component({
  selector: 'single-image-media-object',
  standalone: true,
  templateUrl: './single-image-media-object.component.html',
  styleUrls: ['./single-image-media-object.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleImageMediaObjectComponent extends BaseComponent {
  public currentMedia = input<PlayerMedia | null>(null);
}
