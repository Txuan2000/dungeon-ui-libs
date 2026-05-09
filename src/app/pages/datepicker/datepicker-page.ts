import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DgDatepicker, DgDatepickerValue } from 'dungeon-ui';

@Component({
  selector: 'app-datepicker-page',
  imports: [DgDatepicker, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Datepicker</h1>
      <p>
        <code>&lt;dg-datepicker&gt;</code> — single / range, button bar, week numbers,
        min/max, disabled days/dates, body portal, ControlValueAccessor.
      </p>
    </header>

    <section>
      <h2>Cơ bản (single, popup)</h2>
      <p class="hint">
        Input có sẵn mask theo <code>format</code> (auto-insert dấu <code>/</code>) và lọc ký tự
        không phải số. Khi blur mà text không parse ra ngày hợp lệ → tự revert.
      </p>
      <div class="row stacked" style="max-width: 22rem">
        <label>
          <span class="hint">Plain — gõ thử "abc", "32/13/2024", chữ → bị lọc/revert</span>
          <dg-datepicker fluid [(value)]="basicDate" clearable />
        </label>
        <span class="hint">value: <strong>{{ basicDate() ? (asDate(basicDate())?.toLocaleDateString()) : '—' }}</strong></span>
      </div>
    </section>

    <section>
      <h2>keepInvalid (giữ text dù không hợp lệ)</h2>
      <p class="hint">
        Mặc định <code>keepInvalid=false</code> → blur revert. Bật <code>keepInvalid=true</code>
        để giữ nguyên text user gõ (ví dụ với form custom validators).
      </p>
      <div class="row stacked" style="max-width: 22rem">
        <dg-datepicker fluid [(value)]="keepInvalidDate" [keepInvalid]="true" clearable />
        <span class="hint">value: <strong>{{ keepInvalidDate() ? (asDate(keepInvalidDate())?.toLocaleDateString()) : '—' }}</strong></span>
      </div>
    </section>

    <section>
      <h2>Range</h2>
      <div class="row stacked" style="max-width: 26rem">
        <dg-datepicker
          fluid
          selectionMode="range"
          placeholder="dd/MM/yyyy – dd/MM/yyyy"
          [(value)]="rangeDate"
          clearable
          [showButtonBar]="true"
        />
        <span class="hint">value: <strong>{{ describeRange(rangeDate()) }}</strong></span>
      </div>
    </section>

    <section>
      <h2>Inline (always-visible calendar)</h2>
      <div class="row">
        <dg-datepicker
          inline
          [(value)]="inlineDate"
          [showWeek]="true"
          [showButtonBar]="true"
        />
      </div>
      <p class="hint">value: <strong>{{ inlineDate() ? (asDate(inlineDate())?.toLocaleDateString()) : '—' }}</strong></p>
    </section>

    <section>
      <h2>Min / Max + disabled days &amp; dates</h2>
      <p class="hint">
        <code>minDate</code> = hôm nay, <code>maxDate</code> = +30 ngày,
        <code>disabledDays</code> = thứ 7, CN, <code>disabledDates</code> = mai &amp; mốt.
      </p>
      <div class="row stacked" style="max-width: 22rem">
        <dg-datepicker
          fluid
          placeholder="Chỉ ngày làm việc, 30 ngày tới"
          [(value)]="constrainedDate"
          [minDate]="today"
          [maxDate]="thirtyDaysFromNow"
          [disabledDays]="[0, 6]"
          [disabledDates]="[tomorrow, dayAfter]"
          [showButtonBar]="true"
          clearable
        />
      </div>
    </section>

    <section>
      <h2>Reactive form (CVA), variant=filled, size=small</h2>
      <div class="row stacked" style="max-width: 22rem">
        <dg-datepicker
          fluid
          variant="filled"
          size="small"
          placeholder="Form control"
          [formControl]="formCtrl"
          [appendTo]="'body'"
          [showButtonBar]="true"
          clearable
        />
        <span class="hint">control.value: <strong>{{ formCtrl.value ? formCtrl.value.toLocaleDateString() : '—' }}</strong></span>
      </div>
    </section>

    <section>
      <h2>appendTo body (escape clipped container)</h2>
      <p class="hint">
        Trong container có <code>overflow: hidden</code>. Mặc định panel sẽ bị cắt.
        Dùng <code>appendTo="body"</code> để render panel trực tiếp vào <code>body</code>.
      </p>
      <div class="clipped-zone">
        <p class="clipped-label">overflow: hidden zone (height: 64px)</p>
        <div class="row">
          <dg-datepicker placeholder="appendTo=self (clipped)" [(value)]="portalDate1" />
          <dg-datepicker placeholder="appendTo=body" [(value)]="portalDate2" appendTo="body" />
        </div>
      </div>
    </section>
  `,
})
export class DatepickerPage {
  protected readonly today = new Date();
  protected readonly tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  })();
  protected readonly dayAfter = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  })();
  protected readonly thirtyDaysFromNow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  })();

  protected readonly basicDate = signal<DgDatepickerValue>(null);
  protected readonly keepInvalidDate = signal<DgDatepickerValue>(null);
  protected readonly rangeDate = signal<DgDatepickerValue>(null);
  protected readonly inlineDate = signal<DgDatepickerValue>(new Date());
  protected readonly constrainedDate = signal<DgDatepickerValue>(null);
  protected readonly portalDate1 = signal<DgDatepickerValue>(null);
  protected readonly portalDate2 = signal<DgDatepickerValue>(null);

  protected readonly formCtrl = new FormControl<Date | null>(null);

  protected asDate(v: DgDatepickerValue): Date | null {
    return v instanceof Date ? v : Array.isArray(v) ? v[0] : null;
  }

  protected describeRange(v: DgDatepickerValue): string {
    if (!Array.isArray(v)) return '—';
    const [start, end] = v;
    const a = start ? start.toLocaleDateString() : '?';
    const b = end ? end.toLocaleDateString() : '…';
    return `${a} → ${b}`;
  }
}
