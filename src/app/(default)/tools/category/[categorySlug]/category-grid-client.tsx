'use client';

import { useMemo, useState } from 'react';
import { Search, ArrowDownWideNarrow, X } from 'lucide-react';
import { toolCategories } from '@/lib/tools-data';
import { EnhancedToolCard } from '@/components/layout/category-section';
import { normalizeDisplayText } from '@/lib/display-text';

type SortMode = 'recommended' | 'az';

export function CategoryGridClient({ categorySlug }: { categorySlug: string }) {
  const category = toolCategories.find((c) => c.id === categorySlug);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('recommended');

  const tools = useMemo(() => {
    if (!category) return [];
    const q = query.trim().toLowerCase();

    let list = category.tools.filter(
      (t) =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q))
    );

    if (sort === 'az') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Recommended: popular and badged tools surface first, data order preserved otherwise
      list = [...list].sort((a, b) => Number(b.popular ?? false) - Number(a.popular ?? false) || Number(Boolean(b.badge)) - Number(Boolean(a.badge)));
    }

    return list;
  }, [category, query, sort]);

  if (!category) return null;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute inset-y-0 left-3.5 flex h-4 w-4 items-center text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search in ${normalizeDisplayText(category.name).toLowerCase()}…`}
            aria-label={`Search tools in ${normalizeDisplayText(category.name)}`}
            className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-9 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1" role="group" aria-label="Sort tools">
          <ArrowDownWideNarrow className="ml-2 mr-1 h-3.5 w-3.5 text-muted-foreground" />
          {(['recommended', 'az'] as SortMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSort(mode)}
              aria-pressed={sort === mode}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                sort === mode
                  ? 'bg-primary text-white shadow-[0_6px_16px_-8px_rgba(79,70,229,0.7)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {mode === 'recommended' ? 'Recommended' : 'A–Z'}
            </button>
          ))}
        </div>

        <p className="text-xs font-medium text-muted-foreground sm:ml-auto" role="status">
          {tools.length} of {category.tools.length} tools
        </p>
      </div>

      {tools.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool, index) => (
            <EnhancedToolCard key={tool.id} tool={tool} index={index} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 py-16 text-center">
          <Search className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">No tools match &ldquo;{query}&rdquo;</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a shorter keyword or clear the search.</p>
          <button
            onClick={() => setQuery('')}
            className="mt-4 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
