import { Directive, TemplateRef, inject } from '@angular/core';

export interface DgAutocompleteOptionContext<T = unknown> {
  $implicit: T;
  index: number;
  highlighted: boolean;
  query: string;
}

@Directive({
  selector: 'ng-template[dgAutocompleteOption]',
  standalone: true,
})
export class DgAutocompleteOptionDef {
  readonly templateRef = inject<TemplateRef<DgAutocompleteOptionContext>>(TemplateRef);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static ngTemplateContextGuard(_dir: DgAutocompleteOptionDef, ctx: unknown): ctx is DgAutocompleteOptionContext<any> {
    return true;
  }
}

@Directive({
  selector: 'ng-template[dgAutocompleteEmpty]',
  standalone: true,
})
export class DgAutocompleteEmptyDef {
  readonly templateRef = inject<TemplateRef<{ query: string }>>(TemplateRef);

  static ngTemplateContextGuard(_dir: DgAutocompleteEmptyDef, ctx: unknown): ctx is { query: string } {
    return typeof (ctx as { query?: unknown })?.query === 'string';
  }
}
