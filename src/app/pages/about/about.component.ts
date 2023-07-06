import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { IpcService } from '../../services/ipc-renderer.service';

@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  @ViewChild('version') public version!: ElementRef<HTMLElement>;

  constructor(
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private ipcService: IpcService,
  ) {
  }

  public ngAfterViewInit(): void {
    this.ipcService.send('get-app-version');

    this.ipcService.on('sender-app-version', (event, args) => {
      this.version.nativeElement.innerText = 'Version ' + args.version;
    });
  }
}
