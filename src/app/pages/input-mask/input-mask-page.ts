import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DgInputMask, DgInputText } from 'dungeon-ui';

@Component({
  selector: 'app-input-mask-page',
  imports: [DgInputText, DgInputMask, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Input Mask</h1>
      <p>
        Directive <code>[dgInputMask]</code> — định dạng input theo pattern khi user gõ.
        Token: <code>9</code> = digit, <code>a</code> = letter, <code>*</code> = chữ/số.
        Ký tự khác là separator literal, tự fill khi user gõ.
      </p>
    </header>

    <section>
      <h2>Tokens</h2>
      <div class="tokens">
        <div class="tokens__row tokens__row--head">
          <span>Token</span><span>Match</span><span>Ví dụ</span>
        </div>
        <div class="tokens__row">
          <span><code>9</code></span><span>Digit <code>0–9</code></span><span><code>99/99/9999</code></span>
        </div>
        <div class="tokens__row">
          <span><code>a</code></span><span>Letter <code>A–Z a–z</code></span><span><code>aaa-9999</code></span>
        </div>
        <div class="tokens__row">
          <span><code>*</code></span><span>Alphanumeric</span><span><code>***-***</code></span>
        </div>
        <div class="tokens__row">
          <span>khác</span><span>Literal</span><span><code>(999) 999-9999</code></span>
        </div>
      </div>
    </section>

    <section>
      <h2>Slot mode — click vào đúng vị trí để sửa</h2>
      <p class="hint">
        Bật bằng <code>dgInputMaskSlot="_"</code> (hoặc bất kỳ ký tự đơn nào). Khi focus,
        input fill template <code>__/__/____</code>. Click vào bất kỳ slot nào để đặt cursor;
        gõ → ghi đè đúng slot; Backspace / Delete → khôi phục slot char. Kéo chọn → ghi đè
        cả vùng.
      </p>
      <div class="row stacked" style="max-width: 26rem">
        <label>
          <span class="hint">Date <code>99/99/9999</code> · slot <code>_</code></span>
          <dg-input-text dgInputMask="99/99/9999" dgInputMaskSlot="_" />
        </label>
        <label>
          <span class="hint">Phone US <code>(999) 999-9999</code> · slot <code>_</code></span>
          <dg-input-text dgInputMask="(999) 999-9999" dgInputMaskSlot="_" />
        </label>
        <label>
          <span class="hint">Credit card <code>9999 9999 9999 9999</code> · slot <code>•</code></span>
          <dg-input-text dgInputMask="9999 9999 9999 9999" dgInputMaskSlot="•" />
        </label>
        <label>
          <span class="hint">License plate <code>99-aa 999.99</code> · slot <code>_</code></span>
          <dg-input-text dgInputMask="99-aa 999.99" dgInputMaskSlot="_" />
        </label>
      </div>
    </section>

    <section>
      <h2>Date — <code>99/99/9999</code></h2>
      <div class="row stacked" style="max-width: 22rem">
        <label>
          <span class="hint">Gõ chỉ số, "/" tự thêm. Chữ bị lọc.</span>
          <dg-input-text dgInputMask="99/99/9999" placeholder="dd/MM/yyyy" />
        </label>
        <p class="hint">Thử gõ <code>1101</code> → <code>11/01</code>; <code>32a13b2024</code> → <code>32/13/2024</code>.</p>
      </div>
    </section>

    <section>
      <h2>Phone</h2>
      <div class="row stacked" style="max-width: 26rem">
        <label>
          <span class="hint">VN <code>9999 999 999</code></span>
          <dg-input-text dgInputMask="9999 999 999" placeholder="0901 234 567" />
        </label>
        <label>
          <span class="hint">US <code>(999) 999-9999</code></span>
          <dg-input-text dgInputMask="(999) 999-9999" placeholder="(415) 555-0100" />
        </label>
        <label>
          <span class="hint">International <code>+99 999 999 9999</code></span>
          <dg-input-text dgInputMask="+99 999 999 9999" placeholder="+84 901 234 567" />
        </label>
      </div>
    </section>

    <section>
      <h2>Credit card &amp; CVV</h2>
      <div class="row stacked" style="max-width: 26rem">
        <label>
          <span class="hint">Card number <code>9999 9999 9999 9999</code></span>
          <dg-input-text dgInputMask="9999 9999 9999 9999" placeholder="•••• •••• •••• ••••" />
        </label>
        <label>
          <span class="hint">Expiry <code>99/99</code></span>
          <dg-input-text dgInputMask="99/99" placeholder="MM/YY" />
        </label>
        <label>
          <span class="hint">CVV <code>999</code></span>
          <dg-input-text dgInputMask="999" placeholder="123" />
        </label>
      </div>
    </section>

    <section>
      <h2>Letter + digit (license plate)</h2>
      <div class="row stacked" style="max-width: 22rem">
        <label>
          <span class="hint">VN xe máy <code>99-aa 999.99</code></span>
          <dg-input-text dgInputMask="99-aa 999.99" placeholder="29-A1 123.45" />
        </label>
        <label>
          <span class="hint">VN xe ô tô <code>99a-99999</code></span>
          <dg-input-text dgInputMask="99a-99999" placeholder="51K-12345" />
        </label>
      </div>
    </section>

    <section>
      <h2>Network — IPv4 / IPv6 fragment</h2>
      <div class="row stacked" style="max-width: 26rem">
        <label>
          <span class="hint">IPv4 <code>999.999.999.999</code></span>
          <dg-input-text dgInputMask="999.999.999.999" placeholder="192.168.001.001" />
        </label>
        <label>
          <span class="hint">MAC address <code>**:**:**:**:**:**</code></span>
          <dg-input-text dgInputMask="**:**:**:**:**:**" placeholder="aa:bb:cc:dd:ee:ff" />
        </label>
      </div>
    </section>

    <section>
      <h2>VN-specific — CCCD &amp; tax code</h2>
      <div class="row stacked" style="max-width: 26rem">
        <label>
          <span class="hint">CCCD 12 số <code>999 999 999 999</code></span>
          <dg-input-text dgInputMask="999 999 999 999" placeholder="001 234 567 890" />
        </label>
        <label>
          <span class="hint">MST 10 số <code>9999999999</code> (no separator)</span>
          <dg-input-text dgInputMask="9999999999" placeholder="0123456789" />
        </label>
      </div>
    </section>

    <section>
      <h2>Two-way binding (signal)</h2>
      <div class="row stacked" style="max-width: 22rem">
        <label>
          <span class="hint">Bind giá trị (đã masked) qua <code>[(ngModel)]</code></span>
          <dg-input-text
            dgInputMask="99/99/9999"
            placeholder="dd/MM/yyyy"
            [(value)]="modelValue"
          />
        </label>
        <span class="hint">value (masked): <strong>{{ modelValue() || '—' }}</strong></span>
      </div>
    </section>

    <section>
      <h2>Reactive form (CVA) — masked string + Validators</h2>
      <p class="hint">
        FormControl nhận chuỗi đã mask (kèm separator). Tự viết validator regex để check
        đủ ký số. Đây là pattern thường dùng để validate ngày / điện thoại / CCCD.
      </p>
      <div class="row stacked" style="max-width: 22rem">
        <label>
          <span class="hint">Phone (chính xác 10 số)</span>
          <dg-input-text
            dgInputMask="9999 999 999"
            placeholder="0901 234 567"
            [formControl]="phoneCtrl"
            [invalid]="phoneCtrl.touched && phoneCtrl.invalid"
          />
        </label>
        <span class="hint" [class.hint--error]="phoneCtrl.touched && phoneCtrl.invalid">
          @if (phoneCtrl.touched && phoneCtrl.invalid) {
            Số điện thoại phải đủ 10 số.
          } @else {
            control.value: <strong>{{ phoneCtrl.value || '—' }}</strong>
          }
        </span>
      </div>
    </section>

    <section>
      <h2>Snippet</h2>
      <pre class="snippet">{{ snippet }}</pre>
    </section>
  `,
  styles: [
    `
      .tokens {
        display: grid;
        grid-template-columns: 4rem 1fr 1fr;
        gap: 0;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        overflow: hidden;
        max-width: 32rem;
        font-size: 0.875rem;
      }
      .tokens__row {
        display: contents;
      }
      .tokens__row > span {
        padding: 0.5rem 0.75rem;
        border-top: 1px solid #f1f5f9;
        background: #ffffff;
      }
      .tokens__row--head > span {
        background: #f8fafc;
        font-weight: 600;
        color: #475569;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-top: 0;
      }
      .snippet {
        margin: 0;
        padding: 1rem;
        background: #0f172a;
        color: #e2e8f0;
        border-radius: 0.5rem;
        font-size: 0.8125rem;
        line-height: 1.55;
        overflow-x: auto;
        font-family: 'JetBrains Mono', 'Consolas', monospace;
      }
    `,
  ],
})
export class InputMaskPage {
  protected readonly modelValue = signal('');
  protected readonly phoneCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{4} \d{3} \d{3}$/)],
  });

  protected readonly snippet = `// 1. Append mode (default) — gõ tuần tự
<input dgInputMask="99/99/9999" placeholder="dd/MM/yyyy" />

// 2. Slot mode — click vào slot để sửa
<input dgInputMask="99/99/9999" dgInputMaskSlot="_" />
// hiển thị "__/__/____", overwrite tại cursor

// 3. Với form control
<input dgInputMask="9999 999 999" [formControl]="phoneCtrl" />
phoneCtrl.value // → "0901 234 567"  (masked với separator)

// 4. Bind ngModel
<input dgInputMask="(999) 999-9999" [(ngModel)]="phone" />

// 5. Tokens hỗn hợp
<input dgInputMask="99-aa 999.99" />  // 29-A1 123.45

// 6. Validator pattern (regex match masked output)
new FormControl('', [
  Validators.pattern(/^\\d{4} \\d{3} \\d{3}$/)
])`;
}
