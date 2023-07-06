import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormArray, FormBuilder, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';

import { BaseComponent } from '$directives/base.component';
import { PlaylistSettings } from '$types/player.types';

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
  protected form: FormGroup = this.formBuilder.group({
    start: [null],
    end: [null],
    media: this.formBuilder.array([]),
  });

  protected format: number = 24;
  protected isLoading = false;

  protected onChangeFn: (val: any) => void = () => {};
  protected onTouchedFn: (val: any) => void = () => {};

  protected get media(): FormArray {
    return this.form.get('media') as FormArray;
  }

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
  ) {
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
      this.media.push(this.formBuilder.control(item));
    });

    this.isLoading = false;
    this.changeDetectorRef.markForCheck();
  }

  protected deleteItem(index: number): void {
    this.media.removeAt(index);
    this.changeDetectorRef.markForCheck();
  }

  protected drop(event: any): void {
    const media = this.media.at(event.previousIndex);

    this.media.removeAt(event.previousIndex);
    this.media.insert(event.currentIndex, media);

    this.changeDetectorRef.markForCheck();
  }

  public addMedia(): void {
    this.media.push(this.formBuilder.control({}));
    this.changeDetectorRef.markForCheck();
  }
}
