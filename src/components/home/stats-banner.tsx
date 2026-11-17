import { DollarSign, Files, ShieldCheck, Wrench } from 'lucide-react';
import { platformStats } from '@/lib/tools-data';

export function StatsBanner() {
  const stats = [
    { display: platformStats.freeToolsLabel, label: 'Free Tools', icon: Wrench, gradient: 'from-indigo-600 to-violet-600' },
    { display: platformStats.fileFormatsLabel, label: 'File Formats', icon: Files, gradient: 'from-violet-600 to-purple-600' },
    { display: platformStats.freeWorkflowsLabel, label: 'Free Core Workflows', icon: DollarSign, gradient: 'from-emerald-600 to-teal-600' },
    { display: platformStats.accountWallsLabel, label: 'Account Walls', icon: ShieldCheck, gradient: 'from-sky-600 to-blue-600' },
  ];

  return (
    <section className="py-16 relative overflow-hidden border-y border-border/50">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] to-transparent" />
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative text-center p-6 rounded-2xl glass-card group card-shine hover:-translate-y-1 hover:shadow-premium transition-all duration-300"
            >
              <div className={`absolute top-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${stat.gradient} opacity-60`} />
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-3 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">
                {stat.display}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
