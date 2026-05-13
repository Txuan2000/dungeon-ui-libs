import { Injectable } from '@angular/core';

export type DgPdfFormat = 'a4' | 'a3' | 'a5' | 'letter' | 'legal';
export type DgPdfOrientation = 'portrait' | 'landscape';
export type DgPdfImageFormat = 'JPEG' | 'PNG';
export type DgPdfCompression = 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW';

export interface DgHtmlToPdfOptions {
  /** Paper size. Default `'a4'`. */
  format?: DgPdfFormat;
  /** Page orientation. Default `'portrait'`. */
  orientation?: DgPdfOrientation;
  /** Margin in millimetres on all 4 sides. Default `10`. */
  margin?: number;
  /**
   * html2canvas device-pixel scale. Higher = sharper but slower / larger file.
   * Default `2` (retina). Drop to `1` or `1.5` if file size matters more than
   * print sharpness.
   */
  scale?: number;
  /**
   * JPEG encoding quality for embedded page images, between 0 and 1.
   * Default `0.9` — visually identical to PNG for document content while
   * producing ~5–10× smaller files. Ignored when `imageFormat` is `'PNG'`.
   */
  quality?: number;
  /**
   * How to encode page-image bytes in the PDF. `'JPEG'` (default) is ~5–10×
   * smaller than `'PNG'` for typical document content but lossy. Use `'PNG'`
   * when you need lossless output (screenshots of code, fine line graphics).
   */
  imageFormat?: DgPdfImageFormat;
  /**
   * PDF-level Flate compression applied on top of the image encoding. `'SLOW'`
   * gives the smallest file at the cost of more CPU during generation;
   * `'NONE'` disables it for faster generation. Default `'SLOW'`.
   */
  compression?: DgPdfCompression;
  /** PDF document metadata: title shown in viewer's properties / tab bar. */
  title?: string;
  /** PDF document metadata: author / creator. */
  author?: string;
  /** PDF document metadata: subject. */
  subject?: string;
  /** PDF document metadata: comma- or space-separated keywords for search. */
  keywords?: string;
}

/**
 * Convert HTML (raw string or live `HTMLElement`) into a PDF `Blob`.
 *
 * Loads `jspdf` + `html2canvas` lazily via `await import(...)`, so the
 * ~250 kB cost is paid only on first `convert()` call — bundles that never
 * call this service ship without either library. Both packages are declared
 * as optional peer dependencies (see `dungeon-ui/package.json`); consumers
 * who use this service must install them:
 *
 *   `npm install jspdf html2canvas`
 *
 * Conversion is rasterized (html2canvas renders the DOM onto a canvas, then
 * jspdf embeds the image). Text in the resulting PDF is NOT selectable.
 * Browser-only — calling `convert()` on the server throws.
 */
@Injectable({ providedIn: 'root' })
export class DgHtmlToPdfService {
  async convert(source: string | HTMLElement, options: DgHtmlToPdfOptions = {}): Promise<Blob> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('DgHtmlToPdfService.convert: requires a browser environment.');
    }

    const format = options.format ?? 'a4';
    const orientation = options.orientation ?? 'portrait';
    const margin = options.margin ?? 10;
    const scale = options.scale ?? 2;
    const quality = Math.min(1, Math.max(0.1, options.quality ?? 0.9));
    const imageFormat: DgPdfImageFormat = options.imageFormat ?? 'JPEG';
    const compression: DgPdfCompression = options.compression ?? 'SLOW';
    const imageMime = imageFormat === 'PNG' ? 'image/png' : 'image/jpeg';

    // Lazy-load both libs together (~250 kB combined). html2canvas is used
    // directly here (not through pdf.html()) because jspdf's html() in v3+
    // mixes raster + native text extraction — the text layer uses jspdf's
    // built-in fonts (Helvetica/Times → WinAnsi/Latin-1) so any non-Latin
    // codepoint (Vietnamese diacritics, CJK, Arabic …) gets garbled. Going
    // direct: html2canvas → canvas (browser-native font rendering, every
    // Unicode codepoint correct as pixels) → addImage gives a pure raster
    // PDF, no text layer, no encoding mismatch, no layout reflow.
    const [{ jsPDF }, html2canvasMod] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const html2canvas = html2canvasMod.default;
    const pdf = new jsPDF({ unit: 'mm', format, orientation });

    // Apply PDF document properties (Info dictionary) — these surface in the
    // viewer's Properties dialog and tab title. Only set fields the caller
    // provided so jspdf's defaults remain for the rest.
    const props: { title?: string; author?: string; subject?: string; keywords?: string } = {};
    if (options.title) props.title = options.title;
    if (options.author) props.author = options.author;
    if (options.subject) props.subject = options.subject;
    if (options.keywords) props.keywords = options.keywords;
    if (Object.keys(props).length > 0) pdf.setProperties(props);

    const pageWidthMm = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();
    const contentWidthMm = pageWidthMm - margin * 2;
    const contentHeightMm = pageHeightMm - margin * 2;

    // For a string source: mount the content in an INNER wrapper that sizes
    // to its NATURAL preferred width (`width: max-content`), then wrap that
    // in a `0×0 overflow: hidden` OUTER box anchored at body (0,0). The outer
    // box is invisible to the user (size 0, clipped); the inner wrapper has
    // normal opacity and natural width so html2canvas sees its real pixels
    // and the element's design width — jspdf then scales that natural width
    // down to `contentWidthMm` in the PDF (element width → page width).
    //
    // Previous iteration forced the wrapper to a fixed CSS-pixel width equal
    // to the PDF content area; that squeezed wide layouts to fit and clamped
    // narrow layouts to a fixed size. With `max-content` the wrapper takes
    // whatever width the source HTML naturally lays out at (respecting
    // max-width / explicit width / content intrinsic size), and jspdf's
    // windowWidth / width pair handles the scale to mm.
    let element: HTMLElement;
    let cleanup: (() => void) | null = null;
    if (typeof source === 'string') {
      const outer = document.createElement('div');
      outer.style.cssText = [
        'position: absolute',
        'top: 0',
        'left: 0',
        'width: 0',
        'height: 0',
        'overflow: hidden',
        'pointer-events: none',
        'z-index: -1',
      ].join(';');
      const wrapper = document.createElement('div');
      wrapper.style.cssText = [
        // `max-content` ignores the parent's `width: 0` constraint and sizes
        // the wrapper to the natural preferred width of its content.
        'width: max-content',
        'background: #ffffff',
        'color: #000000',
      ].join(';');
      wrapper.innerHTML = source;
      outer.appendChild(wrapper);
      document.body.appendChild(outer);

      // Force reflow so wrapper.scrollWidth/offsetHeight are computed before
      // html2canvas reads geometry. `void` discards the read but keeps the
      // side effect.
      void wrapper.offsetHeight;

      element = wrapper;
      cleanup = () => outer.remove();
    } else {
      element = source;
    }

    try {
      // Render the element to a single canvas at the requested DPI scale.
      // Browser-native text rendering handles every script correctly →
      // Vietnamese, CJK, Arabic, emoji all come through as exact pixels.
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      // Total image height once scaled to fit the PDF's content width.
      // The element's natural width → page content width (page-fit by width),
      // and height follows the canvas's aspect ratio.
      const totalImgHeightMm = (imgHeight / imgWidth) * contentWidthMm;

      // Encode canvases per the requested image format. JPEG (default) is
      // ~5–10× smaller than PNG for document-style content with visually
      // undetectable loss at quality ≥ 0.9; PNG is lossless for use cases
      // that need it. PDF-level Flate compression (`compression` arg) is
      // applied on top of either encoding.
      if (totalImgHeightMm <= contentHeightMm) {
        const data = canvas.toDataURL(imageMime, imageFormat === 'JPEG' ? quality : undefined);
        pdf.addImage(data, imageFormat, margin, margin, contentWidthMm, totalImgHeightMm, undefined, compression);
      } else {
        // Multi-page: slice the source canvas into page-height chunks and
        // embed each as its own page. Each slice is rasterized to an off-
        // screen canvas so jspdf's addImage gets exact per-page pixels with
        // a clean white background (no leakage from neighbouring pages).
        const pageImgHeightPx = Math.floor((contentHeightMm / totalImgHeightMm) * imgHeight);
        let yPos = 0;
        let firstPage = true;
        while (yPos < imgHeight) {
          const sliceHeight = Math.min(pageImgHeightPx, imgHeight - yPos);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = imgWidth;
          sliceCanvas.height = sliceHeight;
          const ctx = sliceCanvas.getContext('2d');
          if (!ctx) throw new Error('DgHtmlToPdfService: 2D canvas context unavailable.');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, imgWidth, sliceHeight);
          ctx.drawImage(canvas, 0, -yPos);

          if (!firstPage) pdf.addPage();
          const sliceHeightMm = (sliceHeight / imgWidth) * contentWidthMm;
          const data = sliceCanvas.toDataURL(imageMime, imageFormat === 'JPEG' ? quality : undefined);
          pdf.addImage(data, imageFormat, margin, margin, contentWidthMm, sliceHeightMm, undefined, compression);

          yPos += pageImgHeightPx;
          firstPage = false;
        }
      }

      return pdf.output('blob');
    } finally {
      cleanup?.();
    }
  }
}
