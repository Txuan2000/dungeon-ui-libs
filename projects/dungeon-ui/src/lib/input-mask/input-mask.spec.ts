import { describe, expect, it } from 'vitest';
import {
  applyMask,
  buildSlotTemplate,
  deleteBackward,
  deleteForward,
  firstSlotPos,
  insertString,
  isAllSlots,
  padToMask,
  snapToToken,
} from './input-mask';

describe('applyMask (append mode)', () => {
  it('inserts separators automatically as digits arrive', () => {
    expect(applyMask('1', '99/99/9999')).toBe('1');
    expect(applyMask('12', '99/99/9999')).toBe('12');
    expect(applyMask('123', '99/99/9999')).toBe('12/3');
    expect(applyMask('12345678', '99/99/9999')).toBe('12/34/5678');
  });

  it('preserves user-typed separators', () => {
    expect(applyMask('12/3', '99/99/9999')).toBe('12/3');
    expect(applyMask('12/34/2024', '99/99/9999')).toBe('12/34/2024');
  });

  it('strips chars that do not match the token type', () => {
    expect(applyMask('1a2', '99/99/9999')).toBe('12');
    expect(applyMask('abc', '99/99/9999')).toBe('');
  });

  it('handles letter and any tokens', () => {
    expect(applyMask('AB12', 'aa-99')).toBe('AB-12');
    expect(applyMask('a1*', '*** ***')).toBe('a1');
  });
});

describe('slot-mode helpers', () => {
  it('builds an empty slot template', () => {
    expect(buildSlotTemplate('99/99/9999', '_')).toBe('__/__/____');
    expect(buildSlotTemplate('(999) 999-9999', '_')).toBe('(___) ___-____');
  });

  it('pads partial values up to mask length', () => {
    expect(padToMask('12', '99/99/9999', '_')).toBe('12/__/____');
    expect(padToMask('', '99/99/9999', '_')).toBe('__/__/____');
  });

  it('detects an all-slots value', () => {
    expect(isAllSlots('__/__/____', '99/99/9999', '_')).toBe(true);
    expect(isAllSlots('1_/__/____', '99/99/9999', '_')).toBe(false);
  });

  it('finds the first slot position', () => {
    expect(firstSlotPos('__/__/____', '99/99/9999', '_')).toBe(0);
    expect(firstSlotPos('12/__/____', '99/99/9999', '_')).toBe(3); // skip '/'
    expect(firstSlotPos('12/34/2024', '99/99/9999', '_')).toBe(10); // all filled
  });

  it('snaps a cursor onto the next token position', () => {
    expect(snapToToken(0, '99/99/9999')).toBe(0);
    expect(snapToToken(2, '99/99/9999')).toBe(3); // pos 2 is '/'
    expect(snapToToken(5, '99/99/9999')).toBe(6); // pos 5 is '/'
  });
});

describe('slot-mode insertString (overwrite)', () => {
  const mask = '99/99/9999';
  const slot = '_';
  const empty = '__/__/____';

  it('writes a digit at the cursor and skips separators', () => {
    expect(insertString(empty, '1', 0, 0, mask, slot)).toEqual({ value: '1_/__/____', nextPos: 1 });
    expect(insertString('1_/__/____', '2', 1, 1, mask, slot)).toEqual({ value: '12/__/____', nextPos: 3 });
    expect(insertString('12/__/____', '3', 3, 3, mask, slot)).toEqual({ value: '12/3_/____', nextPos: 4 });
  });

  it('drops chars that do not match the token', () => {
    expect(insertString(empty, 'a', 0, 0, mask, slot)).toEqual({ value: '__/__/____', nextPos: 0 });
  });

  it('overwrites a range selection then inserts', () => {
    const r = insertString('12/34/5678', '99', 0, 5, mask, slot);
    expect(r.value).toBe('99/__/5678');
  });
});

describe('slot-mode deleteBackward / deleteForward', () => {
  const mask = '99/99/9999';
  const slot = '_';

  it('backspace replaces previous token with slot', () => {
    expect(deleteBackward('12/__/____', 3, 3, mask, slot)).toEqual({ value: '1_/__/____', nextPos: 1 });
  });

  it('backspace skips separators', () => {
    // Cursor right after a separator '/' (between '2' and '3'): backspace
    // should jump back over the '/' and clear the digit before it.
    expect(deleteBackward('12/3_/____', 4, 4, mask, slot)).toEqual({ value: '12/__/____', nextPos: 3 });
  });

  it('delete clears at cursor', () => {
    expect(deleteForward('12/34/5678', 3, 3, mask, slot)).toEqual({ value: '12/_4/5678', nextPos: 3 });
  });
});
