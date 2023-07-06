import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

import type { SlotWidgetConfigData } from '$types/slot.types';

@Component({
  selector: 'simple-background',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './simple-background.component.html',
  styleUrls: ['./simple-background.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleBackgroundComponent {
  @Input() public backgroundConfig?: SlotWidgetConfigData | null = null;
}
