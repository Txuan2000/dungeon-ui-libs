import { Directive, TemplateRef, inject } from '@angular/core';

export interface DgDatepickerCellContext {
  /** The date represented by this cell. */
  $implicit: Date;
  /** True for cells inside the currently displayed month. */
  current: boolean;
  /** True if this cell's date is today. */
  today: boolean;
  /** True if this cell's date is currently selected. */
  selected: boolean;
  /** True if disabled by minDate / maxDate / disabledDates / disabledDays. */
  disabled: boolean;
}

@Directive({
  selector: 'ng-template[dgDatepickerDate]',
  standalone: true,
})
export class DgDatepickerDateDef {
  readonly templateRef = inject<TemplateRef<DgDatepickerCellContext>>(TemplateRef);

  static ngTemplateContextGuard(_dir: DgDatepickerDateDef, ctx: unknown): ctx is DgDatepickerCellContext {
    return true;
  }
}
