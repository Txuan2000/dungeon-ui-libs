import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DgButton, DgDialog, DgDialogFooterDef, DgDialogHeaderDef, DgDialogService } from 'dungeon-ui';
import { DemoConfirm } from '../../demo-dialogs/demo-confirm';
import { DemoForm, DemoFormResult } from '../../demo-dialogs/demo-form';
import { DemoInfo } from '../../demo-dialogs/demo-info';

@Component({
  selector: 'app-dialog-page',
  imports: [DgButton, DgDialog, DgDialogHeaderDef, DgDialogFooterDef],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Dialog</h1>
      <p>Native &lt;dialog&gt; backed component + programmatic <code>DgDialogService</code>.</p>
    </header>

    <section>
      <h2>Inline dialogs</h2>
      <div class="row">
        <dg-button label="Basic" (clicked)="basicVisible.set(true)" />
        <dg-button label="Dismissable mask" severity="info" (clicked)="dismissableVisible.set(true)" />
        <dg-button label="Top position" severity="secondary" (clicked)="topVisible.set(true)" />
        <dg-button label="Non-modal" variant="outlined" (clicked)="nonModalVisible.set(true)" />
        <dg-button label="Confirm" severity="danger" (clicked)="confirmVisible.set(true)" />
      </div>
      @if (confirmResult()) {
        <p class="hint">Last answer: <strong>{{ confirmResult() }}</strong></p>
      }
    </section>

    <dg-dialog header="Basic dialog" [(visible)]="basicVisible" width="28rem">
      <p>This is a modal dialog using the native <code>&lt;dialog&gt;</code> element.</p>
      <p>Esc to close, focus is trapped automatically by the browser.</p>
    </dg-dialog>

    <dg-dialog header="Click outside to close" [(visible)]="dismissableVisible" dismissableMask width="26rem">
      <p>Click on the dimmed backdrop to close this dialog.</p>
    </dg-dialog>

    <dg-dialog header="Anchored top" [(visible)]="topVisible" position="top" width="32rem">
      <p>Dialog positioned near the top of the viewport.</p>
    </dg-dialog>

    <dg-dialog header="Non-modal" [(visible)]="nonModalVisible" [modal]="false" width="24rem">
      <p>This one uses <code>el.show()</code> instead of <code>showModal()</code>.</p>
      <p>The page behind stays interactive.</p>
    </dg-dialog>

    <dg-dialog [(visible)]="confirmVisible" width="24rem" [closable]="false" [closeOnEscape]="false">
      <ng-template dgDialogHeader>
        <h2 class="custom-header">⚠ Delete this item?</h2>
      </ng-template>

      <p>Hành động này không thể hoàn tác.</p>
      <p>Tất cả dữ liệu liên quan sẽ bị xoá vĩnh viễn.</p>

      <ng-template dgDialogFooter>
        <dg-button label="Cancel" variant="text" (clicked)="confirm('cancelled')" />
        <dg-button label="Delete" severity="danger" (clicked)="confirm('deleted')" />
      </ng-template>
    </dg-dialog>

    <section>
      <h2>Dialog Service (programmatic)</h2>
      <div class="row">
        <dg-button label="Open via service" severity="primary" (clicked)="openServiceDialog('primary')" />
        <dg-button label="Open danger via service" severity="danger" (clicked)="openServiceDialog('danger')" />
        <dg-button label="Open info (no templates)" severity="info" variant="outlined" (clicked)="openInfoDialog()" />
        <dg-button label="Open form (live outputs)" severity="success" (clicked)="openFormDialog()" />
      </div>
      @if (serviceResult()) {
        <p class="hint">Service result: <strong>{{ serviceResult() }}</strong></p>
      }
      @if (formDraft(); as draft) {
        <p class="hint">Live draft from dialog → name: <strong>{{ draft.name || '—' }}</strong>, email: <strong>{{ draft.email || '—' }}</strong></p>
      }
      @if (formSaved(); as saved) {
        <p class="hint">Submitted output → <strong>{{ saved.name }}</strong> ({{ saved.email }})</p>
      }
    </section>
  `,
})
export class DialogPage {
  protected readonly basicVisible = signal(false);
  protected readonly dismissableVisible = signal(false);
  protected readonly topVisible = signal(false);
  protected readonly nonModalVisible = signal(false);
  protected readonly confirmVisible = signal(false);
  protected readonly confirmResult = signal<string | null>(null);

  protected readonly serviceResult = signal<string | null>(null);
  protected readonly formDraft = signal<DemoFormResult | null>(null);
  protected readonly formSaved = signal<DemoFormResult | null>(null);

  private readonly dialogService = inject(DgDialogService);

  protected confirm(answer: string): void {
    this.confirmResult.set(answer);
    this.confirmVisible.set(false);
  }

  protected openServiceDialog(severity: 'primary' | 'danger'): void {
    const ref = this.dialogService.open<DemoConfirm, 'ok' | 'cancel'>(DemoConfirm, {
      header: severity === 'danger' ? 'Xác nhận xoá' : 'Xác nhận',
      width: '24rem',
      dismissableMask: true,
      data: { message: severity === 'danger' ? 'Bạn có chắc muốn xoá item này?' : 'Tiếp tục thao tác?' },
      inputs: { severity },
    });
    ref.afterClosed$.subscribe((result) => {
      this.serviceResult.set(result ?? '(closed)');
    });
  }

  protected openFormDialog(): void {
    this.formDraft.set(null);
    const ref = this.dialogService.open<DemoForm, DemoFormResult>(DemoForm, {
      header: 'Tạo tài khoản',
      width: '26rem',
      closeOnEscape: false,
    });
    const instance = ref.componentInstance;
    if (instance) {
      instance.draftChanged.subscribe((draft) => this.formDraft.set(draft));
      instance.submitted.subscribe((value) => this.formSaved.set(value));
    }
    ref.afterClosed$.subscribe((result) => {
      this.serviceResult.set(result ? `saved: ${result.name} <${result.email}>` : '(form cancelled)');
    });
  }

  protected openInfoDialog(): void {
    const ref = this.dialogService.open<DemoInfo, void>(DemoInfo, {
      header: 'Thông báo hệ thống',
      width: '26rem',
      dismissableMask: true,
      data: {
        title: 'unused — chỉ minh hoạ data',
        body: 'Component này không khai báo dgDialogHeader / dgDialogFooter. Header lấy từ config.header, không có footer.',
      },
      inputs: { highlight: 'config-driven' },
    });
    ref.afterClosed$.subscribe(() => {
      this.serviceResult.set('(info closed)');
    });
  }
}
