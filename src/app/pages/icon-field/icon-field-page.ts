import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  DgDatepicker,
  DgDatepickerValue,
  DgDropdown,
  DgIconField,
  DgInputIcon,
  DgInputNumber,
  DgInputText,
} from 'dungeon-ui';

@Component({
  selector: 'app-icon-field-page',
  imports: [DgIconField, DgInputIcon, DgInputText, DgInputNumber, DgDropdown, DgDatepicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Icon Field</h1>
      <p>
        <code>&lt;dg-icon-field&gt;</code> + <code>&lt;dg-input-icon&gt;</code> — overlay icon
        bên trái hoặc phải input. Khác với <code>input-group</code>: không có addon viền
        riêng, icon nằm trong khung input, text auto reserve padding.
      </p>
    </header>

    <section>
      <h2>Cơ bản — search field</h2>
      <div class="row stacked" style="max-width: 22rem">
        <dg-icon-field iconPosition="left" fluid>
          <dg-input-icon>🔍</dg-input-icon>
          <dg-input-text fluid placeholder="Tìm kiếm…" [(value)]="search" />
        </dg-icon-field>
        <span class="hint">value: <strong>{{ search() || '—' }}</strong></span>
      </div>
    </section>

    <section>
      <h2>Icon bên phải</h2>
      <div class="row stacked" style="max-width: 22rem">
        <dg-icon-field iconPosition="right" fluid>
          <dg-input-icon>📧</dg-input-icon>
          <dg-input-text fluid placeholder="email@example.com" type="email" />
        </dg-icon-field>

        <dg-icon-field iconPosition="right" fluid>
          <dg-input-icon>👤</dg-input-icon>
          <dg-input-text fluid placeholder="Username" />
        </dg-icon-field>
      </div>
    </section>

    <section>
      <h2>Hỗn hợp icon — calendar / lock / phone</h2>
      <div class="row stacked" style="max-width: 22rem">
        <dg-icon-field iconPosition="left" fluid>
          <dg-input-icon>🔒</dg-input-icon>
          <dg-input-text fluid type="password" placeholder="Mật khẩu" />
        </dg-icon-field>

        <dg-icon-field iconPosition="left" fluid>
          <dg-input-icon>📞</dg-input-icon>
          <dg-input-text fluid type="tel" placeholder="0901 234 567" />
        </dg-icon-field>

        <dg-icon-field iconPosition="left" fluid>
          <dg-input-icon>📅</dg-input-icon>
          <dg-datepicker fluid placeholder="Chọn ngày" [(value)]="date" />
        </dg-icon-field>
      </div>
    </section>

    <section>
      <h2>Hoạt động được với input-number / dropdown</h2>
      <div class="row stacked" style="max-width: 22rem">
        <dg-icon-field iconPosition="left" fluid>
          <dg-input-icon>$</dg-input-icon>
          <dg-input-number fluid [(value)]="amount" locale="en-US" placeholder="0.00" />
        </dg-icon-field>

        <dg-icon-field iconPosition="right" fluid>
          <dg-input-icon>🌐</dg-input-icon>
          <dg-dropdown fluid [options]="cities" optionLabel="label" optionValue="value" [(value)]="city" placeholder="City" />
        </dg-icon-field>
      </div>
    </section>

    <section>
      <h2>Sizes (icon tự căn giữa theo chiều cao)</h2>
      <div class="row stacked" style="max-width: 22rem">
        <dg-icon-field iconPosition="left" fluid>
          <dg-input-icon>🔍</dg-input-icon>
          <dg-input-text fluid size="small" placeholder="Small" />
        </dg-icon-field>

        <dg-icon-field iconPosition="left" fluid>
          <dg-input-icon>🔍</dg-input-icon>
          <dg-input-text fluid placeholder="Normal" />
        </dg-icon-field>

        <dg-icon-field iconPosition="left" fluid>
          <dg-input-icon>🔍</dg-input-icon>
          <dg-input-text fluid size="large" placeholder="Large" />
        </dg-icon-field>
      </div>
    </section>
  `,
})
export class IconFieldPage {
  protected readonly search = signal<string | null>(null);
  protected readonly date = signal<DgDatepickerValue>(null);
  protected readonly amount = signal<number | null>(null);
  protected readonly city = signal<string | null>(null);

  protected readonly cities = [
    { label: 'Hà Nội', value: 'HN' },
    { label: 'Hồ Chí Minh', value: 'HCM' },
    { label: 'Đà Nẵng', value: 'DN' },
  ];
}
