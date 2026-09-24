'use client';

import { createContext, useContext } from 'react';
import { useAppStore, type ActiveTool } from '@/store/app-store';

/**
 * Per-request initial tool, provided by ToolPageClient from page props.
 * Lets workspaces SSR their full UI (dropzone + header) without writing to
 * the global Zustand singleton during prerender, so concurrent SSRs cannot
 * cross-pollinate state. After mount, the store takes over via useLayoutEffect.
 */
export const ToolContext = createContext<ActiveTool | null>(null);

/**
 * Drop-in replacement for `useAppStore()` in tool workspaces: identical API,
 * but `activeTool` is hydrated from ToolContext during SSR/prerender.
 */
export function useActiveTool() {
  const store = useAppStore();
  const override = useContext(ToolContext);
  return { ...store, activeTool: override ?? store.activeTool };
}
