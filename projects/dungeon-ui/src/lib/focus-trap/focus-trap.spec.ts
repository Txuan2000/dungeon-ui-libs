import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DgFocusTrap } from './focus-trap';

@Component({
  imports: [DgFocusTrap],
  template: `
    <div dgFocusTrap [dgFocusTrapDisabled]="disabled">
      <button id="b1">One</button>
      <button id="b2">Two</button>
      <button id="b3">Three</button>
    </div>
  `,
})
class HostComponent {
  disabled = false;
}

describe('DgFocusTrap', () => {
  it('inserts two sentinels around the host on init', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement.querySelector('[dgFocusTrap]');
    const sentinels = host.querySelectorAll('[data-dg-focus-trap-sentinel]');
    expect(sentinels.length).toBe(2);
    expect(sentinels[0].getAttribute('data-dg-focus-trap-sentinel')).toBe('first');
    expect(sentinels[1].getAttribute('data-dg-focus-trap-sentinel')).toBe('last');
    // Both should be tab-focusable.
    expect((sentinels[0] as HTMLElement).getAttribute('tabindex')).toBe('0');
    expect((sentinels[1] as HTMLElement).getAttribute('tabindex')).toBe('0');
  });

  it('removes sentinels when disabled', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement.querySelector('[dgFocusTrap]');
    expect(host.querySelectorAll('[data-dg-focus-trap-sentinel]').length).toBe(2);

    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(host.querySelectorAll('[data-dg-focus-trap-sentinel]').length).toBe(0);
  });

  it('redirects focus from last sentinel to first focusable (Tab loop)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);

    const host: HTMLElement = fixture.nativeElement.querySelector('[dgFocusTrap]');
    const lastSentinel = host.querySelector('[data-dg-focus-trap-sentinel="last"]') as HTMLElement;
    const firstFocusable = host.querySelector('#b1') as HTMLButtonElement;

    lastSentinel.focus();
    expect(document.activeElement).toBe(firstFocusable);

    document.body.removeChild(fixture.nativeElement);
  });

  it('redirects focus from first sentinel to last focusable (Shift+Tab)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);

    const host: HTMLElement = fixture.nativeElement.querySelector('[dgFocusTrap]');
    const firstSentinel = host.querySelector('[data-dg-focus-trap-sentinel="first"]') as HTMLElement;
    const lastFocusable = host.querySelector('#b3') as HTMLButtonElement;

    firstSentinel.focus();
    expect(document.activeElement).toBe(lastFocusable);

    document.body.removeChild(fixture.nativeElement);
  });
});
