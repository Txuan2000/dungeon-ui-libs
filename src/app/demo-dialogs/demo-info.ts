import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DG_DIALOG_DATA } from 'dungeon-ui';

interface InfoData {
  title: string;
  body: string;
}

@Component({
  selector: 'demo-info',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>{{ data.body }}</p>
    <p class="meta">Highlight word: <strong>{{ highlight() }}</strong></p>
    <p class="meta">Đóng dialog bằng nút × ở góc, Esc, hoặc click ra ngoài backdrop.</p>
  `,
  styles: [
    `
      :host { display: block; }
      .meta {
        color: #64748b;
        font-size: 0.875rem;
        margin: 0.25rem 0 0;
      }
    `,
  ],
})
export class DemoInfo {
  protected readonly data = inject<InfoData>(DG_DIALOG_DATA);
  readonly highlight = input<string>('—');
}
