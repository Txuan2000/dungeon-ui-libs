import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Injector,
  Type,
  ViewContainerRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DgDialog } from './dialog';
import { DgDialogTemplateRegistry } from './dialog-defs';
import { DG_DIALOG_DATA, DgDialogConfig, DgDialogRef } from './dialog-tokens';

@Component({
  selector: 'dg-dialog-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DgDialog],
  providers: [DgDialogTemplateRegistry],
  template: `
    <dg-dialog
      [(visible)]="visible"
      [header]="config.header"
      [width]="config.width"
      [position]="config.position ?? 'center'"
      [modal]="config.modal ?? true"
      [closable]="config.closable ?? true"
      [closeOnEscape]="config.closeOnEscape ?? true"
      [dismissableMask]="config.dismissableMask ?? false"
      [showHeader]="config.showHeader ?? true"
      [blockScroll]="config.blockScroll ?? true"
      [closeAriaLabel]="config.closeAriaLabel ?? 'Close'"
      [headerTemplate]="registry.header()"
      [footerTemplate]="registry.footer()"
      (shown)="dialogRef._emitOpened()"
      (hidden)="onHidden()"
    >
      <ng-template #vc />
    </dg-dialog>
  `,
})
export class DgDialogHost<T = unknown> {
  config!: DgDialogConfig;
  dialogRef!: DgDialogRef<unknown, T>;
  childComponent!: Type<T>;
  childInputs?: Record<string, unknown>;

  protected readonly visible = signal(false);
  protected readonly registry = inject(DgDialogTemplateRegistry);
  private readonly hostInjector = inject(Injector);
  private readonly slot = viewChild.required('vc', { read: ViewContainerRef });
  private childRef?: ComponentRef<T>;

  constructor() {
    effect(() => {
      const slot = this.slot();
      if (!slot || this.childRef) return;

      const childInjector = Injector.create({
        parent: this.hostInjector,
        providers: [
          { provide: DgDialogRef, useValue: this.dialogRef },
          { provide: DG_DIALOG_DATA, useValue: this.config.data ?? null },
        ],
      });

      this.childRef = slot.createComponent(this.childComponent, { injector: childInjector });

      if (this.childInputs) {
        for (const [key, value] of Object.entries(this.childInputs)) {
          this.childRef.setInput(key, value);
        }
      }

      this.dialogRef.componentInstance = this.childRef.instance;
      this.visible.set(true);
    });
  }

  protected onHidden(): void {
    this.dialogRef._emitClosed(undefined);
  }

  /** @internal */
  _close(): void {
    this.visible.set(false);
  }
}
