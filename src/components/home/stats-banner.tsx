'use client';

import { motion } from 'framer-motion';
import { DollarSign, Files, Server, Wrench } from 'lucide-react';
import { AnimatedCounter } from './animated-counter';

export function StatsBanner() {
  const stats = [
    { value: 55, suffix: '+', label: 'Free Tools', icon: Wrench, gradient: 'from-indigo-500 to-violet-500' },
    { value: 99, suffix: '.9%', label: 'Uptime', icon: Server, gradient: 'from-emerald-500 to-teal-500' },
    { value: 8, suffix: '+', label: 'File Formats', icon: Files, gradient: 'from-fuchsia-500 to-pink-500' },
    { value: 0, suffix: '', label: 'Cost', display: 'Free', icon: DollarSign, gradient: 'from-cyan-500 to-blue-500' },
  ];

  return (
    <section className="py-16 relative overflow-hidden border-y border-border/50">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-fuchsia-500/[0.02] to-cyan-500/[0.03]" />
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative text-center p-6 rounded-2xl glass-card group hover:shadow-premium transition-all duration-300"
            >
              <div className={`absolute top-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${stat.gradient} opacity-60`} />
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">
                {stat.display ? stat.display : <AnimatedCounter end={stat.value} suffix={stat.suffix} />}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
