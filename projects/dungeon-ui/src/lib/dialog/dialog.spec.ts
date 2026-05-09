import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DgDialog } from './dialog';

describe('DgDialog', () => {
  it('does not show the dialog when visible is false', () => {
    const fixture = TestBed.createComponent(DgDialog);
    fixture.detectChanges();

    const dialog: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');
    expect(dialog.open).toBe(false);
  });

  it('renders the header text', () => {
    const fixture = TestBed.createComponent(DgDialog);
    fixture.componentRef.setInput('header', 'Confirm action');
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.dg-dialog__title');
    expect(title.textContent.trim()).toContain('Confirm action');
  });

  it('hides close button when closable=false', () => {
    const fixture = TestBed.createComponent(DgDialog);
    fixture.componentRef.setInput('closable', false);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.dg-dialog__close');
    expect(closeBtn).toBeNull();
  });

  it('reflects position via data attribute', () => {
    const fixture = TestBed.createComponent(DgDialog);
    fixture.componentRef.setInput('position', 'top');
    fixture.detectChanges();

    const dialog: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');
    expect(dialog.getAttribute('data-position')).toBe('top');
  });

  it('close() flips visible to false', () => {
    const fixture = TestBed.createComponent(DgDialog);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    fixture.componentInstance.close();
    fixture.detectChanges();

    expect(fixture.componentInstance.visible()).toBe(false);
  });
});
