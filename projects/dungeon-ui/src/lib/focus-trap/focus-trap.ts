import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  Renderer2,
  effect,
  inject,
  input,
} from '@angular/core';

const FOCUSABLE_SELECTOR =
  'a[href]:not([tabindex="-1"]),' +
  'area[href]:not([tabindex="-1"]),' +
  'button:not([disabled]):not([tabindex="-1"]),' +
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]),' +
  'select:not([disabled]):not([tabindex="-1"]),' +
  'textarea:not([disabled]):not([tabindex="-1"]),' +
  'iframe:not([tabindex="-1"]),' +
  'object:not([tabindex="-1"]),' +
  'embed:not([tabindex="-1"]),' +
  'audio[controls]:not([tabindex="-1"]),' +
  'video[controls]:not([tabindex="-1"]),' +
  '[contenteditable]:not([contenteditable="false"]):not([tabindex="-1"]),' +
  '[tabindex]:not([tabindex="-1"])';

const SENTINEL_ATTR = 'data-dg-focus-trap-sentinel';

/**
 * Confines Tab / Shift+Tab navigation to focusable descendants of the host
 * element. Two visually-hidden but tab-focusable sentinel `<span>`s are
 * inserted at the start and end of the host. When focus reaches a sentinel
 * (via Tab from the last real focusable, Shift+Tab from the first, or
 * directly from outside), it is redirected to the first or last focusable
 * inside the host so focus stays trapped.
 *
 * Modelled after PrimeNG's `pFocusTrap` directive.
 *
 * Usage:
 * ```html
 * <div dgFocusTrap>
 *   <button>One</button>
 *   <input />
 *   <button>Done</button>
 * </div>
 * ```
 */
@Directive({
  selector: '[dgFocusTrap]',
  standalone: true,
  exportAs: 'dgFocusTrap',
})
export class DgFocusTrap {
  /**
   * When `true`, the trap is inactive — sentinels are removed and tab
   * navigation flows naturally past the host element.
   */
  readonly disabled = input(false, { transform: booleanish, alias: 'dgFocusTrapDisabled' });

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

  private firstSentinel: HTMLSpanElement | null = null;
  private lastSentinel: HTMLSpanElement | null = null;
  private firstSentinelFocusUnlisten: (() => void) | null = null;
  private lastSentinelFocusUnlisten: (() => void) | null = null;

  constructor() {
    afterNextRender(() => {
      if (!this.disabled()) this.installSentinels();
    });

    effect(() => {
      const isDisabled = this.disabled();
      if (isDisabled) {
        this.uninstallSentinels();
      } else if (!this.firstSentinel) {
        this.installSentinels();
      }
    });

    inject(DestroyRef).onDestroy(() => this.uninstallSentinels());
  }

  /**
   * Move focus to the first focusable element inside the host, or to the
   * host itself if no focusable descendants exist. No-op when disabled.
   */
  focusFirst(): void {
    if (this.disabled()) return;
    const focusables = this.getFocusables();
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      const host = this.hostRef.nativeElement;
      if (typeof host.focus === 'function') host.focus();
    }
  }

  /**
   * Move focus to the last focusable element inside the host. No-op when
   * disabled.
   */
  focusLast(): void {
    if (this.disabled()) return;
    const focusables = this.getFocusables();
    focusables[focusables.length - 1]?.focus();
  }

  private installSentinels(): void {
    if (this.firstSentinel || this.lastSentinel) return;
    const host = this.hostRef.nativeElement;

    this.firstSentinel = this.createSentinel('first');
    this.lastSentinel = this.createSentinel('last');

    this.renderer.insertBefore(host, this.firstSentinel, host.firstChild);
    this.renderer.appendChild(host, this.lastSentinel);

    this.firstSentinelFocusUnlisten = this.renderer.listen(this.firstSentinel, 'focus', (event: FocusEvent) =>
      this.onFirstSentinelFocus(event),
    );
    this.lastSentinelFocusUnlisten = this.renderer.listen(this.lastSentinel, 'focus', (event: FocusEvent) =>
      this.onLastSentinelFocus(event),
    );
  }

  private uninstallSentinels(): void {
    this.firstSentinelFocusUnlisten?.();
    this.lastSentinelFocusUnlisten?.();
    this.firstSentinelFocusUnlisten = null;
    this.lastSentinelFocusUnlisten = null;

    if (this.firstSentinel?.parentNode) {
      this.renderer.removeChild(this.firstSentinel.parentNode, this.firstSentinel);
    }
    if (this.lastSentinel?.parentNode) {
      this.renderer.removeChild(this.lastSentinel.parentNode, this.lastSentinel);
    }
    this.firstSentinel = null;
    this.lastSentinel = null;
  }

  private createSentinel(position: 'first' | 'last'): HTMLSpanElement {
    const el = this.renderer.createElement('span') as HTMLSpanElement;
    this.renderer.setAttribute(el, 'tabindex', '0');
    this.renderer.setAttribute(el, 'role', 'presentation');
    this.renderer.setAttribute(el, 'aria-hidden', 'true');
    this.renderer.setAttribute(el, SENTINEL_ATTR, position);
    // visually hidden but focusable — same recipe as `.sr-only` + tabindex
    const style = el.style;
    style.position = 'absolute';
    style.width = '1px';
    style.height = '1px';
    style.margin = '-1px';
    style.padding = '0';
    style.border = '0';
    style.overflow = 'hidden';
    style.clip = 'rect(0 0 0 0)';
    style.clipPath = 'inset(50%)';
    style.whiteSpace = 'nowrap';
    style.pointerEvents = 'none';
    return el;
  }

  private onFirstSentinelFocus(event: FocusEvent): void {
    // Reached via Shift+Tab from inside (relatedTarget = first real focusable)
    // OR jumped in from outside (relatedTarget outside host). In both cases,
    // wrap to the last focusable. The exception: focus came from the *last*
    // sentinel (Tab loop) — wrap to the first focusable.
    const focusables = this.getFocusables();
    if (focusables.length === 0) return;
    const target =
      event.relatedTarget === this.lastSentinel
        ? focusables[0]
        : focusables[focusables.length - 1];
    target.focus();
  }

  private onLastSentinelFocus(event: FocusEvent): void {
    // Reached via Tab from inside or from outside — wrap to the first
    // focusable. Exception: came from the first sentinel — wrap to last.
    const focusables = this.getFocusables();
    if (focusables.length === 0) return;
    const target =
      event.relatedTarget === this.firstSentinel
        ? focusables[focusables.length - 1]
        : focusables[0];
    target.focus();
  }

  private getFocusables(): HTMLElement[] {
    const host = this.hostRef.nativeElement;
    return Array.from(host.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.hasAttribute(SENTINEL_ATTR) && this.isVisible(el),
    );
  }

  private isVisible(el: HTMLElement): boolean {
    if (el.hidden) return false;
    return !!(el.offsetParent || el.getClientRects().length);
  }
}

function booleanish(value: boolean | string | null | undefined): boolean {
  return value === '' || value === true || value === 'true';
}
