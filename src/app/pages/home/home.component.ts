import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { forkJoin, fromEvent, merge, of, tap } from 'rxjs';

import { BaseComponent } from '$directives/base.component';
import { IpcService } from '$services/ipc-renderer.service';
import { SlotService } from '$services/slot.service';
import { ObjectsService } from '$services/objects.service';
import { PlayerConfig, PlayerMedia, PlaylistMedia } from '$types/player.types';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends BaseComponent implements OnInit {
  @ViewChild('wrapperPost') public wrapperPost!: ElementRef<HTMLElement>;
  @ViewChild('postCanvas') public postCanvas!: ElementRef<HTMLCanvasElement>;

  @ViewChild('marqueeContainer') public marqueeContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('marqueeTextContainer') public marqueeTextContainer!: ElementRef<HTMLDivElement>;

  @ViewChild('postImage') public postImage!: ElementRef<HTMLImageElement>;
  @ViewChild('postVideo') public postVideo!: ElementRef<HTMLVideoElement>;

  protected playerConfig: PlayerConfig | null = null;
  protected playlist: PlaylistMedia[] = [];

  protected mediaIndex = 0;
  protected canMarquee = false;
  protected isNoneMarqueeAnimation = true;
  protected marqueeSpeed = 0;

  protected mediaObjectTimeoutId: NodeJS.Timeout | null = null;
  protected postTimeoutId: NodeJS.Timeout | null = null;

  protected messageText = '#сообщение';
  protected eventText = '#событие';

  public imageBlock: Record<string, any> = {};
  public videoBlock: Record<string, any> = {};

  public windowWidth: number = 0;
  public windowHeight: number = 0;

  public currentMedia: PlaylistMedia | null = null;
  protected marqueeText: string = '';
  protected marqueeFontSize = 0;
  protected defaultMarqueeSpeed = 4;

  protected currentSlotsIndex: Record<number, number> = {};
  protected isElementScrolling = false;

  protected slotIdIn: string | null = null;
  protected isOnline = window.navigator.onLine;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private ipcService: IpcService,
    private objectsService: ObjectsService,
    private slotService: SlotService,
  ) {
    super();

    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;

    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(
        tap(() => {
          console.log('online');
          this.isOnline = true;
          this.ipcService.send('get-player-config');
          this.ipcService.send('connection-restored');
        }),
      ),
      fromEvent(window, 'offline').pipe(
        tap(() => {
          console.log('offline');
          this.isOnline = false;
          this.changeDetectorRef.markForCheck();
        }),
      ),
    )
      .pipe(this.takeUntilDestroy())
      .subscribe();

    this.ipcService.on('no-connect', () => {
      console.log('no-connect');
      this.clearMedia();
      this.isOnline = false;
      this.changeDetectorRef.detectChanges();
    });

    this.ipcService.on('black-window', (event, data) => {
      console.log('black-window', data);
      this.clearMedia();
    });

    this.ipcService.on('player-rotation-config', (event, config) => {
      this.setPlayerConfig(config);
    });
  }

  public ngOnInit(): void {
    if (this.isOnline) {
      this.ipcService.send('get-player-config');
    }
  }

  protected clearMedia(): void {
    this.clearTimeouts();
    this.currentMedia = null;
    this.changeDetectorRef.detectChanges();
  }

  protected setPlayerConfig(config: PlayerConfig): void {
    this.playerConfig = config;

    const mediaSlots: PlayerMedia[] = config.playlistSettings.media
      .filter((item: PlayerMedia) => item.objectType === 'slot');
    this.slotIdIn = mediaSlots.map((item) => item.objectValue).join(',');

    if (this.playerConfig?.playerSettings.iterraToken) {
      forkJoin([
        this.slotService.fetchSlotWidgets(this.slotIdIn, 'posting', this.playerConfig.playerSettings.iterraToken),
        this.slotService.fetchSlotConfigs(this.slotIdIn, this.playerConfig.playerSettings.iterraToken)
      ])
        .pipe(this.takeUntilDestroy())
        .subscribe({
            next: ([slotWidgets, slotWidgetConfigs]) => {
              this.playlist = [];

              this.playerConfig?.playlistSettings.media.forEach((item) => {
                const object: PlaylistMedia = {
                  type: item.objectType,
                };

                switch (item.objectType) {
                  case 'slot':
                    const slotId = Number(item.objectValue);

                    object.slotId = slotId;
                    object.slotManifest = slotWidgets
                      .find((slotWidget) => slotWidget.slotId === slotId)?.manifest || null;

                    const slotConfigData = slotWidgetConfigs
                      .find((slotWidgetConfig) => slotWidgetConfig.slotId === slotId)?.data || null;

                    if (slotConfigData && !slotConfigData.hasOwnProperty('backgroundDisplayFinger')) {
                      slotConfigData.backgroundDisplayFinger = true;
                    }

                    object.slotConfigData = slotConfigData;

                    this.currentSlotsIndex[slotId] = 0;
                    break;
                  case 'file':
                    object.singleMediaPath = String(item.objectValue);
                    break;
                }

                this.playlist.push(object);
              });

              this.showMediaObject();
            },
            error: (error) => console.log('error', error)
          }
        );
    }
  }

  protected showMediaObject(): void {
    this.clearTimeouts();
    this.currentMedia = this.playlist[this.mediaIndex];

    switch (this.playlist[this.mediaIndex].type) {
      case 'slot':
        if (this.playlist[this.mediaIndex].slotId && this.playerConfig?.playerSettings.iterraToken && this.isOnline) {
          this.slotService
            .moveCounter(this.playlist[this.mediaIndex].slotId!, this.playerConfig?.playerSettings.iterraToken!)
            .pipe(this.takeUntilDestroy())
            .subscribe();
        }
        this.processSlot();
        break;
      case 'file':
        this.processSingleObject();
        break;
    }
  }

  protected processSingleObject(): void {
    if (!this.currentMedia || !this.currentMedia.singleMediaPath) {
      return;
    }

    this.currentMedia.singleObjectType =
      this.objectsService.determineSingleObjectType(this.currentMedia.singleMediaPath);

    this.currentMedia.singleObjectExtension =
      this.objectsService.determineSingleObjectExtension(this.currentMedia.singleMediaPath);

    if (this.currentMedia.singleObjectType === 'image') {
      this.getNextShowMediaObject(this.playerConfig?.playlistSettings.media[this.mediaIndex].time || 0);
    }

    this.changeDetectorRef.detectChanges();
  }

  protected processSlot(): void {
    const postIds = this.playlist[this.mediaIndex].slotConfigData?.items || [];

    if (!postIds) {
      console.log('Нет текущих постов для показа');
      return;
    }

    if (!this.isOnline) {
      this.processingPosts();
      return;
    }

    this.slotService.getPosts(postIds, this.playerConfig?.playerSettings.iterraToken!)
      .pipe(this.takeUntilDestroy())
      .subscribe({
        next: (posts) => {
          posts.sort((a, b) => a.id - b.id);
          if (posts.length) {
            this.playlist[this.mediaIndex].slotPosts = posts;
          }
          this.processingPosts();
        },
        error: (error) => {
          console.log('error', error);
          this.processingPosts();
        }
      })
  }

  protected processingPosts(): void {
    this.addPost();
    this.getNextShowMediaObject(this.playerConfig?.playlistSettings.media[this.mediaIndex].time || 0);
  }

  protected addPost(): void {
    if (!this.playlist[this.mediaIndex].slotPosts?.length || !this.currentMedia) {
      this.showMediaObject();
      return;
    }

    if (this.playerConfig && this.currentMedia.type === 'slot' && !this.currentMedia.slotManifest) {
      this.clearMedia();
      this.setPlayerConfig(this.playerConfig);
      return;
    }

    this.isNoneMarqueeAnimation = true;
    this.changeDetectorRef.markForCheck();

    this.isElementScrolling = false;

    const postIndex = this.currentSlotsIndex[this.currentMedia.slotId!];
    const slotPosts = this.playlist[this.mediaIndex].slotPosts || [];
    const blocks = slotPosts[postIndex]?.data?.blocks || [];

    this.imageBlock = blocks.find((item: Record<string, any>) => item['type'] === 'carousel');
    this.videoBlock = blocks.find((item: Record<string, any>) => item['type'] === 'video');
    this.changeDetectorRef.markForCheck();

    this.checkMarquee(blocks);
    this.goToNextPost();
  }

  protected checkMarquee(blocks: any): void {
    const rubric = this.playlist[this.mediaIndex]!.slotConfigData?.rubric || 'default';
    const textBlock = blocks.find((item: Record<string, any>) => item['type'] === 'paragraph');
    this.marqueeFontSize = (this.currentMedia?.slotConfigData?.marqueeHeight ?? 0) * 0.8;

    if (this.playlist[this.mediaIndex].slotConfigData?.marquee) {
      const messageType = rubric === 'events' ? this.eventText : this.messageText;
      this.marqueeText = textBlock ? textBlock.data.text.substring(0, textBlock.data.text.indexOf(messageType)) : '';

      setTimeout(() => {
        const marqueeWidth = this.marqueeTextContainer.nativeElement.offsetWidth;
        const configMarqueeSpeed = this.currentMedia?.slotConfigData?.marqueeSpeed
          ? this.currentMedia?.slotConfigData?.marqueeSpeed
          : this.defaultMarqueeSpeed;

        this.isNoneMarqueeAnimation = false;
        this.marqueeSpeed = (configMarqueeSpeed - 1) * (marqueeWidth / 1000);
        this.changeDetectorRef.detectChanges();
      }, 500);
    }

    this.changeDetectorRef.detectChanges();
  }

  protected loadedSingleData(event: Event, singleVideo: HTMLVideoElement): void {
    this.clearTimeouts();
    this.getNextShowMediaObject(singleVideo?.duration * 1000 || 0);
  }

  protected goToNextPost(): void {
    const slotId = this.playlist[this.mediaIndex].slotId;
    this.canMarquee = false;

    this.currentSlotsIndex[slotId!] =
      (this.currentSlotsIndex[slotId!] === this.playlist[this.mediaIndex].slotPosts!.length - 1)
        ? 0
        : ++this.currentSlotsIndex[slotId!];

    if (this.currentSlotsIndex[slotId!] === 0 && this.isOnline) {
      this.slotService
        .fetchSlotConfigs(this.playlist[this.mediaIndex].slotId!, this.playerConfig?.playerSettings.iterraToken!)
        .pipe(this.takeUntilDestroy())
        .subscribe({
          next: (configs) => {
            this.playlist[this.mediaIndex].slotConfigData = configs[0].data;
            this.postTimeoutId = setTimeout(() => {
              this.addPost();
            }, (this.playlist[this.mediaIndex].slotConfigData?.postTimeSec ?? 0) * 1000);
          }
        })
    } else {
      this.postTimeoutId = setTimeout(() => {
        this.addPost();
      }, (this.playlist[this.mediaIndex].slotConfigData?.postTimeSec ?? 0) * 1000);
    }
  }

  protected onLoadPostImage(): void {
    const ctx = this.postCanvas.nativeElement.getContext('2d');
    const image = this.postImage.nativeElement as HTMLImageElement;

    ctx?.drawImage(image, 0, 0, this.postCanvas.nativeElement.width, this.postCanvas.nativeElement.height);
  }

  protected onLoadPostVideo(): void {
    const ctx = this.postCanvas.nativeElement.getContext('2d');

    if (ctx) {
      const canvas = this.postCanvas.nativeElement;
      this.drawCanvasVideo(this.postVideo.nativeElement as HTMLVideoElement, ctx, canvas.width, canvas.height);
    }
  }

  private clearTimeouts(): void {
    if (this.mediaObjectTimeoutId) {
      clearTimeout(this.mediaObjectTimeoutId);
    }

    if (this.postTimeoutId) {
      clearTimeout(this.postTimeoutId);
    }
  }

  private drawCanvasVideo(
    video: HTMLVideoElement,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number): void {
    if (video.paused || video.ended) return;

    ctx.drawImage(video, 0, 0, width, height);
    setTimeout(() => {
      this.drawCanvasVideo(video, ctx, width, height)
    }, 20);
  }

  private getNextShowMediaObject(duration: number): void {
    this.mediaObjectTimeoutId = setTimeout(() => {
      this.mediaIndex = (this.mediaIndex === this.playlist.length - 1) ? 0 : ++this.mediaIndex;
      this.showMediaObject();
    }, duration);
  }
}
