import { Directive, ElementRef, inject, input } from '@angular/core';

/**
 * Marker directive used to define the bottom edge a `<dg-table>` should reach.
 *
 * Place it on any element that acts as the visual stop point. The table reads
 * the anchor's top position and resizes its viewport so its bottom edge meets
 * the anchor — recomputing virtual scroll on every resize/layout change.
 *
 * Usage:
 * ```html
 * <dg-table [bottomAnchor]="anchor" virtualScroll />
 * <div #anchor="dgTableBottomAnchor" dgTableBottomAnchor></div>
 * ```
 */
@Directive({
  selector: '[dgTableBottomAnchor]',
  standalone: true,
  exportAs: 'dgTableBottomAnchor',
})
export class DgTableBottomAnchor {
  readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Pixel offset to subtract from the computed height. Useful when there is
   * margin/padding between the table and the anchor that should remain visible.
   */
  readonly offset = input<number, unknown>(0, {
    alias: 'dgTableBottomAnchor',
    transform: (value: unknown): number => {
      if (value === '' || value === null || value === undefined) return 0;
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    },
  });
}
