import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, model, output, TemplateRef } from '@angular/core';
import { DgDropdown } from '../dropdown';
import { DgPaginationMode } from './pagination';
import {
  DgPaginatorInfoContext,
  DgPaginatorInfoData,
  DgPaginatorNavContext,
  DgPaginatorNavData,
  DgPaginatorPageSizeContext,
  DgPaginatorPageSizeData,
  DgPaginatorSlot,
} from './paginator-defs';

export interface DgPaginatorPageEvent {
  page: number;
  pageSize: number;
  first: number;
}

export interface DgPaginatorCursorEvent {
  direction: 'first' | 'prev' | 'next';
  pageSize: number;
}

@Component({
  selector: 'dg-paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DgDropdown, NgTemplateOutlet],
  template: `
    <div class="dg-paginator">
      @for (slot of slotOrder(); track slot) {
        @switch (slot) {
          @case ('info') {
            @if (infoTemplate(); as tpl) {
              <ng-container *ngTemplateOutlet="tpl; context: infoCtx()" />
            } @else {
              <div class="dg-paginator__info">
                @if (mode() === 'cursor') {
                  {{ pageSize() }} {{ rowsLabel() }}
                } @else if (total() > 0) {
                  {{ showingLabel() }} {{ rangeStart() }}–{{ rangeEnd() }} {{ ofLabel() }} {{ total() }}
                } @else {
                  {{ emptyLabel() }}
                }
              </div>
            }
          }

          @case ('nav') {
            @if (navTemplate(); as tpl) {
              <ng-container *ngTemplateOutlet="tpl; context: navCtx()" />
            } @else {
              <div class="dg-paginator__nav">
                @if (mode() !== 'cursor') {
                  <button
                    type="button"
                    class="dg-paginator__btn"
                    [disabled]="page() <= 1 || disabled()"
                    (click)="goTo(1)"
                    [attr.aria-label]="firstAriaLabel()"
                  >«</button>
                  <button
                    type="button"
                    class="dg-paginator__btn"
                    [disabled]="page() <= 1 || disabled()"
                    (click)="goTo(page() - 1)"
                    [attr.aria-label]="prevAriaLabel()"
                  >‹</button>

                  @for (p of pageWindow(); track p) {
                    @if (p === '…') {
                      <span class="dg-paginator__ellipsis">…</span>
                    } @else {
                      <button
                        type="button"
                        class="dg-paginator__btn"
                        [class.dg-paginator__btn--active]="p === page()"
                        [disabled]="disabled()"
                        (click)="goTo(+p)"
                      >{{ p }}</button>
                    }
                  }

                  <button
                    type="button"
                    class="dg-paginator__btn"
                    [disabled]="page() >= totalPages() || disabled()"
                    (click)="goTo(page() + 1)"
                    [attr.aria-label]="nextAriaLabel()"
                  >›</button>
                  <button
                    type="button"
                    class="dg-paginator__btn"
                    [disabled]="page() >= totalPages() || disabled()"
                    (click)="goTo(totalPages())"
                    [attr.aria-label]="lastAriaLabel()"
                  >»</button>
                } @else {
                  <button
                    type="button"
                    class="dg-paginator__btn"
                    [disabled]="cursorPrevDisabled() || disabled()"
                    (click)="emitCursor('first')"
                    [attr.aria-label]="firstAriaLabel()"
                  >«</button>
                  <button
                    type="button"
                    class="dg-paginator__btn"
                    [disabled]="cursorPrevDisabled() || disabled()"
                    (click)="emitCursor('prev')"
                    [attr.aria-label]="prevAriaLabel()"
                  >‹</button>
                  <button
                    type="button"
                    class="dg-paginator__btn"
                    [disabled]="cursorNextDisabled() || disabled()"
                    (click)="emitCursor('next')"
                    [attr.aria-label]="nextAriaLabel()"
                  >›</button>
                }
              </div>
            }
          }

          @case ('pageSize') {
            @if (pageSizeTemplate(); as tpl) {
              <ng-container *ngTemplateOutlet="tpl; context: pageSizeCtx()" />
            } @else {
              <div class="dg-paginator__page-size">
                <span>{{ rowsLabel() }}</span>
                <dg-dropdown
                  size="small"
                  appendTo="body"
                  [options]="pageSizeOptions()"
                  [value]="pageSize()"
                  [disabled]="disabled()"
                  (selectedChange)="onPageSizeSelected($event)"
                />
              </div>
            }
          }
        }
      }
    </div>
  `,
  styleUrl: './paginator.scss',
})
export class DgPaginator {
  readonly mode = input.required<DgPaginationMode>();
  readonly page = model(1);
  readonly pageSize = model(10);
  readonly total = input(0);
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50, 100]);
  readonly disabled = input(false);
  readonly cursorPrevDisabled = input(false);
  readonly cursorNextDisabled = input(false);

  // Slot ordering
  readonly slotOrder = input<readonly DgPaginatorSlot[]>(['info', 'nav', 'pageSize']);

  // Per-slot template overrides (provided by parent table)
  readonly infoTemplate = input<TemplateRef<DgPaginatorInfoContext> | null>(null);
  readonly navTemplate = input<TemplateRef<DgPaginatorNavContext> | null>(null);
  readonly pageSizeTemplate = input<TemplateRef<DgPaginatorPageSizeContext> | null>(null);

  // Text label customization
  readonly rowsLabel = input('Rows');
  readonly showingLabel = input('Showing');
  readonly ofLabel = input('of');
  readonly emptyLabel = input('No records');
  readonly firstAriaLabel = input('First page');
  readonly prevAriaLabel = input('Previous page');
  readonly nextAriaLabel = input('Next page');
  readonly lastAriaLabel = input('Last page');

  readonly pageEvent = output<DgPaginatorPageEvent>();
  readonly cursorEvent = output<DgPaginatorCursorEvent>();

  protected readonly totalPages = computed(() => {
    const t = this.total();
    const ps = this.pageSize();
    return ps > 0 ? Math.max(1, Math.ceil(t / ps)) : 1;
  });

  protected readonly rangeStart = computed(() => {
    if (this.total() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  });

  protected readonly rangeEnd = computed(() => Math.min(this.total(), this.page() * this.pageSize()));

  protected readonly pageWindow = computed<(number | '…')[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const out: (number | '…')[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) out.push('…');
    for (let i = start; i <= end; i++) out.push(i);
    if (end < total - 1) out.push('…');
    out.push(total);
    return out;
  });

  protected readonly infoCtx = computed<DgPaginatorInfoContext>(() => {
    const data: DgPaginatorInfoData = {
      rangeStart: this.rangeStart(),
      rangeEnd: this.rangeEnd(),
      total: this.total(),
      page: this.page(),
      pageSize: this.pageSize(),
      totalPages: this.totalPages(),
      mode: this.mode(),
    };
    return { $implicit: data, ...data };
  });

  protected readonly navCtx = computed<DgPaginatorNavContext>(() => {
    const data: DgPaginatorNavData = {
      mode: this.mode(),
      page: this.page(),
      totalPages: this.totalPages(),
      pageWindow: this.pageWindow(),
      disabled: this.disabled(),
      goToPage: (n: number) => this.goTo(n),
      cursorFirst: () => this.emitCursor('first'),
      cursorPrev: () => this.emitCursor('prev'),
      cursorNext: () => this.emitCursor('next'),
      cursorPrevDisabled: this.cursorPrevDisabled(),
      cursorNextDisabled: this.cursorNextDisabled(),
    };
    return { $implicit: data, ...data };
  });

  protected readonly pageSizeCtx = computed<DgPaginatorPageSizeContext>(() => {
    const data: DgPaginatorPageSizeData = {
      pageSize: this.pageSize(),
      options: this.pageSizeOptions(),
      disabled: this.disabled(),
      setPageSize: (size: number) => this.onPageSizeSelected(size),
    };
    return { $implicit: data, ...data };
  });

  protected goTo(target: number): void {
    const clamped = Math.max(1, Math.min(target, this.totalPages()));
    if (clamped === this.page()) return;
    this.page.set(clamped);
    const pageSize = this.pageSize();
    this.pageEvent.emit({ page: clamped, pageSize, first: (clamped - 1) * pageSize });
  }

  protected emitCursor(direction: DgPaginatorCursorEvent['direction']): void {
    this.cursorEvent.emit({ direction, pageSize: this.pageSize() });
  }

  protected onPageSizeSelected(opt: number | null): void {
    if (opt == null || opt === this.pageSize()) return;
    this.pageSize.set(opt);
    if (this.mode() === 'cursor') {
      this.cursorEvent.emit({ direction: 'first', pageSize: opt });
    } else {
      this.page.set(1);
      this.pageEvent.emit({ page: 1, pageSize: opt, first: 0 });
    }
  }
}
