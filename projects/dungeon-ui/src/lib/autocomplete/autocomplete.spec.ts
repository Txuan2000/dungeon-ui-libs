import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DgAutocomplete } from './autocomplete';

interface Item {
  label: string;
  value: number;
}

describe('DgAutocomplete', () => {
  it('renders an input with the configured placeholder', () => {
    const fixture = TestBed.createComponent(DgAutocomplete<Item>);
    fixture.componentRef.setInput('placeholder', 'Search…');
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.dg-autocomplete__input');
    expect(input.placeholder).toBe('Search…');
  });

  it('shows the dropdown trigger button when [dropdown]=true', () => {
    const fixture = TestBed.createComponent(DgAutocomplete<Item>);
    fixture.componentRef.setInput('dropdown', true);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.dg-autocomplete__dropdown');
    expect(trigger).not.toBeNull();
  });

  it('opens panel when dropdown trigger is clicked and renders suggestions', () => {
    const fixture = TestBed.createComponent(DgAutocomplete<Item>);
    fixture.componentRef.setInput('dropdown', true);
    fixture.componentRef.setInput('suggestions', [
      { label: 'Apple', value: 1 },
      { label: 'Banana', value: 2 },
    ] as Item[]);
    fixture.componentRef.setInput('optionLabel', 'label');
    fixture.componentRef.setInput('optionValue', 'value');
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.dg-autocomplete__dropdown').click();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.dg-autocomplete__panel');
    expect(panel).not.toBeNull();
    const options = fixture.nativeElement.querySelectorAll('.dg-autocomplete__option');
    expect(options.length).toBe(2);
    expect(options[0].textContent?.trim()).toBe('Apple');
  });

  it('reflects selected option label in the input on select()', () => {
    const fixture = TestBed.createComponent(DgAutocomplete<Item>);
    fixture.componentRef.setInput('suggestions', [
      { label: 'Apple', value: 1 },
      { label: 'Banana', value: 2 },
    ] as Item[]);
    fixture.componentRef.setInput('optionLabel', 'label');
    fixture.componentRef.setInput('optionValue', 'value');
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    cmp.select({ label: 'Banana', value: 2 });
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.dg-autocomplete__input');
    expect(input.value).toBe('Banana');
    expect(cmp.value()).toBe(2);
  });
});
