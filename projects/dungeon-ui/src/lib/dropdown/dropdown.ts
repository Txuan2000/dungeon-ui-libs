import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  HostListener,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DgDropdownEmptyDef, DgDropdownOptionDef, DgDropdownSelectedDef } from './dropdown-defs';

export type DgDropdownSize = 'small' | 'normal' | 'large';
export type DgDropdownVariant = 'outlined' | 'filled';

type FieldGetter<T, R> = string | ((item: T) => R);

@Component({
  selector: 'dg-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DgDropdown),
      multi: true,
    },
  ],
  template: `
    <button
      #trigger
      type="button"
      class="dg-dropdown__trigger"
      [attr.aria-haspopup]="'listbox'"
      [attr.aria-expanded]="open()"
      [attr.aria-invalid]="invalid() || null"
      [attr.data-size]="size()"
      [attr.data-variant]="variant()"
      [attr.data-invalid]="invalid() || null"
      [attr.data-fluid]="fluid() || null"
      [attr.data-disabled]="isDisabled() || null"
      [disabled]="isDisabled()"
      (click)="toggle()"
      (keydown)="onTriggerKeyDown($event)"
      (blur)="onTouched()"
    >
      <span class="dg-dropdown__value">
        @if (selectedOption(); as opt) {
          @if (selectedTpl(); as tmpl) {
            <ng-container *ngTemplateOutlet="tmpl.templateRef; context: { $implicit: opt }" />
          } @else {
            {{ getLabel(opt) }}
          }
        } @else {
          <span class="dg-dropdown__placeholder">{{ placeholder() }}</span>
        }
      </span>

      @if (clearable() && selectedOption() && !isDisabled()) {
        <button
          type="button"
          class="dg-dropdown__clear"
          aria-label="Clear selection"
          (click)="clear($event)"
        >×</button>
      }

      <span class="dg-dropdown__caret" aria-hidden="true">▾</span>
    </button>

    @if (open()) {
      <div
        #panel
        class="dg-dropdown__panel"
        role="listbox"
        [attr.data-panel-width]="panelWidthMode()"
        [style.max-height]="panelMaxHeight()"
        [style.width]="explicitPanelWidth()"
      >
        @if (filter()) {
          <div class="dg-dropdown__filter">
            <input
              #filterInput
              type="text"
              class="dg-dropdown__filter-input"
              [value]="filterText()"
              [placeholder]="filterPlaceholder()"
              (input)="onFilterInput($event)"
              (keydown)="onTriggerKeyDown($event)"
              autocomplete="off"
            />
          </div>
        }
        <div class="dg-dropdown__list" #list>
          @for (opt of filteredOptions(); track trackOption($index, opt); let i = $index) {
            <div
              class="dg-dropdown__option"
              role="option"
              [attr.aria-selected]="isSelected(opt)"
              [attr.aria-disabled]="isOptionDisabled(opt) || null"
              [class.dg-dropdown__option--selected]="isSelected(opt)"
              [class.dg-dropdown__option--highlighted]="i === highlightedIndex()"
              [class.dg-dropdown__option--disabled]="isOptionDisabled(opt)"
              (mouseenter)="highlightedIndex.set(i)"
              (mousedown)="$event.preventDefault()"
              (click)="select(opt, $event)"
            >
              @if (optionTpl(); as tmpl) {
                <ng-container
                  *ngTemplateOutlet="
                    tmpl.templateRef;
                    context: { $implicit: opt, index: i, selected: isSelected(opt), highlighted: i === highlightedIndex() }
                  "
                />
              } @else {
                {{ getLabel(opt) }}
              }
            </div>
          } @empty {
            @if (emptyTpl(); as tmpl) {
              <ng-container *ngTemplateOutlet="tmpl.templateRef" />
            } @else {
              <div class="dg-dropdown__empty">{{ emptyMessage() }}</div>
            }
          }
        </div>
      </div>
    }
  `,
  styleUrl: './dropdown.scss',
  host: {
    class: 'dg-dropdown',
    '[attr.data-fluid]': 'fluid() || null',
    '[attr.data-open]': 'open() || null',
  },
})
export class DgDropdown<T = unknown> implements ControlValueAccessor {
  readonly options = input<readonly T[]>([]);
  readonly optionLabel = input<FieldGetter<T, string>>();
  readonly optionValue = input<FieldGetter<T, unknown>>();
  readonly optionDisabled = input<FieldGetter<T, boolean>>();
  readonly value = model<unknown>(null);
  readonly placeholder = input('Select');
  readonly filter = input(false, { transform: booleanish });
  readonly filterPlaceholder = input('Search…');
  readonly filterBy = input<string>();
  readonly clearable = input(false, { transform: booleanish });
  readonly invalid = input(false, { transform: booleanish });
  readonly fluid = input(false, { transform: booleanish });
  readonly size = input<DgDropdownSize>('normal');
  readonly variant = input<DgDropdownVariant>('outlined');
  readonly panelMaxHeight = input('14rem');
  readonly emptyMessage = input('No results');
  readonly disabled = input(false, { transform: booleanish });
  readonly appendTo = input<'self' | 'body'>('self');
  /**
   * Panel width policy.
   * - 'host'  (default): panel min-width matches the host element width
   * - 'auto': panel sizes to its content (can be wider than the host)
   * - any CSS length string (e.g. '14rem', '240px'): explicit width
   */
  readonly panelWidth = input<'host' | 'auto' | string>('host');

  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly selectedChange = output<T | null>();
  readonly filterChange = output<string>();

  protected readonly open = signal(false);
  protected readonly filterText = signal('');
  protected readonly highlightedIndex = signal(-1);
  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.cvaDisabled() || this.disabled());

  protected readonly optionTpl = contentChild(DgDropdownOptionDef);
  protected readonly selectedTpl = contentChild(DgDropdownSelectedDef);
  protected readonly emptyTpl = contentChild(DgDropdownEmptyDef);

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly filterInputRef = viewChild<ElementRef<HTMLInputElement>>('filterInput');
  private readonly listRef = viewChild<ElementRef<HTMLElement>>('list');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly filteredOptions = computed<readonly T[]>(() => {
    const text = this.filterText().trim().toLowerCase();
    if (!text) return this.options();
    const fields = this.filterBy()?.split(',').map((s) => s.trim()).filter(Boolean);
    return this.options().filter((opt) => {
      if (fields && fields.length) {
        return fields.some((f) => String((opt as Record<string, unknown>)[f] ?? '').toLowerCase().includes(text));
      }
      return this.getLabel(opt).toLowerCase().includes(text);
    });
  });

  protected readonly panelWidthMode = computed<'host' | 'auto' | 'explicit'>(() => {
    const pw = this.panelWidth();
    return pw === 'host' || pw === 'auto' ? pw : 'explicit';
  });

  protected readonly explicitPanelWidth = computed<string | null>(() => {
    const pw = this.panelWidth();
    return pw === 'host' || pw === 'auto' ? null : pw;
  });

  protected readonly selectedOption = computed<T | null>(() => {
    const v = this.value();
    if (v === null || v === undefined) return null;
    return this.options().find((opt) => this.optionEquals(opt, v)) ?? null;
  });

  protected onChange: (value: unknown) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      if (this.open()) {
        const input = this.filterInputRef();
        if (input) {
          queueMicrotask(() => input.nativeElement.focus());
        }
        this.scrollHighlightedIntoView();
      }
    });

    // Body portal: when open + appendTo='body', move panel to <body> and
    // reposition against trigger; cleanup removes it back when closed.
    effect((onCleanup) => {
      const panel = this.panelRef();
      if (!panel || !this.open() || this.appendTo() !== 'body') return;
      if (typeof document === 'undefined') return;

      const el = panel.nativeElement;
      document.body.appendChild(el);
      el.classList.add('dg-dropdown__panel--detached');
      this.positionPanel();

      const reposition = () => this.positionPanel();
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);

      onCleanup(() => {
        window.removeEventListener('scroll', reposition, true);
        window.removeEventListener('resize', reposition);
        el.classList.remove('dg-dropdown__panel--detached');
        // Explicitly remove from <body> when closing so the DOM never leaks
        // a detached panel after the dropdown is hidden.
        if (el.parentNode === document.body) {
          document.body.removeChild(el);
        }
      });
    });
  }

  private positionPanel(): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;
    const rect = this.triggerRef().nativeElement.getBoundingClientRect();
    panel.style.position = 'fixed';
    panel.style.top = `${rect.bottom + 4}px`;
    panel.style.left = `${rect.left}px`;

    const pw = this.panelWidth();
    if (pw === 'host') {
      panel.style.minWidth = `${rect.width}px`;
      panel.style.width = '';
    } else if (pw === 'auto') {
      panel.style.minWidth = '';
      panel.style.width = '';
    } else {
      panel.style.minWidth = '';
      panel.style.width = pw;
    }
  }

  toggle(): void {
    if (this.isDisabled()) return;
    this.open() ? this.close() : this.openPanel();
  }

  openPanel(): void {
    if (this.open()) return;
    this.open.set(true);
    this.filterText.set('');
    const filtered = this.filteredOptions();
    const selectedIdx = filtered.findIndex((o) => this.isSelected(o));
    this.highlightedIndex.set(selectedIdx >= 0 ? selectedIdx : filtered.findIndex((o) => !this.isOptionDisabled(o)));
    this.opened.emit();
  }

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.closed.emit();
  }

  select(option: T, event?: Event): void {
    event?.stopPropagation();
    if (this.isOptionDisabled(option)) return;
    const v = this.getValue(option);
    this.value.set(v);
    this.onChange(v);
    this.selectedChange.emit(option);
    this.close();
    this.triggerRef().nativeElement.focus();
  }

  clear(event: Event): void {
    event.stopPropagation();
    if (this.isDisabled()) return;
    this.value.set(null);
    this.onChange(null);
    this.selectedChange.emit(null);
  }

  protected onFilterInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.filterText.set(text);
    this.filterChange.emit(text);
    this.highlightedIndex.set(this.filteredOptions().findIndex((o) => !this.isOptionDisabled(o)));
  }

  protected onTriggerKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    const key = event.key;
    if (!this.open()) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        event.preventDefault();
        this.openPanel();
      }
      return;
    }

    const filtered = this.filteredOptions();
    if (key === 'ArrowDown') {
      event.preventDefault();
      this.moveHighlight(1, filtered);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      this.moveHighlight(-1, filtered);
    } else if (key === 'Home') {
      event.preventDefault();
      this.highlightedIndex.set(filtered.findIndex((o) => !this.isOptionDisabled(o)));
      this.scrollHighlightedIntoView();
    } else if (key === 'End') {
      event.preventDefault();
      const last = [...filtered].reverse().findIndex((o) => !this.isOptionDisabled(o));
      this.highlightedIndex.set(last >= 0 ? filtered.length - 1 - last : -1);
      this.scrollHighlightedIntoView();
    } else if (key === 'Enter') {
      event.preventDefault();
      const idx = this.highlightedIndex();
      if (idx >= 0 && filtered[idx]) this.select(filtered[idx]);
    } else if (key === 'Escape' || key === 'Tab') {
      this.close();
    }
  }

  private moveHighlight(delta: number, filtered: readonly T[]): void {
    if (filtered.length === 0) return;
    let idx = this.highlightedIndex();
    for (let i = 0; i < filtered.length; i++) {
      idx = (idx + delta + filtered.length) % filtered.length;
      if (!this.isOptionDisabled(filtered[idx])) {
        this.highlightedIndex.set(idx);
        this.scrollHighlightedIntoView();
        return;
      }
    }
  }

  private scrollHighlightedIntoView(): void {
    const list = this.listRef();
    if (!list) return;
    queueMicrotask(() => {
      const el = list.nativeElement.children[this.highlightedIndex()] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    });
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

  protected isSelected(option: T): boolean {
    const v = this.value();
    return v !== null && v !== undefined && this.optionEquals(option, v);
  }

  protected isOptionDisabled(option: T): boolean {
    return readField<T, boolean>(option, this.optionDisabled()) ?? false;
  }

  protected getLabel(option: T): string {
    const label = readField<T, string>(option, this.optionLabel());
    if (label !== undefined && label !== null) return String(label);
    return String(option);
  }

  protected getValue(option: T): unknown {
    const value = readField(option, this.optionValue());
    return value !== undefined ? value : option;
  }

  private optionEquals(option: T, value: unknown): boolean {
    return this.getValue(option) === value;
  }

  protected trackOption = (_: number, opt: T) => this.getValue(opt);

  // ---- ControlValueAccessor ----
  writeValue(value: unknown): void {
    this.value.set(value ?? null);
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

function readField<T, R>(item: T, getter: FieldGetter<T, R> | undefined): R | undefined {
  if (getter === undefined || getter === null) return undefined;
  if (typeof getter === 'function') return getter(item);
  return (item as Record<string, unknown>)[getter] as R;
}

function booleanish(value: boolean | string | null | undefined): boolean {
  return value === '' || value === true || value === 'true';
}
