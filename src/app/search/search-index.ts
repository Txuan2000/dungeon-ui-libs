export interface SearchEntry {
  /** Section title shown in the result row. */
  title: string;
  /** Parent page label shown as breadcrumb. */
  page: string;
  /** Route to navigate to when this entry is selected. */
  route: string;
  /** Optional extra tokens (Vietnamese diacritics, code names, synonyms). */
  keywords?: string;
  /** Short snippet shown under the title in the result row. */
  hint?: string;
}

/**
 * Static search index. Covers each demo page + its named sections so users
 * can jump from the search box to the relevant content.
 *
 * Curated by hand — keep it short. Add a row when a new section is meaningful
 * for navigation. Don't try to mirror every paragraph.
 */
export const SEARCH_INDEX: readonly SearchEntry[] = [
  { title: 'Trang chủ', page: 'Home', route: '/', keywords: 'home landing index' },

  // --- Button ---
  {
    title: 'Severities',
    page: 'Button',
    route: '/buttons',
    keywords: 'severity primary secondary success info warn danger help contrast màu',
    hint: 'primary · secondary · success · info · warn · danger · help · contrast',
  },
  {
    title: 'Variants & Sizes',
    page: 'Button',
    route: '/buttons',
    keywords: 'solid outlined text link small large rounded loading',
    hint: 'solid · outlined · text · link · small · large · rounded · loading',
  },

  // --- Input Text ---
  { title: 'Sizes', page: 'Input Text', route: '/input-text', keywords: 'small normal large' },
  {
    title: 'Variants & states',
    page: 'Input Text',
    route: '/input-text',
    keywords: 'outlined filled invalid disabled readonly fluid',
    hint: 'outlined · filled · invalid · disabled · readonly · fluid',
  },
  {
    title: 'Two-way binding (signal)',
    page: 'Input Text',
    route: '/input-text',
    keywords: 'two-way model value signal',
  },
  {
    title: 'Reactive form (CVA)',
    page: 'Input Text',
    route: '/input-text',
    keywords: 'formControl reactive validators email ControlValueAccessor',
  },

  // --- Input Mask ---
  {
    title: 'Tokens (9 / a / *)',
    page: 'Input Mask',
    route: '/input-mask',
    keywords: 'token digit letter alphanumeric pattern',
  },
  {
    title: 'Slot mode — click vào vị trí để sửa',
    page: 'Input Mask',
    route: '/input-mask',
    keywords: 'slot overwrite click position dgInputMaskSlot template _',
    hint: 'fill __/__/____ rồi user click slot bất kỳ',
  },
  {
    title: 'Date 99/99/9999',
    page: 'Input Mask',
    route: '/input-mask',
    keywords: 'date dd MM yyyy mask ngày',
  },
  {
    title: 'Phone (VN / US / international)',
    page: 'Input Mask',
    route: '/input-mask',
    keywords: 'phone tel điện thoại VN US international',
  },
  {
    title: 'Credit card & CVV',
    page: 'Input Mask',
    route: '/input-mask',
    keywords: 'credit card cvv expiry số thẻ',
  },
  {
    title: 'License plate (letter + digit)',
    page: 'Input Mask',
    route: '/input-mask',
    keywords: 'license plate biển số xe motor car',
  },
  {
    title: 'IPv4 / MAC address',
    page: 'Input Mask',
    route: '/input-mask',
    keywords: 'ip ipv4 mac address network',
  },
  {
    title: 'CCCD / MST (VN)',
    page: 'Input Mask',
    route: '/input-mask',
    keywords: 'cccd citizen id mst tax code Việt Nam',
  },
  {
    title: 'Reactive form + Validators.pattern',
    page: 'Input Mask',
    route: '/input-mask',
    keywords: 'formControl reactive validators pattern regex',
  },

  // --- Dialog ---
  {
    title: 'Inline dialogs',
    page: 'Dialog',
    route: '/dialog',
    keywords: 'basic dismissable mask top non-modal confirm position',
  },
  {
    title: 'Dialog Service (programmatic)',
    page: 'Dialog',
    route: '/dialog',
    keywords: 'open service DemoConfirm DemoForm DemoInfo afterClosed componentInstance',
    hint: 'DgDialogService.open() · afterClosed$ · componentInstance',
  },
  {
    title: 'Focus trap & autoFocus',
    page: 'Dialog',
    route: '/dialog',
    keywords: 'tab focus trap autoFocus sentinel',
  },

  // --- Dropdown ---
  {
    title: 'Basic dropdown',
    page: 'Dropdown',
    route: '/dropdown',
    keywords: 'options optionLabel optionValue filter clearable invalid CVA',
  },
  {
    title: 'appendTo body — escape clipped',
    page: 'Dropdown',
    route: '/dropdown',
    keywords: 'portal body overflow clipped',
    hint: 'render panel into <body> to escape overflow:hidden parents',
  },
  {
    title: 'panelWidth (host / auto / explicit)',
    page: 'Dropdown',
    route: '/dropdown',
    keywords: 'panel width host auto explicit',
  },

  // --- Checkbox ---
  {
    title: 'Binary mode (default)',
    page: 'Checkbox',
    route: '/checkbox',
    keywords: 'checkbox binary boolean trueValue falseValue',
    hint: 'value là true/false hoặc trueValue/falseValue',
  },
  {
    title: 'Multi (group) mode',
    page: 'Checkbox',
    route: '/checkbox',
    keywords: 'checkbox group array binary false checkboxValue selected list',
    hint: 'binary=false → bound value là array; mỗi checkbox đóng góp checkboxValue',
  },
  {
    title: 'Indeterminate (parent of tree)',
    page: 'Checkbox',
    route: '/checkbox',
    keywords: 'indeterminate mixed parent tree select all permissions',
  },
  {
    title: 'Custom icon (dgCheckboxIcon)',
    page: 'Checkbox',
    route: '/checkbox',
    keywords: 'icon template emoji custom check mark',
  },
  {
    title: 'Reactive form (CVA)',
    page: 'Checkbox',
    route: '/checkbox',
    keywords: 'formControl reactive CVA newsletter',
  },

  // --- Radio ---
  {
    title: 'Group qua [(value)] — chia sẻ binding',
    page: 'Radio',
    route: '/radio',
    keywords: 'radio group name shared value model two-way single select chọn 1',
    hint: 'mọi radio cùng [(value)] tự đồng bộ — không cần wrapper component',
  },
  {
    title: 'States — disabled / readonly / invalid',
    page: 'Radio',
    route: '/radio',
    keywords: 'disabled readonly invalid state',
  },
  {
    title: 'Sizes & variants',
    page: 'Radio',
    route: '/radio',
    keywords: 'size small normal large variant outlined filled',
  },
  {
    title: 'Custom icon (dgRadioIcon)',
    page: 'Radio',
    route: '/radio',
    keywords: 'icon template emoji custom dot star',
  },
  {
    title: 'Reactive form (CVA)',
    page: 'Radio',
    route: '/radio',
    keywords: 'formControl reactive CVA plan',
  },

  // --- Autocomplete ---
  {
    title: 'Async suggestions (complete event)',
    page: 'Autocomplete',
    route: '/autocomplete',
    keywords: 'autocomplete suggest complete query minLength delay debounce search',
    hint: '(complete) bắn ra query — bind suggestions theo kết quả search',
  },
  {
    title: 'Dropdown trigger + custom item template',
    page: 'Autocomplete',
    route: '/autocomplete',
    keywords: 'dropdown button item template dgAutocompleteOption empty',
  },
  {
    title: 'forceSelection + reactive form',
    page: 'Autocomplete',
    route: '/autocomplete',
    keywords: 'forceSelection blur validate formControl CVA',
  },
  {
    title: 'appendTo body — escape clipped',
    page: 'Autocomplete',
    route: '/autocomplete',
    keywords: 'portal body overflow clipped',
  },

  // --- Input Number ---
  {
    title: 'Cơ bản (decimal)',
    page: 'Input Number',
    route: '/input-number',
    keywords: 'number decimal locale grouping định dạng số',
  },
  {
    title: 'Currency / Percent / Prefix-Suffix',
    page: 'Input Number',
    route: '/input-number',
    keywords: 'currency USD VND percent prefix suffix mode tiền tệ phần trăm',
  },
  {
    title: 'Min / Max / Step + Arrow keys',
    page: 'Input Number',
    route: '/input-number',
    keywords: 'min max step arrow up down home end clamp',
  },
  {
    title: 'Spinner buttons (stacked / horizontal)',
    page: 'Input Number',
    route: '/input-number',
    keywords: 'spinner buttons increment decrement layout',
  },
  {
    title: 'Reactive form (CVA)',
    page: 'Input Number',
    route: '/input-number',
    keywords: 'formControl reactive Validators.min currency',
  },

  // --- Input Group ---
  {
    title: 'Cơ bản — addon hai bên',
    page: 'Input Group',
    route: '/input-group',
    keywords: 'addon prefix suffix icon left right',
  },
  {
    title: 'Search field (input + button)',
    page: 'Input Group',
    route: '/input-group',
    keywords: 'search button submit query tìm kiếm',
  },
  {
    title: 'Currency (addon + input-number)',
    page: 'Input Group',
    route: '/input-group',
    keywords: 'currency VND USD percent số tiền',
  },
  {
    title: 'Date / dropdown / mask đều ghép được',
    page: 'Input Group',
    route: '/input-group',
    keywords: 'date dropdown mask phone telephone',
  },

  // --- Icon Field ---
  {
    title: 'Search field (icon trái)',
    page: 'Icon Field',
    route: '/icon-field',
    keywords: 'search icon left magnifying glass tìm kiếm',
  },
  {
    title: 'Icon bên phải',
    page: 'Icon Field',
    route: '/icon-field',
    keywords: 'icon right email user',
  },
  {
    title: 'Hỗn hợp icon — password / phone / date',
    page: 'Icon Field',
    route: '/icon-field',
    keywords: 'password lock phone tel date calendar',
  },
  {
    title: 'Cộng được với input-number / dropdown',
    page: 'Icon Field',
    route: '/icon-field',
    keywords: 'input-number dropdown currency dollar',
  },

  // --- Datepicker ---
  {
    title: 'Cơ bản (single, popup)',
    page: 'Datepicker',
    route: '/datepicker',
    keywords: 'date single popup format dd MM yyyy ngày',
  },
  {
    title: 'Range',
    page: 'Datepicker',
    route: '/datepicker',
    keywords: 'range start end khoảng từ đến',
  },
  {
    title: 'Inline calendar',
    page: 'Datepicker',
    route: '/datepicker',
    keywords: 'inline always-visible week numbers số tuần',
  },
  {
    title: 'Chọn tháng / năm (3 view)',
    page: 'Datepicker',
    route: '/datepicker',
    keywords: 'month year picker view chọn tháng năm decade',
  },
  {
    title: 'Min / Max + disabled',
    page: 'Datepicker',
    route: '/datepicker',
    keywords: 'minDate maxDate disabledDays disabledDates constraints giới hạn cuối tuần',
  },
  {
    title: 'Reactive form (CVA)',
    page: 'Datepicker',
    route: '/datepicker',
    keywords: 'formControl reactive CVA filled small',
  },
  {
    title: 'appendTo body — escape clipped',
    page: 'Datepicker',
    route: '/datepicker',
    keywords: 'portal overflow body',
  },

  // --- Table ---
  {
    title: 'Pagination FE (client)',
    page: 'Table',
    route: '/table',
    keywords: 'pagination client pageSize pageSizeOptions',
  },
  {
    title: 'Pagination BE (server)',
    page: 'Table',
    route: '/table',
    keywords: 'pagination server pageChange totalRecords loading',
  },
  {
    title: 'Pagination cursor',
    page: 'Table',
    route: '/table',
    keywords: 'cursor id pivot direction prev next first',
  },
  {
    title: 'bottomAnchor (auto fit)',
    page: 'Table',
    route: '/table',
    keywords: 'anchor resize observer height',
  },
  {
    title: 'Paginator: i18n labels',
    page: 'Table',
    route: '/table',
    keywords: 'showingLabel ofLabel rowsLabel emptyLabel i18n',
  },
  {
    title: 'Paginator: slot order',
    page: 'Table',
    route: '/table',
    keywords: 'slotOrder info nav pageSize',
  },
  {
    title: 'Paginator: customize slots',
    page: 'Table',
    route: '/table',
    keywords: 'dgPaginatorInfo dgPaginatorNav dgPaginatorPageSize template',
  },
  {
    title: 'Paginator: full replace (dgTablePaginator)',
    page: 'Table',
    route: '/table',
    keywords: 'dgTablePaginator template replace context',
  },
  {
    title: 'Virtual scroll',
    page: 'Table',
    route: '/table',
    keywords: 'virtualScroll 100k rows scrollToIndex bufferSize',
  },

  // --- Nav Menu ---
  { title: 'Horizontal', page: 'Nav Menu', route: '/nav-menu' },
  {
    title: 'Pills (click to expand)',
    page: 'Nav Menu',
    route: '/nav-menu',
    keywords: 'pills click autoDisplay false',
  },
  { title: 'Tabs', page: 'Nav Menu', route: '/nav-menu' },
  {
    title: 'Vertical (sidebar)',
    page: 'Nav Menu',
    route: '/nav-menu',
    keywords: 'vertical sidebar',
  },

  // --- Focus Trap ---
  {
    title: 'Cơ bản — Tab loop trong container',
    page: 'Focus Trap',
    route: '/focus-trap',
    keywords: 'tab focus trap container basic dgFocusTrap sentinel',
  },
  {
    title: 'Toggle disabled',
    page: 'Focus Trap',
    route: '/focus-trap',
    keywords: 'dgFocusTrapDisabled toggle',
  },
  {
    title: 'Programmatic focusFirst / focusLast',
    page: 'Focus Trap',
    route: '/focus-trap',
    keywords: 'viewChild exportAs ref method',
  },
];
