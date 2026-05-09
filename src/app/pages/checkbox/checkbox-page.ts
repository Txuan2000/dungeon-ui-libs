import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DgCheckbox, DgCheckboxIconDef } from 'dungeon-ui';

@Component({
  selector: 'app-checkbox-page',
  imports: [DgCheckbox, DgCheckboxIconDef, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Checkbox</h1>
      <p>Binary &amp; multi modes, indeterminate, custom icon, sizes, reactive form.</p>
    </header>

    <section>
      <h2>Binary (default)</h2>
      <p class="hint">
        Mặc định <code>binary=true</code> — bound value là boolean (hoặc <code>trueValue</code>/<code>falseValue</code> nếu custom).
      </p>
      <div class="row stacked" style="max-width: 24rem">
        <dg-checkbox [(value)]="agree" label="I agree to the terms" />
        <span class="hint">value: <strong>{{ agree() }}</strong></span>

        <dg-checkbox [(value)]="answer" trueValue="Y" falseValue="N" label="Custom trueValue / falseValue (Y / N)" />
        <span class="hint">value: <strong>{{ answer() }}</strong></span>

        <dg-checkbox [(value)]="agree" disabled label="Disabled (checked-state mirrors above)" />
        <dg-checkbox [(value)]="agree" readonly label="Readonly (cannot toggle)" />
        <dg-checkbox [(value)]="agree" invalid label="Invalid (red border)" />
      </div>
    </section>

    <section>
      <h2>Multi (group) mode</h2>
      <p class="hint">
        <code>binary=false</code>: bound value là array; mỗi checkbox đóng góp <code>checkboxValue</code> khi checked.
      </p>
      <div class="row stacked" style="max-width: 24rem">
        @for (city of cities; track city) {
          <dg-checkbox
            [binary]="false"
            [checkboxValue]="city"
            [(value)]="selectedCities"
            [label]="city"
          />
        }
        <span class="hint">selectedCities: <strong>{{ selectedCitiesText() }}</strong></span>
      </div>
    </section>

    <section>
      <h2>Indeterminate (parent of a tree)</h2>
      <p class="hint">
        Click vào parent → toggle all. Khi children mixed → parent ở indeterminate ("mixed", icon "−").
      </p>
      <div class="row stacked" style="max-width: 24rem">
        <dg-checkbox
          [value]="parentChecked()"
          [indeterminate]="parentIndeterminate()"
          (checkboxChange)="toggleAllChildren($event.checked)"
          label="Select all permissions"
        />
        <div style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.25rem">
          @for (perm of permissions(); track perm.id) {
            <dg-checkbox [value]="perm.checked" (checkboxChange)="setPermission(perm.id, $event.checked)" [label]="perm.label" size="small" />
          }
        </div>
      </div>
    </section>

    <section>
      <h2>Sizes &amp; variants</h2>
      <div class="row stacked" style="max-width: 24rem">
        <dg-checkbox [(value)]="sized" size="small" label="Small" />
        <dg-checkbox [(value)]="sized" size="normal" label="Normal" />
        <dg-checkbox [(value)]="sized" size="large" label="Large" />
        <dg-checkbox [(value)]="sized" variant="filled" label="Variant: filled" />
      </div>
    </section>

    <section>
      <h2>Custom icon (template)</h2>
      <p class="hint">
        Project <code>&lt;ng-template dgCheckboxIcon let-c="checked" let-i="indeterminate"&gt;</code> để tự render dấu check.
      </p>
      <div class="row stacked" style="max-width: 24rem">
        <dg-checkbox [(value)]="emoji" label="Custom emoji icons">
          <ng-template dgCheckboxIcon let-c="checked" let-i="indeterminate">
            @if (i) {
              <span style="font-size: 0.9em">⏳</span>
            } @else if (c) {
              <span style="font-size: 0.9em">🌟</span>
            }
          </ng-template>
        </dg-checkbox>
      </div>
    </section>

    <section>
      <h2>Reactive form (CVA)</h2>
      <div class="row stacked" style="max-width: 24rem">
        <dg-checkbox [formControl]="newsletterCtrl" label="Subscribe to newsletter" />
        <span class="hint">control.value: <strong>{{ newsletterCtrl.value }}</strong></span>
      </div>
    </section>
  `,
})
export class CheckboxPage {
  protected readonly agree = signal(false);
  protected readonly answer = signal<'Y' | 'N'>('N');
  protected readonly sized = signal(true);
  protected readonly emoji = signal(true);

  protected readonly cities = ['Hà Nội', 'Đà Nẵng', 'Hồ Chí Minh', 'Cần Thơ'];
  protected readonly selectedCities = signal<string[]>(['Hà Nội']);
  protected readonly selectedCitiesText = computed(() =>
    this.selectedCities().length ? this.selectedCities().join(', ') : '—',
  );

  protected readonly permissions = signal<{ id: string; label: string; checked: boolean }[]>([
    { id: 'read', label: 'Read', checked: true },
    { id: 'write', label: 'Write', checked: false },
    { id: 'delete', label: 'Delete', checked: false },
  ]);
  protected readonly parentChecked = computed(() => this.permissions().every((p) => p.checked));
  protected readonly parentIndeterminate = computed(() => {
    const list = this.permissions();
    const some = list.some((p) => p.checked);
    const all = list.every((p) => p.checked);
    return some && !all;
  });

  protected readonly newsletterCtrl = new FormControl<boolean>(true);

  protected toggleAllChildren(next: boolean): void {
    this.permissions.update((list) => list.map((p) => ({ ...p, checked: next })));
  }

  protected setPermission(id: string, checked: boolean): void {
    this.permissions.update((list) => list.map((p) => (p.id === id ? { ...p, checked } : p)));
  }
}
