import { Directive, TemplateRef, inject } from '@angular/core';

export interface DgDropdownOptionContext<T = unknown> {
  $implicit: T;
  index: number;
  selected: boolean;
  highlighted: boolean;
}

export interface DgDropdownSelectedContext<T = unknown> {
  $implicit: T;
}

@Directive({
  selector: 'ng-template[dgDropdownOption]',
  standalone: true,
})
export class DgDropdownOptionDef {
  readonly templateRef = inject<TemplateRef<DgDropdownOptionContext>>(TemplateRef);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static ngTemplateContextGuard(_dir: DgDropdownOptionDef, ctx: unknown): ctx is DgDropdownOptionContext<any> {
    return true;
  }
}

@Directive({
  selector: 'ng-template[dgDropdownSelected]',
  standalone: true,
})
export class DgDropdownSelectedDef {
  readonly templateRef = inject<TemplateRef<DgDropdownSelectedContext>>(TemplateRef);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static ngTemplateContextGuard(_dir: DgDropdownSelectedDef, ctx: unknown): ctx is DgDropdownSelectedContext<any> {
    return true;
  }
}

@Directive({
  selector: 'ng-template[dgDropdownEmpty]',
  standalone: true,
})
export class DgDropdownEmptyDef {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}
