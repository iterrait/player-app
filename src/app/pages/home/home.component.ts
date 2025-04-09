import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { IpcRendererEvent } from 'electron';
import { fromEvent, merge, of, tap } from 'rxjs';

import { HlsMediaObjectService } from '$components/media-objects/hls-media-object/hls-media-object.service';
import { SlotMediaObjectService } from '$components/media-objects/slot-media-object/slot-media-object.service';
import { BaseComponent } from '$directives/base.component';
import { IpcService } from '$services/ipc-renderer.service';
import { PlayerConfig, PlayerMedia } from '$types/player.types';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [HlsMediaObjectService, SlotMediaObjectService],
})
export class HomeComponent extends BaseComponent implements OnInit {
  private changeDetectorRef = inject(ChangeDetectorRef);
  private ipcService = inject(IpcService);

  protected playerConfig = signal<PlayerConfig | null>(null);
  protected playlist = signal<PlayerMedia[]>([]);
  protected currentMedia = signal<PlayerMedia | null>(null);
  protected mediaIndex = signal<number>(0);
  protected showNextEntity = signal<boolean>(true);
  protected isOnline = signal<boolean>(window.navigator.onLine);

  protected mediaObjectTimeoutId: NodeJS.Timeout | null = null;

  constructor() {
    super();

    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(
        tap(() => {
          this.ipcService.send('log-info', [{ online: 'true'}]);
          this.isOnline.set(true);
          this.ipcService.send('get-player-config');

          setTimeout(() => this.ipcService.send('connection-restored'));
        }),
      ),
      fromEvent(window, 'offline').pipe(
        tap(() => {
          this.ipcService.send('log-info', [{ online: 'false'}]);
          this.isOnline.set(false);
          this.changeDetectorRef.markForCheck();
        }),
      ),
    )
      .pipe(this.takeUntilDestroy())
      .subscribe();

    this.ipcService.on('no-connect', () => {
      this.clearMedia();
      this.isOnline.set(false);
      this.changeDetectorRef.detectChanges();
    });

    this.ipcService.on('black-window', (event, data) => {
      this.clearMedia();
    });

    this.ipcService.on('error', () => {
      this.clearMedia();
      this.isOnline.set(false);
      this.changeDetectorRef.detectChanges();
    });

    this.ipcService.on('player-rotation-config', (event: IpcRendererEvent, config: PlayerConfig) => {
      this.playerConfig.set(config);
      this.playlist.set(config.playlistSettings.media ?? {});
      this.showMediaObject();
      this.changeDetectorRef.detectChanges();
    });
  }

  public ngOnInit(): void {
    if (this.isOnline()) {
      this.ipcService.send('get-player-config');
    }
  }

  protected changeDurationMediaObject(duration: number): void {
    this.clearTimeouts();
    this.getNextShowMediaObject(duration
      ?? this.playerConfig()?.playlistSettings?.media[this.mediaIndex()].time
      ?? 0);
  }

  private clearMedia(): void {
    this.clearTimeouts();

    this.currentMedia.set(null);
    this.mediaIndex.set(0);
    this.changeDetectorRef.detectChanges();
  }

  private showMediaObject(): void {
    this.clearTimeouts();

    if (!this.playlist()?.length) return;

    this.currentMedia.set(this.playlist()[this.mediaIndex()]);
    this.showNextEntity.set(true);
    this.changeDetectorRef.detectChanges();

    const duration = this.playerConfig()?.playlistSettings?.media[this.mediaIndex()].time;
    if (!duration) return;

    this.getNextShowMediaObject(duration);
  }

  private getNextShowMediaObject(duration: number): void {
    this.mediaObjectTimeoutId = setTimeout(() => {
      this.showNextEntity.set(false);
      this.changeDetectorRef.detectChanges();

      let index = this.mediaIndex();
      const nextIndex = (index === this.playlist()?.length - 1) ? 0 : ++index;

      this.mediaIndex.set(nextIndex);
      this.showMediaObject();
    }, duration);
  }

  private clearTimeouts(): void {
    if (this.mediaObjectTimeoutId) {
      clearTimeout(this.mediaObjectTimeoutId);
    }
  }
}
