import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DgDropdown } from './dropdown';

interface Item {
  label: string;
  value: number;
}

describe('DgDropdown', () => {
  it('shows placeholder when no value', () => {
    const fixture = TestBed.createComponent(DgDropdown<Item>);
    fixture.componentRef.setInput('options', [{ label: 'A', value: 1 }] as Item[]);
    fixture.componentRef.setInput('optionLabel', 'label');
    fixture.componentRef.setInput('optionValue', 'value');
    fixture.componentRef.setInput('placeholder', 'Pick one');
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.dg-dropdown__trigger');
    expect(trigger.textContent?.includes('Pick one')).toBe(true);
  });

  it('renders selected label when value is set', () => {
    const fixture = TestBed.createComponent(DgDropdown<Item>);
    fixture.componentRef.setInput('options', [
      { label: 'A', value: 1 },
      { label: 'B', value: 2 },
    ] as Item[]);
    fixture.componentRef.setInput('optionLabel', 'label');
    fixture.componentRef.setInput('optionValue', 'value');
    fixture.componentRef.setInput('value', 2);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.dg-dropdown__trigger');
    expect(trigger.textContent?.includes('B')).toBe(true);
  });

  it('opens panel on trigger click', () => {
    const fixture = TestBed.createComponent(DgDropdown<Item>);
    fixture.componentRef.setInput('options', [{ label: 'A', value: 1 }] as Item[]);
    fixture.componentRef.setInput('optionLabel', 'label');
    fixture.componentRef.setInput('optionValue', 'value');
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.dg-dropdown__trigger').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dg-dropdown__panel')).not.toBeNull();
  });
});
