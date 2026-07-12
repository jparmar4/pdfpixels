'use client';

import { toolCategories } from '@/lib/tools-data';
import { EnhancedToolCard } from '@/components/layout/category-section';

export function CategoryGridClient({ categorySlug }: { categorySlug: string }) {
  const category = toolCategories.find((c) => c.id === categorySlug);

  if (!category) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
      {category.tools.map((tool, index) => (
        <EnhancedToolCard key={tool.id} tool={tool} index={index} />
      ))}
    </div>
  );
}
