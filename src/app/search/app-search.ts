import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DgInputText } from 'dungeon-ui';
import { SEARCH_INDEX, SearchEntry } from './search-index';

@Component({
  selector: 'app-search',
  imports: [DgInputText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-search">
      <dg-input-text
        #search
        fluid
        size="small"
        placeholder="Tìm trong tài liệu…"
        [value]="query()"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (keydown)="onKeyDown($event)"
      />

      @if (open() && results().length > 0) {
        <div class="app-search__panel" role="listbox">
          @for (entry of results(); track entry.route + entry.title; let i = $index) {
            <button
              type="button"
              class="app-search__row"
              role="option"
              [attr.aria-selected]="i === highlightedIndex()"
              [class.app-search__row--active]="i === highlightedIndex()"
              (mouseenter)="highlightedIndex.set(i)"
              (mousedown)="$event.preventDefault()"
              (click)="select(entry)"
            >
              <span class="app-search__page">{{ entry.page }}</span>
              <span class="app-search__title">{{ entry.title }}</span>
              @if (entry.hint) {
                <span class="app-search__hint">{{ entry.hint }}</span>
              }
            </button>
          }
        </div>
      } @else if (open() && query().trim().length > 0) {
        <div class="app-search__panel app-search__panel--empty">
          Không tìm thấy kết quả cho "<strong>{{ query() }}</strong>"
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; position: relative; }

      .app-search {
        position: relative;
      }

      .app-search__panel {
        position: absolute;
        top: calc(100% + 0.25rem);
        left: 0;
        right: 0;
        max-height: 22rem;
        overflow-y: auto;
        z-index: 1100;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06);
        padding: 0.25rem;
      }

      .app-search__panel--empty {
        padding: 0.75rem 0.875rem;
        font-size: 0.8125rem;
        color: #64748b;
      }

      .app-search__row {
        appearance: none;
        background: transparent;
        border: 0;
        width: 100%;
        text-align: left;
        cursor: pointer;
        padding: 0.4375rem 0.625rem;
        border-radius: 0.375rem;
        display: grid;
        grid-template-columns: auto 1fr;
        column-gap: 0.5rem;
        align-items: baseline;
        font: inherit;
        color: inherit;
        transition: background-color 80ms ease;
      }

      .app-search__row:hover,
      .app-search__row--active {
        background: #f1f5f9;
      }

      .app-search__page {
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #2563eb;
        white-space: nowrap;
      }

      .app-search__title {
        font-size: 0.875rem;
        color: #0f172a;
      }

      .app-search__hint {
        grid-column: 2;
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 0.125rem;
      }
    `,
  ],
})
export class AppSearch {
  private readonly router = inject(Router);
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly searchInput = viewChild<DgInputText>('search');

  protected readonly query = signal('');
  protected readonly open = signal(false);
  protected readonly highlightedIndex = signal(0);

  protected readonly results = computed<readonly SearchEntry[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return SEARCH_INDEX.slice(0, 10); // top items when empty + focused
    const tokens = q.split(/\s+/).filter(Boolean);
    return SEARCH_INDEX.filter((entry) => {
      const haystack = `${entry.page} ${entry.title} ${entry.keywords ?? ''} ${entry.hint ?? ''}`.toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  });

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.open.set(true);
    this.highlightedIndex.set(0);
  }

  protected onFocus(): void {
    this.open.set(true);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    const list = this.results();
    if (key === 'ArrowDown') {
      event.preventDefault();
      if (list.length === 0) return;
      this.highlightedIndex.update((i) => (i + 1) % list.length);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      if (list.length === 0) return;
      this.highlightedIndex.update((i) => (i - 1 + list.length) % list.length);
    } else if (key === 'Enter') {
      event.preventDefault();
      const entry = list[this.highlightedIndex()];
      if (entry) this.select(entry);
    } else if (key === 'Escape') {
      event.preventDefault();
      this.open.set(false);
      this.query.set('');
    }
  }

  protected select(entry: SearchEntry): void {
    this.router.navigateByUrl(entry.route);
    this.open.set(false);
    this.query.set('');
    this.highlightedIndex.set(0);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node;
    if (this.hostRef.nativeElement.contains(target)) return;
    this.open.set(false);
  }
}
