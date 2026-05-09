import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  DgAutocomplete,
  DgAutocompleteCompleteEvent,
  DgAutocompleteEmptyDef,
  DgAutocompleteOptionDef,
} from 'dungeon-ui';

interface City {
  label: string;
  value: string;
  region: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-autocomplete-page',
  imports: [DgAutocomplete, DgAutocompleteOptionDef, DgAutocompleteEmptyDef, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Autocomplete</h1>
      <p>Async query, dropdown trigger, custom item template, force-selection.</p>
    </header>

    <section>
      <h2>Basic — async suggestions</h2>
      <p class="hint">
        Component phát ra <code>(complete)</code> khi user gõ — bind suggestions theo query.
        Mặc định <code>minLength=1</code>, <code>delay=300ms</code>.
      </p>
      <div class="row stacked" style="max-width: 24rem">
        <label>
          <span class="hint">Tìm thành phố</span>
          <dg-autocomplete
            fluid
            placeholder="Bắt đầu gõ tên thành phố…"
            [suggestions]="filteredCities()"
            optionLabel="label"
            optionValue="value"
            optionDisabled="disabled"
            [(value)]="selectedCity"
            clearable
            (complete)="onCityComplete($event)"
            (selected)="onSelected($event)"
          />
          <span class="hint">value: <strong>{{ selectedCity() ?? '—' }}</strong></span>
        </label>
      </div>
    </section>

    <section>
      <h2>Dropdown trigger + custom item template</h2>
      <p class="hint">
        Bật <code>[dropdown]="true"</code> để hiển thị nút mở panel — click sẽ phát
        <code>(complete)</code> với query hiện tại (chuỗi rỗng nếu chưa gõ).
      </p>
      <div class="row stacked" style="max-width: 24rem">
        <label>
          <span class="hint">Custom template — hiển thị region</span>
          <dg-autocomplete
            fluid
            dropdown
            clearable
            placeholder="Chọn thành phố"
            [suggestions]="filteredCities()"
            optionLabel="label"
            optionValue="value"
            [(value)]="selectedCity"
            (complete)="onCityComplete($event)"
          >
            <ng-template dgAutocompleteOption let-opt let-q="query">
              <span style="flex:1">{{ opt.label }}</span>
              <span class="hint" style="font-size:0.75rem">{{ opt.region }}</span>
            </ng-template>
            <ng-template dgAutocompleteEmpty let-q="query">
              <div class="hint" style="padding:0.875rem 0.75rem; text-align:center">
                Không tìm thấy "{{ q }}"
              </div>
            </ng-template>
          </dg-autocomplete>
        </label>
      </div>
    </section>

    <section>
      <h2>forceSelection + reactive form</h2>
      <p class="hint">
        <code>forceSelection</code>: nếu user blur khi text không khớp suggestion nào, input
        và value sẽ được clear. Bind qua <code>FormControl</code> để xem giá trị.
      </p>
      <div class="row stacked" style="max-width: 24rem">
        <label>
          <span class="hint">filled, size=small, forceSelection</span>
          <dg-autocomplete
            fluid
            forceSelection
            dropdown
            variant="filled"
            size="small"
            placeholder="Phải chọn từ list"
            [suggestions]="filteredCities()"
            optionLabel="label"
            optionValue="value"
            [formControl]="cityControl"
            (complete)="onCityComplete($event)"
          />
          <span class="hint">control.value: <strong>{{ cityControl.value || '—' }}</strong></span>
        </label>
      </div>
    </section>

    <section>
      <h2>appendTo body (escapes clipped container)</h2>
      <div class="clipped-zone">
        <p class="clipped-label">overflow: hidden zone (height: 64px)</p>
        <div class="row">
          <dg-autocomplete
            placeholder="appendTo=self (clipped)"
            [suggestions]="filteredCities()"
            optionLabel="label"
            optionValue="value"
            [(value)]="selectedCity"
            dropdown
            (complete)="onCityComplete($event)"
          />
          <dg-autocomplete
            placeholder="appendTo=body"
            [suggestions]="filteredCities()"
            optionLabel="label"
            optionValue="value"
            [(value)]="selectedCity"
            dropdown
            appendTo="body"
            (complete)="onCityComplete($event)"
          />
        </div>
      </div>
    </section>
  `,
})
export class AutocompletePage {
  private readonly cities: City[] = [
    { label: 'Hà Nội', value: 'HN', region: 'Bắc' },
    { label: 'Hải Phòng', value: 'HP', region: 'Bắc' },
    { label: 'Đà Nẵng', value: 'DN', region: 'Trung' },
    { label: 'Huế', value: 'HUE', region: 'Trung' },
    { label: 'Nha Trang', value: 'NT', region: 'Trung' },
    { label: 'Hồ Chí Minh', value: 'HCM', region: 'Nam' },
    { label: 'Cần Thơ', value: 'CT', region: 'Nam' },
    { label: 'Vũng Tàu', value: 'VT', region: 'Nam' },
    { label: 'Đà Lạt', value: 'DL', region: 'Trung' },
    { label: 'Phú Quốc', value: 'PQ', region: 'Nam', disabled: true },
  ];

  protected readonly filteredCities = signal<City[]>(this.cities);
  protected readonly selectedCity = signal<string | null>(null);
  protected readonly cityControl = new FormControl<string | null>(null);

  protected onCityComplete(event: DgAutocompleteCompleteEvent): void {
    const q = event.query.trim().toLowerCase();
    if (!q) {
      this.filteredCities.set(this.cities);
      return;
    }
    this.filteredCities.set(
      this.cities.filter((c) => c.label.toLowerCase().includes(q) || c.region.toLowerCase().includes(q)),
    );
  }

  protected onSelected(opt: City): void {
    // Hook for the demo — could fire analytics, log, etc.
    void opt;
  }
}
