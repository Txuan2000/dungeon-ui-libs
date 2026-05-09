import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DgInputMask } from '../input-mask';
import { DgDatepickerCellContext, DgDatepickerDateDef } from './datepicker-defs';

export type DgDatepickerSize = 'small' | 'normal' | 'large';
export type DgDatepickerVariant = 'outlined' | 'filled';
export type DgDatepickerSelectionMode = 'single' | 'range';

/**
 * For range mode: tuple `[start, end]`. `end` may be `null` while the user is
 * picking the second date. For single mode: a plain `Date`.
 */
export type DgDatepickerValue = Date | [Date, Date | null] | null;

interface CellModel {
  date: Date;
  current: boolean;
  today: boolean;
  disabled: boolean;
}

@Component({
  selector: 'dg-datepicker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, DgInputMask],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DgDatepicker),
      multi: true,
    },
  ],
  template: `
    @if (!inline()) {
      <div
        class="dg-datepicker__field"
        [attr.data-size]="size()"
        [attr.data-variant]="variant()"
        [attr.data-invalid]="invalid() || null"
        [attr.data-disabled]="isDisabled() || null"
        [attr.data-fluid]="fluid() || null"
      >
        <input
          #input
          type="text"
          class="dg-datepicker__input"
          autocomplete="off"
          [dgInputMask]="mask()"
          [readonly]="readonlyInput()"
          [disabled]="isDisabled()"
          [placeholder]="effectivePlaceholder()"
          [value]="displayValue()"
          [attr.aria-invalid]="invalid() || null"
          [attr.aria-haspopup]="'dialog'"
          [attr.aria-expanded]="open()"
          (input)="onTextInput($event)"
          (focus)="onInputFocus()"
          (blur)="onInputBlur($event)"
          (keydown)="onInputKeyDown($event)"
        />
        @if (clearable() && hasValue() && !isDisabled()) {
          <button
            type="button"
            class="dg-datepicker__clear"
            aria-label="Clear date"
            (click)="clear($event)"
          >×</button>
        }
        <button
          type="button"
          class="dg-datepicker__trigger"
          [disabled]="isDisabled()"
          [attr.aria-label]="'Open calendar'"
          (click)="toggle()"
        >
          <span aria-hidden="true">📅</span>
        </button>
      </div>
    }

    @if (open() || inline()) {
      <div
        #panel
        class="dg-datepicker__panel"
        [class.dg-datepicker__panel--inline]="inline()"
        role="dialog"
        aria-label="Calendar"
        (click)="$event.stopPropagation()"
      >
        <header class="dg-datepicker__cal-header">
          <button
            type="button"
            class="dg-datepicker__nav"
            [attr.aria-label]="prevAriaLabel()"
            (click)="prev()"
          >‹</button>
          <div class="dg-datepicker__title">
            @if (view() === 'date') {
              <button
                type="button"
                class="dg-datepicker__title-btn dg-datepicker__title-month"
                aria-label="Select month"
                (click)="setView('month')"
              >{{ monthLabel() }}</button>
              <button
                type="button"
                class="dg-datepicker__title-btn dg-datepicker__title-year"
                aria-label="Select year"
                (click)="setView('year')"
              >{{ yearLabel() }}</button>
            } @else if (view() === 'month') {
              <button
                type="button"
                class="dg-datepicker__title-btn dg-datepicker__title-year"
                aria-label="Select year"
                (click)="setView('year')"
              >{{ yearLabel() }}</button>
            } @else {
              <span class="dg-datepicker__title-range">{{ yearRangeLabel() }}</span>
            }
          </div>
          <button
            type="button"
            class="dg-datepicker__nav"
            [attr.aria-label]="nextAriaLabel()"
            (click)="next()"
          >›</button>
        </header>

        @if (view() === 'month') {
          <div class="dg-datepicker__picker-grid" role="grid">
            @for (m of monthCells(); track m.month) {
              <button
                type="button"
                class="dg-datepicker__picker-cell"
                role="gridcell"
                [class.dg-datepicker__picker-cell--selected]="m.selected"
                [class.dg-datepicker__picker-cell--today]="m.today"
                [class.dg-datepicker__picker-cell--disabled]="m.disabled"
                [attr.aria-selected]="m.selected"
                [attr.aria-disabled]="m.disabled || null"
                [disabled]="m.disabled"
                (click)="selectMonth(m.month)"
              >{{ m.label }}</button>
            }
          </div>
        } @else if (view() === 'year') {
          <div class="dg-datepicker__picker-grid" role="grid">
            @for (y of yearCells(); track y.year) {
              <button
                type="button"
                class="dg-datepicker__picker-cell"
                role="gridcell"
                [class.dg-datepicker__picker-cell--selected]="y.selected"
                [class.dg-datepicker__picker-cell--today]="y.today"
                [class.dg-datepicker__picker-cell--disabled]="y.disabled"
                [attr.aria-selected]="y.selected"
                [attr.aria-disabled]="y.disabled || null"
                [disabled]="y.disabled"
                (click)="selectYear(y.year)"
              >{{ y.year }}</button>
            }
          </div>
        } @else {
        <table class="dg-datepicker__grid" role="grid">
          <thead>
            <tr>
              @if (showWeek()) { <th class="dg-datepicker__week-head">{{ weekLabel() }}</th> }
              @for (d of weekdayLabels(); track d.iso) {
                <th [attr.aria-label]="d.long">{{ d.short }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (week of grid(); track week[0].date.getTime()) {
              <tr>
                @if (showWeek()) {
                  <td class="dg-datepicker__week-num">{{ weekNumber(week[0].date) }}</td>
                }
                @for (cell of week; track cell.date.getTime()) {
                  @if (dateTpl(); as tmpl) {
                    <td
                      class="dg-datepicker__cell"
                      role="gridcell"
                      [class.dg-datepicker__cell--other]="!cell.current"
                      [class.dg-datepicker__cell--today]="cell.today"
                      [class.dg-datepicker__cell--selected]="isSelected(cell.date)"
                      [class.dg-datepicker__cell--in-range]="isInRange(cell.date)"
                      [class.dg-datepicker__cell--range-start]="isRangeStart(cell.date)"
                      [class.dg-datepicker__cell--range-end]="isRangeEnd(cell.date)"
                      [class.dg-datepicker__cell--disabled]="cell.disabled"
                      [attr.aria-selected]="isSelected(cell.date)"
                      [attr.aria-disabled]="cell.disabled || null"
                      (click)="selectCell(cell)"
                    >
                      <ng-container
                        *ngTemplateOutlet="
                          tmpl.templateRef;
                          context: {
                            $implicit: cell.date,
                            current: cell.current,
                            today: cell.today,
                            selected: isSelected(cell.date),
                            disabled: cell.disabled
                          }
                        "
                      />
                    </td>
                  } @else {
                    <td
                      class="dg-datepicker__cell"
                      role="gridcell"
                      [class.dg-datepicker__cell--other]="!cell.current"
                      [class.dg-datepicker__cell--today]="cell.today"
                      [class.dg-datepicker__cell--selected]="isSelected(cell.date)"
                      [class.dg-datepicker__cell--in-range]="isInRange(cell.date)"
                      [class.dg-datepicker__cell--range-start]="isRangeStart(cell.date)"
                      [class.dg-datepicker__cell--range-end]="isRangeEnd(cell.date)"
                      [class.dg-datepicker__cell--disabled]="cell.disabled"
                      [attr.aria-selected]="isSelected(cell.date)"
                      [attr.aria-disabled]="cell.disabled || null"
                      (click)="selectCell(cell)"
                    >
                      <span class="dg-datepicker__cell-num">{{ cell.date.getDate() }}</span>
                    </td>
                  }
                }
              </tr>
            }
          </tbody>
        </table>
        }

        @if (showButtonBar()) {
          <footer class="dg-datepicker__bar">
            <button
              type="button"
              class="dg-datepicker__bar-btn"
              (click)="goToday()"
            >{{ todayLabel() }}</button>
            <button
              type="button"
              class="dg-datepicker__bar-btn"
              (click)="clearAll()"
            >{{ clearLabel() }}</button>
          </footer>
        }
      </div>
    }
  `,
  styleUrl: './datepicker.scss',
  host: {
    class: 'dg-datepicker',
    '[attr.data-fluid]': 'fluid() || null',
    '[attr.data-open]': 'open() || null',
    '[attr.data-inline]': 'inline() || null',
  },
})
export class DgDatepicker implements ControlValueAccessor {
  readonly value = model<DgDatepickerValue>(null);
  readonly selectionMode = input<DgDatepickerSelectionMode>('single');
  readonly placeholder = input<string | undefined>(undefined);
  readonly format = input('dd/MM/yyyy');
  /**
   * When true, leaves text in the input even if it doesn't parse to a valid
   * date on blur. Default `false` reverts the text to the last valid value
   * — matches PrimeNG's default behavior.
   */
  readonly keepInvalid = input(false, { transform: booleanish });
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly disabledDates = input<readonly Date[]>([]);
  /** Day-of-week numbers to disable. 0 = Sunday … 6 = Saturday. */
  readonly disabledDays = input<readonly number[]>([]);
  readonly showOtherMonths = input(true, { transform: booleanish });
  readonly selectOtherMonths = input(false, { transform: booleanish });
  readonly showWeek = input(false, { transform: booleanish });
  /** 0 = Sunday … 6 = Saturday. Default 1 (Monday). */
  readonly firstDayOfWeek = input(1);
  readonly inline = input(false, { transform: booleanish });
  readonly showButtonBar = input(false, { transform: booleanish });
  readonly clearable = input(false, { transform: booleanish });
  readonly invalid = input(false, { transform: booleanish });
  readonly fluid = input(false, { transform: booleanish });
  readonly disabled = input(false, { transform: booleanish });
  readonly readonlyInput = input(false, { transform: booleanish });
  readonly size = input<DgDatepickerSize>('normal');
  readonly variant = input<DgDatepickerVariant>('outlined');
  readonly appendTo = input<'self' | 'body'>('self');
  readonly locale = input<string>(typeof navigator !== 'undefined' ? navigator.language : 'en');
  readonly todayLabel = input('Today');
  readonly clearLabel = input('Clear');
  readonly weekLabel = input('Wk');
  readonly rangeSeparator = input(' – ');

  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly selectedChange = output<DgDatepickerValue>();
  readonly monthChange = output<{ month: number; year: number }>();
  readonly yearChange = output<{ month: number; year: number }>();

  protected readonly open = signal(false);
  protected readonly viewYear = signal(new Date().getFullYear());
  protected readonly viewMonth = signal(new Date().getMonth());
  /** Current calendar view — `'date'` (default) shows day cells, `'month'`
   * shows a 12-month picker, `'year'` shows a 12-year picker. */
  protected readonly view = signal<'date' | 'month' | 'year'>('date');
  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.cvaDisabled() || this.disabled());

  protected readonly dateTpl = contentChild(DgDatepickerDateDef);

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  protected onChange: (value: DgDatepickerValue) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    // Sync the visible month/year with the selected value when it changes
    // externally (writeValue, model bindings, etc.).
    effect(() => {
      const v = this.value();
      const focusDate = this.getFocusDate(v);
      if (focusDate) {
        this.viewMonth.set(focusDate.getMonth());
        this.viewYear.set(focusDate.getFullYear());
      }
    });

    // Body portal: when open + appendTo='body', move panel to <body> and
    // reposition next to the input. Cleanup removes it back when closed.
    effect((onCleanup) => {
      if (this.inline()) return;
      const panel = this.panelRef();
      if (!panel || !this.open() || this.appendTo() !== 'body') return;
      if (typeof document === 'undefined') return;

      const el = panel.nativeElement;
      document.body.appendChild(el);
      el.classList.add('dg-datepicker__panel--detached');
      this.positionPanel();

      const reposition = () => this.positionPanel();
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);

      onCleanup(() => {
        window.removeEventListener('scroll', reposition, true);
        window.removeEventListener('resize', reposition);
        el.classList.remove('dg-datepicker__panel--detached');
        if (el.parentNode === document.body) {
          document.body.removeChild(el);
        }
      });
    });
  }

  // ---- Public API ----

  toggle(): void {
    if (this.isDisabled() || this.inline()) return;
    this.open() ? this.close() : this.openPanel();
  }

  openPanel(): void {
    if (this.open() || this.inline()) return;
    this.open.set(true);
    this.opened.emit();
  }

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    // Reset to date view so the next open starts on the day grid.
    this.view.set('date');
    this.closed.emit();
  }

  /** View-aware previous: month / year / decade depending on current view. */
  prev(): void {
    if (this.view() === 'date') return this.prevMonth();
    if (this.view() === 'month') {
      this.viewYear.update((y) => y - 1);
      this.yearChange.emit({ month: this.viewMonth(), year: this.viewYear() });
      return;
    }
    this.viewYear.update((y) => y - 12);
  }

  /** View-aware next: month / year / decade depending on current view. */
  next(): void {
    if (this.view() === 'date') return this.nextMonth();
    if (this.view() === 'month') {
      this.viewYear.update((y) => y + 1);
      this.yearChange.emit({ month: this.viewMonth(), year: this.viewYear() });
      return;
    }
    this.viewYear.update((y) => y + 12);
  }

  setView(v: 'date' | 'month' | 'year'): void {
    this.view.set(v);
  }

  protected selectMonth(month: number): void {
    if (this.isMonthDisabled(this.viewYear(), month)) return;
    this.viewMonth.set(month);
    this.monthChange.emit({ month, year: this.viewYear() });
    this.view.set('date');
  }

  protected selectYear(year: number): void {
    if (this.isYearDisabled(year)) return;
    const prev = this.viewYear();
    this.viewYear.set(year);
    if (prev !== year) this.yearChange.emit({ month: this.viewMonth(), year });
    // After picking a year, drill down to month picker so the user can
    // narrow further. PrimeNG follows the same pattern.
    this.view.set('month');
  }

  prevMonth(): void {
    let m = this.viewMonth() - 1;
    let y = this.viewYear();
    if (m < 0) { m = 11; y -= 1; }
    this.viewMonth.set(m);
    this.viewYear.set(y);
    this.monthChange.emit({ month: m, year: y });
  }

  nextMonth(): void {
    let m = this.viewMonth() + 1;
    let y = this.viewYear();
    if (m > 11) { m = 0; y += 1; }
    this.viewMonth.set(m);
    this.viewYear.set(y);
    this.monthChange.emit({ month: m, year: y });
  }

  goToday(): void {
    const t = new Date();
    this.viewMonth.set(t.getMonth());
    this.viewYear.set(t.getFullYear());
    if (this.selectionMode() === 'single' && !this.isDateDisabled(t)) {
      this.applyValue(t);
    }
  }

  clearAll(): void {
    this.applyValue(null);
    if (!this.inline()) this.close();
  }

  clear(event: Event): void {
    event.stopPropagation();
    if (this.isDisabled()) return;
    this.applyValue(null);
  }

  // ---- Computed display ----

  /**
   * Mask string derived from `format`. Each date token char (`y`, `M`, `d`)
   * becomes the digit token `9`; everything else stays literal. For range
   * mode, two masks are joined by `rangeSeparator`.
   */
  protected readonly mask = computed<string>(() => {
    const fmtMask = this.format().replace(/[yMd]/g, '9');
    return this.selectionMode() === 'range'
      ? fmtMask + this.rangeSeparator() + fmtMask
      : fmtMask;
  });

  /** Placeholder fallback that mirrors the format when none is supplied. */
  protected readonly effectivePlaceholder = computed<string>(() => {
    const explicit = this.placeholder();
    if (explicit !== undefined) return explicit;
    return this.selectionMode() === 'range'
      ? this.format() + this.rangeSeparator() + this.format()
      : this.format();
  });

  protected readonly displayValue = computed<string>(() => {
    const v = this.value();
    const fmt = this.format();
    if (v === null || v === undefined) return '';
    if (this.selectionMode() === 'single') {
      return v instanceof Date ? formatDate(v, fmt) : '';
    }
    if (Array.isArray(v)) {
      const [start, end] = v;
      const a = start ? formatDate(start, fmt) : '';
      const b = end ? formatDate(end, fmt) : '';
      if (a && b) return `${a}${this.rangeSeparator()}${b}`;
      return a;
    }
    return '';
  });

  protected readonly hasValue = computed<boolean>(() => {
    const v = this.value();
    if (v === null || v === undefined) return false;
    if (Array.isArray(v)) return !!v[0];
    return true;
  });

  protected readonly monthLabel = computed<string>(() => {
    const d = new Date(this.viewYear(), this.viewMonth(), 1);
    return new Intl.DateTimeFormat(this.locale(), { month: 'long' }).format(d);
  });

  protected readonly yearLabel = computed<string>(() => String(this.viewYear()));

  /** Start year of the 12-cell year grid (locked to a "decade-ish" window). */
  protected readonly yearViewStart = computed<number>(() => Math.floor(this.viewYear() / 10) * 10 - 1);

  protected readonly yearRangeLabel = computed<string>(() => {
    const start = this.yearViewStart();
    return `${start} – ${start + 11}`;
  });

  protected readonly prevAriaLabel = computed<string>(() => {
    const v = this.view();
    return v === 'date' ? 'Previous month' : v === 'month' ? 'Previous year' : 'Previous decade';
  });

  protected readonly nextAriaLabel = computed<string>(() => {
    const v = this.view();
    return v === 'date' ? 'Next month' : v === 'month' ? 'Next year' : 'Next decade';
  });

  protected readonly monthCells = computed<readonly { month: number; label: string; selected: boolean; today: boolean; disabled: boolean }[]>(() => {
    const fmt = new Intl.DateTimeFormat(this.locale(), { month: 'short' });
    const yr = this.viewYear();
    const focus = this.getFocusDate(this.value());
    const now = new Date();
    const out: { month: number; label: string; selected: boolean; today: boolean; disabled: boolean }[] = [];
    for (let m = 0; m < 12; m++) {
      out.push({
        month: m,
        label: fmt.format(new Date(yr, m, 1)),
        selected: !!focus && focus.getFullYear() === yr && focus.getMonth() === m,
        today: now.getFullYear() === yr && now.getMonth() === m,
        disabled: this.isMonthDisabled(yr, m),
      });
    }
    return out;
  });

  protected readonly yearCells = computed<readonly { year: number; selected: boolean; today: boolean; disabled: boolean }[]>(() => {
    const start = this.yearViewStart();
    const focus = this.getFocusDate(this.value());
    const now = new Date();
    const out: { year: number; selected: boolean; today: boolean; disabled: boolean }[] = [];
    for (let i = 0; i < 12; i++) {
      const y = start + i;
      out.push({
        year: y,
        selected: !!focus && focus.getFullYear() === y,
        today: now.getFullYear() === y,
        disabled: this.isYearDisabled(y),
      });
    }
    return out;
  });

  protected readonly weekdayLabels = computed<readonly { iso: number; short: string; long: string }[]>(() => {
    const start = this.firstDayOfWeek();
    const out: { iso: number; short: string; long: string }[] = [];
    const shortFmt = new Intl.DateTimeFormat(this.locale(), { weekday: 'short' });
    const longFmt = new Intl.DateTimeFormat(this.locale(), { weekday: 'long' });
    for (let i = 0; i < 7; i++) {
      const dow = (start + i) % 7;
      // Reference Sunday = 1970-01-04
      const ref = new Date(1970, 0, 4 + dow);
      out.push({ iso: dow, short: shortFmt.format(ref), long: longFmt.format(ref) });
    }
    return out;
  });

  protected readonly grid = computed<readonly CellModel[][]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstDow = firstOfMonth.getDay();
    const offset = (firstDow - this.firstDayOfWeek() + 7) % 7;
    // Start from `offset` days before the 1st.
    const start = new Date(year, month, 1 - offset);
    const today = new Date();
    const rows: CellModel[][] = [];
    for (let r = 0; r < 6; r++) {
      const week: CellModel[] = [];
      for (let c = 0; c < 7; c++) {
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + r * 7 + c);
        const current = date.getMonth() === month;
        week.push({
          date,
          current,
          today: sameDay(date, today),
          disabled: this.isDateDisabled(date) || (!this.selectOtherMonths() && !current && !this.showOtherMonths()),
        });
      }
      rows.push(week);
    }
    return rows;
  });

  // ---- Selection helpers ----

  protected isSelected(date: Date): boolean {
    const v = this.value();
    if (this.selectionMode() === 'single') {
      return v instanceof Date && sameDay(date, v);
    }
    if (Array.isArray(v)) {
      return sameDay(date, v[0]) || sameDay(date, v[1] ?? null);
    }
    return false;
  }

  protected isRangeStart(date: Date): boolean {
    if (this.selectionMode() !== 'range') return false;
    const v = this.value();
    return Array.isArray(v) && sameDay(date, v[0]);
  }

  protected isRangeEnd(date: Date): boolean {
    if (this.selectionMode() !== 'range') return false;
    const v = this.value();
    return Array.isArray(v) && !!v[1] && sameDay(date, v[1]);
  }

  protected isInRange(date: Date): boolean {
    if (this.selectionMode() !== 'range') return false;
    const v = this.value();
    if (!Array.isArray(v) || !v[0] || !v[1]) return false;
    const t = startOfDay(date).getTime();
    return t > startOfDay(v[0]).getTime() && t < startOfDay(v[1]).getTime();
  }

  protected selectCell(cell: CellModel): void {
    if (cell.disabled) return;
    if (!cell.current && !this.selectOtherMonths()) return;

    if (!cell.current) {
      // Clicking an "other month" cell — jump the view.
      this.viewMonth.set(cell.date.getMonth());
      this.viewYear.set(cell.date.getFullYear());
    }

    if (this.selectionMode() === 'single') {
      this.applyValue(cell.date);
      if (!this.inline()) this.close();
      return;
    }

    // range mode
    const cur = this.value();
    if (!Array.isArray(cur) || !cur[0] || cur[1]) {
      // Start a new range
      this.applyValue([cell.date, null]);
    } else {
      const start = cur[0];
      if (cell.date.getTime() < start.getTime()) {
        // Clicked earlier than start → reset start
        this.applyValue([cell.date, null]);
      } else {
        this.applyValue([start, cell.date]);
        if (!this.inline()) this.close();
      }
    }
  }

  protected weekNumber(d: Date): number {
    // ISO 8601 week number
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  }

  // ---- Input typing ----

  protected onTextInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    const fmt = this.format();
    const sep = this.rangeSeparator();

    if (this.selectionMode() === 'single') {
      if (text.trim() === '') {
        this.applyValue(null);
        return;
      }
      const d = parseDate(text, fmt);
      if (d && !this.isDateDisabled(d)) this.applyValue(d);
      return;
    }

    // range
    if (text.trim() === '') {
      this.applyValue(null);
      return;
    }
    const parts = text.split(sep);
    const start = parts[0] ? parseDate(parts[0].trim(), fmt) : null;
    const end = parts[1] ? parseDate(parts[1].trim(), fmt) : null;
    if (start && (!end || end.getTime() >= start.getTime())) {
      this.applyValue([start, end]);
    }
  }

  protected onInputFocus(): void {
    // Don't auto-open on focus to avoid surprising users; explicit toggle.
  }

  protected onInputBlur(event: Event): void {
    this.onTouched();
    if (this.keepInvalid()) return;
    // If the user typed something the parser couldn't turn into a valid
    // value, the model wasn't updated. Revert the input text to the
    // formatted display so the field never shows an out-of-sync string.
    const input = event.target as HTMLInputElement;
    if (input.value !== this.displayValue()) {
      input.value = this.displayValue();
    }
  }

  protected onInputKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    if (this.isDisabled()) return;
    if (key === 'Enter' || (key === ' ' && this.readonlyInput())) {
      event.preventDefault();
      this.toggle();
    } else if (key === 'Escape') {
      if (this.open()) {
        event.preventDefault();
        this.close();
      }
    } else if (key === 'ArrowDown' && !this.open()) {
      event.preventDefault();
      this.openPanel();
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node;
    if (this.hostRef.nativeElement.contains(target)) return;
    const panel = this.panelRef()?.nativeElement;
    if (panel?.contains(target)) return;
    this.close();
  }

  // ---- Internals ----

  private applyValue(v: DgDatepickerValue): void {
    this.value.set(v);
    this.onChange(v);
    this.selectedChange.emit(v);
  }

  private getFocusDate(v: DgDatepickerValue): Date | null {
    if (v instanceof Date) return v;
    if (Array.isArray(v)) return v[0] ?? null;
    return null;
  }

  private isMonthDisabled(year: number, month: number): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    const lastOfMonth = new Date(year, month + 1, 0);
    const firstOfMonth = new Date(year, month, 1);
    if (min && lastOfMonth.getTime() < startOfDay(min).getTime()) return true;
    if (max && firstOfMonth.getTime() > startOfDay(max).getTime()) return true;
    return false;
  }

  private isYearDisabled(year: number): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    if (min && new Date(year, 11, 31).getTime() < startOfDay(min).getTime()) return true;
    if (max && new Date(year, 0, 1).getTime() > startOfDay(max).getTime()) return true;
    return false;
  }

  private isDateDisabled(d: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    const ts = startOfDay(d).getTime();
    if (min && ts < startOfDay(min).getTime()) return true;
    if (max && ts > startOfDay(max).getTime()) return true;
    if (this.disabledDays().includes(d.getDay())) return true;
    if (this.disabledDates().some((x) => sameDay(x, d))) return true;
    return false;
  }

  private positionPanel(): void {
    const panel = this.panelRef()?.nativeElement;
    const input = this.inputRef()?.nativeElement;
    if (!panel || !input) return;
    const rect = input.getBoundingClientRect();
    panel.style.position = 'fixed';
    panel.style.top = `${rect.bottom + 4}px`;
    panel.style.left = `${rect.left}px`;
    panel.style.minWidth = `${rect.width}px`;
  }

  // ---- ControlValueAccessor ----

  writeValue(value: DgDatepickerValue): void {
    if (value === undefined) value = null;
    if (value !== null && this.selectionMode() === 'range' && !Array.isArray(value)) {
      // tolerate scalar in range mode
      value = [value as Date, null];
    }
    this.value.set(value as DgDatepickerValue);
  }

  registerOnChange(fn: (value: DgDatepickerValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  // Re-export type for templates
  protected readonly _ctxType!: DgDatepickerCellContext;
}

// ---- helpers ----

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDate(d: Date, fmt: string): string {
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return fmt
    .replace(/yyyy/g, String(year).padStart(4, '0'))
    .replace(/yy/g, String(year).slice(-2))
    .replace(/MM/g, String(month).padStart(2, '0'))
    .replace(/M/g, String(month))
    .replace(/dd/g, String(day).padStart(2, '0'))
    .replace(/d/g, String(day));
}

function parseDate(str: string, fmt: string): Date | null {
  const tokens: ('y' | 'M' | 'd')[] = [];
  let regex = '';
  let i = 0;
  while (i < fmt.length) {
    if (fmt.startsWith('yyyy', i)) { tokens.push('y'); regex += '(\\d{4})'; i += 4; }
    else if (fmt.startsWith('yy', i)) { tokens.push('y'); regex += '(\\d{2})'; i += 2; }
    else if (fmt.startsWith('MM', i)) { tokens.push('M'); regex += '(\\d{1,2})'; i += 2; }
    else if (fmt[i] === 'M') { tokens.push('M'); regex += '(\\d{1,2})'; i += 1; }
    else if (fmt.startsWith('dd', i)) { tokens.push('d'); regex += '(\\d{1,2})'; i += 2; }
    else if (fmt[i] === 'd') { tokens.push('d'); regex += '(\\d{1,2})'; i += 1; }
    else { regex += escapeRegex(fmt[i]); i += 1; }
  }
  const m = new RegExp('^' + regex + '$').exec(str.trim());
  if (!m) return null;
  let y = 0, mo = 0, dd = 0;
  tokens.forEach((t, idx) => {
    const v = parseInt(m[idx + 1], 10);
    if (t === 'y') y = v < 100 ? 2000 + v : v;
    else if (t === 'M') mo = v;
    else dd = v;
  });
  if (!y || !mo || !dd) return null;
  const date = new Date(y, mo - 1, dd);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== dd) return null;
  return date;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function booleanish(value: boolean | string | null | undefined): boolean {
  return value === '' || value === true || value === 'true';
}
