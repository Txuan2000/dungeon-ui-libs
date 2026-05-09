import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

export type DgIconFieldPosition = 'left' | 'right';

/**
 * Wraps an input + a `<dg-input-icon>` so the icon is overlaid INSIDE the
 * input's visible area (left or right side). Modelled after PrimeNG's
 * `<p-iconfield>`. Typical use case: a magnifying-glass icon next to a
 * search input.
 *
 * Different from `<dg-input-group>`: input-group joins the input with a
 * separate, bordered addon section. icon-field paints the icon over the
 * input itself with no extra border — the input simply gets internal
 * padding to make room.
 *
 * Uses `ViewEncapsulation.None` so its global stylesheet can adjust the
 * inner padding of `.dg-input-text__field` / `.dg-input-number__field`
 * without bumping into Angular's per-component encapsulation.
 *
 * Usage:
 * ```html
 * <dg-icon-field iconPosition="left">
 *   <dg-input-icon>🔍</dg-input-icon>
 *   <dg-input-text placeholder="Search…" />
 * </dg-icon-field>
 * ```
 */
@Component({
  selector: 'dg-icon-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  styleUrl: './icon-field.scss',
  host: {
    class: 'dg-icon-field',
    '[attr.data-icon-position]': 'iconPosition()',
    '[attr.data-fluid]': 'fluid() || null',
  },
})
export class DgIconField {
  readonly iconPosition = input<DgIconFieldPosition>('left');
  readonly fluid = input(false, { transform: booleanish });
}

/**
 * Single icon container that lives inside `<dg-icon-field>`. Position and
 * spacing are handled by the parent's stylesheet — this component just
 * projects whatever you put inside (emoji, font icon class, SVG, etc.).
 */
@Component({
  selector: 'dg-input-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'dg-input-icon',
  },
})
export class DgInputIcon {}

function booleanish(value: boolean | string | null | undefined): boolean {
  return value === '' || value === true || value === 'true';
}
