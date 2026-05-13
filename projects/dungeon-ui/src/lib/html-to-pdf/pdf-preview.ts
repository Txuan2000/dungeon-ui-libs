import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';

/**
 * Render a PDF `Blob` in an `<iframe>` and expose a download button.
 *
 * Wraps the iframe in a fixed-height container; pair with `DgHtmlToPdfService`
 * (or any other Blob source — server-rendered PDFs, attachments, etc.) to get
 * a side-by-side editor + preview UI.
 *
 * The object URL is created on each `blob` change and revoked on the next
 * change or on destroy, so long-lived previews don't accumulate URLs.
 */
@Component({
  selector: 'dg-pdf-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dg-pdf-preview__toolbar">
      <span class="dg-pdf-preview__title">{{ filename() }}</span>
      <div class="dg-pdf-preview__actions">
        @if (blob(); as b) {
          <span class="dg-pdf-preview__size">{{ humanSize() }}</span>
          <button
            type="button"
            class="dg-pdf-preview__btn"
            (click)="download()"
            [attr.aria-label]="'Download ' + filename()"
          >
            <span aria-hidden="true">⬇</span> Download
          </button>
        } @else {
          <span class="dg-pdf-preview__size dg-pdf-preview__size--empty">no document</span>
        }
      </div>
    </div>

    <div class="dg-pdf-preview__body" [style.height]="resolvedHeight()">
      @if (safeUrl(); as url) {
        <iframe
          #frame
          class="dg-pdf-preview__frame"
          [src]="url"
          [title]="filename()"
        ></iframe>
      } @else {
        <div class="dg-pdf-preview__empty">
          <span class="dg-pdf-preview__empty-icon" aria-hidden="true">📄</span>
          <p>Chưa có PDF — nhấn Convert để xem preview.</p>
        </div>
      }
    </div>
  `,
  styleUrl: './pdf-preview.scss',
  host: { class: 'dg-pdf-preview' },
})
export class DgPdfPreview {
  readonly blob = input<Blob | null>(null);
  readonly filename = input<string>('document.pdf');
  readonly height = input<string | number>('600px');

  readonly downloaded = output<string>();

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly frame = viewChild<ElementRef<HTMLIFrameElement>>('frame');
  protected readonly objectUrl = signal<string | null>(null);
  // Angular's URL sanitizer rejects blob:/data: URLs on iframe [src] unless
  // explicitly trusted. Object URLs we create ourselves from a Blob are
  // same-origin and safe to load.
  protected readonly safeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.objectUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
  protected readonly resolvedHeight = computed(() => {
    const h = this.height();
    return typeof h === 'number' ? `${h}px` : h;
  });
  protected readonly humanSize = computed(() => {
    const b = this.blob();
    if (!b) return '';
    return formatBytes(b.size);
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Create / revoke object URLs in lockstep with the blob input. effect()
    // tracks blob() reads; the cleanup hook revokes the prior URL on the next
    // run or on component destroy.
    effect((onCleanup) => {
      const b = this.blob();
      if (!b || typeof URL === 'undefined') {
        this.objectUrl.set(null);
        return;
      }
      const url = URL.createObjectURL(b);
      this.objectUrl.set(url);
      onCleanup(() => URL.revokeObjectURL(url));
    });

    destroyRef.onDestroy(() => {
      const url = this.objectUrl();
      if (url) URL.revokeObjectURL(url);
    });
  }

  protected download(): void {
    const url = this.objectUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = this.filename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.downloaded.emit(this.filename());
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
