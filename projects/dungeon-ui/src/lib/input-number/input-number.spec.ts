import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DgInputNumber } from './input-number';

describe('DgInputNumber', () => {
  it('renders empty when value is null', () => {
    const fixture = TestBed.createComponent(DgInputNumber);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('');
  });

  it('formats decimal value with locale grouping', () => {
    const fixture = TestBed.createComponent(DgInputNumber);
    fixture.componentRef.setInput('locale', 'en-US');
    fixture.componentRef.setInput('value', 1234567.89);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toMatch(/1,234,567.89/);
  });

  it('honors prefix / suffix in display', () => {
    const fixture = TestBed.createComponent(DgInputNumber);
    fixture.componentRef.setInput('value', 42);
    fixture.componentRef.setInput('prefix', '$');
    fixture.componentRef.setInput('suffix', ' USD');
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('$42 USD');
  });

  it('increments by step on increment()', () => {
    const fixture = TestBed.createComponent(DgInputNumber);
    fixture.componentRef.setInput('value', 5);
    fixture.componentRef.setInput('step', 3);
    fixture.detectChanges();
    fixture.componentInstance.increment();
    expect(fixture.componentInstance.value()).toBe(8);
  });

  it('clamps to max on increment', () => {
    const fixture = TestBed.createComponent(DgInputNumber);
    fixture.componentRef.setInput('value', 9);
    fixture.componentRef.setInput('max', 10);
    fixture.componentRef.setInput('step', 5);
    fixture.detectChanges();
    fixture.componentInstance.increment();
    expect(fixture.componentInstance.value()).toBe(10);
  });

  it('clamps to min on decrement from null (treated as 0)', () => {
    const fixture = TestBed.createComponent(DgInputNumber);
    fixture.componentRef.setInput('min', -5);
    fixture.componentRef.setInput('step', 10);
    fixture.detectChanges();
    fixture.componentInstance.decrement();
    expect(fixture.componentInstance.value()).toBe(-5);
  });

  it('clear() resets value to null', () => {
    const fixture = TestBed.createComponent(DgInputNumber);
    fixture.componentRef.setInput('value', 99);
    fixture.componentRef.setInput('showClear', true);
    fixture.detectChanges();
    fixture.componentInstance.clear();
    expect(fixture.componentInstance.value()).toBeNull();
  });

  it('renders spinner buttons when showButtons=true', () => {
    const fixture = TestBed.createComponent(DgInputNumber);
    fixture.componentRef.setInput('showButtons', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.dg-input-number__btn').length).toBe(2);
  });
});
