import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  DgButton,
  DgColumnDef,
  DgCursorChangeEvent,
  DgDropdown,
  DgPageChangeEvent,
  DgPaginatorInfoDef,
  DgPaginatorNavDef,
  DgTable,
  DgTableBottomAnchor,
  DgTableColumn,
  DgTablePaginatorDef,
} from 'dungeon-ui';

interface TableRow extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'error' | 'archived';
  amount: number;
  role: string;
  department: string;
  joinedAt: string;
}

@Component({
  selector: 'app-table-page',
  imports: [
    DgTable,
    DgTableBottomAnchor,
    DgColumnDef,
    DgButton,
    DgDropdown,
    DgTablePaginatorDef,
    DgPaginatorInfoDef,
    DgPaginatorNavDef,
    DecimalPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Table</h1>
      <p>Virtual scroll, pagination (client / server / cursor), bottom-anchor sizing, paginator slots.</p>
    </header>

    <section>
      <h2>Pagination FE (client mode, {{ clientRows.length | number }} rows)</h2>
      <dg-table
        [value]="clientRows"
        [columns]="tableColumns"
        pagination="client"
        [pageSizeOptions]="[10, 25, 50]"
        [trackBy]="trackById"
      >
        <ng-template dgColumn="status" let-row>
          <span class="status-badge" [attr.data-status]="row.status">{{ row.status }}</span>
        </ng-template>
      </dg-table>
    </section>

    <section>
      <h2>Pagination BE (server mode, simulated API)</h2>
      <p class="hint">
        Last call: <strong>{{ serverLastEvent() ? 'page=' + serverLastEvent()!.page + ', size=' + serverLastEvent()!.pageSize + ', first=' + serverLastEvent()!.first : '—' }}</strong>
      </p>
      <dg-table
        [value]="serverPageRows()"
        [columns]="tableColumns"
        pagination="server"
        [totalRecords]="serverTotal()"
        [loading]="serverLoading()"
        [pageSizeOptions]="[10, 25, 50]"
        [trackBy]="trackById"
        (pageChange)="onServerPageChange($event)"
      >
        <ng-template dgColumn="status" let-row>
          <span class="status-badge" [attr.data-status]="row.status">{{ row.status }}</span>
        </ng-template>
      </dg-table>
    </section>

    <section>
      <h2>Pagination cursor (id-pivot, simulated API)</h2>
      <p class="hint">
        Last call:
        <strong>
          {{ cursorLastEvent()
            ? 'cursor=' + (cursorLastEvent()!.cursor ?? 'null') + ', size=' + cursorLastEvent()!.pageSize + ', dir=' + cursorLastEvent()!.direction
            : '—' }}
        </strong>
      </p>
      <dg-table
        [value]="cursorPageRows()"
        [columns]="tableColumns"
        pagination="cursor"
        cursorField="id"
        [pageSize]="cursorPageSize()"
        (pageSizeChange)="cursorPageSize.set($event)"
        [pageSizeOptions]="[10, 20, 50]"
        [cursorPrevDisabled]="cursorPrevDisabled()"
        [cursorNextDisabled]="cursorNextDisabled()"
        [loading]="cursorLoading()"
        [trackBy]="trackById"
        (cursorChange)="onCursorChange($event)"
      >
        <ng-template dgColumn="status" let-row>
          <span class="status-badge" [attr.data-status]="row.status">{{ row.status }}</span>
        </ng-template>
      </dg-table>
    </section>

    <section>
      <h2>bottomAnchor (auto fit to anchor)</h2>
      <p class="hint">
        Bấm <strong>+</strong> / <strong>−</strong> để đổi chiều cao container. Table tự co/dãn để
        đáy chạm element <code>dgTableBottomAnchor</code>; virtual scroll tính lại
        <code>visibleCount</code> theo height mới.
      </p>
      <div class="row" style="margin-bottom: 0.5rem">
        <dg-button label="− 60px" size="small" variant="outlined" (clicked)="resizeAnchorPanel(-60)" />
        <dg-button label="+ 60px" size="small" variant="outlined" (clicked)="resizeAnchorPanel(60)" />
        <span class="hint">container height: <strong>{{ anchorPanelHeight() }}px</strong></span>
      </div>
      <div class="anchor-panel" [style.height.px]="anchorPanelHeight()">
        <div class="anchor-panel__heading">Header trên cùng — chiếm chỗ phía trên table</div>
        <dg-table
          [value]="tableRows()"
          [columns]="tableColumns"
          [rowHeight]="36"
          virtualScroll
          [bottomAnchor]="bottomAnchor"
          [trackBy]="trackById"
        >
          <ng-template dgColumn="status" let-row>
            <span class="status-badge" [attr.data-status]="row.status">{{ row.status }}</span>
          </ng-template>
        </dg-table>
        <div #bottomAnchor="dgTableBottomAnchor" [dgTableBottomAnchor]="12" class="anchor-panel__footer">
          Footer (anchor) — table luôn dừng ở đây, cách 12px.
        </div>
      </div>
    </section>

    <section>
      <h2>Paginator: text labels (i18n)</h2>
      <p class="hint">Đổi text các label qua input <code>showingLabel</code>, <code>ofLabel</code>, <code>rowsLabel</code>, <code>emptyLabel</code>.</p>
      <dg-table
        [value]="clientRows"
        [columns]="tableColumns"
        pagination="client"
        [pageSizeOptions]="[10, 25, 50]"
        [trackBy]="trackById"
        showingLabel="Hiển thị"
        ofLabel="trên"
        rowsLabel="Dòng"
        emptyLabel="Không có dữ liệu"
      >
        <ng-template dgColumn="status" let-row>
          <span class="status-badge" [attr.data-status]="row.status">{{ row.status }}</span>
        </ng-template>
      </dg-table>
    </section>

    <section>
      <h2>Paginator: đổi vị trí slot (pageSize → nav → info)</h2>
      <p class="hint">Đảo thứ tự thông qua <code>slotOrder</code> input.</p>
      <dg-table
        [value]="clientRows"
        [columns]="tableColumns"
        pagination="client"
        [pageSizeOptions]="[10, 25, 50]"
        [trackBy]="trackById"
        [slotOrder]="['pageSize', 'nav', 'info']"
      >
        <ng-template dgColumn="status" let-row>
          <span class="status-badge" [attr.data-status]="row.status">{{ row.status }}</span>
        </ng-template>
      </dg-table>
    </section>

    <section>
      <h2>Paginator: customize từng slot</h2>
      <p class="hint">
        Override slot <code>info</code> + <code>nav</code> bằng <code>&lt;ng-template dgPaginatorInfo&gt;</code> /
        <code>dgPaginatorNav</code>; slot <code>pageSize</code> giữ default.
      </p>
      <dg-table
        [value]="clientRows"
        [columns]="tableColumns"
        pagination="client"
        [pageSizeOptions]="[10, 25, 50]"
        [trackBy]="trackById"
      >
        <ng-template dgColumn="status" let-row>
          <span class="status-badge" [attr.data-status]="row.status">{{ row.status }}</span>
        </ng-template>

        <ng-template dgPaginatorInfo let-ctx>
          <div class="custom-info">
            📊 Trang <strong>{{ ctx.page }}</strong> / {{ ctx.totalPages }}
            (<em>{{ ctx.rangeStart }}–{{ ctx.rangeEnd }}</em> trên {{ ctx.total }} bản ghi)
          </div>
        </ng-template>

        <ng-template dgPaginatorNav let-ctx>
          <div class="custom-nav">
            <dg-button label="← Trước" variant="text" size="small" [disabled]="ctx.page <= 1" (clicked)="ctx.goToPage(ctx.page - 1)" />
            <span class="custom-nav__page">{{ ctx.page }} / {{ ctx.totalPages }}</span>
            <dg-button label="Sau →" variant="text" size="small" [disabled]="ctx.page >= ctx.totalPages" (clicked)="ctx.goToPage(ctx.page + 1)" />
          </div>
        </ng-template>
      </dg-table>
    </section>

    <section>
      <h2>Paginator: thay thế toàn bộ qua <code>dgTablePaginator</code></h2>
      <p class="hint">
        Khi cần kiểm soát hoàn toàn (dùng button của dự án, layout khác), dùng template
        <code>&lt;ng-template dgTablePaginator&gt;</code> để thay thế cả paginator.
      </p>
      <dg-table
        [value]="clientRows"
        [columns]="tableColumns"
        pagination="client"
        [pageSizeOptions]="[10, 25, 50]"
        [trackBy]="trackById"
      >
        <ng-template dgColumn="status" let-row>
          <span class="status-badge" [attr.data-status]="row.status">{{ row.status }}</span>
        </ng-template>

        <ng-template dgTablePaginator let-ctx>
          <div class="full-custom-pager">
            <span>
              Bạn đang ở trang
              <strong>{{ ctx.page }}</strong>
              của <strong>{{ ctx.totalPages }}</strong>
              ({{ ctx.total }} bản ghi · {{ ctx.pageSize }}/trang)
            </span>
            <div class="full-custom-pager__actions">
              <dg-button label="Đầu" size="small" variant="outlined" [disabled]="ctx.page === 1" (clicked)="ctx.goToPage(1)" />
              <dg-button label="Trước" size="small" severity="secondary" [disabled]="ctx.page === 1" (clicked)="ctx.goToPage(ctx.page - 1)" />
              <dg-button label="Sau" size="small" severity="secondary" [disabled]="ctx.page === ctx.totalPages" (clicked)="ctx.goToPage(ctx.page + 1)" />
              <dg-button label="Cuối" size="small" variant="outlined" [disabled]="ctx.page === ctx.totalPages" (clicked)="ctx.goToPage(ctx.totalPages)" />
              <dg-dropdown
                size="small"
                appendTo="body"
                [options]="ctx.options"
                [value]="ctx.pageSize"
                (selectedChange)="ctx.setPageSize($any($event))"
              />
            </div>
          </div>
        </ng-template>
      </dg-table>
    </section>

    <section>
      <h2>Small dataset (no virtual scroll)</h2>
      <dg-table [value]="smallTableRows()" [columns]="tableColumns" [rowHeight]="36" [trackBy]="trackById" />
    </section>

    <section>
      <h2>Virtual scroll over {{ tableRows().length | number }} rows</h2>
      <div class="row" style="margin-bottom: 0.75rem">
        <dg-button label="1k" variant="outlined" size="small" (clicked)="reseed(1000)" />
        <dg-button label="10k" variant="outlined" size="small" (clicked)="reseed(10000)" />
        <dg-button label="100k" variant="outlined" size="small" (clicked)="reseed(100000)" />
        <dg-button label="Jump to 5000" size="small" severity="info" (clicked)="scrollTo(5000, bigTable)" />
        <dg-button label="Jump to last" size="small" severity="info" (clicked)="scrollTo(tableRows().length - 1, bigTable)" />
      </div>
      <dg-table
        #bigTable
        [value]="tableRows()"
        [columns]="tableColumns"
        [rowHeight]="36"
        scrollHeight="400px"
        virtualScroll
        [trackBy]="trackById"
      >
        <ng-template dgColumn="status" let-row>
          <span class="status-badge" [attr.data-status]="row.status">{{ row.status }}</span>
        </ng-template>
        <ng-template dgColumn="name" let-row let-i="index">
          <strong>#{{ i + 1 }}</strong>&nbsp;&middot;&nbsp;{{ row.name }}
        </ng-template>
      </dg-table>
    </section>
  `,
})
export class TablePage {
  protected readonly tableColumns: DgTableColumn<TableRow>[] = [
    { field: 'id', header: 'ID', width: '70px', align: 'right' },
    { field: 'name', header: 'Name', width: '1.4fr' },
    { field: 'email', header: 'Email', width: '1.6fr' },
    { field: 'role', header: 'Role', width: '120px' },
    { field: 'department', header: 'Dept', width: '120px' },
    { field: 'status', header: 'Status', width: '120px' },
    { field: 'joinedAt', header: 'Joined', width: '110px' },
    { field: 'amount', header: 'Amount', width: '120px', align: 'right', formatter: (r) => `$${r.amount.toFixed(2)}` },
  ];

  protected readonly tableRows = signal<TableRow[]>(generateRows(10_000));
  protected readonly smallTableRows = computed(() => this.tableRows().slice(0, 8));

  private readonly serverMaster = generateRows(523);
  protected readonly clientRows = this.serverMaster.slice(0);

  protected readonly serverPageRows = signal<TableRow[]>([]);
  protected readonly serverTotal = signal(this.serverMaster.length);
  protected readonly serverLoading = signal(false);
  protected readonly serverLastEvent = signal<DgPageChangeEvent | null>(null);

  protected readonly cursorPageRows = signal<TableRow[]>([]);
  protected readonly cursorPageSize = signal(20);
  protected readonly cursorPrevDisabled = signal(true);
  protected readonly cursorNextDisabled = signal(false);
  protected readonly cursorLoading = signal(false);
  protected readonly cursorLastEvent = signal<DgCursorChangeEvent | null>(null);

  protected readonly anchorPanelHeight = signal(420);

  constructor() {
    this.onServerPageChange({ page: 1, pageSize: 10, first: 0 });
    this.onCursorChange({ direction: 'first', cursor: null, pageSize: this.cursorPageSize() });
  }

  protected readonly trackById = (_: number, row: TableRow): number => row.id;

  protected scrollTo(index: number, table: DgTable<TableRow>): void {
    table.scrollToIndex(index);
  }

  protected reseed(count: number): void {
    this.tableRows.set(generateRows(count));
  }

  protected resizeAnchorPanel(delta: number): void {
    this.anchorPanelHeight.update((h) => Math.max(160, Math.min(720, h + delta)));
  }

  protected onServerPageChange(event: DgPageChangeEvent): void {
    this.serverLastEvent.set(event);
    this.serverLoading.set(true);
    setTimeout(() => {
      const start = (event.page - 1) * event.pageSize;
      this.serverPageRows.set(this.serverMaster.slice(start, start + event.pageSize));
      this.serverLoading.set(false);
    }, 350);
  }

  protected onCursorChange(event: DgCursorChangeEvent): void {
    this.cursorLastEvent.set(event);
    this.cursorLoading.set(true);
    setTimeout(() => {
      const sorted = this.serverMaster;
      const size = event.pageSize;
      let startIdx: number;

      if (event.direction === 'first' || event.cursor == null) {
        startIdx = 0;
      } else if (event.direction === 'next') {
        const cursorId = event.cursor as number;
        const idx = sorted.findIndex((r) => r.id === cursorId);
        startIdx = idx >= 0 ? idx + 1 : 0;
      } else {
        const cursorId = event.cursor as number;
        const idx = sorted.findIndex((r) => r.id === cursorId);
        startIdx = Math.max(0, (idx >= 0 ? idx : 0) - size);
      }

      const slice = sorted.slice(startIdx, startIdx + size);
      this.cursorPageRows.set(slice);
      this.cursorPrevDisabled.set(startIdx === 0);
      this.cursorNextDisabled.set(startIdx + size >= sorted.length);
      this.cursorLoading.set(false);
    }, 350);
  }
}

const FIRST_NAMES = [
  'An', 'Bình', 'Châu', 'Diệp', 'Dũng', 'Giang', 'Hà', 'Hải', 'Hoàng', 'Hùng',
  'Khánh', 'Lan', 'Linh', 'Long', 'Mai', 'Minh', 'Nam', 'Ngọc', 'Nhi', 'Oanh',
  'Phong', 'Phương', 'Quân', 'Quỳnh', 'Sơn', 'Tâm', 'Thảo', 'Thư', 'Trang', 'Trung',
  'Tuấn', 'Tú', 'Uyên', 'Vinh', 'Vy', 'Yến',
];
const LAST_NAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đào', 'Đoàn', 'Mai', 'Trịnh',
];
const ROLES = ['Engineer', 'Sr. Engineer', 'Lead', 'Designer', 'PM', 'QA', 'DevOps', 'Manager', 'Director', 'Intern'];
const DEPARTMENTS = ['Platform', 'Mobile', 'Web', 'Data', 'Infra', 'Sales', 'Marketing', 'Finance', 'HR', 'Support'];
const STATUSES: TableRow['status'][] = ['active', 'pending', 'error', 'archived'];

function generateRows(count: number): TableRow[] {
  const out: TableRow[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 7) % LAST_NAMES.length];
    const slug = stripDiacritics(`${first}.${last}${i + 1}`).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const year = 2018 + ((i * 13) % 7);
    const month = ((i * 5) % 12) + 1;
    const day = ((i * 17) % 28) + 1;
    out[i] = {
      id: i + 1,
      name: `${last} ${first}`,
      email: `${slug}@dungeon.dev`,
      role: ROLES[(i * 3) % ROLES.length],
      department: DEPARTMENTS[(i * 11) % DEPARTMENTS.length],
      status: STATUSES[(i * 29) % STATUSES.length],
      joinedAt: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      amount: Math.round((500 + Math.random() * 99_500) * 100) / 100,
    };
  }
  return out;
}

function stripDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}
