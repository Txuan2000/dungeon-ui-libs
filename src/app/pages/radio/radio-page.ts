import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DgRadio, DgRadioIconDef } from 'dungeon-ui';

@Component({
  selector: 'app-radio-page',
  imports: [DgRadio, DgRadioIconDef, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Radio</h1>
      <p>Single-select radio with shared group binding, sizes, custom dot, reactive form.</p>
    </header>

    <section>
      <h2>Cơ bản — group qua <code>[(value)]</code></h2>
      <p class="hint">
        Mọi radio cùng <code>name</code> + cùng nguồn <code>[(value)]</code> sẽ tự đồng bộ — không cần wrapper component.
      </p>
      <div class="row stacked" style="max-width: 24rem">
        @for (city of cities; track city) {
          <dg-radio name="city" [radioValue]="city" [(value)]="selectedCity" [label]="city" />
        }
        <span class="hint">selectedCity: <strong>{{ selectedCity() ?? '—' }}</strong></span>
      </div>
    </section>

    <section>
      <h2>Inline (horizontal)</h2>
      <div class="row" style="gap: 1rem; flex-wrap: wrap">
        @for (s of sizes; track s) {
          <dg-radio name="sized" [radioValue]="s" [(value)]="size" [label]="s" />
        }
      </div>
      <span class="hint">size: <strong>{{ size() }}</strong></span>
    </section>

    <section>
      <h2>States — disabled / readonly / invalid</h2>
      <div class="row stacked" style="max-width: 24rem">
        <dg-radio name="state" radioValue="A" [(value)]="state" label="Bình thường (A)" />
        <dg-radio name="state" radioValue="B" [(value)]="state" disabled label="Disabled (B)" />
        <dg-radio name="state" radioValue="C" [(value)]="state" readonly label="Readonly (C)" />
        <dg-radio name="state" radioValue="D" [(value)]="state" invalid label="Invalid (D)" />
      </div>
      <span class="hint">state: <strong>{{ state() }}</strong></span>
    </section>

    <section>
      <h2>Sizes &amp; variants</h2>
      <div class="row stacked" style="max-width: 24rem">
        <dg-radio name="picked-size" radioValue="small" [(value)]="pickedSize" size="small" label="Small" />
        <dg-radio name="picked-size" radioValue="normal" [(value)]="pickedSize" size="normal" label="Normal" />
        <dg-radio name="picked-size" radioValue="large" [(value)]="pickedSize" size="large" label="Large" />
        <dg-radio name="picked-size" radioValue="filled" [(value)]="pickedSize" variant="filled" label="Variant: filled" />
      </div>
    </section>

    <section>
      <h2>Custom icon (template)</h2>
      <p class="hint">
        Project <code>&lt;ng-template dgRadioIcon let-c="checked"&gt;</code> để thay dot mặc định bằng icon riêng.
      </p>
      <div class="row stacked" style="max-width: 24rem">
        @for (fruit of fruits; track fruit) {
          <dg-radio name="fruit" [radioValue]="fruit" [(value)]="selectedFruit" [label]="fruit">
            <ng-template dgRadioIcon let-c="checked">
              @if (c) {
                <span style="font-size: 0.75rem">⭐</span>
              }
            </ng-template>
          </dg-radio>
        }
        <span class="hint">selectedFruit: <strong>{{ selectedFruit() ?? '—' }}</strong></span>
      </div>
    </section>

    <section>
      <h2>Reactive form (CVA)</h2>
      <div class="row stacked" style="max-width: 24rem">
        @for (plan of plans; track plan) {
          <dg-radio name="plan" [radioValue]="plan" [formControl]="planCtrl" [label]="plan" />
        }
        <span class="hint">control.value: <strong>{{ planCtrl.value ?? '—' }}</strong></span>
      </div>
    </section>
  `,
})
export class RadioPage {
  protected readonly cities = ['Hà Nội', 'Đà Nẵng', 'Hồ Chí Minh', 'Cần Thơ'];
  protected readonly selectedCity = signal<string | null>('Hà Nội');

  protected readonly sizes = ['XS', 'S', 'M', 'L', 'XL'];
  protected readonly size = signal<string>('M');

  protected readonly state = signal<string>('A');

  protected readonly pickedSize = signal<string>('normal');

  protected readonly fruits = ['🍎 Apple', '🍌 Banana', '🍇 Grape'];
  protected readonly selectedFruit = signal<string | null>(null);

  protected readonly plans = ['Free', 'Pro', 'Enterprise'];
  protected readonly planCtrl = new FormControl<string>('Pro');
}
