'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Award,
  Users,
  Zap,
  CheckCircle2,
  Globe,
  BadgeCheck,
  Quote
} from 'lucide-react';
import { seoConfig } from '@/lib/seo-config';
import { useState, useCallback } from 'react';

// Animated counter for trust section
function AnimatedStat({ value, icon: Icon, label }: { value: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [hasAnimated, setHasAnimated] = useState(false);

  const animate = useCallback(() => {
    if (hasAnimated) return;
    setHasAnimated(true);

    const numMatch = value.match(/^([\d.]+)/);
    if (!numMatch) { setDisplayValue(value); return; }

    const target = parseFloat(numMatch[1]);
    const suffix = value.slice(numMatch[1].length);
    const isDecimal = numMatch[1].includes('.');
    const duration = 1500;
    const startTime = Date.now();

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setDisplayValue(isDecimal ? current.toFixed(1) + suffix : Math.floor(current) + suffix);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, hasAnimated]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onViewportEnter={() => setTimeout(animate, 300)}
      className="text-center p-6 rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 shadow-soft hover:shadow-premium transition-all duration-400 hover:-translate-y-1 group"
    >
      <div className="icon-glow w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mx-auto mb-4 transition-all duration-300 ring-2 ring-primary/10 group-hover:ring-primary/20">
        <Icon className="w-7 h-7 text-primary transition-transform duration-300 group-hover:scale-110" />
      </div>
      <div className="text-3xl font-bold gradient-text mb-1.5">{displayValue}</div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
    </motion.div>
  );
}

const workflows = [
  {
    title: 'Compress PDF',
    audience: 'Email and portals',
    text: 'Shrink a large PDF for Gmail, job sites, and government forms, then download the smaller file.',
  },
  {
    title: 'Merge PDF',
    audience: 'Reports and invoices',
    text: 'Combine up to 20 PDFs into one file, with a 25 MB per-file and 100 MB combined cap.',
  },
  {
    title: 'HEIC to JPG',
    audience: 'iPhone photos',
    text: 'Convert one HEIC still photo at a time so Windows, Android, and web forms can open it.',
  },
  {
    title: 'Compress image',
    audience: 'KB limits',
    text: 'Hit a target size such as 50 KB or 200 KB for ID photos and application uploads.',
  },
  {
    title: 'Remove background',
    audience: 'Listings and headshots',
    text: 'Run an AI cutout on the server for that request, then download a transparent PNG.',
  },
];

export function TrustSection() {
  const trustBadges = [
    { icon: Shield, label: 'Privacy-aware', desc: 'Clear processing expectations by workflow' },
    { icon: Lock, label: 'Secure transport', desc: 'Protected file transfers and modern browser support' },
    { icon: BadgeCheck, label: 'Clear limits', desc: 'Accepted formats and size limits are surfaced in each tool' },
    { icon: Globe, label: 'Works on the web', desc: 'Designed for desktop and mobile browsers' },
  ];

  const achievements = [
    { value: seoConfig.credentials.tools, label: 'Available tools', icon: BadgeCheck },
    { value: seoConfig.credentials.access, label: 'Signup required', icon: Users },
    { value: seoConfig.credentials.workflow, label: 'Workflow model', icon: Zap },
    { value: seoConfig.credentials.coverage, label: 'Platform coverage', icon: Globe },
  ];

  const awards = [
    'No signup for core tools',
    'Honest file limits on each page',
    'Guides for common PDF and photo jobs',
  ];

  return (
    <section
      className="py-24 relative overflow-hidden"
      aria-labelledby="trust-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
      <div className="absolute inset-0 dot-pattern opacity-20 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-6 shadow-soft">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Built for dependable workflows</span>
          </div>
          <h2 id="trust-heading" className="text-3xl md:text-4xl font-bold mb-5">
Trust signals users can understand quickly
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            PdfPixels is designed around privacy-aware processing, transparent workflow messaging, and mobile-friendly access.
          </p>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {trustBadges.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-shine flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 group"
              >
                <div className="icon-glow w-10 h-10 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center transition-all duration-300">
                  <badge.icon className="w-5 h-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">{badge.label}</div>
                  <div className="text-xs text-muted-foreground">{badge.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Achievement Stats */}
        <div className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-3xl mx-auto">
            {achievements.map((stat) => (
              <AnimatedStat
                key={stat.label}
                value={stat.value}
                icon={stat.icon}
                label={stat.label}
              />
            ))}
          </div>
        </div>

        {/* Testimonials Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Quote className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold">Common jobs these tools cover</h3>
            </div>
          </div>

          <div className="scroll-carousel px-2 pb-4">
            {workflows.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="testimonial-card"
              >
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4">
                  {item.text}
                </p>
                <div>
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.audience}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Awards & Recognition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">What you can count on</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {awards.map((award, i) => (
              <motion.div
                key={award}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/8 border border-primary/15 shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-0.5"
              >
                <BadgeCheck className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{award}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center max-w-2xl mx-auto"
        >
          <div className="gradient-divider mb-8" />
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">PdfPixels</strong> is committed to providing
            free image and PDF processing tools. Core workflows stay free, with honest file limits
            and privacy-aware processing instead of fake ratings or invented awards.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            {seoConfig.trustSignals.slice(0, 4).map((signal) => (
              <div key={signal} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{signal}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

