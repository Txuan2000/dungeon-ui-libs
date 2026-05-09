import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type DgButtonSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast';
export type DgButtonSize = 'small' | 'normal' | 'large';
export type DgButtonVariant = 'solid' | 'outlined' | 'text' | 'link';
export type DgButtonIconPos = 'left' | 'right';
export type DgButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'dg-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [disabled]="isDisabled()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-busy]="loading() || null"
      [attr.data-severity]="severity()"
      [attr.data-size]="size()"
      [attr.data-variant]="variant()"
      [class]="hostClass()"
      (click)="clicked.emit($event)"
      (focus)="focused.emit($event)"
      (blur)="blurred.emit($event)"
    >
      @if (loading()) {
        <span class="dg-button__spinner" aria-hidden="true"></span>
      } @else if (icon() && iconPos() === 'left') {
        <span class="dg-button__icon" [class]="icon()" aria-hidden="true"></span>
      }

      @if (label()) {
        <span class="dg-button__label">{{ label() }}</span>
      }
      <ng-content />

      @if (!loading() && icon() && iconPos() === 'right') {
        <span class="dg-button__icon" [class]="icon()" aria-hidden="true"></span>
      }
    </button>
  `,
  styleUrl: './button.scss',
})
export class DgButton {
  readonly label = input<string>();
  readonly icon = input<string>();
  readonly iconPos = input<DgButtonIconPos>('left');
  readonly severity = input<DgButtonSeverity>('primary');
  readonly size = input<DgButtonSize>('normal');
  readonly variant = input<DgButtonVariant>('solid');
  readonly type = input<DgButtonType>('button');
  readonly disabled = input(false, { transform: booleanish });
  readonly loading = input(false, { transform: booleanish });
  readonly rounded = input(false, { transform: booleanish });
  readonly raised = input(false, { transform: booleanish });
  readonly fullWidth = input(false, { transform: booleanish });
  readonly ariaLabel = input<string>();

  readonly clicked = output<MouseEvent>();
  readonly focused = output<FocusEvent>();
  readonly blurred = output<FocusEvent>();

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected readonly hostClass = computed(() => {
    const classes = ['dg-button'];
    if (this.rounded()) classes.push('dg-button--rounded');
    if (this.raised()) classes.push('dg-button--raised');
    if (this.fullWidth()) classes.push('dg-button--full');
    if (this.loading()) classes.push('dg-button--loading');
    if (this.label() === undefined && this.icon()) classes.push('dg-button--icon-only');
    return classes.join(' ');
  });
}

function booleanish(value: boolean | string | null | undefined): boolean {
  return value === '' || value === true || value === 'true';
}
