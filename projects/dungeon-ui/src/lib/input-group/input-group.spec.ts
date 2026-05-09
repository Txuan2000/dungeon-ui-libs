import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DgInputGroup, DgInputGroupAddon } from './input-group';

@Component({
  imports: [DgInputGroup, DgInputGroupAddon],
  template: `
    <dg-input-group>
      <dg-input-group-addon>$</dg-input-group-addon>
      <input class="dg-input-text__field" />
      <dg-input-group-addon>.00</dg-input-group-addon>
    </dg-input-group>
  `,
})
class HostComponent {}

describe('DgInputGroup', () => {
  it('renders projected addons + input children', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const group: HTMLElement = fixture.nativeElement.querySelector('.dg-input-group');
    expect(group).not.toBeNull();
    const addons = fixture.nativeElement.querySelectorAll('.dg-input-group__addon');
    expect(addons.length).toBe(2);
    expect(addons[0].textContent?.trim()).toBe('$');
    expect(addons[1].textContent?.trim()).toBe('.00');
  });

  it('reflects fluid input as a host data-attribute', () => {
    const fixture = TestBed.createComponent(DgInputGroup);
    fixture.componentRef.setInput('fluid', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('data-fluid')).toBe('true');
  });
});
