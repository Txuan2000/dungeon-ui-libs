import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  afterRenderEffect,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  DgNavMenuEndDef,
  DgNavMenuItem,
  DgNavMenuItemCommandEvent,
  DgNavMenuItemDef,
  DgNavMenuStartDef,
  DgNavMenuSubmenuIconDef,
} from './nav-menu-defs';

export type DgNavMenuOrientation = 'horizontal' | 'vertical';
export type DgNavMenuVariant = 'plain' | 'pills' | 'tabs';
export type DgNavMenuSize = 'small' | 'normal' | 'large';

interface OpenItem {
  item: DgNavMenuItem;
  level: number;
}

@Component({
  selector: 'dg-nav-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    @if (startTpl(); as tmpl) {
      <div class="dg-nav-menu__start">
        <ng-container *ngTemplateOutlet="tmpl.templateRef" />
      </div>
    }

    @if (showMenuButton()) {
      <button
        type="button"
        class="dg-nav-menu__menu-button"
        [attr.aria-haspopup]="model().length > 0 || null"
        [attr.aria-expanded]="mobileActive()"
        [attr.aria-controls]="id()"
        [attr.aria-label]="ariaLabel() || 'Navigation menu'"
        (click)="toggleMobile($event)"
      >
        <span class="dg-nav-menu__menu-icon" aria-hidden="true">☰</span>
      </button>
    }

    <ul
      #listEl
      class="dg-nav-menu__list"
      role="menubar"
      [attr.id]="id()"
      [attr.aria-orientation]="orientation()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.data-mobile-active]="mobileActive() || null"
    >
      @if (orientation() === 'vertical') {
        <li
          class="dg-nav-menu__indicator"
          [class.dg-nav-menu__indicator--visible]="indicator() !== null"
          [style.transform]="'translateY(' + (indicator()?.top ?? 0) + 'px)'"
          [style.height.px]="indicator()?.height ?? 0"
          role="presentation"
          aria-hidden="true"
        ></li>
      }
      @for (item of visibleItems(); track trackItem($index, item); let i = $index) {
        @if (item.separator) {
          <li class="dg-nav-menu__separator" role="separator"></li>
        } @else {
          <li
            class="dg-nav-menu__item"
            role="none"
            [attr.id]="item.id"
            [attr.style]="item.style ? null : null"
            [class]="itemClassFor(item, false)"
            [class.dg-nav-menu__item--active]="isActive(item)"
            [class.dg-nav-menu__item--open]="isOpen(item, 0)"
            [class.dg-nav-menu__item--disabled]="!!item.disabled"
            [class.dg-nav-menu__item--has-children]="hasChildren(item)"
            (mouseenter)="onItemHover(item, 0, $event)"
          >
            @if (itemTpl(); as tmpl) {
              <ng-container
                *ngTemplateOutlet="
                  tmpl.templateRef;
                  context: {
                    $implicit: item,
                    active: isActive(item),
                    expanded: isOpen(item, 0),
                    level: 0,
                    hasChildren: hasChildren(item)
                  }
                "
              />
            } @else {
              <a
                class="dg-nav-menu__link"
                [class]="item.linkClass"
                role="menuitem"
                [attr.href]="anchorHref(item)"
                [attr.target]="item.url ? item.target ?? null : null"
                [attr.title]="item.tooltip ?? null"
                [attr.aria-haspopup]="hasChildren(item) ? 'menu' : null"
                [attr.aria-expanded]="hasChildren(item) ? isOpen(item, 0) : null"
                [attr.aria-disabled]="item.disabled || null"
                [attr.tabindex]="item.disabled ? -1 : (item.tabindex ?? 0)"
                (click)="onItemClick(item, 0, i, $event)"
                (keydown)="onItemKeyDown(item, 0, i, $event)"
              >
                @if (item.icon) {
                  <span
                    class="dg-nav-menu__icon"
                    [class]="iconClasses(item)"
                    aria-hidden="true"
                  ></span>
                }
                @if (item.label) {
                  @if (item.escape === false) {
                    <span class="dg-nav-menu__label" [class]="item.labelClass" [innerHTML]="item.label"></span>
                  } @else {
                    <span class="dg-nav-menu__label" [class]="item.labelClass">{{ item.label }}</span>
                  }
                }
                @if (item.badge !== undefined && item.badge !== null) {
                  <span class="dg-nav-menu__badge" [class]="item.badgeStyleClass">{{ item.badge }}</span>
                }
                @if (hasChildren(item)) {
                  @if (submenuIconTpl(); as tmpl) {
                    <ng-container *ngTemplateOutlet="tmpl.templateRef; context: { root: true }" />
                  } @else {
                    <span class="dg-nav-menu__caret" aria-hidden="true">▾</span>
                  }
                }
              </a>
            }

            @if (hasChildren(item) && isOpen(item, 0)) {
              <div
                class="dg-nav-menu__submenu"
                role="menu"
                (mouseenter)="onSubmenuHover(0)"
              >
                @for (child of visibleChildren(item); track trackItem($index, child); let ci = $index) {
                  <ng-container
                    *ngTemplateOutlet="
                      submenuTpl;
                      context: { $implicit: child, level: 1, index: ci }
                    "
                  />
                }
              </div>
            }
          </li>
        }
      }
    </ul>

    @if (endTpl(); as tmpl) {
      <div class="dg-nav-menu__end">
        <ng-container *ngTemplateOutlet="tmpl.templateRef" />
      </div>
    }

    <ng-template #submenuTpl let-child let-level="level" let-index="index">
      @if (child.separator) {
        <div class="dg-nav-menu__separator" role="separator"></div>
      } @else {
        <div
          class="dg-nav-menu__sub-item"
          role="none"
          [attr.id]="child.id"
          [class]="itemClassFor(child, true)"
          [class.dg-nav-menu__sub-item--active]="isActive(child)"
          [class.dg-nav-menu__sub-item--open]="isOpen(child, level)"
          [class.dg-nav-menu__sub-item--disabled]="!!child.disabled"
          [class.dg-nav-menu__sub-item--has-children]="hasChildren(child)"
          (mouseenter)="onItemHover(child, level, $event)"
        >
          @if (itemTpl(); as tmpl) {
            <ng-container
              *ngTemplateOutlet="
                tmpl.templateRef;
                context: {
                  $implicit: child,
                  active: isActive(child),
                  expanded: isOpen(child, level),
                  level: level,
                  hasChildren: hasChildren(child)
                }
              "
            />
          } @else {
            <a
              class="dg-nav-menu__link dg-nav-menu__link--sub"
              [class]="child.linkClass"
              role="menuitem"
              [attr.href]="anchorHref(child)"
              [attr.target]="child.url ? child.target ?? null : null"
              [attr.title]="child.tooltip ?? null"
              [attr.aria-haspopup]="hasChildren(child) ? 'menu' : null"
              [attr.aria-expanded]="hasChildren(child) ? isOpen(child, level) : null"
              [attr.aria-disabled]="child.disabled || null"
              [attr.tabindex]="child.disabled ? -1 : (child.tabindex ?? 0)"
              (click)="onItemClick(child, level, index, $event)"
              (keydown)="onItemKeyDown(child, level, index, $event)"
            >
              @if (child.icon) {
                <span
                  class="dg-nav-menu__icon"
                  [class]="iconClasses(child)"
                  aria-hidden="true"
                ></span>
              }
              @if (child.label) {
                @if (child.escape === false) {
                  <span class="dg-nav-menu__label" [class]="child.labelClass" [innerHTML]="child.label"></span>
                } @else {
                  <span class="dg-nav-menu__label" [class]="child.labelClass">{{ child.label }}</span>
                }
              }
              @if (child.badge !== undefined && child.badge !== null) {
                <span class="dg-nav-menu__badge" [class]="child.badgeStyleClass">{{ child.badge }}</span>
              }
              @if (hasChildren(child)) {
                @if (submenuIconTpl(); as tmpl) {
                  <ng-container *ngTemplateOutlet="tmpl.templateRef; context: { root: false }" />
                } @else {
                  <span class="dg-nav-menu__caret dg-nav-menu__caret--sub" aria-hidden="true">▸</span>
                }
              }
            </a>
          }

          @if (hasChildren(child) && isOpen(child, level)) {
            <div
              class="dg-nav-menu__submenu dg-nav-menu__submenu--nested"
              role="menu"
              (mouseenter)="onSubmenuHover(level)"
            >
              @for (grand of visibleChildren(child); track trackItem($index, grand); let gi = $index) {
                <ng-container
                  *ngTemplateOutlet="
                    submenuTpl;
                    context: { $implicit: grand, level: level + 1, index: gi }
                  "
                />
              }
            </div>
          }
        </div>
      }
    </ng-template>
  `,
  styleUrl: './nav-menu.scss',
  host: {
    class: 'dg-nav-menu',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-fluid]': 'fluid() || null',
    '[attr.data-mobile]': 'isMobile() || null',
    '[attr.data-mobile-active]': 'mobileActive() || null',
  },
})
export class DgNavMenu {
  /** PrimeNG-style: array of menu items. */
  readonly model = input<readonly DgNavMenuItem[]>([]);
  readonly orientation = input<DgNavMenuOrientation>('horizontal');
  readonly variant = input<DgNavMenuVariant>('plain');
  readonly size = input<DgNavMenuSize>('normal');
  /** Open submenus on hover. PrimeNG default is `true`. When `false`, only click expands. */
  readonly autoDisplay = input(true, { transform: booleanish });
  /** Hide submenus when the mouse leaves the menu. PrimeNG default is `false`. */
  readonly autoHide = input(false, { transform: booleanish });
  /** Delay (ms) before `autoHide` fires. */
  readonly autoHideDelay = input(100);
  /** Max-width breakpoint at which the menu collapses behind a hamburger button. */
  readonly breakpoint = input('960px');
  readonly fluid = input(false, { transform: booleanish });
  readonly closeOnSelect = input(true, { transform: booleanish });
  readonly id = input<string>();
  readonly ariaLabel = input<string>();
  /** Active leaf identifier — extension over PrimeNG. */
  readonly value = model<unknown>(null);
  /** Mobile drawer open state — model so callers can drive it. */
  readonly mobileActive = model(false);

  readonly itemClick = output<DgNavMenuItemCommandEvent>();
  readonly opened = output<DgNavMenuItem>();
  readonly closed = output<void>();
  readonly onFocus = output<FocusEvent>();
  readonly onBlur = output<FocusEvent>();

  protected readonly itemTpl = contentChild(DgNavMenuItemDef);
  protected readonly startTpl = contentChild(DgNavMenuStartDef);
  protected readonly endTpl = contentChild(DgNavMenuEndDef);
  protected readonly submenuIconTpl = contentChild(DgNavMenuSubmenuIconDef);

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly openStack = signal<readonly OpenItem[]>([]);
  private readonly viewportMatches = signal(false);
  private autoHideTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Vertical-mode "magic pill": single absolutely-positioned highlight inside
   * the list, animated to the active item's offsetTop + offsetHeight via
   * transform/height transitions. Null when no active item or non-vertical.
   * Measured via afterRenderEffect (deps on value/model/orientation/viewport)
   * so it re-runs after Angular updates the DOM with the new active class.
   */
  private readonly listRef = viewChild<ElementRef<HTMLUListElement>>('listEl');
  protected readonly indicator = signal<{ top: number; height: number } | null>(null);

  protected readonly isMobile = computed(() => this.viewportMatches());
  protected readonly showMenuButton = computed(() => this.isMobile() && this.model().length > 0);

  protected readonly visibleItems = computed(() => this.model().filter((it) => it.visible !== false));

  constructor() {
    effect(() => {
      // Reset open submenus whenever the items reference changes.
      this.model();
      this.openStack.set([]);
    });

    effect((onCleanup) => {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      const mql = window.matchMedia(`(max-width: ${this.breakpoint()})`);
      const listener = () => this.viewportMatches.set(mql.matches);
      this.viewportMatches.set(mql.matches);
      mql.addEventListener('change', listener);
      onCleanup(() => mql.removeEventListener('change', listener));
    });

    afterRenderEffect(() => {
      // Track inputs that affect the active item's geometry so the indicator
      // re-measures after Angular has applied the new active class to the DOM.
      this.value();
      this.model();
      this.orientation();
      this.viewportMatches();
      this.measureIndicator();
    });

    // ResizeObserver on the list so font changes / window resize keep the
    // indicator aligned. Re-attaches whenever the viewChild becomes defined.
    effect((onCleanup) => {
      const list = this.listRef()?.nativeElement;
      if (!list || typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(() => this.measureIndicator());
      ro.observe(list);
      onCleanup(() => ro.disconnect());
    });
  }

  private measureIndicator(): void {
    if (this.orientation() !== 'vertical') {
      this.indicator.set(null);
      return;
    }
    const list = this.listRef()?.nativeElement;
    if (!list) {
      this.indicator.set(null);
      return;
    }
    const active = list.querySelector<HTMLElement>('.dg-nav-menu__item--active');
    if (!active) {
      this.indicator.set(null);
      return;
    }
    const next = { top: active.offsetTop, height: active.offsetHeight };
    // SSR / pre-layout: JSDOM reports 0×0 because no layout is computed. Bail
    // so the prerendered HTML doesn't bake in a visible indicator at the
    // default position — the client will run measureIndicator again post-
    // hydration and pick up real geometry.
    if (next.height === 0) return;
    const prev = this.indicator();
    if (prev && prev.top === next.top && prev.height === next.height) return;
    this.indicator.set(next);
  }

  protected hasChildren(item: DgNavMenuItem): boolean {
    return !!item.items && item.items.length > 0;
  }

  protected visibleChildren(item: DgNavMenuItem): readonly DgNavMenuItem[] {
    return (item.items ?? []).filter((it) => it.visible !== false);
  }

  protected isActive(item: DgNavMenuItem): boolean {
    const v = this.value();
    if (v === null || v === undefined) return false;
    return item.value === v;
  }

  protected isOpen(item: DgNavMenuItem, level: number): boolean {
    const stack = this.openStack();
    return stack[level]?.item === item;
  }

  protected anchorHref(item: DgNavMenuItem): string | null {
    if (item.disabled) return null;
    return item.url ?? null;
  }

  protected iconClasses(item: DgNavMenuItem): string {
    return [item.icon, item.iconClass].filter(Boolean).join(' ');
  }

  protected itemClassFor(item: DgNavMenuItem, _isSub: boolean): string {
    return item.styleClass ?? '';
  }

  protected onItemHover(item: DgNavMenuItem, level: number, _event: MouseEvent): void {
    this.clearAutoHideTimer();
    if (!this.autoDisplay()) return;
    if (item.disabled) return;
    if (!this.hasChildren(item)) {
      this.truncateOpen(level);
      return;
    }
    this.openAt(item, level);
  }

  protected onSubmenuHover(parentLevel: number): void {
    this.clearAutoHideTimer();
    if (!this.autoDisplay()) return;
    this.truncateOpen(parentLevel + 1);
  }

  protected onItemClick(item: DgNavMenuItem, level: number, index: number, event: MouseEvent): void {
    if (item.disabled) {
      event.preventDefault();
      return;
    }

    if (this.hasChildren(item)) {
      event.preventDefault();
      if (this.isOpen(item, level)) {
        this.truncateOpen(level);
      } else {
        this.openAt(item, level);
      }
      return;
    }

    if (item.value !== undefined) {
      this.value.set(item.value);
    }

    const cmd: DgNavMenuItemCommandEvent = { originalEvent: event, item, index };
    item.command?.(cmd);
    this.itemClick.emit(cmd);

    if (!item.url && !item.routerLink) {
      event.preventDefault();
    }

    if (this.closeOnSelect()) {
      this.closeAll();
      this.mobileActive.set(false);
    }
  }

  protected onItemKeyDown(item: DgNavMenuItem, level: number, index: number, event: KeyboardEvent): void {
    if (item.disabled) return;
    const key = event.key;

    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.onItemClick(item, level, index, event as unknown as MouseEvent);
      return;
    }

    if (key === 'Escape') {
      event.preventDefault();
      this.closeAll();
      return;
    }

    if (this.orientation() === 'horizontal' && level === 0) {
      if (key === 'ArrowDown' && this.hasChildren(item)) {
        event.preventDefault();
        this.openAt(item, level);
      }
    } else if (key === 'ArrowRight' && this.hasChildren(item)) {
      event.preventDefault();
      this.openAt(item, level);
    } else if (key === 'ArrowLeft' && level > 0) {
      event.preventDefault();
      this.truncateOpen(level);
    }
  }

  protected toggleMobile(event: MouseEvent): void {
    event.preventDefault();
    if (this.mobileActive()) {
      this.mobileActive.set(false);
      this.closeAll();
    } else {
      this.mobileActive.set(true);
    }
  }

  private openAt(item: DgNavMenuItem, level: number): void {
    const next = this.openStack().slice(0, level);
    next.push({ item, level });
    this.openStack.set(next);
    this.opened.emit(item);
  }

  private truncateOpen(level: number): void {
    const stack = this.openStack();
    if (stack.length <= level) return;
    const wasOpen = stack.length > 0;
    this.openStack.set(stack.slice(0, level));
    if (wasOpen && level === 0) {
      this.closed.emit();
    }
  }

  private closeAll(): void {
    if (this.openStack().length === 0) return;
    this.openStack.set([]);
    this.closed.emit();
  }

  private clearAutoHideTimer(): void {
    if (this.autoHideTimer !== null) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }

  protected trackItem = (index: number, item: DgNavMenuItem) =>
    item.id ?? (item.value !== undefined ? item.value : item.label ?? index);

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.openStack().length === 0 && !this.mobileActive()) return;
    const target = event.target as Node;
    if (this.hostRef.nativeElement.contains(target)) return;
    this.closeAll();
    this.mobileActive.set(false);
  }

  @HostListener('mouseleave')
  protected onHostLeave(): void {
    if (!this.autoHide()) return;
    this.clearAutoHideTimer();
    this.autoHideTimer = setTimeout(() => {
      this.closeAll();
      this.autoHideTimer = null;
    }, this.autoHideDelay());
  }

  @HostListener('focusin', ['$event'])
  protected onHostFocusIn(event: FocusEvent): void {
    this.onFocus.emit(event);
  }

  @HostListener('focusout', ['$event'])
  protected onHostFocusOut(event: FocusEvent): void {
    this.onBlur.emit(event);
  }
}

function booleanish(value: boolean | string | null | undefined): boolean {
  return value === '' || value === true || value === 'true';
}
