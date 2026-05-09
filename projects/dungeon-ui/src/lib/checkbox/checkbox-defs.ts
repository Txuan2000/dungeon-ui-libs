import { Directive, TemplateRef, inject } from '@angular/core';

export interface DgCheckboxIconContext {
  checked: boolean;
  indeterminate: boolean;
}

@Directive({
  selector: 'ng-template[dgCheckboxIcon]',
  standalone: true,
})
export class DgCheckboxIconDef {
  readonly templateRef = inject<TemplateRef<DgCheckboxIconContext>>(TemplateRef);

  static ngTemplateContextGuard(_dir: DgCheckboxIconDef, ctx: unknown): ctx is DgCheckboxIconContext {
    return true;
  }
}
