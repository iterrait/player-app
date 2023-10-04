import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { Observable, of, retry } from 'rxjs';

import { ApiService } from '$services/api.service';
import type { Post, SlotWidget, SlotWidgetConfig } from '$types/slot.types';
import type { WidgetType } from '$types/player.types';

@Injectable({
  providedIn: 'root',
})
export class SlotService {
  private retryCount = 10;
  private retryDelay = 10000;

  constructor(
    private apiService: ApiService
  ) {
  }

  public fetchSlotWidgets(slotIdIn: string, widget: WidgetType, token: string): Observable<SlotWidget[]> {
    if (!slotIdIn.length || !token) {
      return of([]);
    }

    const path = 'https://api.iterra.world/v1/capsule/location/slots/widgets';
    const params = {
      slotIdIn,
      widget,
      isActive: true,
      limit: 0,
    };
    const options = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };

    return this.apiService.get<SlotWidget[]>(path, params, options).pipe(
      catchError(() => of([])),
    );
  }

  public fetchSlotConfigs(slotIdIn: string | number, token: string): Observable<SlotWidgetConfig[]> {
    if (!slotIdIn || !token) {
      return of([]);
    }

    if (typeof slotIdIn === 'number') {
      slotIdIn = slotIdIn.toString();
    }

    const path = 'https://widget.iterra.world/posting/channels/slots';
    const params = { slotIdIn };

    const options = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };

    return this.apiService.get<SlotWidgetConfig[]>(path, params, options).pipe(
      catchError(() => of([])),
    );
  }

  public moveCounter(slotId: number, token: string): Observable<void> {
    const path = `https://widget.iterra.world/posting/slots/${slotId}/post`;
    const params = { slotId, token };

    return this.apiService.get<void>(path, params).pipe(
      catchError(() => of(void 0)),
    );
  }

  public getPosts(items: number[], token: string): Observable<Post[]> {
    if (!items || items.length === 0 || !token) {
      return of([]);
    }

    const idIn = items.join(',');
    const searchParams = new URLSearchParams({
      'id_in': idIn,
      'is_approved': 'true'
    });
    const path = `https://widget.iterra.world/posting/posts?${searchParams}&offset=0&limit=0`;
    const options = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };

    return this.apiService.get<Post[]>(path, {}, options).pipe(
      catchError(() => of([]))
    );
  }
}
