import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { DgButton, DgFocusTrap, DgInputText } from 'dungeon-ui';

@Component({
  selector: 'app-focus-trap-page',
  imports: [DgFocusTrap, DgButton, DgInputText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Focus Trap</h1>
      <p>
        Directive <code>[dgFocusTrap]</code> giam Tab/Shift+Tab trong container — tab không
        thể nhảy ra ngoài. Đóng/mở qua <code>[dgFocusTrapDisabled]</code>; có method
        <code>focusFirst()</code> / <code>focusLast()</code>.
      </p>
    </header>

    <section>
      <h2>Cơ bản — bấm vào ô bên trong rồi nhấn Tab nhiều lần</h2>
      <p class="hint">
        Ngoài container có 2 button "Trước" / "Sau" để bạn so sánh. Khi trap bật, Tab/Shift+Tab
        không thể chạm tới chúng — focus loop quanh các control bên trong.
      </p>

      <div class="row">
        <dg-button label="◀ Trước (ngoài trap)" variant="outlined" />
      </div>

      <div class="trap-box" dgFocusTrap>
        <p class="trap-box__hint">Trap container — focus loop bên trong</p>
        <div class="row stacked">
          <dg-input-text placeholder="Nhập tên" />
          <dg-input-text placeholder="Email" type="email" />
          <div class="row">
            <dg-button label="Hủy" variant="text" />
            <dg-button label="Lưu" severity="primary" />
          </div>
        </div>
      </div>

      <div class="row">
        <dg-button label="Sau (ngoài trap) ▶" variant="outlined" />
      </div>
    </section>

    <section>
      <h2>Tắt/bật trap qua input</h2>
      <p class="hint">
        Toggle <code>[dgFocusTrapDisabled]</code>. Khi disabled, sentinels được gỡ và Tab thoát
        ra ngoài bình thường.
      </p>

      <div class="row" style="margin-bottom: 0.75rem">
        <dg-button
          [label]="trapDisabled() ? 'Trap: OFF — bật lên' : 'Trap: ON — tắt đi'"
          [severity]="trapDisabled() ? 'secondary' : 'primary'"
          (clicked)="trapDisabled.set(!trapDisabled())"
        />
        <span class="hint">disabled = <strong>{{ trapDisabled() }}</strong></span>
      </div>

      <div class="row">
        <dg-button label="◀ Anchor trước" variant="outlined" />
      </div>

      <div class="trap-box trap-box--toggle" dgFocusTrap [dgFocusTrapDisabled]="trapDisabled()">
        <p class="trap-box__hint">
          {{ trapDisabled() ? '🔓 Trap đang tắt — Tab thoát được ra ngoài' : '🔒 Trap đang bật — Tab loop bên trong' }}
        </p>
        <div class="row">
          <dg-button label="Một" />
          <dg-button label="Hai" />
          <dg-button label="Ba" />
        </div>
      </div>

      <div class="row">
        <dg-button label="Anchor sau ▶" variant="outlined" />
      </div>
    </section>

    <section>
      <h2>Programmatic — gọi <code>focusFirst()</code> / <code>focusLast()</code></h2>
      <p class="hint">
        Dùng <code>#ref="dgFocusTrap"</code> hoặc <code>viewChild(DgFocusTrap)</code> để lấy
        reference rồi gọi method.
      </p>

      <div class="row" style="margin-bottom: 0.75rem">
        <dg-button label="focusFirst()" severity="info" (clicked)="programmaticTrap()?.focusFirst()" />
        <dg-button label="focusLast()" severity="info" (clicked)="programmaticTrap()?.focusLast()" />
      </div>

      <div class="trap-box" #ref="dgFocusTrap" dgFocusTrap>
        <p class="trap-box__hint">Container có exportAs ref</p>
        <div class="row">
          <dg-button label="Đầu" />
          <dg-input-text placeholder="Giữa" />
          <dg-button label="Cuối" />
        </div>
      </div>
    </section>

    <section>
      <h2>Snippet</h2>
      <pre class="snippet">{{ snippet }}</pre>
    </section>
  `,
  styles: [
    `
      .trap-box {
        position: relative;
        border: 2px dashed #2563eb;
        border-radius: 0.5rem;
        padding: 1rem 1.25rem;
        background: #eff6ff;
        margin: 0.75rem 0;
      }
      .trap-box--toggle {
        border-color: #f59e0b;
        background: #fffbeb;
      }
      .trap-box__hint {
        margin: 0 0 0.75rem;
        font-size: 0.8125rem;
        color: #1d4ed8;
        font-weight: 500;
      }
      .trap-box--toggle .trap-box__hint {
        color: #92400e;
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
export class FocusTrapPage {
  protected readonly trapDisabled = signal(false);
  protected readonly programmaticTrap = viewChild(DgFocusTrap);

  protected readonly snippet = `// 1. Cơ bản
<div dgFocusTrap>
  <button>Một</button>
  <input />
  <button>Hai</button>
</div>

// 2. Toggle qua input
<aside dgFocusTrap [dgFocusTrapDisabled]="!isOpen()">…</aside>

// 3. Lấy reference + gọi method
<div #trap="dgFocusTrap" dgFocusTrap>…</div>
<button (click)="trap.focusFirst()">Focus đầu</button>

// hoặc trong component:
import { DgFocusTrap } from 'dungeon-ui';
protected readonly trap = viewChild.required(DgFocusTrap);
this.trap().focusLast();`;
}
