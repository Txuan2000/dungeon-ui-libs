import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  input,
  model,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { DgFocusTrap } from '../focus-trap';
import { DgDialogFooterDef, DgDialogHeaderDef } from './dialog-defs';

export type DgDialogPosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'topleft'
  | 'topright'
  | 'bottomleft'
  | 'bottomright';

@Component({
  selector: 'dg-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, DgFocusTrap],
  template: `
    <dialog
      #dialogEl
      class="dg-dialog"
      dgFocusTrap
      [dgFocusTrapDisabled]="!focusTrap()"
      [attr.data-position]="position()"
      [attr.data-modal]="modal() || null"
      [class.dg-dialog--modal]="modal()"
      (close)="handleNativeClose()"
      (click)="handleBackdropClick($event)"
      (cancel)="handleCancel($event)"
    >
      <div class="dg-dialog__panel" [style.width]="width() ?? null" (click)="$event.stopPropagation()">
        @if (showHeader()) {
          <header class="dg-dialog__header">
            <div class="dg-dialog__title">
              @if (currentHeaderTemplate(); as tmpl) {
                <ng-container *ngTemplateOutlet="tmpl" />
              } @else if (header()) {
                <h2 class="dg-dialog__title-text">{{ header() }}</h2>
              }
            </div>
            @if (closable()) {
              <button
                type="button"
                class="dg-dialog__close"
                [attr.aria-label]="closeAriaLabel()"
                (click)="close()"
              >
                <span aria-hidden="true">×</span>
              </button>
            }
          </header>
        }

        <div class="dg-dialog__body">
          <ng-content />
        </div>

        @if (currentFooterTemplate(); as tmpl) {
          <footer class="dg-dialog__footer">
            <ng-container *ngTemplateOutlet="tmpl" />
          </footer>
        }
      </div>
    </dialog>
  `,
  styleUrl: './dialog.scss',
  host: {
    '[attr.data-dg-dialog]': '""',
  },
})
export class DgDialog {
  readonly visible = model(false);
  readonly header = input<string>();
  readonly modal = input(true, { transform: booleanish });
  readonly closable = input(true, { transform: booleanish });
  readonly closeOnEscape = input(true, { transform: booleanish });
  readonly dismissableMask = input(false, { transform: booleanish });
  readonly showHeader = input(true, { transform: booleanish });
  readonly blockScroll = input(true, { transform: booleanish });
  /**
   * When true (default), Tab / Shift+Tab cycles focus only between focusable
   * elements inside the dialog (via the {@link DgFocusTrap} directive).
   * Native `<dialog>` already inerts the page in modal mode, but the trap
   * also covers non-modal mode where focus could otherwise escape.
   */
  readonly focusTrap = input(true, { transform: booleanish });
  /**
   * When true (default), focus moves to the first focusable element inside
   * the dialog after open. Set to `false` to keep focus on the opener.
   */
  readonly autoFocus = input(true, { transform: booleanish });
  readonly position = input<DgDialogPosition>('center');
  readonly width = input<string>();
  readonly closeAriaLabel = input('Close');
  readonly headerTemplate = input<TemplateRef<unknown> | null>(null);
  readonly footerTemplate = input<TemplateRef<unknown> | null>(null);

  readonly shown = output<void>();
  readonly hidden = output<void>();

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
  private readonly trap = viewChild.required(DgFocusTrap);
  private readonly headerDef = contentChild(DgDialogHeaderDef);
  private readonly footerDef = contentChild(DgDialogFooterDef);

  protected readonly currentHeaderTemplate = computed<TemplateRef<unknown> | null>(
    () => this.headerTemplate() ?? this.headerDef()?.templateRef ?? null,
  );
  protected readonly currentFooterTemplate = computed<TemplateRef<unknown> | null>(
    () => this.footerTemplate() ?? this.footerDef()?.templateRef ?? null,
  );

  constructor() {
    effect(() => {
      const el = this.dialogRef().nativeElement;
      const open = this.visible();
      const isOpen = el.open;

      if (open && !isOpen) {
        if (this.modal()) {
          el.showModal();
        } else {
          el.show();
        }
        this.toggleBodyScroll(true);
        if (this.autoFocus()) {
          queueMicrotask(() => this.trap().focusFirst());
        }
        this.shown.emit();
      } else if (!open && isOpen) {
        el.close();
      }
    });
  }

  close(): void {
    if (this.visible()) {
      this.visible.set(false);
    }
  }

  protected handleNativeClose(): void {
    if (this.visible()) {
      this.visible.set(false);
    }
    this.toggleBodyScroll(false);
    this.hidden.emit();
  }

  protected handleCancel(event: Event): void {
    if (!this.closeOnEscape()) {
      event.preventDefault();
    }
  }

  protected handleBackdropClick(event: MouseEvent): void {
    if (!this.dismissableMask()) {
      return;
    }
    if (event.target === this.dialogRef().nativeElement) {
      this.close();
    }
  }

  private toggleBodyScroll(lock: boolean): void {
    if (typeof document === 'undefined') return;
    if (!this.blockScroll() || !this.modal()) return;
    document.body.style.overflow = lock ? 'hidden' : '';
  }
}

function booleanish(value: boolean | string | null | undefined): boolean {
  return value === '' || value === true || value === 'true';
}
