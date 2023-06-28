import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';

import { IpcService } from '../../services/ipc-renderer.service';
import { PlayerConfig } from '../../types/player.types';

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements AfterViewInit {
  protected form: FormGroup = this.formBuilder.group({
    start: [null],
    end: [null],
    token: [null],
    media: this.formBuilder.array([]),
  });

  protected format: number = 24;

  protected get media(): FormArray {
    return this.form.get('media') as FormArray;
  }

  constructor(
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private ipcService: IpcService,
  ) {
  }

  public ngAfterViewInit(): void {
    this.ipcService.send('get-player-config');

    this.ipcService.on('player-rotation-config', (event, config) => {
      this.setFormData(config);
    });
  }

  protected setFormData(config: PlayerConfig): void {
    console.log('config', config);
    this.form.reset();

    this.form.patchValue({
      start: config.start,
      end: config.end,
      token: config.token,
    });

    this.media.clear();

    config.media.forEach((item) => {
      this.media.push(this.formBuilder.control(item));
    });
    this.changeDetectorRef.detectChanges();
  }

  protected deleteItem(index: number): void {
    this.media.removeAt(index);
    this.changeDetectorRef.detectChanges();
  }

  protected saveForm(): void {
    this.ipcService.send('set-player-config', this.form.value);
  }

  protected addMedia(): void {
    this.media.push(this.formBuilder.control({}));
  }
}
