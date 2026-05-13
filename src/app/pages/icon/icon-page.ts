import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  DgButton,
  DgDialogService,
  DgIcon,
  DgIconField,
  DgInputIcon,
  DgInputText,
  DG_ICON_NAMES,
  type DgIconName,
} from 'dungeon-ui';
import { IconDetailDialog } from '../../demo-dialogs/icon-detail-dialog';

@Component({
  selector: 'app-icon-page',
  imports: [DgButton, DgIcon, DgIconField, DgInputIcon, DgInputText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Icon</h1>
      <p>54 inline SVG icons ported từ PrimeNG. Tất cả share viewBox <code>0 0 14 14</code>, dùng
      <code>currentColor</code> → màu kế thừa text, size scale theo px hoặc <code>1em</code>.</p>
    </header>

    <section>
      <h2>Gallery — click vào icon để tuỳ chỉnh & copy code</h2>
      <p class="hint">
        Mở dialog điều chỉnh size / màu / spin / aria-label và sinh sẵn snippet cho 3 cách dùng
        (<code>&lt;dg-icon&gt;</code>, <code>.dgi</code> mask-image, <code>.dgf</code> webfont).
      </p>

      <div class="gallery-toolbar">
        <dg-icon-field fluid>
          <dg-input-icon><dg-icon name="search" /></dg-input-icon>
          <dg-input-text fluid placeholder="Tìm icon… (vd. arrow, check, sort)" [(value)]="query" />
        </dg-icon-field>
        <span class="hint count">{{ filtered().length }} / {{ names.length }}</span>
      </div>

      <div class="grid-scroll">
        @if (filtered().length === 0) {
          <p class="empty">Không tìm thấy icon khớp "{{ query() }}".</p>
        } @else {
          <div class="grid">
            @for (name of filtered(); track name) {
              <button
                type="button"
                class="cell"
                (click)="openDetail(name)"
                [title]="'Mở dialog: ' + name"
              >
                <dg-icon [name]="name" [size]="20" />
                <span class="cell__name">{{ name }}</span>
              </button>
            }
          </div>
        }
      </div>
    </section>

    <section>
      <h2>Size</h2>
      <div class="row align-baseline">
        <dg-icon name="star" [size]="12" />
        <dg-icon name="star" [size]="16" />
        <dg-icon name="star" [size]="24" />
        <dg-icon name="star" [size]="32" />
        <dg-icon name="star" [size]="48" />
        <span class="hint">12 · 16 · 24 · 32 · 48 px</span>
      </div>
      <div class="row align-baseline">
        <span style="font-size: 14px">14px inline <dg-icon name="check" size="1em" /></span>
        <span style="font-size: 20px">20px inline <dg-icon name="check" size="1em" /></span>
        <span style="font-size: 32px">32px inline <dg-icon name="check" size="1em" /></span>
        <span class="hint">size=<code>"1em"</code> scales với font-size cha</span>
      </div>
    </section>

    <section>
      <h2>Màu — currentColor</h2>
      <div class="row align-baseline">
        <span style="color: #2563eb"><dg-icon name="info-circle" [size]="20" /> info</span>
        <span style="color: #16a34a"><dg-icon name="check" [size]="20" /> success</span>
        <span style="color: #f59e0b"><dg-icon name="exclamation-triangle" [size]="20" /> warn</span>
        <span style="color: #dc2626"><dg-icon name="times-circle" [size]="20" /> danger</span>
        <span style="color: #a855f7"><dg-icon name="star-fill" [size]="20" /> accent</span>
      </div>
    </section>

    <section>
      <h2>Spin</h2>
      <div class="row align-baseline">
        <dg-icon name="spinner" [size]="20" spin />
        <dg-icon name="refresh" [size]="20" spin />
        <dg-icon name="undo" [size]="20" spin />
        <span class="hint">prop <code>spin</code> apply 1s linear infinite rotation</span>
      </div>
    </section>

    <section>
      <h2>Compose vào nút</h2>
      <div class="row">
        <dg-button severity="primary" (clicked)="bump()"><dg-icon name="check" />Lưu</dg-button>
        <dg-button severity="danger" variant="outlined"><dg-icon name="trash" />Xoá</dg-button>
        <dg-button severity="secondary" variant="text"><dg-icon name="refresh" />Tải lại</dg-button>
        <dg-button severity="info"><dg-icon name="search" />Tìm</dg-button>
        <dg-button severity="contrast" rounded ariaLabel="Cài đặt"><dg-icon name="bars" /></dg-button>
      </div>
      <p class="hint">Đã bấm Lưu: <strong>{{ saveCount() }}</strong> lần</p>
    </section>

    <section>
      <h2>CSS class builds — không cần Angular</h2>
      <p>Cùng bộ icon được build ra 2 file CSS độc lập (xem
      <code>scripts/build-icon-artifacts.mjs</code>). Dùng trong plain HTML,
      email template, React/Vue, hoặc web component không có Angular.</p>

      <h3>1. Mask-image (<code>dg-icons.css</code>) — khuyến nghị</h3>
      <p class="hint">Class: <code>.dgi</code> + <code>.dgi-&lt;name&gt;</code>.
      Size 1em × 1em, màu = <code>currentColor</code> (qua background). Single
      CSS file ~150 KB (data-URI SVG inline).</p>
      <div class="row align-baseline" style="font-size: 24px; color: #1d4ed8">
        <i class="dgi dgi-check"></i>
        <i class="dgi dgi-search"></i>
        <i class="dgi dgi-trash"></i>
        <i class="dgi dgi-times"></i>
        <i class="dgi dgi-star-fill"></i>
        <i class="dgi dgi-bars"></i>
        <i class="dgi dgi-spinner dgi--spin"></i>
        <span class="hint" style="font-size: 14px; color: #64748b">font-size: 24px · color: #1d4ed8</span>
      </div>
      <pre class="code-snippet">&lt;link rel="stylesheet" href="https://dungeon-ui-cdn.pages.dev/icons/dg-icons.css"&gt;
&lt;i class="dgi dgi-check"&gt;&lt;/i&gt;
&lt;i class="dgi dgi-spinner dgi--spin"&gt;&lt;/i&gt;</pre>

      <h3>2. Webfont (<code>dg-icons-font.css</code>) — fallback</h3>
      <p class="hint">Class: <code>.dgf</code> + <code>.dgf-&lt;name&gt;</code>.
      Glyph trong PUA <code>U+E001…</code>, font ~11 KB TTF / 7 KB WOFF.
      Dùng khi mask-image không phù hợp (email, một số PDF pipeline, hoặc thích
      ergonomics kiểu PrimeIcons).</p>
      <div class="row align-baseline" style="font-size: 24px; color: #16a34a">
        <i class="dgf dgf-check"></i>
        <i class="dgf dgf-search"></i>
        <i class="dgf dgf-trash"></i>
        <i class="dgf dgf-times"></i>
        <i class="dgf dgf-star-fill"></i>
        <i class="dgf dgf-bars"></i>
        <i class="dgf dgf-spinner dgf--spin"></i>
        <span class="hint" style="font-size: 14px; color: #64748b">font-size: 24px · color: #16a34a</span>
      </div>
      <pre class="code-snippet">&lt;link rel="stylesheet" href="https://dungeon-ui-cdn.pages.dev/icons/dg-icons-font.css"&gt;
&lt;i class="dgf dgf-check"&gt;&lt;/i&gt;
&lt;i class="dgf dgf-spinner dgf--spin"&gt;&lt;/i&gt;</pre>

      <h3>So sánh</h3>
      <table class="cmp">
        <thead>
          <tr><th>Aspect</th><th>&lt;dg-icon&gt;</th><th>.dgi (mask)</th><th>.dgf (font)</th></tr>
        </thead>
        <tbody>
          <tr><td>Cần Angular</td><td>Có</td><td>Không</td><td>Không</td></tr>
          <tr><td>currentColor</td><td>fill</td><td>background</td><td>font color</td></tr>
          <tr><td>Resize</td><td>[size] px / em</td><td>font-size (1em)</td><td>font-size</td></tr>
          <tr><td>Spin</td><td>[spin]</td><td>.dgi--spin</td><td>.dgf--spin</td></tr>
          <tr><td>File size</td><td>~80 KB JS</td><td>~150 KB CSS</td><td>~11 KB TTF + 3 KB CSS</td></tr>
          <tr><td>Tree-shakable</td><td>Khi import name</td><td>Không (single file)</td><td>Không (single font)</td></tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>Accessibility</h2>
      <p>Mặc định <code>aria-hidden="true"</code> (decorative). Khi cần icon đứng một mình mang
      nghĩa, set <code>ariaLabel</code> — component sẽ chuyển sang <code>role="img"</code> +
      <code>aria-label</code>.</p>
      <div class="row align-baseline">
        <dg-icon name="info-circle" [size]="20" />
        <code>&lt;dg-icon name="info-circle" /&gt;</code>
        <span class="hint">decorative — screen reader bỏ qua</span>
      </div>
      <div class="row align-baseline">
        <dg-icon name="info-circle" [size]="20" ariaLabel="Thông tin" />
        <code>&lt;dg-icon name="info-circle" ariaLabel="Thông tin" /&gt;</code>
        <span class="hint">role="img" — screen reader đọc "Thông tin"</span>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 64rem;
      }

      header h1 {
        margin: 0 0 0.25rem;
      }
      header p {
        margin: 0;
        color: #475569;
      }

      section {
        margin-top: 2rem;
      }
      section h2 {
        font-size: 1.125rem;
        margin: 0 0 0.75rem;
      }

      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .row.align-baseline {
        align-items: baseline;
      }

      .hint {
        color: #64748b;
        font-size: 0.875rem;
        margin: 0;
      }

      code {
        background: #f1f5f9;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        font-size: 0.85em;
      }

      .gallery-toolbar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }
      .gallery-toolbar dg-icon-field {
        flex: 1;
      }
      .gallery-toolbar .count {
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }

      .grid-scroll {
        max-height: 24rem;
        overflow-y: auto;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        background: #f8fafc;
        padding: 0.5rem;
      }
      .grid-scroll::-webkit-scrollbar {
        width: 8px;
      }
      .grid-scroll::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      .grid-scroll::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      .empty {
        margin: 0;
        padding: 2rem 1rem;
        text-align: center;
        color: #64748b;
        font-size: 0.875rem;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 0.5rem;
      }

      .cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 0.5rem;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        cursor: pointer;
        font: inherit;
        color: #0f172a;
        transition: background-color 120ms ease, border-color 120ms ease, transform 120ms ease;
      }
      .cell:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
        color: #1d4ed8;
      }
      .cell:active {
        transform: translateY(1px);
      }
      .cell__name {
        font-size: 0.75rem;
        color: #475569;
        text-align: center;
        word-break: break-all;
        line-height: 1.2;
      }
      .cell:hover .cell__name {
        color: inherit;
      }

      section h3 {
        font-size: 1rem;
        margin: 1rem 0 0.5rem;
        color: #0f172a;
      }

      .code-snippet {
        background: #0f172a;
        color: #e2e8f0;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.825rem;
        line-height: 1.55;
        overflow-x: auto;
        margin: 0.25rem 0 0.75rem;
      }

      .cmp {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0.5rem;
        font-size: 0.875rem;
      }
      .cmp th,
      .cmp td {
        padding: 0.5rem 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
      }
      .cmp th {
        background: #f8fafc;
        font-weight: 600;
        color: #0f172a;
      }
      .cmp td:first-child {
        font-weight: 500;
        color: #475569;
      }
    `,
  ],
})
export class IconPage {
  protected readonly names = DG_ICON_NAMES;
  protected readonly saveCount = signal(0);
  protected readonly query = signal('');
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.names;
    return this.names.filter((n) => n.includes(q));
  });

  private readonly dialogService = inject(DgDialogService);

  constructor() {
    // Load the standalone CSS-class builds (mask-image + font) lazily so they
    // only ship to users viewing this demo, and so Angular's index.html
    // optimizer doesn't try to inline them at build time.
    const doc = inject(DOCUMENT);
    for (const href of ['icons/dg-icons.css', 'icons/dg-icons-font.css']) {
      if (doc.querySelector(`link[href="${href}"]`)) continue;
      const link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      doc.head.appendChild(link);
    }
  }

  protected bump(): void {
    this.saveCount.update((c) => c + 1);
  }

  protected openDetail(name: DgIconName): void {
    this.dialogService.open<IconDetailDialog, void, unknown, { iconName: DgIconName }>(IconDetailDialog, {
      header: `Icon: ${name}`,
      width: '40rem',
      dismissableMask: true,
      inputs: { iconName: name },
    });
  }
}
