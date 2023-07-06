import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';

import { BaseComponent } from '$directives/base.component';
import { PlayerSettings, ProjectType } from '$types/player.types';

interface ProjectSelect {
  title: string;
  value: ProjectType;
}

@Component({
  selector: 'player-settings',
  templateUrl: './player-settings.component.html',
  styleUrls: ['./player-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PlayerSettingsComponent),
      multi: true,
    }
  ]
})
export class PlayerSettingsComponent extends BaseComponent implements ControlValueAccessor {
  protected form: FormGroup = this.formBuilder.group({
    playerNumber: [null],
    organization: [null],
    address: [null],
    responsible: [null],
    phone: [null],
    project: [null],
    anydeskId: [null],
    telegramBotToken: [null],
    telegramChatID: [null],
    iterraToken: [null],
  });

  protected phoneMask = { mask: "+7(000)000-00-00" };
  protected projects: ProjectSelect[] = [
    { title: 'ДОСААФ', value: 'dosaaf' },
    { title: 'вБайкале', value: 'vBaikale' },
    { title: 'Сибирский характер', value: 'siberianСharacter' },
    { title: 'iTerra', value: 'iterra' },
  ];

  protected onChangeFn: (val: any) => void = () => {};
  protected onTouchedFn: (val: any) => void = () => {};

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

  public writeValue(settings: PlayerSettings): void {
    if (!settings) {
      return;
    }

    this.form.patchValue({
      playerNumber: settings?.playerNumber,
      organization: settings?.organization,
      address: settings?.address,
      responsible: settings?.responsible,
      phone: settings?.phone,
      project: settings?.project,
      anydeskId: settings?.anydeskId,
      telegramBotToken: settings?.telegramBotToken,
      telegramChatID: settings?.telegramChatID,
      iterraToken: settings?.iterraToken,
    });

    this.changeDetectorRef.markForCheck();
  }
}
