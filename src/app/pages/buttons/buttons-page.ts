import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DgButton } from 'dungeon-ui';

@Component({
  selector: 'app-buttons-page',
  imports: [DgButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Button</h1>
      <p>Severity / variant / size / loading.</p>
    </header>

    <section>
      <h2>Severities</h2>
      <div class="row">
        <dg-button label="Primary" severity="primary" (clicked)="handleClick()" />
        <dg-button label="Secondary" severity="secondary" />
        <dg-button label="Success" severity="success" />
        <dg-button label="Info" severity="info" />
        <dg-button label="Warn" severity="warn" />
        <dg-button label="Danger" severity="danger" />
        <dg-button label="Help" severity="help" />
        <dg-button label="Contrast" severity="contrast" />
      </div>
    </section>

    <section>
      <h2>Variants &amp; Sizes</h2>
      <div class="row">
        <dg-button label="Solid" variant="solid" />
        <dg-button label="Outlined" variant="outlined" />
        <dg-button label="Text" variant="text" />
        <dg-button label="Link" variant="link" />
        <dg-button label="Small" size="small" />
        <dg-button label="Large" size="large" />
        <dg-button label="Rounded" rounded />
        <dg-button [label]="isLoading() ? 'Loading' : 'Loading toggle'" [loading]="isLoading()" (clicked)="toggleLoading()" />
      </div>
    </section>

    <footer>
      <p>Clicks on Primary button: <strong>{{ clickCount() }}</strong></p>
    </footer>
  `,
})
export class ButtonsPage {
  protected readonly clickCount = signal(0);
  protected readonly isLoading = signal(false);

  protected handleClick(): void {
    this.clickCount.update((c) => c + 1);
  }
  protected toggleLoading(): void {
    this.isLoading.update((v) => !v);
  }
}
