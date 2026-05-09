import { ChangeDetectionStrategy, Component, computed, effect, inject, output, signal } from '@angular/core';
import { DgButton, DgDialogFooterDef, DgDialogRef, DgInputText } from 'dungeon-ui';

export interface DemoFormResult {
  name: string;
  email: string;
}

@Component({
  selector: 'demo-form',
  imports: [DgButton, DgInputText, DgDialogFooterDef],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      <label>Name</label>
      <dg-input-text fluid placeholder="Your full name" [(value)]="name" />
    </div>
    <div class="field">
      <label>Email</label>
      <dg-input-text fluid type="email" placeholder="you@example.com" [(value)]="email" [invalid]="!isValid()" />
    </div>

    <ng-template dgDialogFooter>
      <dg-button label="Cancel" variant="text" (clicked)="cancel()" />
      <dg-button label="Save" severity="primary" [disabled]="!isValid()" (clicked)="save()" />
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 22rem;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-bottom: 0.875rem;

        label {
          font-size: 0.8125rem;
          color: #475569;
          font-weight: 500;
        }
      }
    `,
  ],
})
export class DemoForm {
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly isValid = computed(() => this.name().trim().length > 0 && /.+@.+\..+/.test(this.email()));

  readonly draftChanged = output<DemoFormResult>();
  readonly submitted = output<DemoFormResult>();

  private readonly dialogRef = inject<DgDialogRef<DemoFormResult, DemoForm>>(DgDialogRef);

  constructor() {
    effect(() => {
      this.draftChanged.emit({ name: this.name(), email: this.email() });
    });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }

  protected save(): void {
    if (!this.isValid()) return;
    const value: DemoFormResult = { name: this.name().trim(), email: this.email().trim() };
    this.submitted.emit(value);
    this.dialogRef.close(value);
  }
}
