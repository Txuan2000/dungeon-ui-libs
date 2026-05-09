import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DgNavMenu } from './nav-menu';
import { DgNavMenuItem, DgNavMenuItemCommandEvent } from './nav-menu-defs';

describe('DgNavMenu', () => {
  const items: DgNavMenuItem[] = [
    { label: 'Home', value: 'home' },
    {
      label: 'Products',
      value: 'products',
      items: [
        { label: 'Phones', value: 'phones' },
        { label: 'Laptops', value: 'laptops' },
      ],
    },
    { label: 'About', value: 'about', disabled: true },
  ];

  it('renders top-level items', () => {
    const fixture = TestBed.createComponent(DgNavMenu);
    fixture.componentRef.setInput('model', items);
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('.dg-nav-menu__link');
    expect(links.length).toBe(3);
    expect(links[0].textContent?.trim()).toContain('Home');
    expect(links[2].getAttribute('aria-disabled')).toBe('true');
  });

  it('opens submenu on click for items with children', () => {
    const fixture = TestBed.createComponent(DgNavMenu);
    fixture.componentRef.setInput('model', items);
    fixture.componentRef.setInput('autoDisplay', false);
    fixture.detectChanges();

    const productsLink: HTMLAnchorElement = fixture.nativeElement.querySelectorAll('.dg-nav-menu__link')[1];
    productsLink.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dg-nav-menu__submenu')).not.toBeNull();
    expect(productsLink.getAttribute('aria-expanded')).toBe('true');
  });

  it('emits itemClick with PrimeNG-shaped event + sets value on leaf select', () => {
    const fixture = TestBed.createComponent(DgNavMenu);
    fixture.componentRef.setInput('model', items);
    fixture.detectChanges();

    let received: DgNavMenuItemCommandEvent | null = null;
    fixture.componentInstance.itemClick.subscribe((evt) => (received = evt));

    const homeLink: HTMLAnchorElement = fixture.nativeElement.querySelectorAll('.dg-nav-menu__link')[0];
    homeLink.click();
    fixture.detectChanges();

    expect(received).not.toBeNull();
    expect(received!.item.value).toBe('home');
    expect(received!.index).toBe(0);
    expect(fixture.componentInstance.value()).toBe('home');
  });

  it('invokes per-item command callback', () => {
    let invokedFor: DgNavMenuItem | null = null;
    const itemsWithCommand: DgNavMenuItem[] = [
      { label: 'Cmd', value: 'cmd', command: (evt) => (invokedFor = evt.item) },
    ];
    const fixture = TestBed.createComponent(DgNavMenu);
    fixture.componentRef.setInput('model', itemsWithCommand);
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.dg-nav-menu__link');
    link.click();
    fixture.detectChanges();

    expect(invokedFor).not.toBeNull();
    expect(invokedFor!.value).toBe('cmd');
  });

  it('marks active item from value', () => {
    const fixture = TestBed.createComponent(DgNavMenu);
    fixture.componentRef.setInput('model', items);
    fixture.componentRef.setInput('value', 'home');
    fixture.detectChanges();

    const firstItem = fixture.nativeElement.querySelector('.dg-nav-menu__item');
    expect(firstItem.classList.contains('dg-nav-menu__item--active')).toBe(true);
  });

  it('hides items with visible=false', () => {
    const fixture = TestBed.createComponent(DgNavMenu);
    fixture.componentRef.setInput('model', [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b', visible: false },
      { label: 'C', value: 'c' },
    ] as DgNavMenuItem[]);
    fixture.detectChanges();

    const labels = Array.from(fixture.nativeElement.querySelectorAll('.dg-nav-menu__label')).map(
      (el: Element) => el.textContent?.trim(),
    );
    expect(labels).toEqual(['A', 'C']);
  });
});
