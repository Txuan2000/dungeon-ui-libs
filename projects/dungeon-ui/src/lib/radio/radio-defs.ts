import { Directive, TemplateRef, inject } from '@angular/core';

export interface DgRadioIconContext {
  checked: boolean;
}

@Directive({
  selector: 'ng-template[dgRadioIcon]',
  standalone: true,
})
export class DgRadioIconDef {
  readonly templateRef = inject<TemplateRef<DgRadioIconContext>>(TemplateRef);

  static ngTemplateContextGuard(_dir: DgRadioIconDef, ctx: unknown): ctx is DgRadioIconContext {
    return true;
  }
}
