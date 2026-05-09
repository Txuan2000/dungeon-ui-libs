import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DgInputText } from './input-text';

describe('DgInputText', () => {
  it('renders placeholder', () => {
    const fixture = TestBed.createComponent(DgInputText);
    fixture.componentRef.setInput('placeholder', 'Enter your name');
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.placeholder).toBe('Enter your name');
  });

  it('two-way binds via model input on user typing', () => {
    const fixture = TestBed.createComponent(DgInputText);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'hello';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('hello');
  });

  it('reflects size and variant via data attributes', () => {
    const fixture = TestBed.createComponent(DgInputText);
    fixture.componentRef.setInput('size', 'large');
    fixture.componentRef.setInput('variant', 'filled');
    fixture.componentRef.setInput('invalid', true);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.getAttribute('data-size')).toBe('large');
    expect(input.getAttribute('data-variant')).toBe('filled');
    expect(input.getAttribute('data-invalid')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('writeValue propagates to the input element', () => {
    const fixture = TestBed.createComponent(DgInputText);
    fixture.detectChanges();

    fixture.componentInstance.writeValue('preset');
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('preset');
  });
});
