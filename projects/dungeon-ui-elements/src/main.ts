import { createApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection, type Type } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import {
  DgAutocomplete,
  DgButton,
  DgCheckbox,
  DgDatepicker,
  DgDialog,
  DgDropdown,
  DgIconField,
  DgInputGroup,
  DgInputGroupAddon,
  DgInputIcon,
  DgInputNumber,
  DgInputText,
  DgNavMenu,
  DgPaginator,
  DgRadio,
  DgTable,
} from 'dungeon-ui';

const elements: Array<readonly [string, Type<unknown>]> = [
  ['dg-button', DgButton],
  ['dg-input-text', DgInputText],
  ['dg-input-number', DgInputNumber],
  ['dg-input-group', DgInputGroup],
  ['dg-input-group-addon', DgInputGroupAddon],
  ['dg-icon-field', DgIconField],
  ['dg-input-icon', DgInputIcon],
  ['dg-dialog', DgDialog],
  ['dg-table', DgTable as Type<unknown>],
  ['dg-paginator', DgPaginator],
  ['dg-checkbox', DgCheckbox as Type<unknown>],
  ['dg-radio', DgRadio as Type<unknown>],
  ['dg-dropdown', DgDropdown as Type<unknown>],
  ['dg-autocomplete', DgAutocomplete as Type<unknown>],
  ['dg-datepicker', DgDatepicker],
  ['dg-nav-menu', DgNavMenu],
];

createApplication({
  providers: [provideZonelessChangeDetection()],
}).then((app) => {
  for (const [tag, cmp] of elements) {
    if (customElements.get(tag)) continue;
    customElements.define(tag, createCustomElement(cmp, { injector: app.injector }));
  }
});
