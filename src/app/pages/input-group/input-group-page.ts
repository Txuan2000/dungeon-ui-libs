import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  DgButton,
  DgDatepicker,
  DgDatepickerValue,
  DgDropdown,
  DgInputGroup,
  DgInputGroupAddon,
  DgInputMask,
  DgInputNumber,
  DgInputText,
} from 'dungeon-ui';

@Component({
  selector: 'app-input-group-page',
  imports: [
    DgInputGroup,
    DgInputGroupAddon,
    DgInputText,
    DgInputNumber,
    DgInputMask,
    DgDropdown,
    DgDatepicker,
    DgButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Input Group</h1>
      <p>
        <code>&lt;dg-input-group&gt;</code> + <code>&lt;dg-input-group-addon&gt;</code> —
        ghép input với icon / chữ / button thành một khối liền viền. Cộng được với mọi
        input của dungeon-ui (text / number / mask / dropdown / datepicker / button).
      </p>
    </header>

    <section>
      <h2>Cơ bản — addon hai bên</h2>
      <div class="row stacked" style="max-width: 24rem">
        <dg-input-group fluid>
          <dg-input-group-addon>$</dg-input-group-addon>
          <dg-input-text fluid placeholder="0.00" />
          <dg-input-group-addon>.00</dg-input-group-addon>
        </dg-input-group>

        <dg-input-group fluid>
          <dg-input-group-addon>www.</dg-input-group-addon>
          <dg-input-text fluid placeholder="example" />
          <dg-input-group-addon>.com</dg-input-group-addon>
        </dg-input-group>

        <dg-input-group fluid>
          <dg-input-group-addon>@</dg-input-group-addon>
          <dg-input-text fluid placeholder="username" />
        </dg-input-group>

        <dg-input-group fluid>
          <dg-input-text fluid placeholder="search…" />
          <dg-input-group-addon>🔍</dg-input-group-addon>
        </dg-input-group>
      </div>
    </section>

    <section>
      <h2>Với button — search field</h2>
      <div class="row stacked" style="max-width: 26rem">
        <dg-input-group fluid>
          <dg-input-text fluid [placeholder]="'Tìm kiếm'" [(value)]="query" />
          <dg-button label="Search" severity="primary" (clicked)="searchClicked.set(query() ?? '')" />
        </dg-input-group>
        <span class="hint">last search: <strong>{{ searchClicked() || '—' }}</strong></span>
      </div>
    </section>

    <section>
      <h2>Số tiền — addon currency + input-number</h2>
      <div class="row stacked" style="max-width: 26rem">
        <dg-input-group fluid>
          <dg-input-group-addon>VND</dg-input-group-addon>
          <dg-input-number fluid locale="vi-VN" [(value)]="amount" />
        </dg-input-group>

        <dg-input-group fluid>
          <dg-input-number fluid locale="en-US" [maxFractionDigits]="2" [(value)]="rate" />
          <dg-input-group-addon>%</dg-input-group-addon>
        </dg-input-group>
      </div>
    </section>

    <section>
      <h2>Date / dropdown / mask đều ghép được</h2>
      <div class="row stacked" style="max-width: 28rem">
        <dg-input-group fluid>
          <dg-input-group-addon>📅</dg-input-group-addon>
          <dg-datepicker fluid [(value)]="bookDate" />
        </dg-input-group>

        <dg-input-group fluid>
          <dg-input-group-addon>+84</dg-input-group-addon>
          <dg-input-text fluid dgInputMask="999 999 999" placeholder="901 234 567" />
        </dg-input-group>

        <dg-input-group fluid>
          <dg-dropdown fluid [options]="countries" optionLabel="label" optionValue="value" [(value)]="country" />
          <dg-input-text fluid placeholder="city" />
        </dg-input-group>
      </div>
    </section>

    <section>
      <h2>Input-only / addon-only / 3+ phần tử</h2>
      <div class="row stacked" style="max-width: 26rem">
        <dg-input-group fluid>
          <dg-button label="−" variant="outlined" />
          <dg-input-number fluid [showButtons]="false" [(value)]="counter" />
          <dg-button label="+" variant="outlined" />
        </dg-input-group>

        <dg-input-group fluid>
          <dg-input-group-addon>http://</dg-input-group-addon>
          <dg-input-text fluid placeholder="host" />
          <dg-input-group-addon>:</dg-input-group-addon>
          <dg-input-number fluid [(value)]="port" placeholder="8080" />
        </dg-input-group>
      </div>
    </section>
  `,
})
export class InputGroupPage {
  protected readonly query = signal<string | null>(null);
  protected readonly searchClicked = signal('');
  protected readonly amount = signal<number | null>(2_500_000);
  protected readonly rate = signal<number | null>(7.5);
  protected readonly bookDate = signal<DgDatepickerValue>(null);
  protected readonly country = signal<string | null>('VN');
  protected readonly counter = signal<number | null>(0);
  protected readonly port = signal<number | null>(8080);

  protected readonly countries = [
    { label: 'VN', value: 'VN' },
    { label: 'US', value: 'US' },
    { label: 'JP', value: 'JP' },
    { label: 'KR', value: 'KR' },
  ];
}
