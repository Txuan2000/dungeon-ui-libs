import { Directive, ElementRef, HostListener, computed, inject, input } from '@angular/core';

/**
 * Input mask tokens supported by `[dgInputMask]`:
 *
 * | Token | Matches            |
 * |-------|--------------------|
 * | `9`   | digit `[0-9]`      |
 * | `a`   | letter `[A-Za-z]`  |
 * | `*`   | alphanumeric       |
 *
 * Any other character in the mask is a literal separator (e.g. `/`, `-`,
 * space). Examples:
 *
 * - Date `dd/MM/yyyy` → mask `99/99/9999`
 * - Phone US → mask `(999) 999-9999`
 * - License plate VN → mask `99-aa 999.99`
 *
 * ### Two modes
 *
 * **Append mode** (default — `dgInputMaskSlot=""`): user types from the
 * left, the directive auto-inserts separators between tokens. Simple, low
 * surface area; fits forms where users always type the whole value.
 *
 * **Slot mode** (`dgInputMaskSlot="_"` or any single char): the field is
 * filled with a template like `__/__/____`. Each token position is
 * occupied by the slot character; the user clicks into any position and
 * types — keystrokes overwrite the slot at the cursor (skipping
 * separators automatically). Backspace / Delete restore the slot
 * character. Pasting fills slots from the cursor onwards. This is the
 * PrimeNG `slotChar` behavior — useful when partial editing is common
 * (e.g. correcting a single digit in the middle of a date).
 *
 * The directive operates on the underlying `<input>`'s `.value`. It
 * resolves the input element from its host: either the host itself
 * (`<input dgInputMask=…>`) or the first descendant `<input>`
 * (`<dg-input-text dgInputMask=…>`).
 */
@Directive({
  selector: '[dgInputMask]',
  standalone: true,
})
export class DgInputMask {
  readonly mask = input.required<string>({ alias: 'dgInputMask' });
  /**
   * Single character that fills empty token positions when set. Empty
   * string (default) keeps the simpler append-mode behavior.
   */
  readonly slotChar = input('', { alias: 'dgInputMaskSlot' });

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Whether slot (overwrite) mode is enabled — `slotChar` length === 1. */
  protected readonly slotMode = computed<boolean>(() => this.slotChar().length === 1);

  // ---- DOM event handling ----

  @HostListener('focusin', ['$event'])
  protected onFocusIn(event: FocusEvent): void {
    if (!this.slotMode()) return;
    const input = this.resolveInput(event.target);
    if (!input) return;
    if (input.value === '') {
      input.value = buildSlotTemplate(this.mask(), this.slotChar());
    } else {
      input.value = padToMask(input.value, this.mask(), this.slotChar());
    }
    queueMicrotask(() => {
      const pos = firstSlotPos(input.value, this.mask(), this.slotChar());
      try { input.setSelectionRange(pos, pos); } catch { /* ignore */ }
    });
  }

  @HostListener('focusout', ['$event'])
  protected onFocusOut(event: FocusEvent): void {
    if (!this.slotMode()) return;
    const input = this.resolveInput(event.target);
    if (!input) return;
    if (isAllSlots(input.value, this.mask(), this.slotChar())) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  @HostListener('keydown', ['$event'])
  protected onKeyDown(event: KeyboardEvent): void {
    if (!this.slotMode()) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const input = this.resolveInput(event.target);
    if (!input) return;

    const key = event.key;
    // Let navigation / commit keys bubble through.
    if (
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'ArrowUp' ||
      key === 'ArrowDown' ||
      key === 'Home' ||
      key === 'End' ||
      key === 'Tab' ||
      key === 'Escape' ||
      key === 'Enter'
    ) {
      return;
    }

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? start;

    if (key === 'Backspace') {
      event.preventDefault();
      this.applyEdit(input, deleteBackward(input.value, start, end, this.mask(), this.slotChar()));
      return;
    }

    if (key === 'Delete') {
      event.preventDefault();
      this.applyEdit(input, deleteForward(input.value, start, end, this.mask(), this.slotChar()));
      return;
    }

    if (key.length === 1) {
      event.preventDefault();
      this.applyEdit(input, insertString(input.value, key, start, end, this.mask(), this.slotChar()));
    }
  }

  @HostListener('input', ['$event'])
  protected onInput(event: Event): void {
    const input = this.resolveInput(event.target);
    if (!input) return;

    if (this.slotMode()) {
      // In slot mode, edits are routed through keydown. The native `input`
      // event still fires for IME / autofill — re-pad to keep length stable.
      if (input.value === '') {
        input.value = buildSlotTemplate(this.mask(), this.slotChar());
      } else if (input.value.length !== this.mask().length) {
        input.value = padToMask(input.value, this.mask(), this.slotChar());
      }
      return;
    }

    // Append mode (legacy).
    const before = input.value;
    const cursor = input.selectionStart ?? before.length;
    const masked = applyMask(before, this.mask());
    if (masked !== before) {
      input.value = masked;
      const grew = masked.length > before.length;
      const wasAtEnd = cursor >= before.length;
      const newPos = grew && wasAtEnd ? masked.length : Math.min(masked.length, cursor);
      try { input.setSelectionRange(newPos, newPos); } catch { /* ignore */ }
    }
  }

  @HostListener('paste', ['$event'])
  protected onPaste(event: ClipboardEvent): void {
    const input = this.resolveInput(event.target);
    if (!input) return;

    if (this.slotMode()) {
      event.preventDefault();
      const data = event.clipboardData?.getData('text') ?? '';
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? start;
      // Make sure we have a full template before overlaying.
      if (input.value.length !== this.mask().length) {
        input.value = input.value === ''
          ? buildSlotTemplate(this.mask(), this.slotChar())
          : padToMask(input.value, this.mask(), this.slotChar());
      }
      this.applyEdit(input, insertString(input.value, data, start, end, this.mask(), this.slotChar()));
      return;
    }

    // Append mode — let native paste happen, then re-mask.
    queueMicrotask(() => {
      const masked = applyMask(input.value, this.mask());
      if (masked !== input.value) input.value = masked;
    });
  }

  @HostListener('click', ['$event'])
  protected onClick(event: MouseEvent): void {
    if (!this.slotMode()) return;
    const input = this.resolveInput(event.target);
    if (!input) return;
    queueMicrotask(() => {
      // Empty field (all slot chars) → caret to the very first token slot
      // so users always start typing at the beginning, regardless of where
      // they clicked. Without this, the browser's mousedown places the
      // caret at the click position which may land mid-template.
      if (isAllSlots(input.value, this.mask(), this.slotChar())) {
        try { input.setSelectionRange(0, 0); } catch { /* ignore */ }
        return;
      }
      // Otherwise snap caret onto the nearest token position so clicking
      // on a separator doesn't strand the user between slots.
      const pos = input.selectionStart ?? 0;
      const snapped = snapToToken(pos, this.mask());
      if (snapped !== pos) {
        try { input.setSelectionRange(snapped, snapped); } catch { /* ignore */ }
      }
    });
  }

  // ---- helpers ----

  private resolveInput(target: EventTarget | null): HTMLInputElement | null {
    if (target instanceof HTMLInputElement) return target;
    const host = this.hostRef.nativeElement;
    if (host instanceof HTMLInputElement) return host;
    return host.querySelector('input');
  }

  private applyEdit(input: HTMLInputElement, edit: { value: string; nextPos: number }): void {
    if (edit.value !== input.value) {
      input.value = edit.value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    try { input.setSelectionRange(edit.nextPos, edit.nextPos); } catch { /* ignore */ }
  }
}

// ============================================================================
// Pure helpers — exported for unit tests
// ============================================================================

/** Append-mode mask: drop chars that don't fit, auto-insert separators. */
export function applyMask(rawInput: string, mask: string): string {
  const chars = Array.from(rawInput);
  let chIdx = 0;
  let out = '';

  for (const m of mask) {
    if (chIdx >= chars.length) break;

    if (isToken(m)) {
      while (chIdx < chars.length && !matchesToken(chars[chIdx], m)) chIdx++;
      if (chIdx >= chars.length) break;
      out += chars[chIdx++];
    } else {
      if (chars[chIdx] === m) chIdx++;
      out += m;
    }
  }

  return out;
}

/** Build the empty slot template for a mask, e.g. `__/__/____`. */
export function buildSlotTemplate(mask: string, slotChar: string): string {
  let out = '';
  for (const m of mask) out += isToken(m) ? slotChar : m;
  return out;
}

/** Pad/extend a partial value so it matches the mask shape. */
export function padToMask(value: string, mask: string, slotChar: string): string {
  let out = '';
  for (let i = 0; i < mask.length; i++) {
    if (i < value.length) {
      out += value[i];
    } else {
      out += isToken(mask[i]) ? slotChar : mask[i];
    }
  }
  return out;
}

/** True if every token position in `value` still holds the slot char. */
export function isAllSlots(value: string, mask: string, slotChar: string): boolean {
  if (value.length !== mask.length) return false;
  for (let i = 0; i < mask.length; i++) {
    if (isToken(mask[i]) && value[i] !== slotChar) return false;
  }
  return true;
}

/** Index of the first slot-char position; falls back to mask length. */
export function firstSlotPos(value: string, mask: string, slotChar: string): number {
  for (let i = 0; i < Math.min(value.length, mask.length); i++) {
    if (isToken(mask[i]) && value[i] === slotChar) return i;
  }
  return Math.min(value.length, mask.length);
}

/** Snap an arbitrary cursor position onto the next token slot. */
export function snapToToken(pos: number, mask: string): number {
  let p = Math.max(0, Math.min(pos, mask.length));
  while (p < mask.length && !isToken(mask[p])) p++;
  return p;
}

/** Slot-mode insert: overwrite at cursor; advance past separators. */
export function insertString(
  value: string,
  text: string,
  start: number,
  end: number,
  mask: string,
  slotChar: string,
): { value: string; nextPos: number } {
  // If a range is selected, clear it first.
  let cur = value;
  let pos = start;
  if (start !== end) {
    cur = clearRange(cur, start, end, mask, slotChar);
    pos = start;
  }

  for (const ch of text) {
    pos = snapToToken(pos, mask);
    if (pos >= mask.length) break;
    if (matchesToken(ch, mask[pos])) {
      cur = cur.substring(0, pos) + ch + cur.substring(pos + 1);
      pos = snapToToken(pos + 1, mask);
    }
    // else silently drop the char
  }
  return { value: cur, nextPos: pos };
}

/** Slot-mode backspace: replace previous token with slot, move caret there. */
export function deleteBackward(
  value: string,
  start: number,
  end: number,
  mask: string,
  slotChar: string,
): { value: string; nextPos: number } {
  if (start !== end) {
    return { value: clearRange(value, start, end, mask, slotChar), nextPos: start };
  }
  let p = start - 1;
  while (p >= 0 && !isToken(mask[p])) p--;
  if (p < 0) return { value, nextPos: 0 };
  return {
    value: value.substring(0, p) + slotChar + value.substring(p + 1),
    nextPos: p,
  };
}

/** Slot-mode delete (forward): replace token at cursor with slot. */
export function deleteForward(
  value: string,
  start: number,
  end: number,
  mask: string,
  slotChar: string,
): { value: string; nextPos: number } {
  if (start !== end) {
    return { value: clearRange(value, start, end, mask, slotChar), nextPos: start };
  }
  let p = snapToToken(start, mask);
  if (p >= mask.length) return { value, nextPos: start };
  return {
    value: value.substring(0, p) + slotChar + value.substring(p + 1),
    nextPos: start,
  };
}

function clearRange(value: string, start: number, end: number, mask: string, slotChar: string): string {
  let mid = '';
  for (let i = start; i < end; i++) {
    mid += isToken(mask[i]) ? slotChar : mask[i];
  }
  return value.substring(0, start) + mid + value.substring(end);
}

function isToken(ch: string): boolean {
  return ch === '9' || ch === 'a' || ch === '*';
}

function matchesToken(ch: string, token: string): boolean {
  switch (token) {
    case '9': return ch >= '0' && ch <= '9';
    case 'a': return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
    case '*': return (ch >= '0' && ch <= '9') || (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
    default: return false;
  }
}
