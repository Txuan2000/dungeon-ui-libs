import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DgAutocompleteEmptyDef, DgAutocompleteOptionDef } from './autocomplete-defs';

export type DgAutocompleteSize = 'small' | 'normal' | 'large';
export type DgAutocompleteVariant = 'outlined' | 'filled';

export interface DgAutocompleteCompleteEvent {
  query: string;
  originalEvent?: Event;
}

type FieldGetter<T, R> = string | ((item: T) => R);

@Component({
  selector: 'dg-autocomplete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DgAutocomplete),
      multi: true,
    },
  ],
  template: `
    <div class="dg-autocomplete__input-wrapper" [attr.data-fluid]="fluid() || null">
      <input
        #inputEl
        type="text"
        class="dg-autocomplete__input"
        autocomplete="off"
        spellcheck="false"
        role="combobox"
        aria-autocomplete="list"
        [attr.aria-expanded]="open()"
        [attr.aria-invalid]="invalid() || null"
        [attr.data-size]="size()"
        [attr.data-variant]="variant()"
        [attr.data-invalid]="invalid() || null"
        [attr.data-has-dropdown]="dropdown() || null"
        [attr.data-has-clear]="showClear() || null"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [readonly]="readonly()"
        [value]="inputText()"
        (input)="onInput($event)"
        (keydown)="onKeyDown($event)"
        (focus)="onFocus($event)"
        (blur)="onBlur($event)"
      />

      @if (showClear()) {
        <button
          type="button"
          class="dg-autocomplete__clear"
          aria-label="Clear"
          tabindex="-1"
          (mousedown)="$event.preventDefault()"
          (click)="clear()"
        >×</button>
      }

      @if (dropdown()) {
        <button
          type="button"
          class="dg-autocomplete__dropdown"
          aria-label="Show suggestions"
          tabindex="-1"
          [disabled]="isDisabled()"
          (mousedown)="$event.preventDefault()"
          (click)="onDropdownClick()"
        >▾</button>
      }
    </div>

    @if (open()) {
      <div
        #panel
        class="dg-autocomplete__panel"
        role="listbox"
        [attr.data-panel-width]="panelWidthMode()"
        [style.max-height]="panelMaxHeight()"
        [style.width]="explicitPanelWidth()"
      >
        <div class="dg-autocomplete__list" #list>
          @if (loading()) {
            <div class="dg-autocomplete__loading">{{ loadingMessage() }}</div>
          } @else {
            @for (opt of suggestions(); track trackOption($index, opt); let i = $index) {
              <div
                class="dg-autocomplete__option"
                role="option"
                [attr.aria-selected]="i === highlightedIndex()"
                [attr.aria-disabled]="isOptionDisabled(opt) || null"
                [class.dg-autocomplete__option--highlighted]="i === highlightedIndex()"
                [class.dg-autocomplete__option--disabled]="isOptionDisabled(opt)"
                (mouseenter)="highlightedIndex.set(i)"
                (mousedown)="$event.preventDefault()"
                (click)="select(opt)"
              >
                @if (optionTpl(); as tmpl) {
                  <ng-container
                    *ngTemplateOutlet="
                      tmpl.templateRef;
                      context: { $implicit: opt, index: i, highlighted: i === highlightedIndex(), query: inputText() }
                    "
                  />
                } @else {
                  {{ getLabel(opt) }}
                }
              </div>
            } @empty {
              @if (emptyTpl(); as tmpl) {
                <ng-container *ngTemplateOutlet="tmpl.templateRef; context: { query: inputText() }" />
              } @else {
                <div class="dg-autocomplete__empty">{{ emptyMessage() }}</div>
              }
            }
          }
        </div>
      </div>
    }
  `,
  styleUrl: './autocomplete.scss',
  host: {
    class: 'dg-autocomplete',
    '[attr.data-fluid]': 'fluid() || null',
    '[attr.data-open]': 'open() || null',
  },
})
export class DgAutocomplete<T = unknown> implements ControlValueAccessor {
  readonly suggestions = input<readonly T[]>([]);
  readonly optionLabel = input<FieldGetter<T, string>>();
  readonly optionValue = input<FieldGetter<T, unknown>>();
  readonly optionDisabled = input<FieldGetter<T, boolean>>();
  readonly value = model<unknown>(null);
  readonly placeholder = input('');
  readonly minLength = input(1);
  readonly delay = input(300);
  readonly forceSelection = input(false, { transform: booleanish });
  readonly dropdown = input(false, { transform: booleanish });
  readonly clearable = input(false, { transform: booleanish });
  readonly invalid = input(false, { transform: booleanish });
  readonly fluid = input(false, { transform: booleanish });
  readonly readonly = input(false, { transform: booleanish });
  readonly disabled = input(false, { transform: booleanish });
  readonly size = input<DgAutocompleteSize>('normal');
  readonly variant = input<DgAutocompleteVariant>('outlined');
  readonly panelMaxHeight = input('14rem');
  readonly emptyMessage = input('No results');
  readonly loading = input(false, { transform: booleanish });
  readonly loadingMessage = input('Loading…');
  readonly appendTo = input<'self' | 'body'>('self');
  /**
   * Panel width policy: 'host' (default) matches input width, 'auto' sizes
   * to content, or any CSS length string for an explicit width.
   */
  readonly panelWidth = input<'host' | 'auto' | string>('host');

  readonly complete = output<DgAutocompleteCompleteEvent>();
  readonly selected = output<T>();
  readonly cleared = output<void>();
  readonly opened = output<void>();
  readonly closed = output<void>();

  protected readonly open = signal(false);
  protected readonly inputText = signal('');
  protected readonly highlightedIndex = signal(-1);
  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.cvaDisabled() || this.disabled());

  protected readonly optionTpl = contentChild(DgAutocompleteOptionDef);
  protected readonly emptyTpl = contentChild(DgAutocompleteEmptyDef);

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');
  private readonly listRef = viewChild<ElementRef<HTMLElement>>('list');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  private debounceHandle: ReturnType<typeof setTimeout> | null = null;
  private lastQuery = '';
  private suppressNextComplete = false;

  protected readonly panelWidthMode = computed<'host' | 'auto' | 'explicit'>(() => {
    const pw = this.panelWidth();
    return pw === 'host' || pw === 'auto' ? pw : 'explicit';
  });

  protected readonly explicitPanelWidth = computed<string | null>(() => {
    const pw = this.panelWidth();
    return pw === 'host' || pw === 'auto' ? null : pw;
  });

  protected readonly showClear = computed(
    () => this.clearable() && !this.isDisabled() && !this.readonly() && this.inputText().length > 0,
  );

  protected onChange: (value: unknown) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    // Sync input text from external value changes (CVA writeValue / [(value)]).
    effect(() => {
      const v = this.value();
      const label = this.findOptionByValue(v);
      const display = label !== null ? this.getLabel(label) : v === null || v === undefined ? '' : String(v);
      // Avoid clobbering the user's in-progress typing — only sync when the
      // input is not currently the focused element.
      if (typeof document === 'undefined' || document.activeElement !== this.inputRef().nativeElement) {
        this.inputText.set(display);
      }
    });

    // Body portal: when open + appendTo='body', move panel to <body> and
    // reposition against the input; cleanup removes it back on close.
    effect((onCleanup) => {
      const panel = this.panelRef();
      if (!panel || !this.open() || this.appendTo() !== 'body') return;
      if (typeof document === 'undefined') return;

      const el = panel.nativeElement;
      document.body.appendChild(el);
      el.classList.add('dg-autocomplete__panel--detached');
      this.positionPanel();

      const reposition = () => this.positionPanel();
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);

      onCleanup(() => {
        window.removeEventListener('scroll', reposition, true);
        window.removeEventListener('resize', reposition);
        el.classList.remove('dg-autocomplete__panel--detached');
        if (el.parentNode === document.body) {
          document.body.removeChild(el);
        }
      });
    });

    effect(() => {
      if (this.open()) this.scrollHighlightedIntoView();
    });
  }

  private positionPanel(): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;
    const rect = this.hostRef.nativeElement.getBoundingClientRect();
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

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.inputText.set(text);
    // Typing without a final selection => clear current bound value so the
    // model reflects "in-progress" rather than the previously selected one.
    if (this.value() !== null && this.value() !== undefined) {
      const matched = this.findOptionByValue(this.value());
      if (!matched || this.getLabel(matched) !== text) {
        this.value.set(null);
        this.onChange(null);
      }
    }
    this.scheduleComplete(text, event);
  }

  private scheduleComplete(query: string, originalEvent?: Event): void {
    if (this.debounceHandle !== null) {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = null;
    }
    if (this.suppressNextComplete) {
      this.suppressNextComplete = false;
      return;
    }
    if (query.length < this.minLength()) {
      this.lastQuery = query;
      this.close();
      return;
    }
    const run = () => {
      this.debounceHandle = null;
      this.lastQuery = query;
      this.complete.emit({ query, originalEvent });
      this.openPanel();
    };
    if (this.delay() > 0) {
      this.debounceHandle = setTimeout(run, this.delay());
    } else {
      run();
    }
  }

  protected onDropdownClick(): void {
    if (this.isDisabled()) return;
    if (this.open()) {
      this.close();
      return;
    }
    this.lastQuery = this.inputText();
    this.complete.emit({ query: this.inputText() });
    this.openPanel();
    this.inputRef().nativeElement.focus();
  }

  protected onFocus(_event: FocusEvent): void {
    // No auto-open on focus — wait for typing or dropdown click. This matches
    // PrimeNG's default behavior and keeps the input quiet for navigation.
  }

  protected onBlur(_event: FocusEvent): void {
    this.onTouched();
    if (this.forceSelection()) {
      const text = this.inputText();
      const match = this.suggestions().find((opt) => this.getLabel(opt) === text);
      if (!match) {
        this.suppressNextComplete = true;
        this.inputText.set('');
        this.value.set(null);
        this.onChange(null);
      }
    }
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    const key = event.key;
    if (!this.open()) {
      if (key === 'ArrowDown' && this.suggestions().length > 0) {
        event.preventDefault();
        this.openPanel();
      }
      return;
    }

    const list = this.suggestions();
    if (key === 'ArrowDown') {
      event.preventDefault();
      this.moveHighlight(1, list);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      this.moveHighlight(-1, list);
    } else if (key === 'Home') {
      event.preventDefault();
      this.highlightedIndex.set(list.findIndex((o) => !this.isOptionDisabled(o)));
      this.scrollHighlightedIntoView();
    } else if (key === 'End') {
      event.preventDefault();
      const last = [...list].reverse().findIndex((o) => !this.isOptionDisabled(o));
      this.highlightedIndex.set(last >= 0 ? list.length - 1 - last : -1);
      this.scrollHighlightedIntoView();
    } else if (key === 'Enter') {
      const idx = this.highlightedIndex();
      if (idx >= 0 && list[idx]) {
        event.preventDefault();
        this.select(list[idx]);
      }
    } else if (key === 'Escape') {
      this.close();
    } else if (key === 'Tab') {
      this.close();
    }
  }

  private moveHighlight(delta: number, list: readonly T[]): void {
    if (list.length === 0) return;
    let idx = this.highlightedIndex();
    for (let i = 0; i < list.length; i++) {
      idx = (idx + delta + list.length) % list.length;
      if (!this.isOptionDisabled(list[idx])) {
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

  openPanel(): void {
    if (this.open()) return;
    this.open.set(true);
    const list = this.suggestions();
    this.highlightedIndex.set(list.findIndex((o) => !this.isOptionDisabled(o)));
    this.opened.emit();
  }

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.closed.emit();
  }

  select(option: T): void {
    if (this.isOptionDisabled(option)) return;
    const v = this.getValue(option);
    const label = this.getLabel(option);
    this.suppressNextComplete = true;
    this.inputText.set(label);
    this.value.set(v);
    this.onChange(v);
    this.selected.emit(option);
    this.close();
    this.inputRef().nativeElement.focus();
  }

  clear(): void {
    if (this.isDisabled()) return;
    this.suppressNextComplete = true;
    this.inputText.set('');
    this.value.set(null);
    this.onChange(null);
    this.cleared.emit();
    this.inputRef().nativeElement.focus();
    this.close();
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

  private findOptionByValue(value: unknown): T | null {
    if (value === null || value === undefined) return null;
    return this.suggestions().find((opt) => this.getValue(opt) === value) ?? null;
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
