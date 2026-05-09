import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  ComponentRef,
  EmbeddedViewRef,
  Injectable,
  Injector,
  Type,
  createComponent,
  inject,
} from '@angular/core';
import { DgDialogHost } from './dialog-host';
import { DgDialogRef, DgDialogOpenConfig } from './dialog-tokens';

@Injectable({ providedIn: 'root' })
export class DgDialogService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly hosts = new Map<DgDialogRef<unknown, unknown>, ComponentRef<DgDialogHost<unknown>>>();

  open<T, R = unknown, D = unknown, I extends Record<string, unknown> = Record<string, unknown>>(
    component: Type<T>,
    config: DgDialogOpenConfig<D, I> = {},
  ): DgDialogRef<R, T> {
    const dialogRef = new DgDialogRef<R, T>();

    const hostRef = createComponent(DgDialogHost<T>, {
      environmentInjector: this.appRef.injector,
      elementInjector: this.injector,
    });

    hostRef.instance.config = config;
    hostRef.instance.dialogRef = dialogRef as DgDialogRef<unknown, T>;
    hostRef.instance.childComponent = component;
    hostRef.instance.childInputs = config.inputs;

    this.appRef.attachView(hostRef.hostView);
    const hostElem = (hostRef.hostView as EmbeddedViewRef<unknown>).rootNodes[0] as HTMLElement;
    this.document.body.appendChild(hostElem);

    this.hosts.set(dialogRef as DgDialogRef<unknown, unknown>, hostRef as ComponentRef<DgDialogHost<unknown>>);

    dialogRef.afterClosed$.subscribe(() => {
      hostRef.instance._close();
      queueMicrotask(() => this.cleanup(dialogRef as DgDialogRef<unknown, unknown>));
    });

    return dialogRef;
  }

  private cleanup(dialogRef: DgDialogRef<unknown, unknown>): void {
    const hostRef = this.hosts.get(dialogRef);
    if (!hostRef) return;
    setTimeout(() => {
      this.appRef.detachView(hostRef.hostView);
      hostRef.destroy();
      this.hosts.delete(dialogRef);
    }, 200);
  }
}
