import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type DgInputTextSize = 'small' | 'normal' | 'large';
export type DgInputTextVariant = 'outlined' | 'filled';
export type DgInputTextType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number';

@Component({
  selector: 'dg-input-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DgInputText),
      multi: true,
    },
  ],
  host: {
    // Mirror `data-fluid` to the host so `:host[data-fluid='true']` in the
    // SCSS can stretch the host to 100% width. Without this, the host stays
    // `display: inline-flex` shrink-to-fit and `width: 100%` on the inner
    // field becomes "100% of a host that sized to its content first".
    '[attr.data-fluid]': "fluid() || null",
  },
  template: `
    <input
      class="dg-input-text__field"
      [type]="type()"
      [value]="value() ?? ''"
      [placeholder]="placeholder() ?? ''"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [attr.name]="name()"
      [attr.id]="inputId()"
      [attr.maxlength]="maxlength()"
      [attr.minlength]="minlength()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-describedby]="ariaDescribedBy()"
      [attr.aria-invalid]="invalid() || null"
      [attr.data-size]="size()"
      [attr.data-variant]="variant()"
      [attr.data-invalid]="invalid() || null"
      [attr.data-fluid]="fluid() || null"
      (input)="handleInput($event)"
      (blur)="handleBlur($event)"
      (focus)="focused.emit($event)"
    />
  `,
  styleUrl: './input-text.scss',
})
export class DgInputText implements ControlValueAccessor {
  readonly value = model<string | null | undefined>('');
  readonly placeholder = input<string>();
  readonly type = input<DgInputTextType>('text');
  readonly size = input<DgInputTextSize>('normal');
  readonly variant = input<DgInputTextVariant>('outlined');
  readonly invalid = input(false, { transform: booleanish });
  readonly fluid = input(false, { transform: booleanish });
  readonly readonly = input(false, { transform: booleanish });
  readonly name = input<string>();
  readonly inputId = input<string>();
  readonly ariaLabel = input<string>();
  readonly ariaDescribedBy = input<string>();
  readonly maxlength = input<number>();
  readonly minlength = input<number>();

  readonly inputEvent = output<Event>();
  readonly focused = output<FocusEvent>();
  readonly blurred = output<FocusEvent>();

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private readonly cvaDisabled = signal(false);

  protected readonly disabled = computed(() => this.cvaDisabled());

  protected handleInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
    this.inputEvent.emit(event);
  }

  protected handleBlur(event: FocusEvent): void {
    this.onTouched();
    this.blurred.emit(event);
  }

  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string | null) => void): void {
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
