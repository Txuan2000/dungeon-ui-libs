import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DgIconField, DgInputIcon } from './icon-field';

@Component({
  imports: [DgIconField, DgInputIcon],
  template: `
    <dg-icon-field [iconPosition]="position">
      <dg-input-icon>🔍</dg-input-icon>
      <input class="dg-input-text__field" />
    </dg-icon-field>
  `,
})
class HostComponent {
  position: 'left' | 'right' = 'left';
}

describe('DgIconField', () => {
  it('renders icon + input children', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const field: HTMLElement = fixture.nativeElement.querySelector('.dg-icon-field');
    expect(field).not.toBeNull();
    expect(field.querySelector('.dg-input-icon')?.textContent?.trim()).toBe('🔍');
    expect(field.querySelector('.dg-input-text__field')).not.toBeNull();
  });

  it('reflects iconPosition as a host data-attribute', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const field: HTMLElement = fixture.nativeElement.querySelector('.dg-icon-field');
    expect(field.getAttribute('data-icon-position')).toBe('left');

    fixture.componentInstance.position = 'right';
    fixture.detectChanges();
    expect(field.getAttribute('data-icon-position')).toBe('right');
  });

  it('reflects fluid as a host data-attribute', () => {
    const fixture = TestBed.createComponent(DgIconField);
    fixture.componentRef.setInput('fluid', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('data-fluid')).toBe('true');
  });
});
