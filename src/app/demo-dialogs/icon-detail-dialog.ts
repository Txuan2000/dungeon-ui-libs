import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import {
  DgButton,
  DgCheckbox,
  DgDialogFooterDef,
  DgDialogRef,
  DgIcon,
  DgInputNumber,
  DgInputText,
  type DgIconName,
} from 'dungeon-ui';

type SnippetKey = 'angular' | 'mask' | 'font';

@Component({
  selector: 'icon-detail-dialog',
  imports: [DgButton, DgCheckbox, DgIcon, DgInputNumber, DgInputText, DgDialogFooterDef],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout">
      <div class="preview" [style.color]="color()">
        <dg-icon [name]="iconName()" [size]="size()" [spin]="spin()" [ariaLabel]="ariaLabel() || undefined" />
        <p class="preview__name">{{ iconName() }}</p>
        <p class="preview__meta">{{ size() }}px · {{ color() }}{{ spin() ? ' · spin' : '' }}</p>
      </div>

      <div class="controls">
        <div class="field">
          <label for="icon-size">Size (px)</label>
          <dg-input-number
            inputId="icon-size"
            [(value)]="size"
            [min]="8"
            [max]="128"
            [step]="2"
            showButtons
            size="small"
          />
        </div>

        <div class="field">
          <label for="icon-color">Màu (currentColor)</label>
          <input id="icon-color" type="color" class="color-input" [value]="color()" (input)="onColor($event)" />
        </div>

        <div class="field">
          <dg-checkbox [(value)]="spin" label="Spin (1s linear infinite)" />
        </div>

        <div class="field">
          <label for="icon-aria">aria-label (optional)</label>
          <dg-input-text inputId="icon-aria" fluid size="small" placeholder="bỏ trống nếu decorative" [(value)]="ariaLabel" />
        </div>
      </div>
    </div>

    <div class="snippets">
      <h3>Copy code cho 3 trường hợp</h3>

      <div class="snippet">
        <div class="snippet__head">
          <strong>1. Angular component</strong>
          <button type="button" class="copy" [class.copied]="lastCopied() === 'angular'" (click)="copy('angular')">
            {{ lastCopied() === 'angular' ? 'Copied ✓' : 'Copy' }}
          </button>
        </div>
        <pre class="snippet__code">{{ angularSnippet() }}</pre>
      </div>

      <div class="snippet">
        <div class="snippet__head">
          <strong>2. Mask-image CSS (<code>.dgi</code>)</strong>
          <button type="button" class="copy" [class.copied]="lastCopied() === 'mask'" (click)="copy('mask')">
            {{ lastCopied() === 'mask' ? 'Copied ✓' : 'Copy' }}
          </button>
        </div>
        <pre class="snippet__code">{{ maskSnippet() }}</pre>
      </div>

      <div class="snippet">
        <div class="snippet__head">
          <strong>3. Webfont CSS (<code>.dgf</code>)</strong>
          <button type="button" class="copy" [class.copied]="lastCopied() === 'font'" (click)="copy('font')">
            {{ lastCopied() === 'font' ? 'Copied ✓' : 'Copy' }}
          </button>
        </div>
        <pre class="snippet__code">{{ fontSnippet() }}</pre>
      </div>
    </div>

    <ng-template dgDialogFooter>
      <dg-button label="Đóng" variant="text" (clicked)="close()" />
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 32rem;
        max-width: 40rem;
      }

      .layout {
        display: grid;
        grid-template-columns: 12rem 1fr;
        gap: 1rem;
        align-items: start;
      }

      .preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1.5rem 1rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        min-height: 9rem;
      }
      .preview__name {
        margin: 0;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.8125rem;
        color: #0f172a;
      }
      .preview__meta {
        margin: 0;
        font-size: 0.75rem;
        color: #64748b;
      }

      .controls {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .field label {
        font-size: 0.8125rem;
        color: #475569;
        font-weight: 500;
      }
      .color-input {
        width: 4rem;
        height: 2rem;
        padding: 0;
        border: 1px solid #cbd5e1;
        border-radius: 0.375rem;
        background: #ffffff;
        cursor: pointer;
      }

      .snippets {
        margin-top: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }
      .snippets h3 {
        font-size: 0.875rem;
        margin: 0 0 0.25rem;
        color: #0f172a;
      }
      .snippet {
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        overflow: hidden;
      }
      .snippet__head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.75rem;
        background: #f1f5f9;
        font-size: 0.8125rem;
      }
      .snippet__head code {
        background: transparent;
        padding: 0;
      }
      .snippet__code {
        margin: 0;
        padding: 0.625rem 0.75rem;
        background: #0f172a;
        color: #e2e8f0;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.8125rem;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .copy {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 0.25rem;
        padding: 0.25rem 0.625rem;
        font: inherit;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        color: #1d4ed8;
        transition: background 120ms ease, border-color 120ms ease;
      }
      .copy:hover {
        background: #eff6ff;
      }
      .copy.copied {
        background: #dcfce7;
        border-color: #16a34a;
        color: #166534;
      }
    `,
  ],
})
export class IconDetailDialog {
  readonly iconName = input.required<DgIconName>();

  protected readonly size = signal(24);
  protected readonly color = signal('#000000');
  protected readonly spin = signal(false);
  protected readonly ariaLabel = signal('');
  protected readonly lastCopied = signal<SnippetKey | null>(null);

  private readonly dialogRef = inject<DgDialogRef<void, IconDetailDialog>>(DgDialogRef);

  protected readonly angularSnippet = computed(() => {
    const parts = [`name="${this.iconName()}"`];
    if (this.size() !== 14) parts.push(`[size]="${this.size()}"`);
    if (this.spin()) parts.push('spin');
    if (this.ariaLabel().trim()) parts.push(`ariaLabel="${this.ariaLabel().trim()}"`);
    const tag = `<dg-icon ${parts.join(' ')} />`;
    if (this.color() !== 'currentColor' && this.color()) {
      return `<span style="color: ${this.color()}">\n  ${tag}\n</span>`;
    }
    return tag;
  });

  protected readonly maskSnippet = computed(() => {
    const classes = ['dgi', `dgi-${this.iconName()}`];
    if (this.spin()) classes.push('dgi--spin');
    const styles = [`font-size: ${this.size()}px`];
    if (this.color()) styles.push(`color: ${this.color()}`);
    const aria = this.ariaLabel().trim()
      ? ` role="img" aria-label="${this.ariaLabel().trim()}"`
      : ' aria-hidden="true"';
    return `<i class="${classes.join(' ')}" style="${styles.join('; ')}"${aria}></i>`;
  });

  protected readonly fontSnippet = computed(() => {
    const classes = ['dgf', `dgf-${this.iconName()}`];
    if (this.spin()) classes.push('dgf--spin');
    const styles = [`font-size: ${this.size()}px`];
    if (this.color()) styles.push(`color: ${this.color()}`);
    const aria = this.ariaLabel().trim()
      ? ` role="img" aria-label="${this.ariaLabel().trim()}"`
      : ' aria-hidden="true"';
    return `<i class="${classes.join(' ')}" style="${styles.join('; ')}"${aria}></i>`;
  });

  protected onColor(event: Event): void {
    this.color.set((event.target as HTMLInputElement).value);
  }

  protected close(): void {
    this.dialogRef.close();
  }

  protected async copy(key: SnippetKey): Promise<void> {
    const text =
      key === 'angular' ? this.angularSnippet() : key === 'mask' ? this.maskSnippet() : this.fontSnippet();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Swallow — the UI fallback below still flashes "Copied ✓" so the user knows the snippet is selectable.
    }
    this.lastCopied.set(key);
    setTimeout(() => {
      if (this.lastCopied() === key) this.lastCopied.set(null);
    }, 1500);
  }
}
