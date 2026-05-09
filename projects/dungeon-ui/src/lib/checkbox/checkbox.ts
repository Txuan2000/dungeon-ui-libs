import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  ElementRef,
  forwardRef,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DgCheckboxIconDef } from './checkbox-defs';

export type DgCheckboxSize = 'small' | 'normal' | 'large';
export type DgCheckboxVariant = 'outlined' | 'filled';

export interface DgCheckboxChangeEvent<T = unknown> {
  /** New bound value: in binary mode the trueValue/falseValue; in multi mode the array. */
  value: T;
  /** True if the checkbox is now checked, false otherwise (ignores indeterminate). */
  checked: boolean;
  originalEvent: Event;
}

@Component({
  selector: 'dg-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DgCheckbox),
      multi: true,
    },
  ],
  template: `
    <label
      class="dg-checkbox"
      [attr.data-size]="size()"
      [attr.data-variant]="variant()"
      [attr.data-checked]="checked() || null"
      [attr.data-indeterminate]="indeterminate() || null"
      [attr.data-invalid]="invalid() || null"
      [attr.data-disabled]="isDisabled() || null"
      [attr.data-readonly]="readonly() || null"
    >
      <input
        #inputEl
        type="checkbox"
        class="dg-checkbox__input"
        [attr.id]="inputId()"
        [attr.name]="name()"
        [attr.tabindex]="tabindex()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-describedby]="ariaDescribedBy()"
        [attr.aria-checked]="indeterminate() ? 'mixed' : checked()"
        [attr.aria-invalid]="invalid() || null"
        [checked]="checked()"
        [indeterminate]="indeterminate()"
        [disabled]="isDisabled()"
        [readOnly]="readonly()"
        (change)="onInputChange($event)"
        (focus)="focused.emit($event)"
        (blur)="onBlur($event)"
      />
      <span class="dg-checkbox__box" aria-hidden="true">
        @if (iconTpl(); as tmpl) {
          <ng-container
            *ngTemplateOutlet="tmpl.templateRef; context: { checked: checked(), indeterminate: indeterminate() }"
          />
        } @else {
          @if (indeterminate()) {
            <span class="dg-checkbox__mark dg-checkbox__mark--indeterminate" aria-hidden="true">−</span>
          } @else if (checked()) {
            <span class="dg-checkbox__mark dg-checkbox__mark--check" aria-hidden="true">✓</span>
          }
        }
      </span>
      @if (label(); as l) {
        <span class="dg-checkbox__label">{{ l }}</span>
      }
    </label>
  `,
  styleUrl: './checkbox.scss',
  host: {
    class: 'dg-checkbox-host',
  },
})
export class DgCheckbox<T = unknown> implements ControlValueAccessor {
  /**
   * Two-way bound value.
   * - Binary mode (default): `trueValue` when checked, `falseValue` when unchecked.
   *   Default trueValue=true, falseValue=false → behaves as a `boolean`.
   * - Multi mode (`binary=false`): the bound value is an array; toggling adds /
   *   removes `value` (the per-checkbox payload) from the array.
   */
  readonly value = model<unknown>(undefined);
  /** Per-checkbox payload used in multi mode; ignored in binary mode. */
  readonly checkboxValue = input<unknown>(undefined);
  /** Default true → bound value is a single trueValue/falseValue. False → array (group). */
  readonly binary = input(true, { transform: booleanish });
  readonly trueValue = input<unknown>(true);
  readonly falseValue = input<unknown>(false);
  readonly indeterminate = input(false, { transform: booleanish });
  readonly label = input<string>();
  readonly invalid = input(false, { transform: booleanish });
  readonly disabled = input(false, { transform: booleanish });
  readonly readonly = input(false, { transform: booleanish });
  readonly size = input<DgCheckboxSize>('normal');
  readonly variant = input<DgCheckboxVariant>('outlined');
  readonly name = input<string>();
  readonly inputId = input<string>();
  readonly tabindex = input<number>();
  readonly ariaLabel = input<string>();
  readonly ariaDescribedBy = input<string>();

  /**
   * Emitted after every user-driven toggle. NB: NOT named `change` because
   * that collides with the native DOM `change` event bubbling from the
   * inner `<input>` — Angular's `(change)` on a custom component would
   * become ambiguous and the output binding can fail to fire.
   */
  readonly checkboxChange = output<DgCheckboxChangeEvent<T>>();
  readonly focused = output<FocusEvent>();
  readonly blurred = output<FocusEvent>();

  protected readonly iconTpl = contentChild(DgCheckboxIconDef);
  protected readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.cvaDisabled() || this.disabled());

  /** Whether the checkbox renders as checked (does NOT reflect indeterminate). */
  protected readonly checked = computed(() => {
    if (this.binary()) {
      return this.value() === this.trueValue();
    }
    const v = this.value();
    return Array.isArray(v) && v.includes(this.checkboxValue());
  });

  protected onChange: (value: unknown) => void = () => {};
  protected onTouched: () => void = () => {};

  /** Programmatically focus the inner <input>. */
  focus(): void {
    this.inputRef().nativeElement.focus();
  }

  /** Programmatically toggle the checkbox (respects disabled/readonly). */
  toggle(originalEvent?: Event): void {
    if (this.isDisabled() || this.readonly()) return;
    const next = !this.checked();
    this.commit(next, originalEvent ?? new Event('change'));
  }

  protected onInputChange(event: Event): void {
    if (this.readonly()) {
      // Native checkbox already toggled the DOM state — revert.
      const el = event.target as HTMLInputElement;
      el.checked = this.checked();
      return;
    }
    const el = event.target as HTMLInputElement;
    this.commit(el.checked, event);
  }

  protected onBlur(event: FocusEvent): void {
    this.onTouched();
    this.blurred.emit(event);
  }

  private commit(nextChecked: boolean, originalEvent: Event): void {
    let nextValue: unknown;
    if (this.binary()) {
      nextValue = nextChecked ? this.trueValue() : this.falseValue();
    } else {
      const current = this.value();
      const arr = Array.isArray(current) ? [...current] : [];
      const item = this.checkboxValue();
      if (nextChecked) {
        if (!arr.includes(item)) arr.push(item);
      } else {
        const idx = arr.indexOf(item);
        if (idx >= 0) arr.splice(idx, 1);
      }
      nextValue = arr;
    }
    this.value.set(nextValue);
    this.onChange(nextValue);
    this.checkboxChange.emit({ value: nextValue as T, checked: nextChecked, originalEvent });
  }

  // ---- ControlValueAccessor ----
  writeValue(value: unknown): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: unknown) => void): void {
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
