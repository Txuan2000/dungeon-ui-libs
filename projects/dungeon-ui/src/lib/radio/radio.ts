import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  Injectable,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DgRadioIconDef } from './radio-defs';

/**
 * Coordinates radios sharing the same `name`. Required because Angular's
 * `FormControl.setValue(value, { emitModelToViewChange: false })` (called
 * from an originating accessor's `onChange`) does NOT propagate
 * `writeValue` to OTHER `[formControl]` directives bound to the same
 * control — so sibling radios would keep their stale `value` and all
 * show as checked. Registering by `name` lets us sync siblings explicitly,
 * mirroring PrimeNG's `RadioControlRegistry`.
 */
@Injectable({ providedIn: 'root' })
export class DgRadioRegistry {
  private readonly radios = new Set<DgRadio<unknown>>();

  add(radio: DgRadio<unknown>): void {
    this.radios.add(radio);
  }

  remove(radio: DgRadio<unknown>): void {
    this.radios.delete(radio);
  }

  /** Notify siblings sharing the picked radio's `name` of the new group value. */
  selected(picked: DgRadio<unknown>): void {
    const name = picked.name();
    if (!name) return;
    const next = picked.radioValue();
    this.radios.forEach((r) => {
      if (r !== picked && r.name() === name) {
        r.syncSelected(next);
      }
    });
  }
}

export type DgRadioSize = 'small' | 'normal' | 'large';
export type DgRadioVariant = 'outlined' | 'filled';

export interface DgRadioChangeEvent<T = unknown> {
  /** New group value (= this radio's `radioValue`). */
  value: T;
  originalEvent: Event;
}

@Component({
  selector: 'dg-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DgRadio),
      multi: true,
    },
  ],
  template: `
    <label
      class="dg-radio"
      [attr.data-size]="size()"
      [attr.data-variant]="variant()"
      [attr.data-checked]="checked() || null"
      [attr.data-invalid]="invalid() || null"
      [attr.data-disabled]="isDisabled() || null"
      [attr.data-readonly]="readonly() || null"
    >
      <input
        #inputEl
        type="radio"
        class="dg-radio__input"
        [attr.id]="inputId()"
        [attr.name]="name()"
        [attr.tabindex]="tabindex()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-describedby]="ariaDescribedBy()"
        [attr.aria-checked]="checked()"
        [attr.aria-invalid]="invalid() || null"
        [checked]="checked()"
        [disabled]="isDisabled()"
        [readOnly]="readonly()"
        (change)="onInputChange($event)"
        (focus)="focused.emit($event)"
        (blur)="onBlur($event)"
      />
      <span class="dg-radio__box" aria-hidden="true">
        @if (iconTpl(); as tmpl) {
          <ng-container
            *ngTemplateOutlet="tmpl.templateRef; context: { checked: checked() }"
          />
        } @else if (checked()) {
          <span class="dg-radio__dot" aria-hidden="true"></span>
        }
      </span>
      @if (label(); as l) {
        <span class="dg-radio__label">{{ l }}</span>
      }
    </label>
  `,
  styleUrl: './radio.scss',
  host: {
    class: 'dg-radio-host',
  },
})
export class DgRadio<T = unknown> implements ControlValueAccessor {
  /**
   * Two-way bound group value. When user picks this radio, `value` is set
   * to `radioValue`. All radios in the same group share the same parent
   * binding (via `[(value)]`, `[(ngModel)]`, or `[formControl]`) so they
   * stay in sync — no registry / wrapper component needed.
   */
  readonly value = model<unknown>(undefined);
  /** This radio's payload — emitted as the new group value when picked. */
  readonly radioValue = input<unknown>(undefined);
  readonly label = input<string>();
  readonly invalid = input(false, { transform: booleanish });
  readonly disabled = input(false, { transform: booleanish });
  readonly readonly = input(false, { transform: booleanish });
  readonly size = input<DgRadioSize>('normal');
  readonly variant = input<DgRadioVariant>('outlined');
  /** Native `name` so browser-level radio grouping (Arrow keys) works across radios sharing the same name. */
  readonly name = input<string>();
  readonly inputId = input<string>();
  readonly tabindex = input<number>();
  readonly ariaLabel = input<string>();
  readonly ariaDescribedBy = input<string>();

  /**
   * Emitted after a user-driven selection. NB: NOT named `change` because
   * that collides with the native DOM `change` event bubbling from the
   * inner `<input>` — Angular's `(change)` on a custom component would
   * become ambiguous and the output binding can fail to fire.
   */
  readonly radioChange = output<DgRadioChangeEvent<T>>();
  readonly focused = output<FocusEvent>();
  readonly blurred = output<FocusEvent>();

  protected readonly iconTpl = contentChild(DgRadioIconDef);
  protected readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.cvaDisabled() || this.disabled());

  protected readonly checked = computed(() => this.value() === this.radioValue());

  protected onChange: (value: unknown) => void = () => {};
  protected onTouched: () => void = () => {};

  private readonly registry = inject(DgRadioRegistry);

  constructor() {
    this.registry.add(this as DgRadio<unknown>);
    inject(DestroyRef).onDestroy(() => this.registry.remove(this as DgRadio<unknown>));
  }

  /**
   * Internal — called by `DgRadioRegistry` when a sibling radio (same `name`)
   * commits a new value. Updates the local `value` so `checked` recomputes,
   * without re-firing CVA `onChange` (the sibling already did that).
   */
  syncSelected(value: unknown): void {
    this.value.set(value);
  }

  /** Programmatically focus the inner <input>. */
  focus(): void {
    this.inputRef().nativeElement.focus();
  }

  /** Programmatically pick this radio (respects disabled/readonly). */
  select(originalEvent?: Event): void {
    if (this.isDisabled() || this.readonly()) return;
    if (this.checked()) return;
    this.commit(originalEvent ?? new Event('change'));
  }

  protected onInputChange(event: Event): void {
    if (this.readonly()) {
      // Native radio already toggled the DOM state — revert.
      const el = event.target as HTMLInputElement;
      el.checked = this.checked();
      return;
    }
    if (this.checked()) return;
    this.commit(event);
  }

  protected onBlur(event: FocusEvent): void {
    this.onTouched();
    this.blurred.emit(event);
  }

  private commit(originalEvent: Event): void {
    const next = this.radioValue();
    this.value.set(next);
    this.onChange(next);
    this.registry.selected(this as DgRadio<unknown>);
    this.radioChange.emit({ value: next as T, originalEvent });
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
