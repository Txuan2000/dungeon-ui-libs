import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DgDropdown, DgDropdownOptionDef } from 'dungeon-ui';

@Component({
  selector: 'app-dropdown-page',
  imports: [DgDropdown, DgDropdownOptionDef, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Dropdown</h1>
      <p>Filter, body portal, panel-width policy, custom templates.</p>
    </header>

    <section>
      <h2>Basic</h2>
      <div class="row stacked" style="max-width: 24rem">
        <label>
          <span class="hint">Plain (no filter)</span>
          <dg-dropdown
            fluid
            placeholder="Chọn thành phố"
            [options]="cities"
            optionLabel="label"
            optionValue="value"
            optionDisabled="disabled"
            [(value)]="selectedCity"
            clearable
          />
        </label>

        <label>
          <span class="hint">With filter ({{ filterByLabel }})</span>
          <dg-dropdown
            fluid
            placeholder="Tìm thành phố"
            [options]="cities"
            optionLabel="label"
            optionValue="value"
            optionDisabled="disabled"
            [(value)]="selectedCity"
            filter
            filterPlaceholder="Gõ tên thành phố…"
            clearable
          />
        </label>

        <label>
          <span class="hint">Custom option template + selected display</span>
          <dg-dropdown
            fluid
            placeholder="Trạng thái"
            [options]="statuses"
            optionLabel="label"
            optionValue="value"
            [(value)]="selectedStatus"
          >
            <ng-template dgDropdownOption let-opt>
              <span style="font-size: 1.1em">{{ opt.icon }}</span>
              <span>{{ opt.label }}</span>
            </ng-template>
          </dg-dropdown>
        </label>

        <label>
          <span class="hint">Reactive form (CVA), variant=filled, size=small</span>
          <dg-dropdown
            fluid
            placeholder="Chọn"
            [options]="cities"
            optionLabel="label"
            optionValue="value"
            [formControl]="cityControl"
            variant="filled"
            size="small"
            filter
          />
          <span class="hint">control.value: <strong>{{ cityControl.value || '—' }}</strong></span>
        </label>
      </div>
    </section>

    <section>
      <h2>appendTo body (escapes clipped container)</h2>
      <p class="hint">
        Container có <code>overflow: hidden</code>. Dropdown thường sẽ bị cắt; với <code>appendTo="body"</code>
        panel được render trực tiếp vào <code>document.body</code> nên không bị cắt. Khi đóng dropdown panel
        tự động bị xoá khỏi body.
      </p>
      <div class="clipped-zone">
        <p class="clipped-label">overflow: hidden zone (height: 64px)</p>
        <div class="row">
          <dg-dropdown
            placeholder="appendTo=self (clipped)"
            [options]="cities"
            optionLabel="label"
            optionValue="value"
            [(value)]="selectedCity"
            filter
          />
          <dg-dropdown
            placeholder="appendTo=body (escapes)"
            [options]="cities"
            optionLabel="label"
            optionValue="value"
            [(value)]="selectedCity"
            filter
            appendTo="body"
          />
        </div>
      </div>
    </section>

    <section>
      <h2>panelWidth (host / auto / explicit)</h2>
      <p class="hint">
        Mặc định panel khớp width của host (<code>panelWidth="host"</code>). Với <code>"auto"</code>
        panel co theo nội dung — có thể rộng hơn host. Có thể set width tuỳ ý (vd <code>"18rem"</code>).
      </p>
      <div class="row stacked" style="max-width: 12rem">
        <label>
          <span class="hint">host (default) — panel = host width</span>
          <dg-dropdown fluid placeholder="host" [options]="cities" optionLabel="label" optionValue="value" filter />
        </label>
        <label>
          <span class="hint">auto — panel rộng hơn host (theo content)</span>
          <dg-dropdown fluid placeholder="auto" [options]="cities" optionLabel="label" optionValue="value" filter panelWidth="auto" appendTo="body" />
        </label>
        <label>
          <span class="hint">explicit "18rem"</span>
          <dg-dropdown fluid placeholder="18rem" [options]="cities" optionLabel="label" optionValue="value" filter panelWidth="18rem" appendTo="body" />
        </label>
      </div>
    </section>
  `,
})
export class DropdownPage {
  protected readonly cities = [
    { label: 'Hà Nội', value: 'HN' },
    { label: 'Hồ Chí Minh', value: 'HCM' },
    { label: 'Đà Nẵng', value: 'DN' },
    { label: 'Hải Phòng', value: 'HP' },
    { label: 'Cần Thơ', value: 'CT' },
    { label: 'Huế', value: 'HUE' },
    { label: 'Nha Trang', value: 'NT' },
    { label: 'Vũng Tàu', value: 'VT' },
    { label: 'Đà Lạt', value: 'DL' },
    { label: 'Phú Quốc', value: 'PQ', disabled: true },
  ];
  protected readonly selectedCity = signal<string | null>(null);
  protected readonly statuses = [
    { label: 'Active', value: 'active', icon: '🟢' },
    { label: 'Pending', value: 'pending', icon: '🟡' },
    { label: 'Error', value: 'error', icon: '🔴' },
    { label: 'Archived', value: 'archived', icon: '⚪' },
  ];
  protected readonly selectedStatus = signal<string | null>('pending');
  protected readonly cityControl = new FormControl<string | null>('HCM');
  protected readonly filterByLabel = 'lọc theo label';
}
