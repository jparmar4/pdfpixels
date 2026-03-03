'use client';

import { motion } from 'framer-motion';
import {
  Zap,
  Shield,
  Globe,
  Sparkles,
  Smartphone,
  Infinity,
  Wand2,
  Clock,
  FileImage,
  Lock,
  RefreshCw,
  BadgeCheck
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Instant Processing',
    description: 'Our optimized servers process your images in seconds, not minutes. No queues, no waiting.',
    highlight: 'Up to 10x faster',
    gradient: 'from-amber-500/15 to-orange-500/5',
    iconGradient: 'from-amber-500/20 to-orange-500/8',
    stat: '10M+ files/month',
    featured: true,
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: '256-bit SSL encryption, SOC 2 certified infrastructure, and GDPR compliance for complete peace of mind.',
    highlight: 'Bank-level security',
    gradient: 'from-emerald-500/15 to-teal-500/5',
    iconGradient: 'from-emerald-500/20 to-teal-500/8',
    stat: '99.9% uptime',
    featured: true,
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Tools',
    description: 'Smart background removal, intelligent upscaling, and automatic photo enhancement powered by AI.',
    highlight: 'Advanced AI',
    gradient: 'from-violet-500/15 to-purple-500/5',
    iconGradient: 'from-violet-500/20 to-purple-500/8',
  },
  {
    icon: Infinity,
    title: 'Unlimited & Free',
    description: 'No file limits, no daily restrictions, no hidden fees. Process as many images as you need.',
    highlight: 'Free to use',
    gradient: 'from-blue-500/15 to-indigo-500/5',
    iconGradient: 'from-blue-500/20 to-indigo-500/8',
  },
  {
    icon: Smartphone,
    title: 'Works Everywhere',
    description: 'Fully responsive design works on desktop, tablet, and mobile. No app download required.',
    highlight: 'Cross-platform',
    gradient: 'from-pink-500/15 to-rose-500/5',
    iconGradient: 'from-pink-500/20 to-rose-500/8',
  },
  {
    icon: Lock,
    title: 'Privacy First',
    description: 'Privacy-focused processing with temporary file handling and automatic cleanup on supported workflows.',
    highlight: 'Zero data retention',
    gradient: 'from-cyan-500/15 to-sky-500/5',
    iconGradient: 'from-cyan-500/20 to-sky-500/8',
  },
  {
    icon: FileImage,
    title: 'All Formats Supported',
    description: 'JPG, PNG, WebP, HEIC, GIF, BMP, TIFF, and more. Convert between any format instantly.',
    highlight: '50+ formats',
    gradient: 'from-lime-500/15 to-green-500/5',
    iconGradient: 'from-lime-500/20 to-green-500/8',
  },
  {
    icon: Wand2,
    title: 'Professional Quality',
    description: 'High-quality output with adjustable settings. Perfect for print, web, and professional use.',
    highlight: 'Print-ready',
    gradient: 'from-fuchsia-500/15 to-purple-500/5',
    iconGradient: 'from-fuchsia-500/20 to-purple-500/8',
  },
];

export function FeaturesSection() {
  return (
    <section
      className="py-24 relative overflow-hidden"
      aria-labelledby="features-heading"
    >
      {/* Decorative mesh background */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 bg-muted/25" />

      <div className="relative container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-6 shadow-soft">
            <BadgeCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Powerful Features</span>
          </div>
          <h2 id="features-heading" className="text-3xl md:text-4xl font-bold mb-5">
            Why Choose PdfPixels?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Professional-grade image processing tools with enterprise-level security and reliability.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className={`card-shine group relative bg-card/90 backdrop-blur-sm border border-border/40 rounded-2xl p-6 shadow-soft hover:shadow-premium transition-all duration-400 hover:-translate-y-2 hover:border-primary/20 overflow-hidden ${feature.featured ? 'lg:col-span-2' : ''
                }`}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none`} />

              {/* Decorative watermark icon for featured cards */}
              {feature.featured && (
                <div className="absolute -bottom-4 -right-4 w-28 h-28 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-400 pointer-events-none">
                  <feature.icon className="w-full h-full text-primary" />
                </div>
              )}

              {/* Featured badge */}
              {feature.featured && (
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15">
                    ★ Top Feature
                  </span>
                </div>
              )}

              <div className="relative">
                {/* Icon */}
                <div className={`icon-glow w-12 h-12 rounded-xl bg-gradient-to-br ${feature.iconGradient || feature.gradient} flex items-center justify-center mb-5 transition-all duration-300`}>
                  <feature.icon className="w-6 h-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold mb-2.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {feature.description}
                </p>

                {/* Bottom row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-block text-xs font-semibold text-primary bg-primary/8 border border-primary/12 px-3 py-1.5 rounded-full">
                    {feature.highlight}
                  </span>
                  {feature.featured && feature.stat && (
                    <span className="text-xs font-semibold text-muted-foreground bg-muted/60 border border-border/30 px-3 py-1.5 rounded-full">
                      {feature.stat}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 grid md:grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {[
            { icon: Clock, title: '24/7 Availability', desc: 'Always online' },
            { icon: Globe, title: 'Global CDN', desc: 'Fast worldwide' },
            { icon: RefreshCw, title: 'Regular Updates', desc: 'New tools weekly' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3 p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/12 to-primary/3 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
