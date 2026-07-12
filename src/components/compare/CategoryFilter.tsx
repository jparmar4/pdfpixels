'use client';

interface CategoryFilterProps {
    categories: string[];
    activeCategory: string;
    onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ categories, activeCategory, onCategoryChange }: CategoryFilterProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                onClick={() => onCategoryChange('all')}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${
                    activeCategory === 'all'
                        ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                }`}
            >
                All
            </button>
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onCategoryChange(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${
                        activeCategory === cat
                            ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                            : 'bg-background text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
