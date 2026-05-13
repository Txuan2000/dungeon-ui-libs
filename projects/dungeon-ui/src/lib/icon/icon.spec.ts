import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DgIcon } from './icon';
import { DG_ICONS } from './icons-data';

describe('DgIcon', () => {
  it('renders the SVG body for the named icon', () => {
    const fixture = TestBed.createComponent(DgIcon);
    fixture.componentRef.setInput('name', 'check');
    fixture.detectChanges();

    const svg: SVGSVGElement = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('viewBox')).toBe('0 0 14 14');
    expect(svg.innerHTML).toContain('path');
    expect(svg.innerHTML.replace(/\s+/g, ' ')).toContain(DG_ICONS['check'].replace(/\s+/g, ' ').slice(0, 60));
  });

  it('exposes aria-label as role=img and drops aria-hidden', () => {
    const fixture = TestBed.createComponent(DgIcon);
    fixture.componentRef.setInput('name', 'search');
    fixture.componentRef.setInput('ariaLabel', 'Search');
    fixture.detectChanges();

    const svg: SVGSVGElement = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Search');
    expect(svg.getAttribute('aria-hidden')).toBeNull();
  });

  it('applies spin class when spin=true', () => {
    const fixture = TestBed.createComponent(DgIcon);
    fixture.componentRef.setInput('name', 'spinner');
    fixture.componentRef.setInput('spin', true);
    fixture.detectChanges();

    const svg: SVGSVGElement = fixture.nativeElement.querySelector('svg');
    expect(svg.classList.contains('dg-icon--spin')).toBe(true);
  });

  it('reactively switches body when name changes', () => {
    const fixture = TestBed.createComponent(DgIcon);
    fixture.componentRef.setInput('name', 'check');
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelector('svg').innerHTML;

    fixture.componentRef.setInput('name', 'times');
    fixture.detectChanges();
    const second = fixture.nativeElement.querySelector('svg').innerHTML;

    expect(first).not.toBe(second);
  });
});
