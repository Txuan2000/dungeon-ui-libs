import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  DgButton,
  DgHtmlToPdfService,
  DgPdfPreview,
  DgPdfSource,
  type DgPdfCompression,
  type DgPdfFormat,
  type DgPdfImageFormat,
  type DgPdfOrientation,
} from 'dungeon-ui';

const SAMPLE_HTML = `<div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #0f172a; padding: 24px; max-width: 640px;">
  <header style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
    <h1 style="margin: 0 0 4px; color: #1d4ed8;">Invoice #2026-001</h1>
    <p style="margin: 0; color: #64748b; font-size: 13px;">Dungeon Studio · 2026-05-13</p>
  </header>

  <section style="margin-bottom: 16px;">
    <h2 style="font-size: 15px; margin: 0 0 6px; color: #475569;">Billed to</h2>
    <p style="margin: 0;">Acme Co.<br/>123 Trần Hưng Đạo, Q.1<br/>TP.HCM, Vietnam</p>
  </section>

  <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
    <thead>
      <tr style="background: #f1f5f9;">
        <th style="padding: 8px 10px; text-align: left; font-size: 13px;">Mục</th>
        <th style="padding: 8px 10px; text-align: right; font-size: 13px;">Số lượng</th>
        <th style="padding: 8px 10px; text-align: right; font-size: 13px;">Đơn giá</th>
        <th style="padding: 8px 10px; text-align: right; font-size: 13px;">Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 10px;">Tư vấn kiến trúc</td>
        <td style="padding: 8px 10px; text-align: right;">10 h</td>
        <td style="padding: 8px 10px; text-align: right;">$120</td>
        <td style="padding: 8px 10px; text-align: right;">$1,200</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 10px;">Triển khai</td>
        <td style="padding: 8px 10px; text-align: right;">5 h</td>
        <td style="padding: 8px 10px; text-align: right;">$150</td>
        <td style="padding: 8px 10px; text-align: right;">$750</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="padding: 10px; text-align: right; font-weight: 600; font-size: 14px;">Tổng cộng</td>
        <td style="padding: 10px; text-align: right; font-weight: 700; font-size: 14px; color: #1d4ed8;">$1,950</td>
      </tr>
    </tfoot>
  </table>

  <p style="margin-top: 24px; padding: 12px; background: #eff6ff; border-left: 3px solid #2563eb; color: #1e3a8a; font-size: 13px;">
    Cảm ơn quý khách. Vui lòng thanh toán trong vòng 14 ngày kể từ ngày phát hành hoá đơn.
  </p>
</div>`;

@Component({
  selector: 'app-html-to-pdf-page',
  imports: [DgButton, DgPdfPreview, DgPdfSource, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>HTML → PDF</h1>
      <p>
        <code>DgHtmlToPdfService.convert(html)</code> dùng <code>jspdf</code> + <code>html2canvas</code>
        (dynamic import, ~250 kB lazy chunk). <code>DgPdfPreview</code> render Blob trong iframe và
        cung cấp nút Download. Lưu ý: bản PDF là <strong>raster</strong> — text không select được.
      </p>
    </header>

    <section class="toolbar">
      <fieldset>
        <legend>Layout</legend>
        <label>
          Format
          <select [value]="format()" (change)="format.set($any($event.target).value)">
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
            <option value="legal">Legal</option>
            <option value="a3">A3</option>
            <option value="a5">A5</option>
          </select>
        </label>
        <label>
          Orientation
          <select [value]="orientation()" (change)="orientation.set($any($event.target).value)">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>
        <label>
          Margin (mm)
          <input type="number" min="0" max="40" step="1" [value]="margin()" (input)="margin.set(+$any($event.target).value)" />
        </label>
      </fieldset>

      <fieldset>
        <legend>Image</legend>
        <label>
          Scale
          <input type="number" min="1" max="4" step="0.5" [value]="scale()" (input)="scale.set(+$any($event.target).value)" />
        </label>
        <label>
          Format
          <select [value]="imageFormat()" (change)="imageFormat.set($any($event.target).value)">
            <option value="JPEG">JPEG</option>
            <option value="PNG">PNG</option>
          </select>
        </label>
        <label [class.muted]="imageFormat() === 'PNG'">
          Quality
          <input
            type="number"
            min="0.3"
            max="1"
            step="0.05"
            [value]="quality()"
            [disabled]="imageFormat() === 'PNG'"
            (input)="quality.set(+$any($event.target).value)"
          />
        </label>
        <label>
          Compression
          <select [value]="compression()" (change)="compression.set($any($event.target).value)">
            <option value="NONE">None</option>
            <option value="FAST">Fast</option>
            <option value="MEDIUM">Medium</option>
            <option value="SLOW">Slow (smallest)</option>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Metadata</legend>
        <label>
          Title
          <input type="text" [value]="title()" (input)="title.set($any($event.target).value)" />
        </label>
        <label>
          Author
          <input type="text" [value]="author()" (input)="author.set($any($event.target).value)" />
        </label>
        <label>
          Subject
          <input type="text" [value]="subject()" (input)="subject.set($any($event.target).value)" />
        </label>
        <label>
          Keywords
          <input type="text" [value]="keywords()" (input)="keywords.set($any($event.target).value)" />
        </label>
      </fieldset>

      <fieldset>
        <legend>Output</legend>
        <label class="filename">
          Filename
          <input
            type="text"
            [value]="customFilename()"
            [placeholder]="defaultFilename()"
            (input)="customFilename.set($any($event.target).value)"
          />
        </label>
      </fieldset>

      <div class="actions">
        <dg-button
          severity="secondary"
          variant="outlined"
          size="small"
          label="Reset"
          (clicked)="reset()"
        />
        <dg-button
          severity="primary"
          size="small"
          [label]="converting() ? 'Converting…' : 'Convert → PDF'"
          [loading]="converting()"
          (clicked)="convert()"
        />
      </div>
    </section>

    @if (error(); as e) {
      <div class="error" role="alert">{{ e }}</div>
    }

    <section class="grid">
      <div class="pane pane--editor">
        <div class="pane__head">
          <strong>HTML source</strong>
          <span class="hint">{{ html().length }} chars</span>
        </div>
        <textarea
          class="editor"
          spellcheck="false"
          [value]="html()"
          (input)="html.set($any($event.target).value)"
        ></textarea>
      </div>

      <div class="pane pane--rendered">
        <div class="pane__head">
          <strong>Rendered HTML</strong>
          <span class="hint">live preview · 250ms debounce</span>
        </div>
        <iframe
          #renderedFrame
          class="rendered-frame"
          title="Rendered HTML preview"
        ></iframe>
      </div>

      <div class="pane pane--pdf">
        <dg-pdf-preview
          [blob]="pdfBlob()"
          [filename]="filename()"
          height="100%"
          (downloaded)="onDownloaded($event)"
        />
      </div>
    </section>

    <p class="status">{{ status() }}</p>

    <section class="directive-demo">
      <h2>Directive <code>[dgPdfSource]</code> — convert live element trên template</h2>
      <p class="hint">
        Đánh dấu một element bất kỳ với <code>dgPdfSource</code>; reference qua template var
        (<code>#pdf="dgPdfSource"</code>) rồi gọi <code>pdf.download()</code> / <code>pdf.toBlob()</code>
        từ click handler — không cần inject service thủ công. Mỗi lần gọi capture HTML <em>hiện tại</em>
        của element, nên signals / form values / async data đã render đều được pickup.
      </p>

      <div class="card-row">
        <div
          class="invoice-card"
          [dgPdfSource]="{ margin: 15, quality: 0.9 }"
          filename="card-sample.pdf"
          #pdfCard="dgPdfSource"
        >
          <h3>Thẻ hoá đơn live · {{ now }}</h3>
          <p>Counter: <strong>{{ cardCounter() }}</strong></p>
          <p>
            Click <em>Tăng counter</em> rồi <em>Download as PDF</em> — số trong PDF sẽ là giá trị
            counter ngay khi convert (không bị stale).
          </p>
          <div class="invoice-line">
            <span>Tiền hàng</span>
            <span>{{ cardCounter() * 250000 | number }} ₫</span>
          </div>
          <div class="invoice-line invoice-line--total">
            <span>Tổng cộng</span>
            <span>{{ cardCounter() * 250000 | number }} ₫</span>
          </div>
        </div>

        <div class="card-actions">
          <dg-button severity="secondary" variant="outlined" size="small" label="Tăng counter" (clicked)="cardCounter.update(v => v + 1)" />
          <dg-button severity="primary" size="small" label="Download as PDF" (clicked)="pdfCard.download()" />
          <dg-button severity="info" variant="outlined" size="small" label="Set blob → preview ↑" (clicked)="useCardAsBlob(pdfCard)" />
        </div>
      </div>

      <pre class="snippet">{{ directiveSnippet }}</pre>
    </section>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        height: 100%;
        min-height: 0;
      }

      header h1 {
        margin: 0 0 0.25rem;
      }
      header p {
        margin: 0;
        color: #475569;
      }
      code {
        background: #f1f5f9;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        font-size: 0.85em;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: stretch;
        padding: 0.625rem 0.75rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
      }
      fieldset {
        display: flex;
        flex-wrap: wrap;
        gap: 0.625rem;
        align-items: end;
        border: 1px solid #cbd5e1;
        border-radius: 0.375rem;
        padding: 0.375rem 0.625rem 0.5rem;
        margin: 0;
        background: #ffffff;
      }
      legend {
        font-size: 0.6875rem;
        color: #475569;
        font-weight: 700;
        padding: 0 0.375rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      fieldset label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.75rem;
        color: #475569;
        font-weight: 500;
      }
      fieldset label.muted {
        opacity: 0.5;
      }
      fieldset select,
      fieldset input {
        font: inherit;
        font-size: 0.8125rem;
        padding: 0.3125rem 0.5rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.25rem;
        background: #ffffff;
        min-width: 5.5rem;
      }
      fieldset input[type='text'] {
        min-width: 9rem;
      }
      fieldset .filename input {
        min-width: 12rem;
      }
      fieldset input:disabled {
        background: #f1f5f9;
        cursor: not-allowed;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        align-items: end;
        margin-left: auto;
        padding-bottom: 0.125rem;
      }

      .error {
        padding: 0.5rem 0.75rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #991b1b;
        border-radius: 0.375rem;
        font-size: 0.875rem;
      }

      .grid {
        display: grid;
        grid-template-areas:
          'source source'
          'rendered pdf';
        grid-template-rows: 16rem 1fr;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        flex: 1 1 auto;
        min-height: 32rem;
      }
      .pane--editor { grid-area: source; }
      .pane--rendered { grid-area: rendered; }
      .pane--pdf { grid-area: pdf; }

      @media (max-width: 880px) {
        .grid {
          grid-template-areas:
            'source'
            'rendered'
            'pdf';
          grid-template-rows: 14rem 20rem 24rem;
          grid-template-columns: 1fr;
        }
      }

      .rendered-frame {
        flex: 1 1 auto;
        width: 100%;
        border: 0;
        background: #ffffff;
        display: block;
      }

      .pane {
        display: flex;
        flex-direction: column;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        overflow: hidden;
        background: #ffffff;
        min-height: 0;
      }
      .pane--pdf {
        background: transparent;
        border: none;
      }
      .pane__head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0.75rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        font-size: 0.8125rem;
        color: #0f172a;
      }
      .pane__head .hint {
        color: #64748b;
        font-variant-numeric: tabular-nums;
      }

      .editor {
        flex: 1 1 auto;
        width: 100%;
        border: 0;
        outline: 0;
        padding: 0.75rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.8125rem;
        line-height: 1.55;
        background: #0f172a;
        color: #e2e8f0;
        resize: none;
        min-height: 24rem;
      }
      .editor:focus {
        box-shadow: inset 0 0 0 2px #1d4ed8;
      }

      .status {
        margin: 0;
        font-size: 0.8125rem;
        color: #64748b;
      }

      .directive-demo {
        margin-top: 1rem;
        padding: 1rem 1.25rem 1.25rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
      }
      .directive-demo h2 {
        margin: 0 0 0.25rem;
        font-size: 1rem;
        color: #0f172a;
      }
      .directive-demo > p {
        margin: 0 0 0.875rem;
        color: #475569;
        font-size: 0.875rem;
      }

      .card-row {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: flex-start;
        margin-bottom: 0.875rem;
      }
      .invoice-card {
        flex: 1 1 22rem;
        max-width: 26rem;
        padding: 1rem 1.25rem;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        color: #0f172a;
      }
      .invoice-card h3 {
        margin: 0 0 0.5rem;
        color: #1d4ed8;
        font-size: 1rem;
      }
      .invoice-card p {
        margin: 0 0 0.5rem;
        font-size: 0.875rem;
      }
      .invoice-line {
        display: flex;
        justify-content: space-between;
        padding: 0.375rem 0;
        font-size: 0.875rem;
        border-top: 1px solid #e2e8f0;
      }
      .invoice-line--total {
        font-weight: 700;
        color: #1d4ed8;
      }
      .card-actions {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .snippet {
        margin: 0;
        padding: 0.75rem 1rem;
        background: #0f172a;
        color: #e2e8f0;
        border-radius: 0.375rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.8125rem;
        line-height: 1.55;
        white-space: pre-wrap;
        word-break: break-word;
      }
    `,
  ],
})
export class HtmlToPdfPage {
  private readonly svc = inject(DgHtmlToPdfService);

  protected readonly html = signal(SAMPLE_HTML);
  protected readonly format = signal<DgPdfFormat>('a4');
  protected readonly orientation = signal<DgPdfOrientation>('portrait');
  protected readonly margin = signal(10);
  protected readonly scale = signal(2);
  protected readonly quality = signal(0.9);
  protected readonly imageFormat = signal<DgPdfImageFormat>('JPEG');
  protected readonly compression = signal<DgPdfCompression>('SLOW');
  protected readonly title = signal('Invoice #2026-001');
  protected readonly author = signal('Dungeon Studio');
  protected readonly subject = signal('Hoá đơn dịch vụ');
  protected readonly keywords = signal('invoice, hoá đơn, demo');
  protected readonly customFilename = signal('');
  protected readonly cardCounter = signal(3);
  protected readonly now = new Date().toLocaleDateString('vi-VN');

  protected readonly directiveSnippet = `<div [dgPdfSource]="{ margin: 15, quality: 0.9 }"
     filename="card-sample.pdf"
     #pdfCard="dgPdfSource">
  <h3>Thẻ hoá đơn live · {{ now }}</h3>
  <p>Counter: <strong>{{ cardCounter() }}</strong></p>
</div>

<dg-button label="Download as PDF" (clicked)="pdfCard.download()" />
<dg-button label="Email PDF"        (clicked)="email(pdfCard)" />
\`\`\`
\`\`\`ts
async email(src: DgPdfSource) {
  const blob = await src.toBlob({ quality: 0.95 });
  await this.api.sendInvoice(blob);
}`;
  protected readonly pdfBlob = signal<Blob | null>(null);
  protected readonly converting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly lastDownloaded = signal<string | null>(null);
  // Debounced mirror of `html` — drives the live <iframe> preview so each
  // keystroke doesn't reload the iframe. 250ms feels live but avoids
  // re-rendering on every char.
  protected readonly debouncedHtml = signal(SAMPLE_HTML);

  private readonly renderedFrame = viewChild<ElementRef<HTMLIFrameElement>>('renderedFrame');

  protected readonly defaultFilename = computed(() => `dungeon-${this.format()}.pdf`);
  protected readonly filename = computed(() => {
    const custom = this.customFilename().trim();
    if (!custom) return this.defaultFilename();
    return custom.toLowerCase().endsWith('.pdf') ? custom : `${custom}.pdf`;
  });
  constructor() {
    // Debounce html() → debouncedHtml() so the iframe preview doesn't reload
    // on every keystroke. The effect's cleanup cancels the pending timeout
    // when html() changes again before the 250ms elapses.
    effect((onCleanup) => {
      const value = this.html();
      const t = setTimeout(() => this.debouncedHtml.set(value), 250);
      onCleanup(() => clearTimeout(t));
    });

    // Push debounced HTML into the iframe. afterRenderEffect runs after every
    // render in the browser only (skipped during SSR), guaranteeing the
    // iframe is mounted and that we don't fight Angular's hydration. We
    // write into `contentDocument` directly when available (no iframe reload
    // — smoother, no flicker on each debounced update); first time the
    // contentDocument may be a fresh blank doc, so we initialize it via
    // `document.open() + .write() + .close()` for a clean baseline.
    afterRenderEffect(() => {
      const frame = this.renderedFrame()?.nativeElement;
      if (!frame) return;
      const html = this.debouncedHtml();
      const doc = frame.contentDocument;
      if (!doc) return;
      // Reset doc and write fresh content. open+write+close is the historic
      // API for replacing an iframe's document programmatically — works
      // across browsers and bypasses Angular's HTML sanitizer.
      doc.open();
      doc.write(
        `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0">${html}</body></html>`,
      );
      doc.close();
    });
  }

  protected readonly status = computed(() => {
    if (this.converting()) return 'Đang convert…';
    if (this.error()) return '';
    const dl = this.lastDownloaded();
    if (dl) return `Đã tải: ${dl}`;
    if (this.pdfBlob()) return 'Sẵn sàng. Nhấn Download để lưu file.';
    return 'Nhấn Convert → PDF để tạo preview.';
  });

  protected async convert(): Promise<void> {
    if (this.converting()) return;
    this.converting.set(true);
    this.error.set(null);
    try {
      const blob = await this.svc.convert(this.html(), {
        format: this.format(),
        orientation: this.orientation(),
        margin: this.margin(),
        scale: this.scale(),
        quality: this.quality(),
        imageFormat: this.imageFormat(),
        compression: this.compression(),
        title: this.title() || undefined,
        author: this.author() || undefined,
        subject: this.subject() || undefined,
        keywords: this.keywords() || undefined,
      });
      this.pdfBlob.set(blob);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.converting.set(false);
    }
  }

  protected reset(): void {
    this.html.set(SAMPLE_HTML);
    this.customFilename.set('');
    this.pdfBlob.set(null);
    this.error.set(null);
    this.lastDownloaded.set(null);
  }

  protected onDownloaded(filename: string): void {
    this.lastDownloaded.set(filename);
  }

  /** Pipe the directive's output back into the existing <dg-pdf-preview> on top. */
  protected async useCardAsBlob(src: DgPdfSource): Promise<void> {
    this.error.set(null);
    try {
      const blob = await src.toBlob();
      this.pdfBlob.set(blob);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : String(err));
    }
  }
}
