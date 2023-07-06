import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { IpcService } from '$services/ipc-renderer.service';
import { PlayerConfig } from '$types/player.types';
import { PlaylistSettingsComponent } from './playlist-settings/playlist-settings.component';

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements AfterViewInit {
  @ViewChild(PlaylistSettingsComponent) public playlistSettings!: PlaylistSettingsComponent;

  protected isVisibleMediaButton = true;
  protected form: FormGroup = this.formBuilder.group({
    playerSettings: [null],
    playlistSettings: [null],
  });

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
    this.form.reset();

    this.form.patchValue({
      playerSettings: config?.playerSettings,
      playlistSettings: config?.playlistSettings,
    });

    this.changeDetectorRef.markForCheck();
  }

  protected saveForm(): void {
    this.ipcService.send('set-player-config', this.form.value);
  }

  protected addPlaylistMedia(): void {
    this.playlistSettings.addMedia();
  }

  protected onTabChange(index: number) {
    this.isVisibleMediaButton = !index;
    this.changeDetectorRef.markForCheck();
  }
}
