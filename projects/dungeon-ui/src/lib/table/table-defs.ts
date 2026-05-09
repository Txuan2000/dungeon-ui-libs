import { Directive, TemplateRef, inject, input } from '@angular/core';

export interface DgTableColumn<T = Record<string, unknown>> {
  field: string;
  header: string;
  width?: string;
  formatter?: (row: T) => string | number;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface DgTableCellContext<T = Record<string, unknown>> {
  $implicit: T;
  value: unknown;
  index: number;
  column: DgTableColumn<T>;
}

@Directive({
  selector: 'ng-template[dgColumn]',
  standalone: true,
})
export class DgColumnDef {
  readonly field = input.required<string>({ alias: 'dgColumn' });
  readonly templateRef = inject<TemplateRef<DgTableCellContext>>(TemplateRef);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static ngTemplateContextGuard(_dir: DgColumnDef, ctx: unknown): ctx is DgTableCellContext<any> {
    return true;
  }
}
