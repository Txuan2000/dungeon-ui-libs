import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DgDatepicker } from './datepicker';

describe('DgDatepicker', () => {
  it('renders trigger field by default (popup mode)', () => {
    const fixture = TestBed.createComponent(DgDatepicker);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dg-datepicker__field')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.dg-datepicker__panel')).toBeNull();
  });

  it('renders panel inline when inline=true', () => {
    const fixture = TestBed.createComponent(DgDatepicker);
    fixture.componentRef.setInput('inline', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dg-datepicker__field')).toBeNull();
    expect(fixture.nativeElement.querySelector('.dg-datepicker__panel--inline')).not.toBeNull();
  });

  it('opens panel on trigger click and selects a date', () => {
    const fixture = TestBed.createComponent(DgDatepicker);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.dg-datepicker__trigger').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dg-datepicker__panel')).not.toBeNull();

    // Click the first available cell in the current month
    const cells = fixture.nativeElement.querySelectorAll('.dg-datepicker__cell:not(.dg-datepicker__cell--other):not(.dg-datepicker__cell--disabled)');
    expect(cells.length).toBeGreaterThan(0);
    cells[0].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBeInstanceOf(Date);
  });

  it('formats single value to displayValue using format input', () => {
    const fixture = TestBed.createComponent(DgDatepicker);
    fixture.componentRef.setInput('format', 'dd/MM/yyyy');
    fixture.componentRef.setInput('value', new Date(2024, 0, 5)); // 5 Jan 2024
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.dg-datepicker__input');
    expect(input.value).toBe('05/01/2024');
  });

  it('builds a 6×7 grid', () => {
    const fixture = TestBed.createComponent(DgDatepicker);
    fixture.componentRef.setInput('inline', true);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.dg-datepicker__grid tbody tr');
    expect(rows.length).toBe(6);
    rows.forEach((r: HTMLTableRowElement) => {
      expect(r.querySelectorAll('.dg-datepicker__cell').length).toBe(7);
    });
  });

  it('supports range selection across two clicks', () => {
    const fixture = TestBed.createComponent(DgDatepicker);
    fixture.componentRef.setInput('inline', true);
    fixture.componentRef.setInput('selectionMode', 'range');
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('.dg-datepicker__cell:not(.dg-datepicker__cell--other):not(.dg-datepicker__cell--disabled)');
    expect(cells.length).toBeGreaterThanOrEqual(3);
    cells[0].click();
    fixture.detectChanges();
    cells[2].click();
    fixture.detectChanges();

    const v = fixture.componentInstance.value();
    expect(Array.isArray(v)).toBe(true);
    expect((v as [Date, Date])[0]).toBeInstanceOf(Date);
    expect((v as [Date, Date])[1]).toBeInstanceOf(Date);
  });
});
