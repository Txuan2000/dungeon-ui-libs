import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { DgCursorChangeEvent, DgPageChangeEvent, DgPaginationMode } from './pagination';
import { DgTableBottomAnchor } from './table-bottom-anchor';
import {
  DgPaginatorInfoDef,
  DgPaginatorNavDef,
  DgPaginatorPageSizeDef,
  DgTablePaginatorContext,
  DgTablePaginatorData,
  DgTablePaginatorDef,
} from './paginator-defs';
import { DgPaginator, DgPaginatorCursorEvent, DgPaginatorPageEvent } from './paginator';
import { DgColumnDef, DgTableColumn } from './table-defs';

@Component({
  selector: 'dg-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, DgPaginator],
  template: `
    <div
      class="dg-table"
      [style.height]="effectiveScrollHeight() ?? null"
      [style.min-height]="minHeight()"
    >
      <div class="dg-table__header" [style.grid-template-columns]="gridTemplate()">
        @for (col of columns(); track col.field) {
          <div
            class="dg-table__hcell"
            [style.text-align]="col.align ?? null"
            [attr.data-field]="col.field"
          >
            {{ col.header }}
          </div>
        }
      </div>

      <div #viewport class="dg-table__viewport" (scroll)="onScroll($event)">
        @if (virtualScroll()) {
          <div class="dg-table__spacer" [style.height.px]="totalHeight()">
            <div class="dg-table__rows" [style.transform]="'translateY(' + offsetY() + 'px)'">
              @for (row of visibleRows(); track trackByFn($index + startIndex(), row); let i = $index) {
                <div
                  class="dg-table__row"
                  [style.height.px]="rowHeight()"
                  [style.grid-template-columns]="gridTemplate()"
                >
                  @for (col of columns(); track col.field) {
                    <div class="dg-table__cell" [style.text-align]="col.align ?? null">
                      <ng-container
                        *ngTemplateOutlet="
                          cellTemplates().get(col.field) ?? defaultCell;
                          context: cellContext(row, startIndex() + i, col)
                        "
                      />
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="dg-table__rows">
            @for (row of displayedRows(); track trackByFn($index, row); let i = $index) {
              <div
                class="dg-table__row"
                [style.height.px]="rowHeight()"
                [style.grid-template-columns]="gridTemplate()"
              >
                @for (col of columns(); track col.field) {
                  <div class="dg-table__cell" [style.text-align]="col.align ?? null">
                    <ng-container
                      *ngTemplateOutlet="
                        cellTemplates().get(col.field) ?? defaultCell;
                        context: cellContext(row, i, col)
                      "
                    />
                  </div>
                }
              </div>
            }
          </div>
        }

        @if (loading()) {
          <div class="dg-table__loading" aria-live="polite">
            <span class="dg-table__loading-dot"></span>
            <span class="dg-table__loading-dot"></span>
            <span class="dg-table__loading-dot"></span>
          </div>
        }
      </div>

      @if (pagination() !== 'none') {
        @if (tablePaginatorDef(); as def) {
          <ng-container *ngTemplateOutlet="def.templateRef; context: paginatorCtx()" />
        } @else {
          <dg-paginator
            [mode]="pagination()"
            [(page)]="currentPage"
            [(pageSize)]="pageSize"
            [total]="paginatorTotal()"
            [pageSizeOptions]="pageSizeOptions()"
            [disabled]="loading()"
            [cursorPrevDisabled]="cursorPrevDisabled()"
            [cursorNextDisabled]="cursorNextDisabled()"
            [slotOrder]="slotOrder()"
            [infoTemplate]="paginatorInfoDef()?.templateRef ?? null"
            [navTemplate]="paginatorNavDef()?.templateRef ?? null"
            [pageSizeTemplate]="paginatorPageSizeDef()?.templateRef ?? null"
            [rowsLabel]="rowsLabel()"
            [showingLabel]="showingLabel()"
            [ofLabel]="ofLabel()"
            [emptyLabel]="emptyLabel()"
            (pageEvent)="onPageEvent($event)"
            (cursorEvent)="onCursorEvent($event)"
          />
        }
      }

      <ng-template #defaultCell let-value="value" let-row let-col="column">
        {{ col.formatter ? col.formatter(row) : (value ?? '') }}
      </ng-template>
    </div>
  `,
  styleUrl: './table.scss',
})
export class DgTable<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly value = input<readonly T[]>([]);
  readonly columns = input.required<readonly DgTableColumn<T>[]>();
  readonly rowHeight = input(36);
  readonly scrollHeight = input<string>();
  readonly virtualScroll = input(false, { transform: booleanish });
  readonly bufferSize = input(5);
  readonly trackBy = input<((index: number, row: T) => unknown) | undefined>();
  readonly bottomAnchor = input<DgTableBottomAnchor | ElementRef<HTMLElement> | HTMLElement | null>(null);
  readonly minHeight = input<string>('350px');

  readonly pagination = input<DgPaginationMode>('none');
  readonly pageSize = model(10);
  readonly currentPage = model(1);
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50, 100]);
  readonly totalRecords = input<number>();
  readonly loading = input(false, { transform: booleanish });
  readonly cursorField = input<string>();
  readonly cursorPrevDisabled = input(false, { transform: booleanish });
  readonly cursorNextDisabled = input(false, { transform: booleanish });

  // Paginator slot order + label customization (forwarded to dg-paginator)
  readonly slotOrder = input<readonly ('info' | 'nav' | 'pageSize')[]>(['info', 'nav', 'pageSize']);
  readonly rowsLabel = input('Rows');
  readonly showingLabel = input('Showing');
  readonly ofLabel = input('of');
  readonly emptyLabel = input('No records');

  readonly pageChange = output<DgPageChangeEvent>();
  readonly cursorChange = output<DgCursorChangeEvent>();

  private readonly columnDefs = contentChildren(DgColumnDef);
  protected readonly tablePaginatorDef = contentChild(DgTablePaginatorDef);
  protected readonly paginatorInfoDef = contentChild(DgPaginatorInfoDef);
  protected readonly paginatorNavDef = contentChild(DgPaginatorNavDef);
  protected readonly paginatorPageSizeDef = contentChild(DgPaginatorPageSizeDef);

  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly scrollTop = signal(0);
  private readonly anchorHeight = signal<number | null>(null);

  protected readonly effectiveScrollHeight = computed<string | undefined>(() => {
    const ah = this.anchorHeight();
    const minPx = parsePx(this.minHeight());
    if (ah !== null) return `${Math.max(ah, minPx)}px`;
    return this.scrollHeight();
  });

  protected readonly cellTemplates = computed(() => {
    const map = new Map<string, TemplateRef<unknown>>();
    for (const def of this.columnDefs()) {
      map.set(def.field(), def.templateRef);
    }
    return map;
  });

  protected readonly gridTemplate = computed(() =>
    this.columns()
      .map((c) => c.width ?? '1fr')
      .join(' '),
  );

  protected readonly displayedRows = computed<readonly T[]>(() => {
    if (this.pagination() === 'client') {
      const p = this.currentPage();
      const ps = this.pageSize();
      return this.value().slice((p - 1) * ps, p * ps);
    }
    return this.value();
  });

  protected readonly paginatorTotal = computed(() => {
    const mode = this.pagination();
    if (mode === 'client') return this.value().length;
    if (mode === 'server') return this.totalRecords() ?? 0;
    return 0;
  });

  protected readonly totalPages = computed(() => {
    const t = this.paginatorTotal();
    const ps = this.pageSize();
    return ps > 0 ? Math.max(1, Math.ceil(t / ps)) : 1;
  });

  protected readonly pageWindow = computed<(number | '…')[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out: (number | '…')[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) out.push('…');
    for (let i = start; i <= end; i++) out.push(i);
    if (end < total - 1) out.push('…');
    out.push(total);
    return out;
  });

  protected readonly paginatorCtx = computed<DgTablePaginatorContext>(() => {
    const total = this.paginatorTotal();
    const page = this.currentPage();
    const pageSize = this.pageSize();
    const totalPages = this.totalPages();
    const data: DgTablePaginatorData = {
      mode: this.pagination(),
      page,
      pageSize,
      total,
      totalPages,
      rangeStart: total === 0 ? 0 : (page - 1) * pageSize + 1,
      rangeEnd: Math.min(total, page * pageSize),
      pageWindow: this.pageWindow(),
      loading: this.loading(),
      options: this.pageSizeOptions(),
      cursorPrevDisabled: this.cursorPrevDisabled(),
      cursorNextDisabled: this.cursorNextDisabled(),
      goToPage: (n: number) => this.goToPageProgrammatic(n),
      setPageSize: (s: number) => this.setPageSizeProgrammatic(s),
      cursorFirst: () => this.emitCursorProgrammatic('first'),
      cursorPrev: () => this.emitCursorProgrammatic('prev'),
      cursorNext: () => this.emitCursorProgrammatic('next'),
    };
    return { $implicit: data, ...data };
  });

  protected readonly totalHeight = computed(() => this.displayedRows().length * this.rowHeight());

  private readonly viewportHeight = computed(() => {
    const raw = this.effectiveScrollHeight();
    const minPx = parsePx(this.minHeight());
    let h = 400;
    if (raw) {
      const px = parseFloat(raw);
      if (Number.isFinite(px)) h = px;
    }
    return Math.max(h, minPx);
  });

  protected readonly visibleCount = computed(() => {
    const visible = Math.ceil(this.viewportHeight() / this.rowHeight());
    return visible + this.bufferSize() * 2;
  });

  protected readonly startIndex = computed(() => {
    const raw = Math.floor(this.scrollTop() / this.rowHeight()) - this.bufferSize();
    return Math.max(0, raw);
  });

  protected readonly endIndex = computed(() =>
    Math.min(this.displayedRows().length, this.startIndex() + this.visibleCount()),
  );

  protected readonly offsetY = computed(() => this.startIndex() * this.rowHeight());

  protected readonly visibleRows = computed(() => this.displayedRows().slice(this.startIndex(), this.endIndex()));

  constructor() {
    effect(() => {
      this.pagination();
      this.pageSize();
      this.currentPage();
      const v = this.viewport();
      if (v) v.nativeElement.scrollTop = 0;
      this.scrollTop.set(0);
    });

    // Bottom-anchor: observe layout changes and recompute table height
    // so the table always extends from its top to the anchor's top.
    effect((onCleanup) => {
      const resolved = this.resolveAnchor();
      if (!resolved) {
        this.anchorHeight.set(null);
        return;
      }
      if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return;

      const { el: anchor, offsetSignal } = resolved;
      const tableEl = this.hostRef.nativeElement;

      const update = (): void => {
        const tableRect = tableEl.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();
        const height = Math.max(0, anchorRect.top - tableRect.top - offsetSignal());
        this.anchorHeight.set(height);
      };

      update();
      const rafId = requestAnimationFrame(update);

      const ro = new ResizeObserver(update);
      ro.observe(document.body);
      if (anchor !== document.body) ro.observe(anchor);
      if (tableEl !== document.body) ro.observe(tableEl);
      window.addEventListener('resize', update);

      onCleanup(() => {
        cancelAnimationFrame(rafId);
        ro.disconnect();
        window.removeEventListener('resize', update);
      });
    });
  }

  private resolveAnchor(): { el: HTMLElement; offsetSignal: () => number } | null {
    const a = this.bottomAnchor();
    if (!a) return null;
    if (a instanceof DgTableBottomAnchor) {
      return { el: a.elementRef.nativeElement, offsetSignal: () => a.offset() };
    }
    if (typeof HTMLElement !== 'undefined' && a instanceof HTMLElement) {
      return { el: a, offsetSignal: () => 0 };
    }
    if ('nativeElement' in a && a.nativeElement) {
      return { el: a.nativeElement, offsetSignal: () => 0 };
    }
    return null;
  }

  protected readonly trackByFn = (index: number, row: T): unknown => {
    const fn = this.trackBy();
    return fn ? fn(index, row) : row;
  };

  protected onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    this.scrollTop.set(el.scrollTop);
  }

  scrollToIndex(index: number): void {
    const v = this.viewport();
    if (!v) return;
    v.nativeElement.scrollTop = index * this.rowHeight();
  }

  protected cellContext(row: T, index: number, column: DgTableColumn<T>) {
    const value = column.formatter ? column.formatter(row) : (row as Record<string, unknown>)[column.field];
    return { $implicit: row, value, index, column };
  }

  protected onPageEvent(event: DgPaginatorPageEvent): void {
    this.pageChange.emit(event);
  }

  protected onCursorEvent(event: DgPaginatorCursorEvent): void {
    const cursor = this.computeCursor(event.direction);
    this.cursorChange.emit({ cursor, pageSize: event.pageSize, direction: event.direction });
  }

  private computeCursor(direction: DgCursorChangeEvent['direction']): unknown | null {
    if (direction === 'first') return null;
    const rows = this.displayedRows();
    if (rows.length === 0) return null;
    const field = this.cursorField();
    const pivotRow = direction === 'next' ? rows[rows.length - 1] : rows[0];
    if (!pivotRow) return null;
    if (!field) return pivotRow;
    return (pivotRow as Record<string, unknown>)[field];
  }

  // ---- Programmatic methods used by full-paginator template ----

  private goToPageProgrammatic(target: number): void {
    const clamped = Math.max(1, Math.min(target, this.totalPages()));
    if (clamped === this.currentPage()) return;
    this.currentPage.set(clamped);
    const pageSize = this.pageSize();
    this.pageChange.emit({ page: clamped, pageSize, first: (clamped - 1) * pageSize });
  }

  private setPageSizeProgrammatic(size: number): void {
    if (!Number.isFinite(size) || size === this.pageSize()) return;
    this.pageSize.set(size);
    if (this.pagination() === 'cursor') {
      this.cursorChange.emit({ direction: 'first', cursor: null, pageSize: size });
    } else {
      this.currentPage.set(1);
      this.pageChange.emit({ page: 1, pageSize: size, first: 0 });
    }
  }

  private emitCursorProgrammatic(direction: DgCursorChangeEvent['direction']): void {
    const cursor = this.computeCursor(direction);
    this.cursorChange.emit({ cursor, pageSize: this.pageSize(), direction });
  }
}

function booleanish(value: boolean | string | null | undefined): boolean {
  return value === '' || value === true || value === 'true';
}

function parsePx(value: string | undefined | null): number {
  if (!value) return 0;
  const px = parseFloat(value);
  return Number.isFinite(px) ? px : 0;
}
