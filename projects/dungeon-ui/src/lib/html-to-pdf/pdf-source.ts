import { Directive, ElementRef, inject, input } from '@angular/core';
import { DgHtmlToPdfService, type DgHtmlToPdfOptions } from './html-to-pdf.service';

/**
 * Mark an element as a PDF source. Use the `exportAs` template variable to
 * call `toBlob()` / `download()` directly from the template — no need to
 * wire up `@ViewChild` + the service manually.
 *
 * ```html
 * <div [dgPdfSource]="{ format: 'a4', margin: 15 }"
 *      filename="invoice.pdf"
 *      #pdf="dgPdfSource">
 *   <h1>Invoice #2026-001</h1>
 *   ...
 * </div>
 *
 * <dg-button label="Download PDF" (clicked)="pdf.download()" />
 * <dg-button label="Email PDF"   (clicked)="email(pdf)" />
 * ```
 *
 * ```ts
 * async email(src: DgPdfSource) {
 *   const blob = await src.toBlob({ quality: 0.95 });
 *   this.api.send(blob);
 * }
 * ```
 *
 * Each call captures the element's CURRENT live HTML — no snapshot is taken
 * at directive init, so signals / observables / form values flowing through
 * the marked subtree are picked up at convert time. Conversion is delegated
 * to `DgHtmlToPdfService` which lazy-loads jspdf + html2canvas on first call.
 */
@Directive({
  selector: '[dgPdfSource]',
  exportAs: 'dgPdfSource',
})
export class DgPdfSource {
  /**
   * Per-element conversion options baked into the directive. Override on each
   * call via the `overrides` arg on `toBlob()` / `download()`. Accepts
   * `[dgPdfSource]="{}"` for the object form or `dgPdfSource` (no value) as
   * a bare marker — empty-string values from the bare form normalize to `{}`.
   */
  readonly options = input<DgHtmlToPdfOptions, DgHtmlToPdfOptions | string | undefined | null>(
    {},
    {
      alias: 'dgPdfSource',
      transform: (value) => (value && typeof value === 'object' ? value : {}),
    },
  );

  /** Filename used by `download()`. Defaults to `'document.pdf'`. */
  readonly filename = input<string>('document.pdf');

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly service = inject(DgHtmlToPdfService);

  /** The marked host element. Useful for measuring or further DOM ops. */
  get nativeElement(): HTMLElement {
    return this.hostRef.nativeElement;
  }

  /**
   * Convert the marked element's current HTML to a PDF Blob. Caller-supplied
   * `overrides` are shallow-merged on top of the directive's `[dgPdfSource]`
   * options (`overrides` wins).
   */
  async toBlob(overrides?: DgHtmlToPdfOptions): Promise<Blob> {
    return this.service.convert(this.nativeElement, { ...this.options(), ...overrides });
  }

  /**
   * Convert and trigger a browser download. Convenience helper around
   * `toBlob()` + an anchor click; revokes the object URL on the next tick.
   */
  async download(overrides?: DgHtmlToPdfOptions): Promise<void> {
    const blob = await this.toBlob(overrides);
    if (typeof document === 'undefined' || typeof URL === 'undefined') return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.filename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
