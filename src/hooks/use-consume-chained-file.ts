'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useWorkflowStore } from '@/store/workflow-store';

/**
 * Automatically hydrates a processed file carried over from a previous tool's
 * 1-click workflow chain into the current workspace's dropzone/input handler.
 */
export function useConsumeChainedFile(
  onFileLoaded: (file: File) => void | Promise<void>,
  canAccept?: (file: File) => boolean,
) {
  const onFileRef = useRef(onFileLoaded);
  const canAcceptRef = useRef(canAccept);
  onFileRef.current = onFileLoaded;
  canAcceptRef.current = canAccept;

  const consumedRef = useRef(false);

  useEffect(() => {
    if (consumedRef.current) return;
    let active = true;

    const timer = window.setTimeout(() => {
      void (async () => {
        const hasQueryHint =
          typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('chained') === '1';
        const store = useWorkflowStore.getState();

        if (!store.pendingChainedFile && !hasQueryHint) {
          return;
        }

        const chainedFile = await store.consumePendingChainedFile(canAcceptRef.current);
        if (!active || !chainedFile) return;

        consumedRef.current = true;
        await onFileRef.current(chainedFile);
        toast.success(`Loaded "${chainedFile.name}" from previous workflow step — ready to continue!`);

        if (hasQueryHint && typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('chained');
          window.history.replaceState({}, '', url.pathname + url.search + url.hash);
        }
      })();
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);
}
