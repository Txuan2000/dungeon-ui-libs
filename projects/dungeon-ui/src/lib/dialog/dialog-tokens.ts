import { InjectionToken, Type } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { DgDialogPosition } from './dialog';

export const DG_DIALOG_DATA = new InjectionToken<unknown>('DG_DIALOG_DATA');

export interface DgDialogConfig<TData = unknown> {
  header?: string;
  width?: string;
  position?: DgDialogPosition;
  modal?: boolean;
  closable?: boolean;
  closeOnEscape?: boolean;
  dismissableMask?: boolean;
  showHeader?: boolean;
  blockScroll?: boolean;
  closeAriaLabel?: string;
  data?: TData;
}

export class DgDialogRef<TResult = unknown, TComponent = unknown> {
  private readonly _afterClosed = new Subject<TResult | undefined>();
  private readonly _afterOpened = new Subject<void>();
  readonly afterClosed$: Observable<TResult | undefined> = this._afterClosed.asObservable();
  readonly afterOpened$: Observable<void> = this._afterOpened.asObservable();

  componentInstance?: TComponent;
  private _closed = false;

  /** @internal — used by DgDialogService */
  _emitOpened(): void {
    this._afterOpened.next();
    this._afterOpened.complete();
  }

  /** @internal — used by DgDialogService */
  _emitClosed(result?: TResult): void {
    if (this._closed) return;
    this._closed = true;
    this._afterClosed.next(result);
    this._afterClosed.complete();
  }

  close(result?: TResult): void {
    this._emitClosed(result);
  }

  afterClosed(): Promise<TResult | undefined> {
    return new Promise((resolve) => {
      const sub = this.afterClosed$.subscribe((r) => {
        resolve(r);
        sub.unsubscribe();
      });
    });
  }
}

export interface DgDialogOpenConfig<TData = unknown, TInputs extends Record<string, unknown> = Record<string, unknown>>
  extends DgDialogConfig<TData> {
  inputs?: TInputs;
}

export type DgDialogContent<T> = Type<T>;
