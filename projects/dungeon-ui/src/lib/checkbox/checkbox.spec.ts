import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DgCheckbox } from './checkbox';

describe('DgCheckbox', () => {
  it('renders unchecked by default in binary mode', () => {
    const fixture = TestBed.createComponent(DgCheckbox<boolean>);
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.dg-checkbox');
    expect(root.hasAttribute('data-checked')).toBe(false);
    expect(root.hasAttribute('data-indeterminate')).toBe(false);
  });

  it('reflects checked state when value === trueValue', () => {
    const fixture = TestBed.createComponent(DgCheckbox<boolean>);
    fixture.componentRef.setInput('value', true);
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.dg-checkbox');
    expect(root.getAttribute('data-checked')).toBe('true');
  });

  it('toggles between trueValue and falseValue on click', () => {
    const fixture = TestBed.createComponent(DgCheckbox<boolean>);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    cmp.toggle();
    expect(cmp.value()).toBe(true);
    cmp.toggle();
    expect(cmp.value()).toBe(false);
  });

  it('honors custom trueValue / falseValue', () => {
    const fixture = TestBed.createComponent(DgCheckbox<string>);
    fixture.componentRef.setInput('trueValue', 'Y');
    fixture.componentRef.setInput('falseValue', 'N');
    fixture.componentRef.setInput('value', 'N');
    fixture.detectChanges();

    fixture.componentInstance.toggle();
    expect(fixture.componentInstance.value()).toBe('Y');
  });

  it('multi mode: toggling adds / removes checkboxValue from the array', () => {
    const fixture = TestBed.createComponent(DgCheckbox<string[]>);
    fixture.componentRef.setInput('binary', false);
    fixture.componentRef.setInput('checkboxValue', 'apple');
    fixture.componentRef.setInput('value', ['banana']);
    fixture.detectChanges();

    fixture.componentInstance.toggle();
    expect(fixture.componentInstance.value()).toEqual(['banana', 'apple']);

    fixture.componentInstance.toggle();
    expect(fixture.componentInstance.value()).toEqual(['banana']);
  });

  it('renders the label when provided', () => {
    const fixture = TestBed.createComponent(DgCheckbox<boolean>);
    fixture.componentRef.setInput('label', 'I agree');
    fixture.detectChanges();

    const label: HTMLElement = fixture.nativeElement.querySelector('.dg-checkbox__label');
    expect(label?.textContent?.trim()).toBe('I agree');
  });

  it('aria-checked reports "mixed" when indeterminate', () => {
    const fixture = TestBed.createComponent(DgCheckbox<boolean>);
    fixture.componentRef.setInput('indeterminate', true);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.dg-checkbox__input');
    expect(input.getAttribute('aria-checked')).toBe('mixed');
  });

  it('does not toggle when readonly', () => {
    const fixture = TestBed.createComponent(DgCheckbox<boolean>);
    fixture.componentRef.setInput('readonly', true);
    fixture.componentRef.setInput('value', false);
    fixture.detectChanges();

    fixture.componentInstance.toggle();
    expect(fixture.componentInstance.value()).toBe(false);
  });
});
