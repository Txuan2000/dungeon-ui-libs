import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DgNavMenu, DgNavMenuItem } from 'dungeon-ui';

@Component({
  selector: 'app-nav-menu-page',
  imports: [DgNavMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Nav Menu</h1>
      <p>PrimeNG-aligned <code>p-menubar</code> equivalent — orientations, variants, mobile drawer.</p>
    </header>

    <section>
      <h2>Horizontal</h2>
      <div class="nav-menu-demo nav-menu-demo--surface">
        <dg-nav-menu [model]="navMenuItems" [(value)]="activeNav" orientation="horizontal" fluid />
      </div>
      <p class="hint">Active: <strong>{{ activeNav() ?? '(none)' }}</strong></p>
    </section>

    <section>
      <h2>Pills (click to expand)</h2>
      <div class="nav-menu-demo nav-menu-demo--accent">
        <dg-nav-menu [model]="navMenuItems" [(value)]="activeNav" variant="pills" [autoDisplay]="false" fluid />
      </div>
    </section>

    <section>
      <h2>Tabs</h2>
      <div class="nav-menu-demo nav-menu-demo--paper">
        <dg-nav-menu [model]="navMenuItems" [(value)]="activeNav" variant="tabs" fluid />
      </div>
    </section>

    <section>
      <h2>Vertical (sidebar)</h2>
      <div class="nav-menu-demo nav-menu-demo--sidebar">
        <dg-nav-menu [model]="navMenuItems" [(value)]="activeNav" orientation="vertical" size="small" fluid />
      </div>
    </section>
  `,
  styles: [
    `
      .nav-menu-demo {
        padding: 0.75rem;
        border-radius: 0.625rem;
        border: 1px solid #e2e8f0;
        box-sizing: border-box;
      }

      .nav-menu-demo--surface {
        background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
      }

      .nav-menu-demo--accent {
        background: linear-gradient(180deg, #ecfeff 0%, #e0f2fe 100%);
        border-color: #bae6fd;
      }

      .nav-menu-demo--paper {
        background: #ffffff;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
      }

      .nav-menu-demo--sidebar {
        max-width: 16rem;
        background: linear-gradient(180deg, #fafaf9 0%, #f5f5f4 100%);
        border-color: #e7e5e4;
      }
    `,
  ],
})
export class NavMenuPage {
  protected readonly navMenuItems: DgNavMenuItem[] = [
    { label: 'Trang chủ', value: 'home', icon: '🏠' },
    {
      label: 'Sản phẩm',
      value: 'products',
      icon: '📦',
      items: [
        { label: 'Điện thoại', value: 'phones' },
        { label: 'Laptop', value: 'laptops', badge: 'New' },
        {
          label: 'Phụ kiện',
          value: 'accessories',
          items: [
            { label: 'Tai nghe', value: 'headphones' },
            { label: 'Sạc dự phòng', value: 'powerbank' },
            { label: 'Ốp lưng', value: 'cases', disabled: true },
          ],
        },
        { separator: true },
        { label: 'Khuyến mãi', value: 'sale', badge: 12, command: (e) => console.log('command', e.item.label) },
      ],
    },
    {
      label: 'Dịch vụ',
      value: 'services',
      icon: '🛠️',
      items: [
        { label: 'Bảo hành', value: 'warranty', tooltip: 'Tra cứu bảo hành' },
        { label: 'Sửa chữa', value: 'repair' },
      ],
    },
    { label: 'Liên hệ', value: 'contact', icon: '✉️', url: 'https://example.com', target: '_blank' },
    { label: 'Quản trị', value: 'admin', icon: '🔒', disabled: true },
  ];
  protected readonly activeNav = signal<unknown>('home');
}
