import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DG_DIALOG_DATA, DgButton, DgDialogFooterDef, DgDialogHeaderDef, DgDialogRef } from 'dungeon-ui';

interface ConfirmData {
  message: string;
}

@Component({
  selector: 'demo-confirm',
  imports: [DgButton, DgDialogHeaderDef, DgDialogFooterDef],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template dgDialogHeader>
      <h2 class="title">
        <span class="dot" [class.dot--danger]="severity() === 'danger'"></span>
        {{ severity() === 'danger' ? 'Xác nhận xoá' : 'Xác nhận' }}
      </h2>
    </ng-template>

    <p>{{ data.message }}</p>
    <p class="meta">Severity: <strong>{{ severity() }}</strong></p>

    <ng-template dgDialogFooter>
      <dg-button label="Cancel" variant="text" (clicked)="dialogRef.close('cancel')" />
      <dg-button label="OK" [severity]="severity()" (clicked)="dialogRef.close('ok')" />
    </ng-template>
  `,
  styles: [
    `
      :host { display: block; }
      .title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        font-size: 1.0625rem;
        font-weight: 600;
      }
      .dot {
        width: 0.6rem;
        height: 0.6rem;
        border-radius: 50%;
        background: #2563eb;
        &--danger { background: #dc2626; }
      }
      .meta { color: #64748b; font-size: 0.875rem; }
    `,
  ],
})
export class DemoConfirm {
  protected readonly dialogRef = inject<DgDialogRef<'ok' | 'cancel', DemoConfirm>>(DgDialogRef);
  protected readonly data = inject<ConfirmData>(DG_DIALOG_DATA);
  readonly severity = input<'primary' | 'danger'>('primary');
}
