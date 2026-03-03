'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Award,
  Star,
  Users,
  Zap,
  Clock,
  CheckCircle2,
  Globe,
  Server,
  BadgeCheck,
  Scan,
  Quote
} from 'lucide-react';
import { seoConfig } from '@/lib/seo-config';
import { useState, useEffect, useCallback } from 'react';

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

// Testimonials data
const testimonials = [
  {
    name: 'Sarah K.',
    role: 'Graphic Designer',
    avatar: 'SK',
    avatarColor: 'bg-violet-500',
    rating: 5,
    text: 'PdfPixels is my go-to tool for compressing images before sending to clients. The quality is incredible and it\'s so fast — I save hours every week!',
  },
  {
    name: 'Marcus T.',
    role: 'Content Creator',
    avatar: 'MT',
    avatarColor: 'bg-blue-500',
    rating: 5,
    text: 'I\'ve tried dozens of image tools but nothing comes close. The PDF merge feature is flawless and I love that there\'s no signup needed.',
  },
  {
    name: 'Priya R.',
    role: 'Small Business Owner',
    avatar: 'PR',
    avatarColor: 'bg-emerald-500',
    rating: 5,
    text: 'Converting my product images to WebP cut my website load time in half. Absolutely essential tool — and it\'s completely free!',
  },
  {
    name: 'James L.',
    role: 'Web Developer',
    avatar: 'JL',
    avatarColor: 'bg-amber-500',
    rating: 5,
    text: 'The batch processing and format conversion tools are top-notch. I use PdfPixels daily for client projects. Highly recommend!',
  },
  {
    name: 'Aisha M.',
    role: 'Marketing Manager',
    avatar: 'AM',
    avatarColor: 'bg-rose-500',
    rating: 5,
    text: 'Finally a tool that respects my privacy! Files are deleted automatically and there\'s no account required. The resize tool is perfect for social media.',
  },
];

export function TrustSection() {
  const trustBadges = [
    { icon: Shield, label: 'GDPR Compliant', desc: 'EU data protection standards' },
    { icon: Lock, label: '256-bit SSL', desc: 'Bank-level encryption' },
    { icon: Server, label: 'SOC 2 Certified', desc: 'Enterprise security' },
    { icon: Scan, label: 'No Data Storage', desc: 'Files auto-deleted in 1 hour' },
  ];

  const achievements = [
    { value: seoConfig.credentials.users, label: 'Active Users', icon: Users },
    { value: seoConfig.credentials.imagesProcessed, label: 'Images Processed', icon: Zap },
    { value: seoConfig.credentials.rating, label: 'User Rating', icon: Star },
    { value: seoConfig.credentials.uptime, label: 'Uptime', icon: Clock },
  ];

  const awards = [
    'G2 High Performer 2024',
    'ProductHunt #1 Product of the Day',
    'Capterra Top Rated 2024',
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
            <span className="text-sm font-semibold">Trusted by Millions</span>
          </div>
          <h2 id="trust-heading" className="text-3xl md:text-4xl font-bold mb-5">
            Enterprise-Grade Security & Trust
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your files are protected with bank-level encryption and automatically deleted for your privacy.
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
              <h3 className="text-xl font-bold">What Our Users Say</h3>
            </div>
            <div className="flex items-center justify-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
              <span className="ml-2 text-sm font-semibold text-muted-foreground">4.9/5 average rating</span>
            </div>
          </div>

          <div className="scroll-carousel px-2 pb-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="testimonial-card"
              >
                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4">
                  &ldquo;{t.text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${t.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
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
            <h3 className="text-lg font-bold">Trusted & Recognized</h3>
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
            the highest quality image and PDF processing tools. Our platform serves millions of users
            worldwide with enterprise-grade security, instant processing, and free-to-use core workflows.
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
