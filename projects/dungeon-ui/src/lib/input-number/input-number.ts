import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type DgInputNumberMode = 'decimal' | 'currency' | 'percent';
export type DgInputNumberSize = 'small' | 'normal' | 'large';
export type DgInputNumberVariant = 'outlined' | 'filled';
export type DgInputNumberButtonLayout = 'stacked' | 'horizontal';

@Component({
  selector: 'dg-input-number',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DgInputNumber),
      multi: true,
    },
  ],
  template: `
    <span class="dg-input-number__field"
      [attr.data-size]="size()"
      [attr.data-variant]="variant()"
      [attr.data-invalid]="invalid() || null"
      [attr.data-disabled]="isDisabled() || null"
      [attr.data-fluid]="fluid() || null"
      [attr.data-button-layout]="showButtons() ? buttonLayout() : null"
    >
      @if (showButtons() && buttonLayout() === 'horizontal') {
        <button
          type="button"
          class="dg-input-number__btn dg-input-number__btn--decrement"
          [attr.aria-label]="'Decrement'"
          [disabled]="isDisabled() || readonly() || isAtMin()"
          (click)="decrement()"
        >−</button>
      }

      <input
        #input
        type="text"
        inputmode="decimal"
        autocomplete="off"
        class="dg-input-number__input"
        [value]="displayValue()"
        [placeholder]="placeholder() ?? ''"
        [disabled]="isDisabled()"
        [readonly]="readonly()"
        [attr.aria-invalid]="invalid() || null"
        [attr.aria-label]="ariaLabel() ?? null"
        (input)="onTextInput($event)"
        (keydown)="onKeyDown($event)"
        (focus)="onFocusEvt($event)"
        (blur)="onBlurEvt($event)"
      />

      @if (showClear() && hasValue() && !isDisabled() && !readonly()) {
        <button
          type="button"
          class="dg-input-number__clear"
          aria-label="Clear"
          (click)="clear($event)"
        >×</button>
      }

      @if (showButtons() && buttonLayout() === 'stacked') {
        <span class="dg-input-number__btns dg-input-number__btns--stacked">
          <button
            type="button"
            class="dg-input-number__btn dg-input-number__btn--increment"
            [attr.aria-label]="'Increment'"
            [disabled]="isDisabled() || readonly() || isAtMax()"
            (click)="increment()"
          >▲</button>
          <button
            type="button"
            class="dg-input-number__btn dg-input-number__btn--decrement"
            [attr.aria-label]="'Decrement'"
            [disabled]="isDisabled() || readonly() || isAtMin()"
            (click)="decrement()"
          >▼</button>
        </span>
      }

      @if (showButtons() && buttonLayout() === 'horizontal') {
        <button
          type="button"
          class="dg-input-number__btn dg-input-number__btn--increment"
          [attr.aria-label]="'Increment'"
          [disabled]="isDisabled() || readonly() || isAtMax()"
          (click)="increment()"
        >+</button>
      }
    </span>
  `,
  styleUrl: './input-number.scss',
  host: {
    class: 'dg-input-number',
    '[attr.data-fluid]': 'fluid() || null',
  },
})
export class DgInputNumber implements ControlValueAccessor {
  readonly value = model<number | null>(null);
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly step = input(1);
  readonly mode = input<DgInputNumberMode>('decimal');
  readonly locale = input<string>(typeof navigator !== 'undefined' ? navigator.language : 'en');
  readonly currency = input<string | undefined>(undefined);
  readonly currencyDisplay = input<'symbol' | 'code' | 'name' | 'narrowSymbol'>('symbol');
  readonly useGrouping = input(true, { transform: booleanish });
  readonly minFractionDigits = input<number | undefined>(undefined);
  readonly maxFractionDigits = input<number | undefined>(undefined);
  readonly prefix = input('');
  readonly suffix = input('');
  readonly placeholder = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly allowEmpty = input(true, { transform: booleanish });
  readonly showButtons = input(false, { transform: booleanish });
  readonly buttonLayout = input<DgInputNumberButtonLayout>('stacked');
  readonly showClear = input(false, { transform: booleanish });
  readonly invalid = input(false, { transform: booleanish });
  readonly fluid = input(false, { transform: booleanish });
  readonly disabled = input(false, { transform: booleanish });
  readonly readonly = input(false, { transform: booleanish });
  readonly size = input<DgInputNumberSize>('normal');
  readonly variant = input<DgInputNumberVariant>('outlined');

  readonly valueChange = output<number | null>();
  readonly cleared = output<void>();
  readonly focused = output<FocusEvent>();
  readonly blurred = output<FocusEvent>();

  protected readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input');
  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.cvaDisabled() || this.disabled());

  protected onChange: (value: number | null) => void = () => {};
  protected onTouched: () => void = () => {};

  // ---- Locale-aware formatter / separators ----

  private readonly numberFormat = computed<Intl.NumberFormat>(() => {
    const opts: Intl.NumberFormatOptions = {
      useGrouping: this.useGrouping(),
    };
    if (this.mode() === 'currency') {
      opts.style = 'currency';
      opts.currency = this.currency() ?? 'USD';
      opts.currencyDisplay = this.currencyDisplay();
    } else if (this.mode() === 'percent') {
      opts.style = 'percent';
    } else {
      opts.style = 'decimal';
    }
    if (this.minFractionDigits() !== undefined) opts.minimumFractionDigits = this.minFractionDigits()!;
    if (this.maxFractionDigits() !== undefined) opts.maximumFractionDigits = this.maxFractionDigits()!;
    return new Intl.NumberFormat(this.locale(), opts);
  });

  private readonly decimalSeparator = computed<string>(() => {
    const parts = new Intl.NumberFormat(this.locale()).formatToParts(0.5);
    return parts.find((p) => p.type === 'decimal')?.value ?? '.';
  });

  private readonly groupSeparator = computed<string>(() => {
    const parts = new Intl.NumberFormat(this.locale()).formatToParts(1234.5);
    return parts.find((p) => p.type === 'group')?.value ?? ',';
  });

  protected readonly displayValue = computed<string>(() => {
    const v = this.value();
    if (v === null || v === undefined || Number.isNaN(v)) return '';
    return this.prefix() + this.numberFormat().format(v) + this.suffix();
  });

  protected readonly hasValue = computed<boolean>(() => {
    const v = this.value();
    return v !== null && v !== undefined && !Number.isNaN(v);
  });

  protected readonly isAtMin = computed<boolean>(() => {
    const v = this.value();
    const min = this.min();
    if (v === null || min === null) return false;
    return v <= min;
  });

  protected readonly isAtMax = computed<boolean>(() => {
    const v = this.value();
    const max = this.max();
    if (v === null || max === null) return false;
    return v >= max;
  });

  // ---- Public API ----

  increment(): void {
    if (this.isDisabled() || this.readonly()) return;
    const cur = this.value() ?? 0;
    this.applyValue(this.clamp(cur + this.step()));
  }

  decrement(): void {
    if (this.isDisabled() || this.readonly()) return;
    const cur = this.value() ?? 0;
    this.applyValue(this.clamp(cur - this.step()));
  }

  clear(event?: Event): void {
    event?.stopPropagation();
    if (this.isDisabled() || this.readonly()) return;
    this.applyValue(null);
    this.cleared.emit();
  }

  focus(): void {
    this.inputRef()?.nativeElement.focus();
  }

  // ---- Event handlers ----

  protected onTextInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    if (text.trim() === '') {
      if (this.allowEmpty()) this.applyValue(null);
      return;
    }
    const parsed = this.parseInput(text);
    if (parsed === null) return;
    // Don't clamp while typing — user may be entering a partial value;
    // clamp is applied on blur.
    this.applyValue(parsed);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled() || this.readonly()) return;
    const key = event.key;
    if (key === 'ArrowUp') {
      event.preventDefault();
      this.increment();
    } else if (key === 'ArrowDown') {
      event.preventDefault();
      this.decrement();
    } else if (key === 'Home' && this.min() !== null) {
      event.preventDefault();
      this.applyValue(this.min());
    } else if (key === 'End' && this.max() !== null) {
      event.preventDefault();
      this.applyValue(this.max());
    }
  }

  protected onFocusEvt(event: FocusEvent): void {
    this.focused.emit(event);
  }

  protected onBlurEvt(event: FocusEvent): void {
    this.onTouched();
    // On blur, clamp the typed value within [min, max] and re-format the
    // display so the input always shows a canonical representation.
    const v = this.value();
    if (v !== null && v !== undefined) {
      const clamped = this.clamp(v);
      if (clamped !== v) this.applyValue(clamped);
    }
    this.blurred.emit(event);
  }

  // ---- Internals ----

  private parseInput(text: string): number | null {
    const dec = this.decimalSeparator();
    // Strip prefix / suffix / group separators / currency symbols and any
    // non-digit chars except '-' and the decimal separator.
    let cleaned = text;
    if (this.prefix()) cleaned = cleaned.replace(this.prefix(), '');
    if (this.suffix()) cleaned = cleaned.replace(this.suffix(), '');
    cleaned = cleaned
      .split(this.groupSeparator()).join('')
      .replace(new RegExp(`[^0-9\\-${escapeRegex(dec)}]`, 'g'), '')
      .replace(dec, '.');
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  private clamp(v: number): number {
    const min = this.min();
    const max = this.max();
    if (min !== null && v < min) return min;
    if (max !== null && v > max) return max;
    return v;
  }

  private applyValue(v: number | null): void {
    this.value.set(v);
    this.onChange(v);
    this.valueChange.emit(v);
  }

  // ---- ControlValueAccessor ----

  writeValue(value: number | null | undefined): void {
    this.value.set(value === undefined ? null : value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}

function booleanish(value: boolean | string | null | undefined): boolean {
  return value === '' || value === true || value === 'true';
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
