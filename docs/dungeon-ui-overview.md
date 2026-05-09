# dungeon-ui — Overview

> **AI agents:** see [`knowledge-graph.json`](./knowledge-graph.json) +
> [`knowledge-graph.md`](./knowledge-graph.md) for a compact structured
> map of every component, demo page, and cross-component relationship
> (load once → ~6 KB; resolves most "where / what / how" questions
> without RAG calls).

`dungeon-ui` is an Angular 21 standalone component library. All components are
zero-runtime-dependency (no @angular/cdk, no PrimeNG dependency at runtime).
Public API is exported from `projects/dungeon-ui/src/public-api.ts`.

Selector prefix: `dg-`. Directive markers: `dg<Name>` or `dg<Name>Def`.

## Loading from CDN

Library deploy lên Cloudflare Pages (project `dungeon-ui-cdn`) sau mỗi
`make cdn-deploy`. Output là FESM2022 (ESM-only), AOT-compiled Ivy — không
có UMD bundle, không cần Angular compiler runtime cho code thư viện.

- **ESM bundle**: `https://dungeon-ui-cdn.pages.dev/fesm2022/dungeon-ui.mjs`
  (CORS `*`, cache `max-age=2592000` ~ 30 ngày)
- **Tarball npm-installable**: `https://dungeon-ui-cdn.pages.dev/dungeon-ui-<version>.tgz`
- **Types**: `https://dungeon-ui-cdn.pages.dev/types/dungeon-ui.d.ts`
- **Bare imports cần map**: `@angular/core`, `@angular/core/rxjs-interop`,
  `@angular/common`, `@angular/common/http`, `@angular/forms`,
  `@angular/platform-browser`, `rxjs`, `rxjs/operators`, `tslib`. Khi consumer
  tự định nghĩa root component (use case 1) thêm `@angular/compiler` để JIT.
  Subpath `/http` và `/rxjs-interop` cần khai báo riêng vì esm.sh không tự
  resolve subpath khi parent đã externalized.

### Use case 1 — Plain HTML + import map (no bundler)

→ Live demo: [`/cdn-example.html`](https://dungeon-ui.pages.dev/cdn-example.html)
(source: [`public/cdn-example.html`](../public/cdn-example.html))

```html
<script type="importmap">
{
  "imports": {
    "dungeon-ui": "https://dungeon-ui-cdn.pages.dev/fesm2022/dungeon-ui.mjs",

    "@angular/core": "https://esm.sh/@angular/core@21.2.0?external=rxjs,tslib",
    "@angular/core/": "https://esm.sh/@angular/core@21.2.0/",

    "@angular/common": "https://esm.sh/@angular/common@21.2.0?external=@angular/core,rxjs,tslib",
    "@angular/common/": "https://esm.sh/@angular/common@21.2.0/",

    "@angular/compiler": "https://esm.sh/@angular/compiler@21.2.0?external=@angular/core,rxjs,tslib",
    "@angular/compiler/": "https://esm.sh/@angular/compiler@21.2.0/",

    "@angular/forms": "https://esm.sh/@angular/forms@21.2.0?external=@angular/core,@angular/common,rxjs,tslib",
    "@angular/forms/": "https://esm.sh/@angular/forms@21.2.0/",

    "@angular/platform-browser": "https://esm.sh/@angular/platform-browser@21.2.0?external=@angular/core,@angular/common,@angular/compiler,rxjs,tslib",
    "@angular/platform-browser/": "https://esm.sh/@angular/platform-browser@21.2.0/",

    "rxjs": "https://esm.sh/rxjs@7.8.0",
    "rxjs/": "https://esm.sh/rxjs@7.8.0/",

    "tslib": "https://esm.sh/tslib@2.6.0"
  }
}
</script>
<app-root></app-root>
<script type="module">
  import '@angular/compiler';
  import { Component, signal, provideZonelessChangeDetection } from '@angular/core';
  import { bootstrapApplication } from '@angular/platform-browser';
  import { DgButton } from 'dungeon-ui';

  // Factory-call form thay cho `@Component(...)` (decorator syntax không
  // parse được trong plain JS).
  const App = Component({
    selector: 'app-root',
    standalone: true,
    imports: [DgButton],
    template: `<dg-button label="Hello" severity="primary" (clicked)="hi()"/>`,
  })(class { hi() { alert('clicked'); } });

  bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] });
</script>
```

Lưu ý:
- Browser support import maps: Chrome 89+, Safari 16.4+, Firefox 108+.
- `?external=...` trên esm.sh là bắt buộc — không có nó, mỗi `@angular/*`
  package sẽ bundle bản `@angular/core` riêng → vỡ DI singleton.
- Pin version cụ thể (`@21.2.0`, `@7.8.0`) khớp với peer range để dedupe
  cache esm.sh.
- Zoneless: `provideZonelessChangeDetection()` thay zone.js, sample không
  cần load `zone.js` riêng.
- `@angular/compiler` chỉ cần khi consumer tự định nghĩa component (template
  cần JIT-compile). Component của thư viện đã pre-compiled nên không cần
  compiler để render chúng.
- SRI (sub-resource integrity) không khả thi với esm.sh do response thay đổi
  theo `?external`.

### Use case 2 — Angular CLI app (npm install từ tarball)

```bash
npm install https://dungeon-ui-cdn.pages.dev/dungeon-ui-0.0.3.tgz
```

`package.json` của consumer sẽ ghi:

```json
{
  "dependencies": {
    "dungeon-ui": "https://dungeon-ui-cdn.pages.dev/dungeon-ui-0.0.3.tgz"
  }
}
```

Sau đó dùng như package thường:

```ts
import { Component } from '@angular/core';
import { DgButton } from 'dungeon-ui';

@Component({
  selector: 'my-comp',
  standalone: true,
  imports: [DgButton],
  template: `<dg-button label="Save" severity="success" />`,
})
export class MyComp {}
```

Khi nào dùng:
- Prototype, internal app không muốn add npm registry/auth.
- Test version mới trước khi publish lên npm.

Khi không nên dùng:
- Production lâu dài — không có version range, không SRI, phụ thuộc Pages
  cache; bump version → đổi URL + `npm install` lại tay.

Update version: chạy `make cdn-deploy` (sẽ bump version + build + push
tarball + fesm2022 lên Pages).

### Use case 3 — Web Components (no Angular knowledge needed)

Approach đơn giản nhất cho host non-Angular (PHP, WordPress, plain HTML,
static site generators). Bundle deploy gồm Angular runtime + library +
custom-element wrappers, tự register tất cả `<dg-*>` tags khi script load.

→ Live demo: [`/elements-example.html`](https://dungeon-ui.pages.dev/elements-example.html)
(source: [`public/elements-example.html`](../public/elements-example.html))

```html
<script type="module" src="https://dungeon-ui-elements.pages.dev/main.js"></script>

<dg-input-text id="name" placeholder="Tên"></dg-input-text>
<dg-button id="btn" label="Chào" severity="primary"></dg-button>
<p id="out"></p>

<script>
  document.getElementById('btn').addEventListener('clicked', () => {
    document.getElementById('out').textContent =
      'Xin chào, ' + document.getElementById('name').value + '!';
  });
</script>
```

**Tags available** (16 components):
`dg-button`, `dg-input-text`, `dg-input-number`, `dg-input-group`,
`dg-input-group-addon`, `dg-icon-field`, `dg-input-icon`, `dg-dialog`,
`dg-table`, `dg-paginator`, `dg-checkbox`, `dg-radio`, `dg-dropdown`,
`dg-autocomplete`, `dg-datepicker`, `dg-nav-menu`.

**Property vs attribute** convention:
- Primitive inputs (string/number/boolean): set qua attribute hoặc property.
  ```html
  <dg-button label="Save" severity="primary" disabled></dg-button>
  ```
- Object/array inputs (`columns`, `value` của `dg-table`; `options` của
  `dg-dropdown`/`dg-autocomplete`; `model` của `dg-nav-menu`; v.v.): **phải**
  set qua property — attribute chỉ accept string.
  ```js
  const t = document.querySelector('dg-table');
  t.columns = [{ field: 'name', header: 'Name' }, ...];
  t.value = [{ name: 'Alice' }, ...];
  ```

**Outputs** → DOM `CustomEvent` cùng tên Angular output. Truy cập payload
qua `event.detail`:

```js
el.addEventListener('clicked', e => { /* e.detail là payload */ });
el.addEventListener('valueChange', e => console.log(e.detail));
```

**Limitations** (so với CLI consumption):
- 2 directives (`[dgInputMask]`, `[dgFocusTrap]`) **không** available — directives
  không thành custom elements được. Cần Angular CLI consumption (use case 2).
- 8 CVA components (`dg-input-text`, `dg-input-number`, `dg-checkbox`, `dg-radio`,
  `dg-dropdown`, `dg-autocomplete`, `dg-datepicker`, ...): **không** support
  `[formControl]`/`[(ngModel)]` (Angular-only directives). Quản lý state bằng
  `el.value` property + `valueChange` event.
- `dg-dialog`: không support `headerTemplate`/`footerTemplate` inputs
  (TemplateRef không serialize được). Dùng các string inputs có sẵn.
- `DgDialogService` imperative API (`dgDialog.open(...)`) **không** expose qua
  bundle này — chỉ available khi consume qua npm/tarball.
- Generic types (`DgTable<T>`, `DgDropdown<T>` etc.) erase ở runtime; TypeScript
  consumers cần cast khi cần type-safety trên element references.

**Bundle size**: ~150KB gzipped (Angular runtime zoneless + 16 components,
tree-shaken). Cache 30 ngày trên Cloudflare CDN.

**Deploy version mới**: `make elements-deploy` (build bundle + push lên
`dungeon-ui-elements.pages.dev`). Lib version từ
`projects/dungeon-ui/package.json` được dùng làm commit message tag.

## Components & Surfaces

### DgButton (`<dg-button>`)
Standalone button wrapper. Inputs:
- `label`, `icon`, `iconPos: 'left'|'right'`
- `severity: 'primary'|'secondary'|'success'|'info'|'warn'|'danger'|'help'|'contrast'`
- `size: 'small'|'normal'|'large'`
- `variant: 'solid'|'outlined'|'text'|'link'`
- `type: 'button'|'submit'|'reset'`
- `disabled`, `loading`, `rounded`, `raised`, `fullWidth`, `ariaLabel`
Outputs: `clicked`, `focused`, `blurred`.
Styling: data-attributes (`data-severity`, `data-size`, `data-variant`).

Usage:
```html
<dg-button label="Save" severity="success" (clicked)="save()" />
<dg-button label="Loading" loading />
```

### DgInputText (`<dg-input-text>`)
Wraps native `<input>`. Implements `ControlValueAccessor`.
Inputs (signal):
- `value` (model — two-way), `placeholder`, `type` (text/email/password/tel/url/search/number)
- `size: 'small'|'normal'|'large'`, `variant: 'outlined'|'filled'`
- `invalid`, `fluid`, `readonly`, `name`, `inputId`, `ariaLabel`, `ariaDescribedBy`
- `maxlength`, `minlength`
Outputs: `inputEvent`, `focused`, `blurred`.

Forms-friendly:
```html
<dg-input-text [(value)]="signalValue" />
<dg-input-text [formControl]="control" />
<dg-input-text [(ngModel)]="modelValue" />
```

### DgInputMask (`[dgInputMask]`)

Standalone directive that applies a typing mask to any `<input>`. Inspired
by PrimeNG's `p-inputmask` but implemented as a thin directive — no
component, no CVA layer; pair with `[(ngModel)]` / `[formControl]` if you
need form binding (the bound value is the masked string with separators).

#### Tokens

| Token | Matches |
| ----- | ------- |
| `9`   | digit `[0-9]` |
| `a`   | letter `[A-Za-z]` |
| `*`   | alphanumeric |
| anything else | literal separator (auto-inserted as the user types) |

#### Inputs

- `dgInputMask: string` (required) — the mask pattern.
- `dgInputMaskSlot: string` (default `''`) — single character. When set,
  enables **slot mode**.

#### Two modes

**Append mode** (default — `dgInputMaskSlot=""`): user types from the
left, the directive auto-inserts separators between tokens. Simple; fits
forms where users type the whole value start-to-finish.

- On every `input` event, the directive re-formats the input's `.value` so
  chars that don't fit the next token are dropped and literal separators
  are auto-inserted.
- On `paste`, the pasted value is re-masked on the next microtask.
- Caret advances to the end when the mask grew (so the next keystroke
  lands in the right slot).

**Slot mode** (`dgInputMaskSlot="_"` etc.): the field is filled with a
template like `__/__/____`. The user can **click into any slot** and edit
exactly that position — keystrokes overwrite the slot character at the
cursor; backspace / delete restore the slot character. Useful when
partial editing is common (e.g. fixing one digit in the middle of a date).

- On `focusin` (when empty): fill the slot template, place caret at the
  first slot.
- On `focusout` (when nothing was typed): clear so the input behaves as
  empty for downstream listeners.
- On `keydown`: Backspace / Delete / printable chars are intercepted to
  perform overwrite-style edits. Arrows / Tab / Home / End / Enter / Esc
  pass through. Range selections get cleared back to slot chars on edit.
- On `paste`: pasted chars overlay starting from the cursor (separators
  auto-skipped).
- On `click`: caret snaps onto the next token slot if the user clicks on
  a literal separator.

The directive operates on the underlying `<input>`'s `.value`. It resolves
the input element from its host: either the host itself
(`<input dgInputMask=…>`) or the first descendant `<input>`
(`<dg-input-text dgInputMask=…>`).

Internally used by `DgDatepicker` to shape the trigger input according
to its `format`.

#### Examples

```html
<!-- append mode (default) -->
<input dgInputMask="99/99/9999" placeholder="dd/MM/yyyy" />

<!-- slot mode — click into any position to edit -->
<input dgInputMask="99/99/9999" dgInputMaskSlot="_" />

<!-- phone -->
<input dgInputMask="(999) 999-9999" placeholder="(___) ___-____" />

<!-- license plate (letters + digits) -->
<input dgInputMask="99-aa 999.99" placeholder="29-A1 123.45" />

<!-- with reactive form (FormControl receives the masked string) -->
<input dgInputMask="99/99/9999" [formControl]="dateStrCtrl" />
```

### DgIconField (`<dg-icon-field>`) + DgInputIcon

Overlays an icon inside an input's visible area (left or right side).
Modelled after PrimeNG's `<p-iconfield>` + `<p-inputicon>`. Typical use:
a 🔍 icon on a search field, 📧 on email, 🔒 on password.

Different from `<dg-input-group>`:
- input-group joins the input with a separate, bordered addon section
  (shared border edges).
- icon-field paints the icon over the input itself with no extra border;
  the input simply gets internal padding to make room.

The wrapper uses `ViewEncapsulation.None` so its rules can adjust the
inner padding of `.dg-input-text__field` /
`.dg-input-number__field` / `.dg-dropdown__trigger` /
`.dg-datepicker__field`. Rules are scoped under `.dg-icon-field` so they
don't leak.

#### `DgIconField` inputs

- `iconPosition: 'left' | 'right'` (default `'left'`).
- `fluid` (default `false`) — when `true`, the field becomes a
  `display: flex` block taking 100 % width.

#### `DgInputIcon` — projection slot

Renders a `<dg-input-icon>` host element styled as an absolutely
positioned, vertically centered chip. Project an emoji, a font icon
class, or an inline SVG. Uses `pointer-events: none` so clicks fall
through to the input behind it.

#### Behavior (handled in CSS)

- `DgIconField` is `position: relative`. The icon is positioned
  absolutely at `top: 50%; transform: translateY(-50%)` and offset
  `0.625rem` from the matching edge.
- The input field gets `padding-left: 2rem` (or `padding-right`) so
  typed text never sits under the icon. `!important` forces this against
  the component's own padding (equal specificity, undefined Angular CSS
  load order — same situation documented on `DgInputGroup`).
- Icon has `z-index: 2` so it floats above the field's focus ring.

#### Usage

```html
<!-- Search field -->
<dg-icon-field iconPosition="left" fluid>
  <dg-input-icon>🔍</dg-input-icon>
  <dg-input-text fluid placeholder="Tìm kiếm…" />
</dg-icon-field>

<!-- Email with icon on the right -->
<dg-icon-field iconPosition="right" fluid>
  <dg-input-icon>📧</dg-input-icon>
  <dg-input-text fluid type="email" placeholder="email@example.com" />
</dg-icon-field>

<!-- Calendar icon on a datepicker -->
<dg-icon-field iconPosition="left" fluid>
  <dg-input-icon>📅</dg-input-icon>
  <dg-datepicker fluid placeholder="Chọn ngày" [(value)]="date" />
</dg-icon-field>

<!-- $ icon on input-number -->
<dg-icon-field iconPosition="left" fluid>
  <dg-input-icon>$</dg-input-icon>
  <dg-input-number fluid locale="en-US" placeholder="0.00" [(value)]="amount" />
</dg-icon-field>
```

### DgInputGroup (`<dg-input-group>`) + DgInputGroupAddon

Layout wrapper that joins an input with prefix / suffix addons (icons,
text, buttons) into a single bordered group with shared edges. Modelled
after PrimeNG's `<p-inputgroup>` + `<p-inputgroup-addon>`. Pure CSS —
no logic on the wrapper component.

The wrapper uses `ViewEncapsulation.None` so its rules can scope into
descendant component templates (the actual visual fields of
`DgInputText` / `DgInputNumber` / `DgDropdown` / `DgDatepicker` /
`DgButton` live inside their own templates). Rules are still scoped under
`.dg-input-group` so they don't leak.

#### `DgInputGroup` inputs

- `fluid` (default `false`) — when `true`, the group becomes a
  `display: flex` block taking 100 % width.

#### `DgInputGroupAddon` — projection container

Renders a `<dg-input-group__addon>` host element styled as a non-input
"chip" inside the group: subtle background, padding, no shrink. Use for
icons, currency symbols, units, short labels. For interactive addons
(submit button, dropdown trigger) place a `<dg-button>` directly inside
the group instead.

#### Behavior (handled in CSS)

- All known field classes inside the group lose their corner radii so
  the group looks like a single rounded rectangle.
- The first child's left side and the last child's right side keep
  rounded corners.
- Adjacent fields share their middle border (left border of every
  non-first field is dropped).
- Focused / invalid fields lift to `z-index: 1` so the focus ring and
  red outline aren't clipped by the next field's border.

#### Usage

```html
<!-- Currency input with $ + .00 addons -->
<dg-input-group fluid>
  <dg-input-group-addon>$</dg-input-group-addon>
  <dg-input-text fluid placeholder="0.00" />
  <dg-input-group-addon>.00</dg-input-group-addon>
</dg-input-group>

<!-- Search field with submit button -->
<dg-input-group fluid>
  <dg-input-text fluid placeholder="Tìm kiếm" [(value)]="query" />
  <dg-button label="Search" severity="primary" (clicked)="search()" />
</dg-input-group>

<!-- Currency + number input -->
<dg-input-group fluid>
  <dg-input-group-addon>VND</dg-input-group-addon>
  <dg-input-number fluid locale="vi-VN" [(value)]="amount" />
</dg-input-group>

<!-- Date with calendar icon prefix -->
<dg-input-group fluid>
  <dg-input-group-addon>📅</dg-input-group-addon>
  <dg-datepicker fluid [(value)]="bookDate" />
</dg-input-group>

<!-- 4-piece compose: protocol + host + : + port -->
<dg-input-group fluid>
  <dg-input-group-addon>http://</dg-input-group-addon>
  <dg-input-text fluid placeholder="host" />
  <dg-input-group-addon>:</dg-input-group-addon>
  <dg-input-number fluid placeholder="8080" />
</dg-input-group>
```

### DgInputNumber (`<dg-input-number>`)

Numeric input with locale-aware formatting. Wraps a native `<input
type="text" inputmode="decimal">` so keyboard / paste / typing behave like
text input but the bound value is always `number | null`. Built on
`Intl.NumberFormat` for grouping, currency, and percent — no date-fns,
no @angular/cdk. Implements `ControlValueAccessor`.

#### Inputs

- `value` (model two-way) — `number | null`.
- `min`, `max` — bounds; clamping happens on blur (typing isn't clamped
  mid-edit so the user can enter intermediate values like `-` or `1.`).
- `step` (default `1`) — increment/decrement amount for spinner buttons
  and Arrow keys.
- `mode: 'decimal' | 'currency' | 'percent'` (default `'decimal'`).
- `locale` (default `navigator.language`) — drives grouping char and
  decimal separator (en-US `1,234.56` vs vi-VN `1.234,56`).
- `currency` (e.g. `'USD'`, `'VND'`) + `currencyDisplay`
  (`'symbol' | 'code' | 'name' | 'narrowSymbol'`, default `'symbol'`).
- `useGrouping` (default `true`) — toggles the thousands separator.
- `minFractionDigits`, `maxFractionDigits` — pass through to
  `Intl.NumberFormat`.
- `prefix`, `suffix` — strings prepended / appended to the formatted value.
- `placeholder`, `ariaLabel`.
- `allowEmpty` (default `true`) — when `false`, blank input keeps the
  previous value instead of becoming `null`.
- `showButtons` (default `false`) + `buttonLayout: 'stacked' |
  'horizontal'` — adds spinner ▲/▼ buttons.
- `showClear` (default `false`) — × button to reset to `null`.
- `invalid`, `fluid`, `disabled`, `readonly`.
- `size: 'small' | 'normal' | 'large'`, `variant: 'outlined' | 'filled'`.

#### Outputs

- `valueChange: number | null` — fires after every commit.
- `cleared` — fires after the × button.
- `focused: FocusEvent`, `blurred: FocusEvent`.

#### Behavior

- **Display formatting**: `Intl.NumberFormat` with `style` =
  decimal/currency/percent, then prefix/suffix wrapped around. `value =
  0.25` with `mode='percent'` shows `"25%"`.
- **Typing**: locale separators are auto-stripped on parse. The user
  types `1,234.56` (en-US) or `1.234,56` (vi-VN) — the directive
  parses to `1234.56` regardless. Currency symbol / prefix / suffix in
  the typed text are stripped.
- **Keyboard**: `ArrowUp` / `ArrowDown` step ±`step`; `Home` / `End`
  jump to `min` / `max` (when defined).
- **Buttons**: stacked layout puts ▲▼ on the right side; horizontal
  layout puts − and + flanking a center-aligned input.
- **Blur clamp**: typed values are clamped into `[min, max]` only on
  blur, so partial entries don't get rewritten while typing.
- **Empty state**: blank input → `value = null` (when `allowEmpty`).
  Spinner from `null` treats current as `0`.

#### Usage

```html
<!-- decimal with locale grouping -->
<dg-input-number [(value)]="qty" locale="en-US" showClear />

<!-- currency -->
<dg-input-number mode="currency" currency="VND" locale="vi-VN" [(value)]="price" />

<!-- percent (0.25 → 25%) -->
<dg-input-number mode="percent" locale="en-US" [(value)]="rate" [maxFractionDigits]="2" />

<!-- bounded with spinner -->
<dg-input-number
  [min]="0" [max]="100" [step]="5"
  [showButtons]="true" buttonLayout="stacked"
  [(value)]="score" />

<!-- ± horizontal layout -->
<dg-input-number [showButtons]="true" buttonLayout="horizontal" [(value)]="counter" />

<!-- reactive form -->
<dg-input-number [formControl]="priceCtrl" mode="currency" currency="USD" />
```

### DgDialog (`<dg-dialog>`) + DgDialogService
Built on native `<dialog>` element (free a11y: ESC, backdrop). The native
element handles inerting the rest of the page in modal mode; for tab
trapping the component composes the `DgFocusTrap` directive on the
`<dialog>` so Tab / Shift+Tab cycles only between focusable controls
inside the dialog in **both** modal and non-modal modes.

Inputs:
- `visible` (model), `header`, `modal`, `closable`, `closeOnEscape`,
  `dismissableMask`, `showHeader`, `blockScroll`, `position`
  (9 positions: center/top/bottom/left/right/topleft/topright/bottomleft/bottomright),
  `width`, `closeAriaLabel`, `headerTemplate`, `footerTemplate`.
- `focusTrap` (default `true`) — toggles the embedded `DgFocusTrap` (sets
  `[dgFocusTrapDisabled]="!focusTrap()"`). Set to `false` if focus should
  escape (e.g. a non-modal toolbar dialog).
- `autoFocus` (default `true`) — calls the trap's `focusFirst()` after
  open so focus lands on the first interactive control. Set to `false` to
  keep focus on the opener.

Outputs: `shown`, `hidden`.

#### Section directives (via `<ng-template>`)
- `<ng-template dgDialogHeader>` → custom header content
- `<ng-template dgDialogFooter>` → custom footer content
- Default body: any other projected content
Header text (plain) can also be set via `header` input as fallback.

#### DgDialogService — programmatic dialogs
```ts
const ref = dialogService.open(MyComponent, {
  header: 'Title', width: '24rem',
  data: { id: 1 },          // injected via DG_DIALOG_DATA
  inputs: { foo: 'bar' },   // setInput() on signal inputs
  position: 'center',
  modal: true, closable: true,
  closeOnEscape: true, dismissableMask: false,
});
ref.afterClosed$.subscribe(result => ...);
ref.componentInstance?.someOutput.subscribe(...);
ref.close('result');
```
Inside the opened component: `inject(DgDialogRef)`, `inject(DG_DIALOG_DATA)`.

### DgCheckbox (`<dg-checkbox>`)

Click-to-toggle checkbox with two modes (binary and multi/group),
indeterminate state, custom check-icon template, label, and standard
`size` / `variant` / `invalid` / `readonly` / `disabled` controls.
Modelled after PrimeNG's `p-checkbox`. Implements `ControlValueAccessor`.

Inputs:

- `value` (model two-way) — bound value.
  - **Binary mode** (default `binary=true`): the bound value is
    `trueValue` when checked, `falseValue` when unchecked. Defaults give
    boolean true/false.
  - **Multi mode** (`binary=false`): the bound value is an array;
    toggling adds / removes `checkboxValue` (the per-checkbox payload).
- `checkboxValue: any` — payload added to / removed from the array in
  multi mode (ignored in binary mode).
- `binary` (default `true`).
- `trueValue` (default `true`), `falseValue` (default `false`) — only
  meaningful in binary mode.
- `indeterminate` — render the `−` icon and report `aria-checked="mixed"`.
  Doesn't affect `value`; the parent toggles it explicitly.
- `label: string` — optional label rendered next to the box; clicking it
  also toggles (because the wrapper is a `<label>`).
- `invalid`, `disabled`, `readonly`.
- `size: 'small'|'normal'|'large'`, `variant: 'outlined'|'filled'`.
- `name`, `inputId`, `tabindex`, `ariaLabel`, `ariaDescribedBy`.

Outputs:

- `checkboxChange: { value, checked, originalEvent }` — fires after every
  user-driven toggle. Skipped when `readonly`. NB: deliberately NOT named
  `change` because that collides with the native DOM `change` event
  bubbling up from the inner `<input>` — Angular's `(change)` on the
  custom component host would become ambiguous and the output binding
  may fail to fire.
- `focused: FocusEvent`, `blurred: FocusEvent`.

Templates (via directive):

- `<ng-template dgCheckboxIcon let-c="checked" let-i="indeterminate">` —
  custom icon. Render whatever you want when `c` (checked) or `i`
  (indeterminate) is true; nothing when both are false.

Methods:

- `toggle(originalEvent?)` — programmatic toggle (respects disabled / readonly).
- `focus()` — focus the inner `<input type="checkbox">`.

Behavior:

- The wrapper is a `<label>`, so clicking the box, the label, or the
  hidden input all toggle the state — no JS needed.
- `readonly` blocks `change` events but the box still shows its current
  state and is keyboard-focusable.
- `indeterminate` is a pure visual + a11y signal — toggling still
  flips `value` based on the current `checked` computation (which
  ignores indeterminate).

Usage:

```html
<!-- Binary boolean -->
<dg-checkbox [(value)]="agree" label="I agree" />

<!-- Custom true/false values -->
<dg-checkbox [(value)]="answer" trueValue="Y" falseValue="N" label="Yes / No" />

<!-- Multi/group via shared array -->
<dg-checkbox *ngFor="let c of cities" [binary]="false"
             [checkboxValue]="c" [(value)]="selected" [label]="c" />

<!-- Indeterminate parent -->
<dg-checkbox [value]="allChecked" [indeterminate]="someChecked && !allChecked"
             (change)="toggleAll($event.checked)" label="Select all" />

<!-- Custom icon -->
<dg-checkbox [(value)]="starred">
  <ng-template dgCheckboxIcon let-c="checked">
    <span *ngIf="c">⭐</span>
  </ng-template>
</dg-checkbox>

<!-- Reactive form -->
<dg-checkbox [formControl]="newsletterCtrl" label="Subscribe" />
```

## Showcase prerender (static SSG)

The `dungeon-ui-libs` demo app is **fully prerendered to static HTML** at
build time — every route in [`src/app/app.routes.ts`][routes] gets its
own `dist/dungeon-ui-libs/browser/<route>/index.html`. No runtime Node
server is required; the output is plain static files (servable by any
CDN / GitHub Pages / Cloudflare Pages).

[routes]: ../src/app/app.routes.ts

Key files:

- `src/main.server.ts` — bootstrap function MUST forward
  `BootstrapContext` so the route extractor can attach to its server
  platform: `(ctx) => bootstrapApplication(App, config, ctx)`. Without
  forwarding the ctx, the build fails with NG0401 *"Missing Platform"*.
- `src/app/app.config.server.ts` — merges
  `provideServerRendering(withRoutes(serverRoutes))` with the browser
  `appConfig`.
- `src/app/app.routes.server.ts` — single
  `{ path: '**', renderMode: RenderMode.Prerender }` rule. Angular's
  route extractor walks the client router config and prerenders each
  match.
- `src/app/app.config.ts` — adds
  `provideClientHydration(withEventReplay())` so prerendered HTML
  hydrates without flicker and DOM events queued during hydration are
  replayed after JS loads.
- `angular.json` build options:
  `"server": "src/main.server.ts"` + `"outputMode": "static"`.

Dev deps: `@angular/ssr@21.2.10`, `@angular/platform-server@21.2.11`
(installed with `--legacy-peer-deps` because npm strict resolution picks
`@angular/router@21.2.12` which conflicts with our pinned
`@angular/core@21.2.11` — same minor, no runtime issue).

### DgRadio (`<dg-radio>`)

Single-select radio button. All radios in the same group share one
parent binding (`[(value)]`, `[(ngModel)]`, or `[formControl]`) — no
wrapper component. An internal `DgRadioRegistry` syncs siblings sharing
the same `name` whenever one is picked, mirroring PrimeNG's
`RadioControlRegistry`. Modelled after PrimeNG's `p-radioButton`.
Implements `ControlValueAccessor`.

> **Always set `name`** on radios in the same group. Without it, the
> registry's sibling-sync is a no-op and `[formControl]` / `[(ngModel)]`
> groups will appear all-checked after the first click — Angular's
> `setValue(value, { emitModelToViewChange: false })` from the
> originating accessor blocks `writeValue` propagation to the other
> directives bound to the same control.

Inputs:

- `value` (model two-way) — the **group's currently-selected value**.
  Bind the SAME source to every radio in the group; whichever radio's
  `radioValue` matches is rendered as checked.
- `radioValue: any` — this radio's payload, written to `value` when
  picked.
- `label: string` — optional label rendered next to the box; clicking it
  also picks (because the wrapper is a `<label>`).
- `invalid`, `disabled`, `readonly`.
- `size: 'small'|'normal'|'large'`, `variant: 'outlined'|'filled'`.
- `name` — native radio group name; lets the browser provide
  Arrow-key navigation across radios sharing the name.
- `inputId`, `tabindex`, `ariaLabel`, `ariaDescribedBy`.

Outputs:

- `radioChange: { value, originalEvent }` — fires after a user-driven
  selection. Skipped when `readonly`. NB: deliberately NOT named
  `change` — collides with the native DOM `change` event bubbling from
  the inner `<input>`.
- `focused: FocusEvent`, `blurred: FocusEvent`.

Templates (via directive):

- `<ng-template dgRadioIcon let-c="checked">` — custom inner mark.
  Render whatever you want when `c` (checked) is true; default is a
  filled blue dot.

Methods:

- `select(originalEvent?)` — programmatically pick this radio (no-op
  when disabled / readonly / already checked).
- `focus()` — focus the inner `<input type="radio">`.

Behavior:

- Re-clicking the already-selected radio is a no-op (radios don't
  toggle off — that matches native HTML radio semantics).
- The wrapper is a `<label>`, so clicking the box, the label, or the
  hidden input all pick the radio — no JS needed.
- `readonly` blocks `change` events but keeps the box visible and
  keyboard-focusable.

Usage:

```html
<!-- Signal two-way: every radio binds the same source -->
<dg-radio *ngFor="let c of cities" name="city"
          [radioValue]="c" [(value)]="selectedCity" [label]="c" />

<!-- Reactive form: every radio uses the same FormControl -->
<dg-radio *ngFor="let p of plans" name="plan"
          [radioValue]="p" [formControl]="planCtrl" [label]="p" />

<!-- Custom mark -->
<dg-radio name="fruit" radioValue="apple" [(value)]="picked">
  <ng-template dgRadioIcon let-c="checked">
    <span *ngIf="c">⭐</span>
  </ng-template>
</dg-radio>
```

### DgDropdown (`<dg-dropdown>`)
Custom-rendered dropdown with filter, keyboard nav (Arrow/Enter/Esc/Home/End),
outside-click close, optional body-portal (`appendTo='body'`).
Implements `ControlValueAccessor`.

Inputs:
- `options: T[]`, `optionLabel`, `optionValue`, `optionDisabled`
  (each accepts `string` field name OR `(item: T) => any` function)
- `value` (model two-way), `placeholder`
- `filter`, `filterPlaceholder`, `filterBy` (csv of fields)
- `clearable`, `invalid`, `fluid`, `disabled`
- `size: 'small'|'normal'|'large'`, `variant: 'outlined'|'filled'`
- `panelMaxHeight` (default `'14rem'`), `emptyMessage`
- `appendTo: 'self' | 'body'` (default `'self'`)
  - `'body'`: panel appended to `<body>` to escape clipping containers; cleared
    from body when closed.
- `panelWidth: 'host' | 'auto' | <css length>` (default `'host'`)
  - `'host'`: panel min-width = host width
  - `'auto'`: panel sizes to its content (can exceed host)
  - `'18rem'` etc: explicit width

Outputs: `opened`, `closed`, `selectedChange<T>`, `filterChange`.

Templates (via directives):
- `<ng-template dgDropdownOption let-opt let-i="index" let-selected="selected" let-highlighted="highlighted">`
- `<ng-template dgDropdownSelected let-opt>` — custom display in trigger
- `<ng-template dgDropdownEmpty>` — custom empty state

Usage:
```html
<dg-dropdown
  [options]="cities"
  optionLabel="label"
  optionValue="value"
  filter
  appendTo="body"
  panelWidth="auto"
  [(value)]="selected">
  <ng-template dgDropdownOption let-c>{{ c.icon }} {{ c.label }}</ng-template>
</dg-dropdown>
```

### DgAutocomplete (`<dg-autocomplete>`)

Single-select autocomplete (combobox) modelled after PrimeNG's
`p-autoComplete`. The component does **not** filter `suggestions` itself —
it emits a debounced `(complete)` event with the typed `query`, and the
parent is expected to provide the matching list. This keeps async data
sources (HTTP, RxJS) the natural path. Implements `ControlValueAccessor`.

Inputs:

- `suggestions: T[]` — currently visible options (parent-provided).
- `optionLabel`, `optionValue`, `optionDisabled` — `string` field name OR
  `(item: T) => any` getter (same convention as `DgDropdown`).
- `value` (model two-way) — bound to the selected option's value.
- `placeholder`, `minLength` (default `1`), `delay` (default `300` ms).
- `forceSelection` (default `false`) — on blur, if the typed text doesn't
  match any visible option's label, clear the input and value.
- `dropdown` (default `false`) — render a ▾ trigger button that fires
  `(complete)` with the current query (often empty) and opens the panel.
- `clearable`, `invalid`, `fluid`, `readonly`, `disabled`.
- `size: 'small' | 'normal' | 'large'`, `variant: 'outlined' | 'filled'`.
- `panelMaxHeight` (default `'14rem'`), `emptyMessage` (default
  `'No results'`), `loading` (shows a placeholder row),
  `loadingMessage`.
- `appendTo: 'self' | 'body'` — body-portal escapes clipping containers
  (cleared on close, just like `DgDropdown`).
- `panelWidth: 'host' | 'auto' | <css length>` — same policy as
  `DgDropdown`.

Outputs:

- `complete: { query: string; originalEvent?: Event }` — fires on each
  typed change (after `delay`) and on `dropdown` button click. The parent
  uses this to update `suggestions`.
- `selected<T>` — fires after a user picks an option.
- `cleared` — × button pressed.
- `opened`, `closed`.

Templates (via directives):

- `<ng-template dgAutocompleteOption let-opt let-i="index" let-highlighted="highlighted" let-q="query">` — custom item rendering (great for two-line items, highlighting the query, badges, etc.).
- `<ng-template dgAutocompleteEmpty let-q="query">` — custom "no results" content with access to the current query.

Behavior:

- Typing past `minLength` schedules `complete` with `delay` debounce, then
  opens the panel after the parent updates `suggestions`.
- Selecting an option writes `optionLabel` into the input and `optionValue`
  into `value` (or the option itself when the getters are unset).
- Typing after a selection clears `value` (so the bound model reflects
  "in progress" rather than the stale selection); a fresh selection
  re-binds it.
- Keyboard: `ArrowDown` opens or moves; `ArrowUp` moves; `Home` / `End`
  jump; `Enter` selects the highlighted option; `Esc` and `Tab` close.
- Outside-click closes the panel.

Usage:
```html
<dg-autocomplete
  [suggestions]="filtered()"
  optionLabel="label"
  optionValue="value"
  dropdown
  clearable
  [(value)]="selectedCity"
  (complete)="onComplete($event)">
  <ng-template dgAutocompleteOption let-opt let-q="query">
    <span style="flex:1">{{ opt.label }}</span>
    <span class="hint">{{ opt.region }}</span>
  </ng-template>
  <ng-template dgAutocompleteEmpty let-q="query">
    Không tìm thấy "{{ q }}"
  </ng-template>
</dg-autocomplete>
```

```ts
onComplete(e: DgAutocompleteCompleteEvent) {
  const q = e.query.trim().toLowerCase();
  this.filtered.set(this.cities.filter(c => c.label.toLowerCase().includes(q)));
}
```

### DgFocusTrap (`[dgFocusTrap]`)

Standalone directive that confines `Tab` / `Shift+Tab` navigation to focusable
descendants of its host element. Modelled after PrimeNG's `pFocusTrap`. Used
internally by `DgDialog`, also exported for any container that needs the
behavior (custom popovers, drawers, inline modals, non-modal toolbars).

How it works: on init the directive inserts two visually-hidden but
tab-focusable `<span>` sentinels at the very start and end of the host. When
focus reaches a sentinel — either by tabbing past the last real focusable
or shift-tabbing past the first, or jumping in from outside — the directive
redirects focus to the first / last real focusable inside the host so the
trap loops naturally. Disabling the directive removes both sentinels and
focus flows through the host as normal.

#### Inputs

- `dgFocusTrapDisabled` (default `false`) — set to `true` to remove the
  sentinels and disable trapping.

#### Public methods

- `focusFirst()` — focus the first focusable inside the host (or the host
  itself if nothing focusable exists).
- `focusLast()` — focus the last focusable inside the host.

Use `exportAs="dgFocusTrap"` to grab a template reference and call these
methods (e.g. when a custom dialog opens):

```html
<div #trap="dgFocusTrap" dgFocusTrap>
  <button>One</button>
  <input />
  <button>Done</button>
</div>
<button (click)="trap.focusFirst()">Focus first</button>

<!-- Disable trap conditionally -->
<aside dgFocusTrap [dgFocusTrapDisabled]="!isOpen()">…</aside>
```

What counts as "focusable": the directive's selector includes
`a[href]`, `area[href]`, `button`, `input` (excluding hidden), `select`,
`textarea`, `iframe`, `object`, `embed`, `audio[controls]`, `video[controls]`,
`[contenteditable]`, and any element with a non-negative `[tabindex]`.
Disabled controls and elements with `tabindex="-1"` are excluded; invisible
elements (no `offsetParent` and no client rect) are also skipped so trap
correctly handles collapsed panels.

### DgNavMenu (`<dg-nav-menu>`)

Hierarchical navigation menu (menubar / sidebar / tabs). API modelled after
PrimeNG `p-menubar`: `model`-driven `MenuItem` tree with nested `items`,
per-item `command` callback, `url` / `routerLink`, `escape`, `disabled`,
`visible`, `separator`, `badge`, `tooltip`, plus extras for active-value
tracking. Zero-dep, multi-level submenus, keyboard nav, hover-or-click
expansion, mobile-responsive collapse with hamburger button.

#### `DgNavMenuItem` (PrimeNG-aligned `MenuItem`)

| field | type | notes |
| ----- | ---- | ----- |
| `label` | `string` | Display text. Honours `escape`. |
| `icon` | `string` | Icon class name (or single emoji). |
| `iconClass`, `labelClass`, `linkClass`, `styleClass`, `style`, `badgeStyleClass` | various | Pass-through styling. |
| `command` | `(event: DgNavMenuItemCommandEvent) => void` | Fired when leaf is invoked. Event = `{ originalEvent, item, index }`. |
| `url` | `string` | External link → renders as `<a href>`. |
| `target` | `'_self' \| '_blank' \| ...` | Anchor target. |
| `routerLink` | `unknown` | Angular routerLink commands. |
| `items` | `DgNavMenuItem[]` | Nested children — opens a submenu. |
| `expanded` | `boolean` | Informational. |
| `disabled` | `boolean` | Non-interactive + greyed. |
| `visible` | `boolean` | When `false`, the item is removed from the DOM entirely. |
| `escape` | `boolean` | Default `true`. Set `false` to render `label` as raw HTML via `[innerHTML]`. |
| `separator` | `boolean` | Render a non-interactive divider. |
| `badge` | `string \| number` | Pill rendered after the label. |
| `tooltip` | `string` | Set as `title` attribute. |
| `id`, `tabindex` | `string` | Forwarded to the link element. |
| `value` | `unknown` | **Extension over PrimeNG.** Active-leaf id matched against the component's `value` model. |
| `data` | `unknown` | Free-form payload forwarded in events. |

#### Component inputs

- `model: DgNavMenuItem[]` — PrimeNG-canonical name (matches `p-menubar`)
- `value` (model two-way) — currently active leaf's `value`
- `orientation: 'horizontal' | 'vertical'` (default `'horizontal'`)
- `variant: 'plain' | 'pills' | 'tabs'`
- `size: 'small' | 'normal' | 'large'`
- `autoDisplay` (default `true`) — open submenu on hover at root. `false` ⇒ click-only.
- `autoHide` (default `false`) + `autoHideDelay` (default `100` ms) — close submenus after the cursor leaves the menu.
- `breakpoint` (default `'960px'`) — max-width below which the menu collapses behind a hamburger button.
- `mobileActive` (model two-way) — drawer open state when in mobile mode.
- `closeOnSelect` (default `true`), `fluid`, `id`, `ariaLabel`

#### Outputs

- `itemClick: DgNavMenuItemCommandEvent` — fires after leaf select, in addition to the per-item `command` callback.
- `opened: DgNavMenuItem` — top-level submenu opened.
- `closed` — all submenus closed.
- `onFocus`, `onBlur` — host focus events.

#### Templates (content directives)

- `<ng-template dgNavMenuItem let-item let-active="active" let-expanded="expanded" let-level="level" let-hasChildren="hasChildren">` — replace default item rendering.
- `<ng-template dgNavMenuStart>` — content before the menu (logo / brand).
- `<ng-template dgNavMenuEnd>` — content after the menu (auth, search).
- `<ng-template dgNavMenuSubmenuIcon let-root="root">` — replace caret icon. `root` is `true` for top-level carets, `false` for nested.

#### Behavior

- Top-level items render as `role="menubar"`. Items with `items` open a
  popup submenu (below in horizontal orientation, to the right in vertical
  / for nested submenus).
- `autoDisplay=true`: hovering a parent opens its submenu; sibling-hover
  switches. `autoDisplay=false`: click-only.
- Outside-click and `Escape` close all submenus.
- Below `breakpoint`, the list collapses; the hamburger button toggles
  `mobileActive`. In drawer mode submenus render inline (no popup).
- Keyboard: `Enter`/`Space` invokes; `ArrowDown` (horizontal root) and
  `ArrowRight` open submenus; `ArrowLeft` closes the current submenu
  level; `Escape` closes all.
- Leaf clicks set `value` (when `item.value` is defined), invoke
  `item.command(event)`, then emit `itemClick`. `event.preventDefault()`
  is called unless `url` or `routerLink` is set, so navigation triggers
  naturally.

#### Usage

```html
<!-- Basic horizontal menubar with active-value tracking -->
<dg-nav-menu
  [model]="navItems"
  [(value)]="active"
  variant="pills"
  [autoDisplay]="false">
</dg-nav-menu>

<!-- Brand + menu + utility area, with custom submenu icon -->
<dg-nav-menu [model]="navItems" [autoHide]="true">
  <ng-template dgNavMenuStart>
    <img src="/logo.svg" alt="brand" />
  </ng-template>
  <ng-template dgNavMenuEnd>
    <button>Sign in</button>
  </ng-template>
  <ng-template dgNavMenuSubmenuIcon let-root="root">
    <span>{{ root ? '▼' : '▶' }}</span>
  </ng-template>
</dg-nav-menu>

<!-- Items with command callbacks (PrimeNG style) -->
<dg-nav-menu [model]="[
  { label: 'Save', icon: 'pi pi-save', command: (e) => save(e.item) },
  { label: 'Open in new tab', url: 'https://example.com', target: '_blank' },
  { separator: true },
  { label: 'Hidden', visible: false },
  { label: '<b>HTML</b> label', escape: false },
]" />
```

### DgDatepicker (`<dg-datepicker>`)

Calendar/date picker — selectionMode `'single'` or `'range'`, inline or popup
panel, min/max + disabled days/dates, button bar (Today / Clear), week
numbers, body portal, ControlValueAccessor. API modelled after PrimeNG
`p-datepicker` but trimmed to the most useful subset (no time picker, no
multiple-month view, no touch UI — these can be added later if needed).

#### Inputs

- `value` (model two-way) — `Date` for single mode, `[Date, Date | null]`
  tuple for range mode (the second slot is `null` while the user is still
  picking the end), `null` when empty. Type alias: `DgDatepickerValue`.
- `selectionMode: 'single' | 'range'` (default `'single'`).
- `format` (default `'dd/MM/yyyy'`) — supports tokens `dd`, `d`, `MM`, `M`,
  `yyyy`, `yy`. Used for both display formatting and parsing typed input.
  The trigger input also gets a `[dgInputMask]` derived from this format
  (each `y` / `M` / `d` becomes the digit token `9`) so users can only type
  digits in the right slots and separators auto-fill as they type.
- `keepInvalid` (default `false`) — when `false`, on blur the input text
  reverts to the formatted value if the user typed something the parser
  couldn't turn into a valid date (matches PrimeNG default). Set to `true`
  to keep the broken text so a Forms validator can flag it.
- `placeholder`, `locale` (default `navigator.language`), `rangeSeparator`
  (default `' – '`).
- `minDate`, `maxDate` (`Date | null`).
- `disabledDates: Date[]`, `disabledDays: number[]` (0 = Sun … 6 = Sat).
- `firstDayOfWeek` (default `1` = Monday).
- `showOtherMonths` (default `true`), `selectOtherMonths` (default `false`).
- `showWeek` (default `false`) + `weekLabel` (default `'Wk'`) — ISO 8601
  week numbers in the leftmost column.
- `inline` (default `false`) — always-visible calendar (no trigger field).
- `showButtonBar` (default `false`) + `todayLabel` / `clearLabel`.
- `clearable`, `invalid`, `fluid`, `disabled`, `readonlyInput`.
- `size: 'small' | 'normal' | 'large'`, `variant: 'outlined' | 'filled'`.
- `appendTo: 'self' | 'body'` (default `'self'`) — body portal escapes
  parents with `overflow: hidden` (same mechanism as `DgDropdown`).

#### Outputs

- `selectedChange: DgDatepickerValue` — fires after every user pick.
- `opened`, `closed` — popup lifecycle.
- `monthChange`, `yearChange` — `{ month, year }` when navigating the view.

#### Templates

- `<ng-template dgDatepickerDate let-date let-current="current" let-today="today" let-selected="selected" let-disabled="disabled">` —
  replace the default cell content (e.g. add a custom badge for today, or
  highlight a holiday). When this template is provided, the host `<td>`
  retains its semantic classes; the template renders inside.

#### Behavior

- Popup mode: trigger field with input + 📅 button. Click button (or press
  `Enter` / `↓` on the input) to toggle. Outside-click and `Escape` close.
- **Three views** in the panel header — clicking the **month** label switches
  to a 12-month picker; clicking the **year** label switches to a 12-year
  picker. Pick a month → back to date view; pick a year → drill down to
  month view (PrimeNG-style). Prev/next arrows step by month / year /
  decade depending on the active view. Closing the panel resets to date
  view.
- Range mode: first click sets `start` (with `end = null`); second click
  sets `end` if the date ≥ `start`, otherwise resets `start`. Cells
  between `start` and `end` get `--in-range`; endpoints get
  `--range-start` / `--range-end` styling.
- Button bar `Today` jumps the view to today and (in single mode) selects
  today; `Clear` empties the value and closes.
- `appendTo='body'` mounts the panel into `<body>` while open and removes
  it on close (positions are recalculated on scroll/resize).
- ControlValueAccessor: works with `[(ngModel)]`, `[formControl]`, and
  signal-style `[(value)]`.

#### Usage

```html
<!-- Single, popup with Today/Clear bar -->
<dg-datepicker
  [(value)]="date"
  format="dd/MM/yyyy"
  clearable
  [showButtonBar]="true">
</dg-datepicker>

<!-- Range with body portal + week numbers -->
<dg-datepicker
  selectionMode="range"
  [(value)]="dateRange"
  appendTo="body"
  [showWeek]="true">
</dg-datepicker>

<!-- Inline calendar with constraints -->
<dg-datepicker
  inline
  [(value)]="date"
  [minDate]="today"
  [maxDate]="thirtyDaysFromNow"
  [disabledDays]="[0, 6]"
  [disabledDates]="holidays">
</dg-datepicker>

<!-- Reactive form, custom day cell template -->
<dg-datepicker [formControl]="dateCtrl">
  <ng-template dgDatepickerDate let-d let-today="today" let-selected="selected">
    <span class="day" [class.day--today]="today">{{ d.getDate() }}</span>
  </ng-template>
</dg-datepicker>
```

### DgTable (`<dg-table>`) + DgPaginator + DgTableBottomAnchor

Powerful div-based grid table (no `<table>` element) with:
- Custom virtual scroll (zero-dep, no @angular/cdk).
- Pagination (client / server / cursor).
- Per-column custom templates.
- Bottom-anchor sizing.
- Min-height enforcement.

#### DgTable inputs
- `value: T[]`, `columns: DgTableColumn<T>[]` (required)
- `rowHeight` (default 36), `scrollHeight` (CSS px), `bufferSize` (default 5)
- `virtualScroll`: enable virtual rendering (recommended for >1000 rows)
- `trackBy: (i, row) => unknown`
- `pagination: 'none'|'client'|'server'|'cursor'`
- `pageSize` (model), `currentPage` (model), `pageSizeOptions`, `totalRecords`
- `loading` — show overlay
- `cursorField` — field name for cursor extraction in cursor mode
- `cursorPrevDisabled`, `cursorNextDisabled` — controlled by parent for cursor mode
- `bottomAnchor: DgTableBottomAnchor | ElementRef | HTMLElement | null`
- `minHeight` (default `'350px'`) — table height floor; if anchor-derived height
  is smaller, table sits at minHeight (and may overflow its container).
- `slotOrder: ('info'|'nav'|'pageSize')[]` — paginator slot order
- `rowsLabel`, `showingLabel`, `ofLabel`, `emptyLabel` — paginator i18n

#### DgTable outputs
- `pageChange: DgPageChangeEvent { page, pageSize, first }`
- `cursorChange: DgCursorChangeEvent { cursor, pageSize, direction }`

#### Methods (programmatic)
- `scrollToIndex(index: number)` — scroll viewport so index is at top.

#### DgTableColumn<T>
```ts
{
  field: string;
  header: string;
  width?: string;     // CSS, e.g. '120px' or '1.4fr'
  align?: 'left'|'center'|'right';
  formatter?: (row: T) => string | number;
  sortable?: boolean; // currently informational
}
```

#### Per-column template (`dgColumn`)
```html
<ng-template dgColumn="status" let-row let-i="index" let-value="value">
  <span class="badge">{{ row.status }}</span>
</ng-template>
```
Context: `{ $implicit: row, value, index, column }`.

#### Paginator customization
Per-slot template directives (each gets typed context with state + methods):
- `<ng-template dgPaginatorInfo let-ctx>` — custom "Showing X–Y of Z"
- `<ng-template dgPaginatorNav let-ctx>` — custom prev/next/page-numbers
- `<ng-template dgPaginatorPageSize let-ctx>` — custom rows-per-page selector

Whole paginator replacement:
- `<ng-template dgTablePaginator let-ctx>` — replaces `<dg-paginator>` entirely.
  Context exposes everything: `page, pageSize, total, totalPages, rangeStart,
  rangeEnd, pageWindow, mode, loading, options, cursorPrevDisabled,
  cursorNextDisabled, goToPage(n), setPageSize(n), cursorFirst(),
  cursorPrev(), cursorNext()`.

#### Bottom anchor (`dgTableBottomAnchor`)
Marker directive: `[dgTableBottomAnchor]` on any DOM element. Optional offset
(px) is bound via the same attribute value. Table observes the anchor's top
position with ResizeObserver (body + anchor + table) and computes its height
so its bottom edge meets the anchor (minus offset). On resize/layout change,
height + virtual-scroll viewport recalculate.

```html
<dg-table [bottomAnchor]="anchor" virtualScroll />
<div #anchor="dgTableBottomAnchor" [dgTableBottomAnchor]="12">Footer</div>
```

The `bottomAnchor` input accepts: `DgTableBottomAnchor` directive instance,
`ElementRef`, raw `HTMLElement`, or `null`.

#### Pagination patterns
- Client: pass full data via `value`, set `pagination="client"`. Table slices
  internally based on `currentPage`/`pageSize`.
- Server: parent fetches by event. Set `pagination="server"`, bind
  `[totalRecords]`, listen to `(pageChange)`. Parent sets new `value` for
  the page.
- Cursor: id-pivot. Set `pagination="cursor"`, `cursorField="id"`, listen
  to `(cursorChange)`. Event `direction: 'first'|'prev'|'next'` and
  `cursor` = the field value of last/first displayed row (or `null` for
  first).
  Parent controls `cursorPrevDisabled` / `cursorNextDisabled` based on
  fetched data state.

## Forms integration

`DgInputText` and `DgDropdown` implement `ControlValueAccessor` via
`NG_VALUE_ACCESSOR` provider with `forwardRef` (no `inject(NgControl)` —
that creates a circular DI). Compatible with `[(ngModel)]`,
`[formControl]`, and the new signal-style `[(value)]` two-way binding.

## Key patterns / lessons

- Signal inputs everywhere (`input()`, `model()`, `output()`).
- ChangeDetectionStrategy.OnPush on all components.
- `ng-template` directives capture `TemplateRef` and are queried via
  `contentChild()` (inline) or via a registry service / inputs (cross-component).
- Body-portal (`appendTo='body'`): use `effect()` with cleanup; explicitly
  `document.body.removeChild(el)` on cleanup so the panel never leaks
  when the dropdown closes.
- For dynamic component creation (DialogService + DialogHost), child uses
  `slot.createComponent(component, { injector })` with a child Injector
  that inherits the host's element injector — so `DgDialogTemplateRegistry`
  provided at the host level reaches directives in the child component.

## Demo app structure

`src/app/app.ts` is a thin layout shell — sidebar with `<dg-nav-menu>` (driven
by `routerLink` items) + `<router-outlet>`. Each component has its own
lazy-loaded page under `src/app/pages/`:

- `home/home-page.ts` — landing card grid linking to each component
- `buttons/buttons-page.ts` — DgButton severities / variants / sizes / loading
- `input-text/input-text-page.ts` — sizes, variants, two-way + reactive form
- `dialog/dialog-page.ts` — inline + service-driven dialogs (uses `demo-dialogs/`)
- `dropdown/dropdown-page.ts` — filter, body-portal, panelWidth, custom templates
- `table/table-page.ts` — virtual scroll, pagination (client/server/cursor),
  bottomAnchor, paginator slot customization
- `nav-menu/nav-menu-page.ts` — orientation / variant / size showcase

Routes in `src/app/app.routes.ts` use `loadComponent` for code-splitting (each
page becomes its own chunk). The shell tracks the current URL via
`Router.events` and binds it to the sidebar nav's `value` so the active page
highlights as you navigate. `App` uses `ViewEncapsulation.None` so the shared
demo styles (`.row`, `.hint`, `.status-badge`, `.anchor-panel`,
`.full-custom-pager`, etc.) in `app.scss` cascade into every page template.

The `demo-dialogs/` folder still contains 3 components opened via
`DgDialogService` showing data-only, result-via-close, and live-output via
`componentInstance` outputs — consumed by `dialog-page.ts`.
