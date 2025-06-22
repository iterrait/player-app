import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '$services/api.service';
import { Player } from '$types/player.types';

@Injectable({
  providedIn: 'root',
})
export class CloudConnectionService {
  private apiService = inject(ApiService);

  public linkDevice(token: string, code: string): Observable<Player> {
    console.log('code', code);
    console.log('token', token);
    return this.apiService.post<Player>(
      'https://player.iterra.world/v1/players/device/',
      {
        code,
        token,
      },
    );
  }
}
