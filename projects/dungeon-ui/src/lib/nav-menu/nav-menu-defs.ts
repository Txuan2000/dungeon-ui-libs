import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Item shape — modelled after PrimeNG's `MenuItem`. Most fields are optional;
 * leaves can omit `items`. A `separator: true` entry renders a divider.
 *
 * Differences vs PrimeNG `MenuItem`:
 * - extra `value`: used by `dg-nav-menu` to track the currently active leaf
 *   via the component's `value` model (PrimeNG menus have no built-in
 *   active-value model — they rely on `routerLinkActive` instead).
 * - extra `data`: free-form payload propagated in command/itemClick events.
 */
export interface DgNavMenuItem {
  label?: string;
  icon?: string;
  /** Identifier used by `dg-nav-menu` `value` model to mark this leaf active. */
  value?: unknown;
  /** Synchronous callback fired when the (leaf) item is invoked. */
  command?: (event: DgNavMenuItemCommandEvent) => void;
  /** External URL — rendered as plain `<a href>`. */
  url?: string;
  target?: '_self' | '_blank' | '_parent' | '_top' | string;
  /** Angular routerLink commands. */
  routerLink?: unknown;
  /** Nested children. PrimeNG name. */
  items?: readonly DgNavMenuItem[];
  /** Whether the submenu of this item is visually expanded — informational. */
  expanded?: boolean;
  disabled?: boolean;
  /** Hide the item from DOM entirely when `false`. */
  visible?: boolean;
  /** Render the label as raw HTML when `false` (default `true` = text). */
  escape?: boolean;
  separator?: boolean;
  badge?: string | number;
  badgeStyleClass?: string;
  tooltip?: string;
  id?: string;
  tabindex?: string;
  style?: Record<string, unknown> | null;
  styleClass?: string;
  iconClass?: string;
  labelClass?: string;
  linkClass?: string;
  /** Free-form payload forwarded in command/itemClick events. */
  data?: unknown;
}

export interface DgNavMenuItemCommandEvent {
  originalEvent: Event;
  item: DgNavMenuItem;
  index: number;
}

export interface DgNavMenuItemContext<T extends DgNavMenuItem = DgNavMenuItem> {
  $implicit: T;
  active: boolean;
  expanded: boolean;
  level: number;
  hasChildren: boolean;
}

@Directive({
  selector: 'ng-template[dgNavMenuItem]',
  standalone: true,
})
export class DgNavMenuItemDef {
  readonly templateRef = inject<TemplateRef<DgNavMenuItemContext>>(TemplateRef);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static ngTemplateContextGuard(_dir: DgNavMenuItemDef, ctx: unknown): ctx is DgNavMenuItemContext<any> {
    return true;
  }
}

@Directive({
  selector: 'ng-template[dgNavMenuStart]',
  standalone: true,
})
export class DgNavMenuStartDef {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

@Directive({
  selector: 'ng-template[dgNavMenuEnd]',
  standalone: true,
})
export class DgNavMenuEndDef {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

@Directive({
  selector: 'ng-template[dgNavMenuSubmenuIcon]',
  standalone: true,
})
export class DgNavMenuSubmenuIconDef {
  readonly templateRef = inject<TemplateRef<{ root: boolean }>>(TemplateRef);

  static ngTemplateContextGuard(_dir: DgNavMenuSubmenuIconDef, ctx: unknown): ctx is { root: boolean } {
    return true;
  }
}
