import { Directive, OnDestroy } from '@angular/core';
import { MonoTypeOperatorFunction, Subject, takeUntil } from 'rxjs';

@Directive({
  selector: 'base-component',
  standalone: true,
})
export class BaseComponent implements OnDestroy {
  private destroy: Subject<void> | undefined;

  protected takeUntilDestroy = <T>(): MonoTypeOperatorFunction<T> => {
    if (!this.destroy) {
      this.destroy = new Subject<void>();
    }

    return takeUntil<T>(this.destroy);
  }

  public ngOnDestroy(): void {
    if (this.destroy) {
      this.destroy.next();
      this.destroy.complete();
    }
  }
}
