import { Directive, Injectable, TemplateRef, inject, signal } from '@angular/core';

@Injectable()
export class DgDialogTemplateRegistry {
  readonly header = signal<TemplateRef<unknown> | null>(null);
  readonly footer = signal<TemplateRef<unknown> | null>(null);
}

@Directive({
  selector: 'ng-template[dgDialogHeader]',
  standalone: true,
})
export class DgDialogHeaderDef {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly registry = inject(DgDialogTemplateRegistry, { optional: true });

  constructor() {
    this.registry?.header.set(this.templateRef);
  }
}

@Directive({
  selector: 'ng-template[dgDialogFooter]',
  standalone: true,
})
export class DgDialogFooterDef {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly registry = inject(DgDialogTemplateRegistry, { optional: true });

  constructor() {
    this.registry?.footer.set(this.templateRef);
  }
}
