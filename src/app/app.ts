import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { DgNavMenu, DgNavMenuItem, DgNavMenuItemCommandEvent } from 'dungeon-ui';
import { AppSearch } from './search/app-search';

@Component({
  selector: 'app-root',
  imports: [DgNavMenu, RouterOutlet, RouterLink, AppSearch],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class App {
  private readonly router = inject(Router);

  /** Top-level nav items. `value` doubles as the route path — used both to
   * highlight the active item and as the navigation target in
   * `onNavSelect`. The library doesn't import @angular/router, so we
   * navigate programmatically instead of using a `routerLink` field. */
  protected readonly navItems: DgNavMenuItem[] = [
    { label: 'Home', value: '/', icon: '🏠' },
    { label: 'Button', value: '/buttons', icon: '🔘' },
    { label: 'Input Text', value: '/input-text', icon: '⌨️' },
    { label: 'Input Mask', value: '/input-mask', icon: '🎭' },
    { label: 'Input Number', value: '/input-number', icon: '🔢' },
    { label: 'Input Group', value: '/input-group', icon: '🧩' },
    { label: 'Icon Field', value: '/icon-field', icon: '🔍' },
    { label: 'Dialog', value: '/dialog', icon: '🗨️' },
    { label: 'Dropdown', value: '/dropdown', icon: '🔽' },
    { label: 'Autocomplete', value: '/autocomplete', icon: '🔎' },
    { label: 'Checkbox', value: '/checkbox', icon: '☑️' },
    { label: 'Radio', value: '/radio', icon: '🔘' },
    { label: 'Datepicker', value: '/datepicker', icon: '📅' },
    { label: 'Table', value: '/table', icon: '📋' },
    { label: 'Nav Menu', value: '/nav-menu', icon: '🧭' },
    { label: 'Focus Trap', value: '/focus-trap', icon: '🪤' },
  ];

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly activeRoute = computed(() => {
    const url = this.currentUrl().split('?')[0].split('#')[0];
    return url || '/';
  });

  /** Mobile drawer state. Sidebar slides in from the left; closes on nav select or backdrop click. */
  protected readonly mobileNavOpen = signal(false);

  protected toggleMobileNav(): void {
    this.mobileNavOpen.update((v) => !v);
  }

  protected closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  protected onNavSelect(event: DgNavMenuItemCommandEvent): void {
    const path = event.item.value;
    if (typeof path === 'string') {
      this.router.navigateByUrl(path);
      this.closeMobileNav();
    }
  }
}
