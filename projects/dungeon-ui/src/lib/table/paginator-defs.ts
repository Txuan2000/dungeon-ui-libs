import { Directive, TemplateRef, inject } from '@angular/core';
import { DgPaginationMode } from './pagination';

export type DgPaginatorSlot = 'info' | 'nav' | 'pageSize';

export interface DgPaginatorInfoData {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  mode: DgPaginationMode;
}

export interface DgPaginatorInfoContext extends DgPaginatorInfoData {
  $implicit: DgPaginatorInfoData;
}

export interface DgPaginatorNavData {
  mode: DgPaginationMode;
  page: number;
  totalPages: number;
  pageWindow: ReadonlyArray<number | '…'>;
  disabled: boolean;
  goToPage: (page: number) => void;
  cursorFirst: () => void;
  cursorPrev: () => void;
  cursorNext: () => void;
  cursorPrevDisabled: boolean;
  cursorNextDisabled: boolean;
}

export interface DgPaginatorNavContext extends DgPaginatorNavData {
  $implicit: DgPaginatorNavData;
}

export interface DgPaginatorPageSizeData {
  pageSize: number;
  options: ReadonlyArray<number>;
  disabled: boolean;
  setPageSize: (size: number) => void;
}

export interface DgPaginatorPageSizeContext extends DgPaginatorPageSizeData {
  $implicit: DgPaginatorPageSizeData;
}

export interface DgTablePaginatorData {
  mode: DgPaginationMode;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  pageWindow: ReadonlyArray<number | '…'>;
  loading: boolean;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  cursorFirst: () => void;
  cursorPrev: () => void;
  cursorNext: () => void;
  cursorPrevDisabled: boolean;
  cursorNextDisabled: boolean;
  options: ReadonlyArray<number>;
}

export interface DgTablePaginatorContext extends DgTablePaginatorData {
  $implicit: DgTablePaginatorData;
}

@Directive({
  selector: 'ng-template[dgPaginatorInfo]',
  standalone: true,
})
export class DgPaginatorInfoDef {
  readonly templateRef = inject<TemplateRef<DgPaginatorInfoContext>>(TemplateRef);

  static ngTemplateContextGuard(_dir: DgPaginatorInfoDef, ctx: unknown): ctx is DgPaginatorInfoContext {
    return true;
  }
}

@Directive({
  selector: 'ng-template[dgPaginatorNav]',
  standalone: true,
})
export class DgPaginatorNavDef {
  readonly templateRef = inject<TemplateRef<DgPaginatorNavContext>>(TemplateRef);

  static ngTemplateContextGuard(_dir: DgPaginatorNavDef, ctx: unknown): ctx is DgPaginatorNavContext {
    return true;
  }
}

@Directive({
  selector: 'ng-template[dgPaginatorPageSize]',
  standalone: true,
})
export class DgPaginatorPageSizeDef {
  readonly templateRef = inject<TemplateRef<DgPaginatorPageSizeContext>>(TemplateRef);

  static ngTemplateContextGuard(_dir: DgPaginatorPageSizeDef, ctx: unknown): ctx is DgPaginatorPageSizeContext {
    return true;
  }
}

@Directive({
  selector: 'ng-template[dgTablePaginator]',
  standalone: true,
})
export class DgTablePaginatorDef {
  readonly templateRef = inject<TemplateRef<DgTablePaginatorContext>>(TemplateRef);

  static ngTemplateContextGuard(_dir: DgTablePaginatorDef, ctx: unknown): ctx is DgTablePaginatorContext {
    return true;
  }
}
