'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAppStore } from '@/store/app-store';

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getClientOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function getServerOnline(): boolean {
  return true;
}

/**
 * Hydration-safe reactive `navigator.onLine` hook for Offline "Airplane Mode" proof pills.
 */
export function useLiveOnlineStatus(): boolean {
  return useSyncExternalStore(subscribeOnline, getClientOnline, getServerOnline);
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'OPTION') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('button, a, [role="button"], summary, [role="dialog"]'));
}

/**
 * Global pro keyboard shortcut dispatcher mounted once per active tool page:
 * - Cmd/Ctrl+O: trigger active workspace file picker
 * - Cmd/Ctrl+S: prevent browser Save dialog & click active Download button
 * - Esc: reset active tool workspace
 * - Spacebar (hold): broadcast `pp:compare-original` so workspaces preview the original input
 */
export function useGlobalToolShortcuts() {
  useEffect(() => {
    let spaceHeld = false;

    const emitCompare = (active: boolean) => {
      window.dispatchEvent(new CustomEvent('pp:compare-original', { detail: { active } }));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const lowerKey = e.key.toLowerCase();

      if (mod && lowerKey === 'o') {
        e.preventDefault();
        const fileInput = document.querySelector<HTMLInputElement>('main input[type="file"]:not([disabled])');
        if (fileInput) {
          fileInput.click();
        } else {
          window.dispatchEvent(new CustomEvent('pp:shortcut-open'));
        }
        return;
      }

      if (mod && lowerKey === 's') {
        e.preventDefault();
        const dlBtn = Array.from(document.querySelectorAll<HTMLElement>('main a[download], main button')).find(
          (el) => {
            if ((el as HTMLButtonElement).disabled) return false;
            return el.hasAttribute('download') || /\b(download|export)\b/i.test(el.textContent || '');
          },
        );
        if (dlBtn) {
          dlBtn.click();
        } else {
          window.dispatchEvent(new CustomEvent('pp:shortcut-download'));
        }
        return;
      }

      if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) {
        const resetBtn = Array.from(document.querySelectorAll<HTMLButtonElement>('main button')).find(
          (el) => !el.disabled && /\b(start over|reset|clear)\b/i.test(el.textContent || ''),
        );
        if (resetBtn) {
          resetBtn.click();
        } else {
          useAppStore.getState().reset();
          window.dispatchEvent(new CustomEvent('pp:shortcut-reset'));
        }
        return;
      }

      if (e.code === 'Space' && !isEditableElement(e.target)) {
        const hasPreview = Boolean(document.querySelector('main img, main canvas'));
        if (!hasPreview) return;
        e.preventDefault();
        if (!spaceHeld) {
          spaceHeld = true;
          emitCompare(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && spaceHeld) {
        spaceHeld = false;
        emitCompare(false);
      }
    };

    const handleBlur = () => {
      if (spaceHeld) {
        spaceHeld = false;
        emitCompare(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
}

/**
 * Subscribe inside any image/comparison workspace to detect when Spacebar is held.
 */
export function useSpaceCompareHold(): boolean {
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<{ active?: boolean }>).detail;
      setHolding(Boolean(detail?.active));
    };
    window.addEventListener('pp:compare-original', handler);
    return () => window.removeEventListener('pp:compare-original', handler);
  }, []);

  return holding;
}
