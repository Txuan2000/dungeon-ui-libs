import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>dungeon-ui-libs</h1>
      <p>Angular 21 standalone component library — built with PrimeNG patterns + signals.</p>
    </header>

    <section>
      <h2>Components</h2>
      <ul class="component-grid">
        <li><a routerLink="/buttons"><strong>Button</strong> — severities, variants, sizes, loading</a></li>
        <li><a routerLink="/input-text"><strong>Input Text</strong> — sizes, variants, two-way + reactive form</a></li>
        <li><a routerLink="/input-mask"><strong>Input Mask</strong> — directive định dạng input theo pattern</a></li>
        <li><a routerLink="/input-number"><strong>Input Number</strong> — currency / percent, spinner, min/max</a></li>
        <li><a routerLink="/input-group"><strong>Input Group</strong> — ghép input + addon + button thành 1 khối</a></li>
        <li><a routerLink="/icon"><strong>Icon</strong> — 54 SVG icon ported từ PrimeNG, currentColor + spin</a></li>
        <li><a routerLink="/icon-field"><strong>Icon Field</strong> — overlay icon bên trong input</a></li>
        <li><a routerLink="/dialog"><strong>Dialog</strong> — inline + service-driven, custom header/footer</a></li>
        <li><a routerLink="/dropdown"><strong>Dropdown</strong> — filter, body portal, custom templates</a></li>
        <li><a routerLink="/datepicker"><strong>Datepicker</strong> — single / range, button bar, min/max</a></li>
        <li><a routerLink="/table"><strong>Table</strong> — virtual scroll, pagination (client/server/cursor)</a></li>
        <li><a routerLink="/nav-menu"><strong>Nav Menu</strong> — PrimeNG-aligned menubar / sidebar / tabs</a></li>
        <li><a routerLink="/focus-trap"><strong>Focus Trap</strong> — directive giam tab trong container</a></li>
        <li><a routerLink="/html-to-pdf"><strong>HTML → PDF</strong> — service convert + preview iframe, side-by-side demo</a></li>
      </ul>
    </section>
  `,
  styles: [
    `
      .component-grid {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 0.75rem;
      }
      .component-grid li {
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        background: #ffffff;
      }
      .component-grid a {
        display: block;
        padding: 1rem;
        color: #0f172a;
        text-decoration: none;
        transition: background-color 120ms ease, border-color 120ms ease;
      }
      .component-grid a:hover {
        background: #f1f5f9;
      }
      .component-grid strong {
        color: #1d4ed8;
      }
    `,
  ],
})
export class HomePage {}
