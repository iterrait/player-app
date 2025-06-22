import { Component, ElementRef, inject, ViewChild } from '@angular/core';

import { IpcService } from '$services/ipc-renderer.service';

@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  @ViewChild('version') public version!: ElementRef<HTMLElement>;

  private ipcService = inject(IpcService);

  public ngAfterViewInit(): void {
    this.ipcService.send('get-app-version');

    this.ipcService.on('sender-app-version', (event, args) => {
      this.version.nativeElement.innerText = 'Version ' + args.version;
    });
  }
}
