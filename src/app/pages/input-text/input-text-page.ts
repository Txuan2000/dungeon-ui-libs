import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DgInputText } from 'dungeon-ui';

@Component({
  selector: 'app-input-text-page',
  imports: [DgInputText, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Input Text</h1>
      <p>Sizes, variants, two-way binding, reactive form via CVA.</p>
    </header>

    <section>
      <h2>Sizes</h2>
      <div class="row stacked">
        <dg-input-text placeholder="Small" size="small" />
        <dg-input-text placeholder="Normal" />
        <dg-input-text placeholder="Large" size="large" />
      </div>
    </section>

    <section>
      <h2>Variants &amp; states</h2>
      <div class="row stacked">
        <dg-input-text placeholder="Outlined (default)" />
        <dg-input-text placeholder="Filled" variant="filled" />
        <dg-input-text placeholder="Invalid" invalid />
        <dg-input-text placeholder="Disabled" disabled />
        <dg-input-text placeholder="Readonly preset" readonly value="readonly value" />
        <dg-input-text placeholder="Fluid (full width)" fluid />
      </div>
    </section>

    <section>
      <h2>Two-way binding (signal)</h2>
      <div class="row">
        <dg-input-text placeholder="Type your name" [(value)]="username" />
        <span>Hello, <strong>{{ username() || 'stranger' }}</strong></span>
      </div>
    </section>

    <section>
      <h2>Reactive form (CVA)</h2>
      <div class="row">
        <dg-input-text placeholder="email@example.com" [formControl]="emailControl" [invalid]="emailControl.touched && emailControl.invalid" />
        <span class="hint" [class.hint--error]="emailControl.touched && emailControl.invalid">
          @if (emailControl.touched && emailControl.invalid) {
            Email không hợp lệ.
          } @else {
            Giá trị: {{ emailControl.value || '—' }}
          }
        </span>
      </div>
    </section>
  `,
})
export class InputTextPage {
  protected readonly username = signal('');
  protected readonly emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
}
