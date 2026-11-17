import Link from 'next/link';
import { allTools, popularTools } from '@/lib/tools-data';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function BlogSidebar() {
    // Show top 5 popular tools in the sidebar
    const topTools = popularTools.slice(0, 5);

    return (
        <aside className="space-y-8">
            {/* Sticky Popular Tools Widget */}
            <div className="sticky top-24 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border bg-muted/30">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Popular Tools
                    </h3>
                </div>
                <div className="p-3">
                    <ul className="space-y-1">
                        {topTools.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <li key={tool.slug}>
                                    <Link
                                        href={`/tools/${tool.slug}`}
                                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                    {tool.name}
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="p-4 border-t border-border bg-muted/10 text-center">
                    <Link href="/" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider">
                        View All {allTools.length}+ Tools
                    </Link>
                </div>
            </div>
        </aside>
    );
}
