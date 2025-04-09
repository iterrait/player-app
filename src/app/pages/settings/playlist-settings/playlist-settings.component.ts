import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, FormArray, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';

import { BaseComponent } from '$directives/base.component';
import { PlaylistSettings } from '$types/player.types';
import { MediaGroup } from '../settings.types';

@Component({
  selector: 'playlist-settings',
  templateUrl: './playlist-settings.component.html',
  styleUrls: ['./playlist-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PlaylistSettingsComponent),
      multi: true,
    }
  ]
})
export class PlaylistSettingsComponent extends BaseComponent implements ControlValueAccessor {
  private changeDetectorRef = inject(ChangeDetectorRef);

  protected form = new FormGroup({
    start: new FormControl<string | null>(null),
    end: new FormControl<string | null>(null),
    media: new FormArray<MediaGroup>([]),
  });

  protected format: number = 24;
  protected isLoading = false;

  protected onChangeFn: (val: any) => void = () => {};
  protected onTouchedFn: (val: any) => void = () => {};

  protected get media(): FormArray {
    return this.form.get('media') as FormArray;
  }

  constructor() {
    super();

    this.form.valueChanges
      .pipe(this.takeUntilDestroy())
      .subscribe({
        next: () => {
          this.onChangeFn(this.form.getRawValue());
        }
      });
  }

  public registerOnChange(fn: any): void {
    this.onChangeFn = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouchedFn = fn;
  }

  public writeValue(settings: PlaylistSettings): void {
    if (!settings) {
      return;
    }
    this.isLoading = true;
    this.form.reset();

    this.form.patchValue({
      start: settings?.start,
      end: settings?.end,
    });

    this.media.clear();

    settings.media.forEach((item) => {
      const group = new FormGroup({
        objectType: new FormControl(item.objectType),
        objectValue: new FormControl(item.objectValue),
        time: new FormControl(item.time),
      });

      this.media.push(group);
    });

    this.isLoading = false;
    this.changeDetectorRef.detectChanges();
  }

  protected deleteItem(index: number): void {
    this.media.removeAt(index);
    this.changeDetectorRef.detectChanges();
  }

  protected drop(event: any): void {
    const media = this.media.at(event.previousIndex);

    this.media.removeAt(event.previousIndex);
    this.media.insert(event.currentIndex, media);

    this.changeDetectorRef.detectChanges();
  }

  public addMedia(): void {
    const group = new FormGroup({
      objectType: new FormControl(null),
      objectValue: new FormControl(null),
      time: new FormControl(null),
    });

    this.media.push(group);
    this.changeDetectorRef.detectChanges();
  }
}
