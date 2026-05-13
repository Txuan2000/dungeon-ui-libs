import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  viewChild,
} from '@angular/core';
import { DG_ICONS, type DgIconName } from './icons-data';

@Component({
  selector: 'dg-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      #svg
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.aria-hidden]="ariaLabel() ? null : 'true'"
      [attr.aria-label]="ariaLabel() || null"
      [attr.role]="ariaLabel() ? 'img' : null"
      [class]="hostClass()"
    ></svg>
  `,
  styleUrl: './icon.scss',
})
export class DgIcon {
  readonly name = input.required<DgIconName>();
  readonly size = input<number | string>(14);
  readonly spin = input(false, { transform: booleanish });
  readonly ariaLabel = input<string>();

  private readonly svgRef = viewChild<ElementRef<SVGSVGElement>>('svg');

  protected readonly hostClass = computed(() => {
    const classes = ['dg-icon'];
    if (this.spin()) classes.push('dg-icon--spin');
    return classes.join(' ');
  });

  constructor() {
    // Registry bodies are pre-bundled SVG markup (no user input) — safe to
    // inject via innerHTML. We do this imperatively because [innerHTML] on an
    // SVG element loses the SVG namespace through Angular's sanitizer, and
    // browsers reparse innerHTML in the parent element's namespace correctly.
    effect(() => {
      const ref = this.svgRef();
      if (!ref) return;
      ref.nativeElement.innerHTML = DG_ICONS[this.name()] ?? '';
    });
  }
}

function booleanish(value: boolean | string | null | undefined): boolean {
  return value === '' || value === true || value === 'true';
}
