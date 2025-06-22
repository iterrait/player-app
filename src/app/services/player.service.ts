import { Injectable, signal } from '@angular/core';

import { Player } from '$types/player.types';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  public player = signal<Player | null>(null);
  public token = signal<string | null>(null);

  // TODO убрать в базовый класс API после окончательного перехода
  public api = signal<string | null>(null);
}
