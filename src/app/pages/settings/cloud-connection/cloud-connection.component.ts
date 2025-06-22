import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { IpcRendererEvent } from 'electron';

import { BaseComponent } from '$directives/base.component';
import { IpcService } from '$services/ipc-renderer.service';
import { PlayerService } from '$services/player.service';
import { Player } from '$types/player.types';
import { CloudConnectionService } from './cloud-connection.service';

@Component({
  selector: 'cloud-connection',
  templateUrl: './cloud-connection.component.html',
  styleUrls: ['./cloud-connection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudConnectionComponent extends BaseComponent {
  private cloudConnectionService = inject(CloudConnectionService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private ipcService = inject(IpcService);
  private playerService = inject(PlayerService);

  protected player = this.playerService.player;
  protected message: string | null = null;

  protected form = new FormGroup({
    code: new FormControl<string | null>(null),
  });

  protected code = this.form.controls.code;
  protected currentCode = signal<string | null>(null);

  constructor() {
    super();

    this.ipcService.send('get-player-data');

    this.ipcService.on('player-data', (event: IpcRendererEvent, player: Player) => {
      this.player.set(player);
    });

    this.ipcService.on('device-token', (event: IpcRendererEvent, token: string) => {
      const code = this.currentCode();
      if (!code || !token) return;

      this.cloudConnectionService.linkDevice(token, code)
        .pipe(this.takeUntilDestroy())
        .subscribe({
          next: (player: Player) => {
            this.player.set(player);
            this.message = 'Плеер успешно привязан';
            this.changeDetectorRef.detectChanges();
            this.ipcService.send('set-player-data', player);
          },
          error: (error: ErrorEvent) => {
            console.log('error', error);
            this.message = error.error.detail ?? 'Ошибка привязки плеера';
            this.changeDetectorRef.detectChanges();
          },
        });
    });
  }

  protected onSubmitClick(): void {
    if (!this.code.value) return;

    this.code.disable();
    this.currentCode.set(this.code.value);
    this.ipcService.send('get-token', { code: this.code.value });
  }
}
