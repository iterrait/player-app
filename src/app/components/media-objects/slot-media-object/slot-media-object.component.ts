import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
  viewChild
} from '@angular/core';
import { forkJoin } from 'rxjs';

import { BaseComponent } from '$directives/base.component';
import { IpcService } from '$services/ipc-renderer.service';
import { PlayerMedia, PlayerSettings } from '$types/player.types';
import { Post, SlotManifest, SlotWidgetConfigData } from '$types/slot.types';
import { SlotService } from './slot.service';
import { SlotMediaObjectService } from './slot-media-object.service';
import { AnimationBackgroundComponent } from '../../animation-background/animation-background.component';
import { SimpleBackgroundComponent } from '../../simple-background/simple-background.component';

@Component({
  selector: 'slot-media-object',
  standalone: true,
  imports: [
    AnimationBackgroundComponent,
    SimpleBackgroundComponent,
  ],
  templateUrl: './slot-media-object.component.html',
  styleUrls: ['./slot-media-object.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotMediaObjectComponent extends BaseComponent implements OnDestroy {
  public currentMedia = input<PlayerMedia | null>(null);
  public playerSettings = input<PlayerSettings | null>(null);
  public showNextEntity = input(true);

  public postCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('postCanvas');
  public postImage = viewChild<ElementRef<HTMLImageElement>>('postImage');
  public postVideo = viewChild<ElementRef<HTMLVideoElement>>('postVideo');
  public marqueeContainer = viewChild<ElementRef<HTMLDivElement>>('marqueeContainer');
  public marqueeTextContainer = viewChild<ElementRef<HTMLDivElement>>('marqueeTextContainer');

  private changeDetectorRef = inject(ChangeDetectorRef);
  private ipcService = inject(IpcService);
  private slotMediaObjectService = inject(SlotMediaObjectService);
  private slotService = inject(SlotService);

  protected windowWidth = 0;
  protected windowHeight = 0;

  protected slotManifest: SlotManifest | null = null;
  protected slotConfig: SlotWidgetConfigData | null = null;
  protected posts = signal<Post[]>([]);
  protected currentPostIndex = signal<number>(0);
  protected currentPost = signal<Post | null>(null);
  protected postTimeoutId: NodeJS.Timeout | null = null;

  protected isStartOver = signal(true);
  protected marqueeFontSize = 0;
  protected defaultMarqueeSpeed = 9;
  protected defaultMarqueeHeight = 65;
  protected marqueeSpeed = this.defaultMarqueeSpeed;
  protected marqueeText = '';
  protected messageText = '#сообщение';
  protected eventText = '#событие';

  protected slotId = computed(() => {
    const currentMedia = this.currentMedia();

    return currentMedia ? currentMedia.objectValue as string : null;
  });

  protected mediaBlockInPost = computed(() => {
    const blocks = this.currentPost()?.data?.blocks ?? [];

    if (!blocks.length) {
      return null;
    }

    const carousel = blocks.find((item: Record<string, any>) => item['type'] === 'carousel');

    if (carousel) {
      return carousel;
    }

    const video = blocks.find((item: Record<string, any>) => item['type'] === 'video');
    if (video) {
      return video;
    }

    return null;
  });

  public override ngOnDestroy() {
    super.ngOnDestroy();

    if (this.postTimeoutId) {
      clearTimeout(this.postTimeoutId);
    }
  }

  constructor() {
    super();

    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;

    effect(() => {
      if (this.currentMedia() && this.showNextEntity()) {
        this.clearTimeoutId();
        this.getConfigData();
      }
    });
  }

  protected onLoadPostImage(): void {
    const ctx = this.postCanvas().nativeElement.getContext('2d');
    if (!ctx || !this.postImage()?.nativeElement || !this.postCanvas()) return;

    ctx.drawImage(
      this.postImage()!.nativeElement!,
      0,
      0,
      this.postCanvas().nativeElement.width,
      this.postCanvas().nativeElement.height,
    );
  }

  private getConfigData(): void {
    const slotId = this.slotId();

    if (!this.playerSettings()?.iterraToken || !slotId) return;

    const postsData = this.slotMediaObjectService.postsData[slotId];

    const methods = (!postsData?.queue || postsData?.queue && postsData?.queue > postsData?.posts.length - 3)
      ? [
        this.slotService.fetchSlotWidgets(slotId, 'posting', this.playerSettings()?.iterraToken!),
        this.slotService.fetchSlotConfigs(slotId, this.playerSettings()?.iterraToken!),
        this.slotService.moveCounter(this.currentMedia()!.objectValue as number, this.playerSettings()?.iterraToken!)
      ]
      : [
        this.slotService.fetchSlotWidgets(slotId, 'posting', this.playerSettings()?.iterraToken!),
        this.slotService.fetchSlotConfigs(slotId, this.playerSettings()?.iterraToken!),
      ];

    forkJoin(methods).pipe(this.takeUntilDestroy())
      .subscribe({
        next: ([slotWidgets, slotWidgetConfigs]) => {
          // @ts-expect-error
          this.slotManifest = slotWidgets[0]?.manifest ?? null;
          // @ts-expect-error
          this.slotConfig = slotWidgetConfigs[0]?.data ?? null;

          this.changeDetectorRef.detectChanges();

          if (!this.slotConfig?.hasOwnProperty('backgroundDisplayFinger') && this.slotConfig) {
            this.slotConfig.backgroundDisplayFinger = true;
          }

          if (this.slotMediaObjectService.postsData[slotId]) {
            this.slotMediaObjectService.postsData[slotId].manifest = this.slotManifest;
            this.slotMediaObjectService.postsData[slotId].config = this.slotConfig;
          } else {
            this.slotMediaObjectService.postsData[slotId] = {
              manifest: this.slotManifest,
              config: this.slotConfig,
              posts: [],
            };
          }

          this.getPosts();
        },
        error: (error) => {
          this.ipcService.send('log-info', [{ getConfigDataError: error }]);
          this.slotManifest = this.slotMediaObjectService.postsData?.[slotId].manifest ?? null;
          this.slotConfig = this.slotMediaObjectService.postsData?.[slotId].config ?? null;
        },
      });
  }

  private getPosts(): void {
    const postIds = this.slotConfig?.items || [];
    const slotId = this.slotId();

    if (!this.playerSettings()?.iterraToken || !postIds.length || !slotId) return;

    this.slotService.getPosts(postIds, this.playerSettings()?.iterraToken!)
      .pipe(this.takeUntilDestroy())
      .subscribe({
        next: (posts) => {
          posts?.sort((a, b) => a.id - b.id);
          this.posts.set(posts);

          if (slotId && this.slotMediaObjectService.postsData[slotId]) {
            this.slotMediaObjectService.postsData[slotId].posts = posts;
          }

          this.processingPosts();
        },
        error: (error) => {
          this.ipcService.send('log-info', [{ getPosts: error }]);
          this.posts.set(this.slotMediaObjectService.postsData?.[slotId].posts ?? []);
          this.processingPosts();
        },
      });
  }

  private processingPosts(): void {
    this.setCurrentPostIndex();
    this.addPost();

    if (!this.slotConfig?.postTimeMs) {
      this.ipcService.send('log-info', [{ currentMedia: 'currentPost: not time' }]);
      return;
    }

    this.postTimeoutId = setInterval(() => {
      this.setCurrentPostIndex();
      this.addPost();
    }, this.slotConfig?.postTimeMs!);
  }

  private setCurrentPostIndex(): void {
    this.isStartOver.set(false);
    this.changeDetectorRef.detectChanges();

    const slotId = this.slotId();

    if (!slotId) return;

    if (!this.slotMediaObjectService.postsData[slotId].hasOwnProperty('queue')) {
      this.currentPostIndex.set(0);
      this.slotMediaObjectService.postsData[slotId].queue = 0;
      return;
    }

    let index = this.slotMediaObjectService.postsData[slotId].queue!;

    if (this.posts()?.length) {
      const nextIndex = (index === this.posts()?.length - 1) ? 0 : ++index;
      this.currentPostIndex.set(nextIndex);
      this.slotMediaObjectService.postsData[slotId].queue = nextIndex;
    } else {
      this.currentPostIndex.set(0);
      this.slotMediaObjectService.postsData[slotId].queue = 0;
    }
  }

  private addPost(): void {
    this.isStartOver.set(true);
    this.currentPost.set(this.posts()?.[this.currentPostIndex()] ?? null);
    this.changeDetectorRef.detectChanges();

    if (this.slotConfig?.marquee) {
      this.addMarquee();
    }
  }

  private addMarquee():void{
    if (!this.slotManifest?.size?.width || !this.marqueeTextContainer()!.nativeElement) return;

    const rubric = this.slotConfig?.rubric ?? 'default';
    const blocks = this.currentPost()?.data?.blocks ?? [];
    const textBlock = blocks.find((item: Record<string, any>) => item['type'] === 'paragraph');
    const messageType = rubric === 'events' ? this.eventText : this.messageText;

    this.marqueeFontSize = (this.slotConfig?.marqueeHeight ?? 0) * 0.8;
    this.marqueeText = textBlock ? textBlock.data.text.substring(0, textBlock.data.text.indexOf(messageType)) : '';

    this.changeDetectorRef.detectChanges();
    // получаем ширину за вычетом padding-left: 100%
    const width = (this.marqueeTextContainer()!.nativeElement.clientWidth - this.slotManifest!.size!.width) ?? 0;
    let percent = 1;

    if (width > 3000) {
      percent = width / 3500;
    }

    this.marqueeSpeed = (this.slotConfig?.marqueeSpeed ?? this.defaultMarqueeSpeed) * percent;
    this.changeDetectorRef.detectChanges();
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

  private clearTimeoutId(): void {
    if (this.postTimeoutId) {
      clearTimeout(this.postTimeoutId);
    }
  }
}
