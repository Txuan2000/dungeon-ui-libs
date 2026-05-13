import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage), title: 'dungeon-ui' },
  { path: 'buttons', loadComponent: () => import('./pages/buttons/buttons-page').then((m) => m.ButtonsPage), title: 'Button · dungeon-ui' },
  { path: 'input-text', loadComponent: () => import('./pages/input-text/input-text-page').then((m) => m.InputTextPage), title: 'Input Text · dungeon-ui' },
  { path: 'input-mask', loadComponent: () => import('./pages/input-mask/input-mask-page').then((m) => m.InputMaskPage), title: 'Input Mask · dungeon-ui' },
  { path: 'input-number', loadComponent: () => import('./pages/input-number/input-number-page').then((m) => m.InputNumberPage), title: 'Input Number · dungeon-ui' },
  { path: 'input-group', loadComponent: () => import('./pages/input-group/input-group-page').then((m) => m.InputGroupPage), title: 'Input Group · dungeon-ui' },
  { path: 'icon', loadComponent: () => import('./pages/icon/icon-page').then((m) => m.IconPage), title: 'Icon · dungeon-ui' },
  { path: 'icon-field', loadComponent: () => import('./pages/icon-field/icon-field-page').then((m) => m.IconFieldPage), title: 'Icon Field · dungeon-ui' },
  { path: 'dialog', loadComponent: () => import('./pages/dialog/dialog-page').then((m) => m.DialogPage), title: 'Dialog · dungeon-ui' },
  { path: 'dropdown', loadComponent: () => import('./pages/dropdown/dropdown-page').then((m) => m.DropdownPage), title: 'Dropdown · dungeon-ui' },
  { path: 'autocomplete', loadComponent: () => import('./pages/autocomplete/autocomplete-page').then((m) => m.AutocompletePage), title: 'Autocomplete · dungeon-ui' },
  { path: 'checkbox', loadComponent: () => import('./pages/checkbox/checkbox-page').then((m) => m.CheckboxPage), title: 'Checkbox · dungeon-ui' },
  { path: 'radio', loadComponent: () => import('./pages/radio/radio-page').then((m) => m.RadioPage), title: 'Radio · dungeon-ui' },
  { path: 'datepicker', loadComponent: () => import('./pages/datepicker/datepicker-page').then((m) => m.DatepickerPage), title: 'Datepicker · dungeon-ui' },
  { path: 'table', loadComponent: () => import('./pages/table/table-page').then((m) => m.TablePage), title: 'Table · dungeon-ui' },
  { path: 'nav-menu', loadComponent: () => import('./pages/nav-menu/nav-menu-page').then((m) => m.NavMenuPage), title: 'Nav Menu · dungeon-ui' },
  { path: 'focus-trap', loadComponent: () => import('./pages/focus-trap/focus-trap-page').then((m) => m.FocusTrapPage), title: 'Focus Trap · dungeon-ui' },
  { path: 'html-to-pdf', loadComponent: () => import('./pages/html-to-pdf/html-to-pdf-page').then((m) => m.HtmlToPdfPage), title: 'HTML → PDF · dungeon-ui' },
  { path: '**', redirectTo: '' },
];
