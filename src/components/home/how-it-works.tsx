'use client';

import { motion } from 'framer-motion';
import { Download, Sliders, Upload } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Your File',
    description: 'Drag & drop or browse. Supports JPG, PNG, WebP, HEIC, PDF and more.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Sliders,
    title: 'Adjust Settings',
    description: 'Configure quality, dimensions, format, or effects to match your needs.',
    color: 'from-violet-500 to-fuchsia-500',
  },
  {
    icon: Download,
    title: 'Download Result',
    description: 'Click process and download instantly. Most results in under 5 seconds.',
    color: 'from-emerald-500 to-teal-600',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-20 bg-muted/20 border-t border-border/50 relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-40" />

      <div className="container mx-auto px-4 lg:px-8 max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">Simple Process</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mt-3 mb-4">
            How It <span className="text-foreground">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Three simple steps. No accounts, no installations, no hassle.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-10 relative">
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 overflow-hidden rounded-full">
            <div className="h-full connector-flow" />
          </div>

          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="relative text-center group"
            >
              <div className={`relative w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-105 transition-all duration-300`}>
                <step.icon className="w-9 h-9 text-white" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center text-xs font-extrabold gradient-text shadow-sm">
                  {idx + 1}
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
