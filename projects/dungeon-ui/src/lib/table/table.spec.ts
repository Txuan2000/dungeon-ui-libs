import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DgTable } from './table';
import { DgTableColumn } from './table-defs';

interface Row {
  id: number;
  name: string;
}

describe('DgTable', () => {
  const columns: DgTableColumn<Row>[] = [
    { field: 'id', header: 'ID', width: '80px' },
    { field: 'name', header: 'Name' },
  ];

  it('renders headers', () => {
    const fixture = TestBed.createComponent(DgTable<Row>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', [{ id: 1, name: 'Alice' }]);
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('.dg-table__hcell');
    expect(headers.length).toBe(2);
    expect(headers[0].textContent.trim()).toBe('ID');
    expect(headers[1].textContent.trim()).toBe('Name');
  });

  it('renders all rows when virtualScroll is false', () => {
    const fixture = TestBed.createComponent(DgTable<Row>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
    ]);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.dg-table__row');
    expect(rows.length).toBe(3);
  });

  it('renders only a window when virtualScroll is true', () => {
    const fixture = TestBed.createComponent(DgTable<Row>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Row ${i}` })));
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('rowHeight', 40);
    fixture.componentRef.setInput('scrollHeight', '400px');
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.dg-table__row');
    expect(rows.length).toBeLessThan(50);
    expect(rows.length).toBeGreaterThan(0);
  });
});
