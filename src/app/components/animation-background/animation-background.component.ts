import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { BaseComponent } from '$directives/base.component';
import type { SlotWidgetConfigData } from '$types/slot.types';

@Component({
  selector: 'animation-background',
  standalone: true,
  imports: [
    BrowserModule,
    CommonModule,
  ],
  templateUrl: './animation-background.component.html',
  styleUrls: ['./animation-background.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimationBackgroundComponent extends BaseComponent implements AfterViewInit {
  @ViewChild('channel') public channel!: ElementRef<HTMLElement>;

  @Input() public backgroundConfig?: SlotWidgetConfigData | null = null;
  protected fontSize: number = 56;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    super();
  }

  public ngAfterViewInit(): void {
    this.changeFontSize();
  }

  protected changeFontSize(): void {
    const element = this.channel?.nativeElement;

    if (!element) {
      return;
    }

    while (element.scrollHeight <= element.clientHeight) {
      this.fontSize = parseFloat(getComputedStyle(element!).fontSize) + 2;
      this.changeDetectorRef.detectChanges();
    }

    while (element.scrollHeight > element.clientHeight) {
      this.fontSize = parseFloat(getComputedStyle(element).fontSize) - 1;
      this.changeDetectorRef.detectChanges();
    }
  }
}
