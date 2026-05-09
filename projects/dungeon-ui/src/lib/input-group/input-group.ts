import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/**
 * Lightweight wrapper that joins inputs and addons (icons / text / buttons)
 * into a single bordered group. Modelled after PrimeNG's `<p-inputgroup>`.
 *
 * The component itself only contributes layout (`display: inline-flex`).
 * The visual "join" — flat shared borders, single rounded corners on the
 * outermost children — is achieved with a global stylesheet that scopes
 * rules under `.dg-input-group` and targets the known field classes
 * (`.dg-input-text__field`, `.dg-input-number__field`,
 * `.dg-dropdown__trigger`, `.dg-datepicker__field`, `.dg-input-group__addon`,
 * `.dg-button`). For that reason the component uses
 * `ViewEncapsulation.None` — its stylesheet must reach into descendant
 * component templates.
 *
 * Usage:
 * ```html
 * <dg-input-group>
 *   <dg-input-group-addon>$</dg-input-group-addon>
 *   <dg-input-text placeholder="Amount" />
 *   <dg-input-group-addon>.00</dg-input-group-addon>
 * </dg-input-group>
 * ```
 */
@Component({
  selector: 'dg-input-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  styleUrl: './input-group.scss',
  host: {
    class: 'dg-input-group',
    '[attr.data-fluid]': 'fluid() || null',
  },
})
export class DgInputGroup {
  readonly fluid = input(false, { transform: booleanish });
}

/**
 * Static visual chunk inside a `<dg-input-group>` — typically an icon, a
 * symbol like `$` or `%`, or a short text label. For interactive addons
 * (e.g. submit / dropdown trigger) put a `<dg-button>` inside the group
 * directly instead of wrapping it in an addon.
 */
@Component({
  selector: 'dg-input-group-addon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'dg-input-group__addon',
  },
})
export class DgInputGroupAddon {}

function booleanish(value: boolean | string | null | undefined): boolean {
  return value === '' || value === true || value === 'true';
}
