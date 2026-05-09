import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DgButton } from './button';

describe('DgButton', () => {
  it('renders the label', () => {
    const fixture = TestBed.createComponent(DgButton);
    fixture.componentRef.setInput('label', 'Save');
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.textContent?.trim()).toBe('Save');
  });

  it('disables the button when loading', () => {
    const fixture = TestBed.createComponent(DgButton);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');
  });

  it('emits clicked on click', () => {
    const fixture = TestBed.createComponent(DgButton);
    fixture.componentRef.setInput('label', 'Go');
    fixture.detectChanges();

    let count = 0;
    fixture.componentInstance.clicked.subscribe(() => count++);

    fixture.nativeElement.querySelector('button').click();
    expect(count).toBe(1);
  });

  it('reflects severity, size and variant via data attributes', () => {
    const fixture = TestBed.createComponent(DgButton);
    fixture.componentRef.setInput('severity', 'danger');
    fixture.componentRef.setInput('size', 'large');
    fixture.componentRef.setInput('variant', 'outlined');
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('data-severity')).toBe('danger');
    expect(btn.getAttribute('data-size')).toBe('large');
    expect(btn.getAttribute('data-variant')).toBe('outlined');
  });
});
