import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DgInputNumber } from 'dungeon-ui';

@Component({
  selector: 'app-input-number-page',
  imports: [DgInputNumber, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Input Number</h1>
      <p>
        <code>&lt;dg-input-number&gt;</code> — số có locale grouping, prefix/suffix, currency,
        min/max, step, spinner buttons, ControlValueAccessor.
      </p>
    </header>

    <section>
      <h2>Cơ bản (decimal)</h2>
      <div class="row stacked" style="max-width: 22rem">
        <label>
          <span class="hint">Plain number, locale grouping (en-US)</span>
          <dg-input-number fluid placeholder="0" [(value)]="basic" locale="en-US" showClear />
        </label>
        <span class="hint">value: <strong>{{ basic() ?? '—' }}</strong></span>
      </div>
    </section>

    <section>
      <h2>Currency / Percent / Custom prefix-suffix</h2>
      <div class="row stacked" style="max-width: 26rem">
        <label>
          <span class="hint">USD</span>
          <dg-input-number fluid mode="currency" currency="USD" locale="en-US" [(value)]="usd" />
        </label>
        <label>
          <span class="hint">VND</span>
          <dg-input-number fluid mode="currency" currency="VND" locale="vi-VN" [(value)]="vnd" />
        </label>
        <label>
          <span class="hint">Percent (0.25 → 25%)</span>
          <dg-input-number fluid mode="percent" locale="en-US" [maxFractionDigits]="2" [(value)]="pct" />
        </label>
        <label>
          <span class="hint">Custom prefix &amp; suffix</span>
          <dg-input-number
            fluid
            prefix="≈ "
            suffix=" kg"
            [maxFractionDigits]="3"
            [(value)]="weight"
          />
        </label>
      </div>
    </section>

    <section>
      <h2>Min / Max / Step (Arrow keys + Home/End)</h2>
      <p class="hint">
        <code>min=0, max=100, step=5</code>. Arrow Up/Down để tăng giảm, Home → min, End → max.
      </p>
      <div class="row stacked" style="max-width: 22rem">
        <dg-input-number fluid [min]="0" [max]="100" [step]="5" [(value)]="bounded" />
        <span class="hint">value: <strong>{{ bounded() ?? '—' }}</strong></span>
      </div>
    </section>

    <section>
      <h2>Spinner buttons — stacked</h2>
      <div class="row stacked" style="max-width: 14rem">
        <dg-input-number
          fluid
          [showButtons]="true"
          buttonLayout="stacked"
          [min]="0"
          [max]="99"
          [(value)]="stackedNum"
        />
      </div>
    </section>

    <section>
      <h2>Spinner buttons — horizontal (± xung quanh)</h2>
      <div class="row stacked" style="max-width: 14rem">
        <dg-input-number
          fluid
          [showButtons]="true"
          buttonLayout="horizontal"
          [min]="-10"
          [max]="10"
          [(value)]="horizontalNum"
        />
      </div>
    </section>

    <section>
      <h2>Sizes &amp; variants</h2>
      <div class="row stacked" style="max-width: 22rem">
        <dg-input-number placeholder="Small" size="small" [(value)]="size1" fluid />
        <dg-input-number placeholder="Normal" [(value)]="size2" fluid />
        <dg-input-number placeholder="Large" size="large" [(value)]="size3" fluid />
        <dg-input-number placeholder="Filled variant" variant="filled" [(value)]="size4" fluid />
        <dg-input-number placeholder="Invalid" invalid [(value)]="size5" fluid />
        <dg-input-number placeholder="Disabled" disabled [value]="42" fluid />
      </div>
    </section>

    <section>
      <h2>Reactive form (CVA)</h2>
      <div class="row stacked" style="max-width: 22rem">
        <dg-input-number
          fluid
          mode="currency"
          currency="VND"
          locale="vi-VN"
          [formControl]="priceCtrl"
          [invalid]="priceCtrl.touched && priceCtrl.invalid"
          [showButtons]="true"
          [min]="0"
          [max]="100000000"
          [step]="1000"
          [showClear]="true"
        />
        <span class="hint" [class.hint--error]="priceCtrl.touched && priceCtrl.invalid">
          @if (priceCtrl.touched && priceCtrl.invalid) {
            Bắt buộc, tối thiểu 10,000 VND.
          } @else {
            control.value: <strong>{{ priceCtrl.value ?? '—' }}</strong>
          }
        </span>
      </div>
    </section>
  `,
})
export class InputNumberPage {
  protected readonly basic = signal<number | null>(null);
  protected readonly usd = signal<number | null>(1234.56);
  protected readonly vnd = signal<number | null>(2_500_000);
  protected readonly pct = signal<number | null>(0.25);
  protected readonly weight = signal<number | null>(72.5);
  protected readonly bounded = signal<number | null>(50);
  protected readonly stackedNum = signal<number | null>(0);
  protected readonly horizontalNum = signal<number | null>(0);
  protected readonly size1 = signal<number | null>(null);
  protected readonly size2 = signal<number | null>(null);
  protected readonly size3 = signal<number | null>(null);
  protected readonly size4 = signal<number | null>(null);
  protected readonly size5 = signal<number | null>(null);

  protected readonly priceCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(10_000)],
  });
}
