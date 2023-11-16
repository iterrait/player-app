import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
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
export class AnimationBackgroundComponent extends BaseComponent implements AfterViewInit, OnChanges {
  @Input() public backgroundConfig?: SlotWidgetConfigData | null = null;

  @ViewChild('channel') public channel!: ElementRef<HTMLElement>;

  protected fontSize: number = 56;
  protected marqueeFontSize: number = 24;
  protected rubricClassName: string = '';
  protected rubrics = {
    'default': 'медиа',
    'news': 'новости',
    'photo': 'фото',
    'events': 'события',
    'ads': 'объявления',
    'theme-day': 'тема дня',
  };

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    super();
  }

  public ngAfterViewInit(): void {
    this.changeFontSize();
  }

  public ngOnChanges({ backgroundConfig }: SimpleChanges): void {
    if (backgroundConfig) {
      this.marqueeFontSize = Math.min(
        this.backgroundConfig?.marqueeHeight ?? 0,
        this.backgroundConfig?.backgroundWidth ?? 0
      ) * 0.5;

      this.rubricClassName = `background-overlay__rubric--${this.backgroundConfig?.rubric ?? 'default'}`;
      this.changeDetectorRef.markForCheck();
    }
  }

  protected changeFontSize(): void {
    const element = this.channel?.nativeElement;

    if (!element) {
      return;
    }

    while (element.scrollWidth <= element.clientWidth) {
      this.fontSize = parseFloat(getComputedStyle(element!).fontSize) + 2;
      this.changeDetectorRef.detectChanges();
    }

    while (element.scrollWidth > element.clientWidth) {
      this.fontSize = parseFloat(getComputedStyle(element).fontSize) - 1;
      this.changeDetectorRef.detectChanges();
    }
  }
}
