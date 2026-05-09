# DungeonUi

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.0.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the library, run:

```bash
ng build dungeon-ui
```

This command will compile your project, and the build artifacts will be placed in the `dist/` directory.

### Publishing the Library

Once the project is built, you can publish your library by following these steps:

1. Navigate to the `dist` directory:

   ```bash
   cd dist/dungeon-ui
   ```

2. Run the `npm publish` command to publish your library to the npm registry:
   ```bash
   npm publish
   ```

## Loading from CDN

Library này có 3 cách consume từ CDN, từ đơn giản nhất đến linh hoạt nhất:

**1. Web Components (host non-Angular)** — đơn giản nhất, 1 script + dùng
`<dg-*>` như HTML thường, không cần Angular knowledge:

```html
<script type="module" src="https://dungeon-ui-elements.pages.dev/main.js"></script>
<dg-button label="Save" severity="primary"></dg-button>
```

Live demo: [`https://dungeon-ui.pages.dev/elements-example.html`](https://dungeon-ui.pages.dev/elements-example.html).
Limitations: 2 directives (`[dgInputMask]`, `[dgFocusTrap]`) và Angular forms
binding (`[formControl]`, `[(ngModel)]`) không support. Bundle ~150KB gzipped
(kèm Angular runtime).

**2. Angular CLI app** — install thẳng từ tarball thay vì npm registry:

```bash
npm install https://dungeon-ui-cdn.pages.dev/dungeon-ui-0.0.3.tgz
```

Full Angular API (forms, directives, services). Bundler tree-shake bình thường.

**3. Plain HTML + import map** (Angular-savvy, no bundler) — FESM2022 ESM với
import map mapping `@angular/*` qua esm.sh. Xem live demo
[`https://dungeon-ui.pages.dev/cdn-example.html`](https://dungeon-ui.pages.dev/cdn-example.html)
và source [`public/cdn-example.html`](../../public/cdn-example.html). Setup
phức tạp hơn (~10 import map entries + `@angular/compiler` JIT) nhưng giữ full
Angular runtime API.

Hướng dẫn đầy đủ (3 use cases, property/event API cho web components, caveats)
trong [`docs/dungeon-ui-overview.md` → Loading from CDN](../../docs/dungeon-ui-overview.md#loading-from-cdn).

Publish version mới:

- `make cdn-deploy` → push FESM2022 + tarball lên `dungeon-ui-cdn.pages.dev`.
- `make elements-deploy` → push web components bundle lên `dungeon-ui-elements.pages.dev`.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
