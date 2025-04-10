import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
  output,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import * as uuid from 'uuid';

import { BaseComponent } from '$directives/base.component';
import { IpcService } from '$services/ipc-renderer.service';
import { ObjectsService } from '$services/objects.service';
import type { FileType, MediaType, PlayerMedia } from '$types/player.types';

interface PlaylistItemType {
  title: string;
  objType: MediaType;
}

@Component({
  selector: 'playlist-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    ReactiveFormsModule,
  ],
  templateUrl: './playlist-item.component.html',
  styleUrls: ['./playlist-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PlaylistItemComponent),
      multi: true,
    }
  ]
})
export class PlaylistItemComponent extends BaseComponent implements AfterViewInit, ControlValueAccessor {
  public deleteItem = output();

  private changeDetectorRef = inject(ChangeDetectorRef);
  private ipcService = inject(IpcService);
  private objectsService = inject(ObjectsService);

  protected form = new FormGroup({
    objectType: new FormControl<MediaType | null>(null),
    objectValue: new FormControl<string | number | null>(null),
    time: new FormControl<number | null>(null),
  });

  private objectUuid: string | null = null;
  protected isVisibleTime = true;

  protected onChangeFn: (val: any) => void = () => {};
  protected onTouchedFn: (val: any) => void = () => {};

  protected playlistItemTypes: PlaylistItemType[] = [
    { title: 'Слот', objType: 'slot' },
    { title: 'Видео', objType: 'video' },
    { title: 'Картинка', objType: 'image' },
    { title: 'hls-поток', objType: 'hls-stream' },
  ];

  protected get objectType(): FormControl {
    return this.form.get('objectType') as FormControl;
  }

  protected get objectValue(): FormControl {
    return this.form.get('objectValue') as FormControl;
  }

  protected get time(): FormControl {
    return this.form.get('time') as FormControl;
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

    this.objectType.valueChanges
      .pipe(this.takeUntilDestroy())
      .subscribe({
        next: (value) => {
          if (value === 'video') {
            this.time.disable();
          } else {
            this.time.enable();
          }
        },
      });
  }

  public ngAfterViewInit(): void {
    this.ipcService.on('set-file', (event, args: FileType) => {
      if (args.uuid === this.objectUuid && args.filePaths[0]) {
        const path = args.filePaths[0].toString();

        this.objectValue.setValue(path);
        this.objectValue.enable();
        this.isVisibleTime = this.objectsService.determineSingleObjectType(path) !== 'video';
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  protected setFile(file: string): void {
    this.objectValue.setValue(file);
  }

  public registerOnChange(fn: any): void {
    this.onChangeFn = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouchedFn = fn;
  }

  public writeValue(obj: PlayerMedia | null): void {
    this.form.reset();

    if(!obj) return;

    this.form.patchValue({
      objectType: obj?.objectType ?? 'slot',
      objectValue: obj?.objectValue?.toString(),
      time: obj?.time,
    });

    if (this.objectValue.value) {
      this.isVisibleTime = this.objectsService.determineSingleObjectType(this.objectValue.value) !== 'video';
    }

    this.changeDetectorRef.markForCheck();
  }

  protected chooseFile(): void {
    this.objectUuid = uuid.v4();
    this.ipcService.send('open-dialog', { uuid: this.objectUuid } as any);
  }

  protected onDeleteItem(): void {
    this.deleteItem.emit();
  }
}
