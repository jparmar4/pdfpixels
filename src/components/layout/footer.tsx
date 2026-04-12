'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import {
  Github,
  Linkedin,
  Mail,
  ShieldCheck,
  Sparkles,
  Twitter,
  Zap,
  Globe,
  ArrowRight,
  Image as ImageIcon,
  ChevronDown,
  Send,
  ArrowUp,
} from 'lucide-react';
import { allTools, toolCategories } from '@/lib/tools-data';
import { useAppStore } from '@/store/app-store';

const toolLinkIds = ['compress', 'resize', 'remove-background', 'image-to-pdf', 'pdf-merge', 'pdf-split'];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const setActiveTool = useAppStore((state) => state.setActiveTool);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const toolLinks = toolLinkIds
    .map((id) => allTools.find((tool) => tool.id === id))
    .filter(Boolean)
    .map((tool) => ({
      name: tool!.name,
      href: `/tools/${tool!.slug}`,
    }));

  // Build dynamic category columns from toolCategories (first 6 tools each)
  const categoryColumns = toolCategories
    .filter((cat) => cat.id !== 'most-used')
    .slice(0, 3)
    .map((cat) => ({
      title: cat.name,
      links: cat.tools.slice(0, 6).map((tool) => ({
        name: tool.name,
        href: `/tools/${tool.slug}`,
      })),
    }));

  const companyLinks = [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
    { name: 'Compare tools', href: '/compare' },
  ];

  const legalLinks = [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Disclaimer', href: '/disclaimer' },
    { name: 'DMCA', href: '/dmca' },
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/pdfpixels', label: 'Follow us on Twitter / X', tooltip: 'Twitter' },
    { icon: Github, href: 'https://github.com/pdfpixels', label: 'View our open-source projects on GitHub', tooltip: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com/company/pdfpixels', label: 'Connect with us on LinkedIn', tooltip: 'LinkedIn' },
    { icon: Mail, href: 'mailto:support@pdfpixels.com', label: 'Send us an email', tooltip: 'Email Us' },
  ];

  const trustFeatures = [
    { icon: ShieldCheck, label: 'Secure-by-default' },
    { icon: Zap, label: 'Fast output' },
    { icon: Globe, label: 'Global access' },
  ];

  const [subscribeError, setSubscribeError] = useState('');

  const handleSubscribe = useCallback(async () => {
    if (!email.trim() || !email.includes('@')) return;
    setSubscribeError('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribed(true);
        setEmail('');
      } else {
        setSubscribeError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setSubscribeError('Network error. Please try again.');
    }
  }, [email]);

  return (
    <footer className="relative mt-auto border-t border-border/40 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(59,130,246,0.03))]">
      {/* ── CTA Banner with Newsletter ── */}
      <div className="container mx-auto px-4 py-12 lg:px-8 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/80 p-8 shadow-premium backdrop-blur-xl md:p-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_28%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Premium web workflow
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                A faster front door for PDF and image workflows.
              </h2>
              <p className="text-base leading-7 text-muted-foreground">
                PdfPixels gives you {allTools.length}+ tools with cleaner UX, reliable output, and a deployment-friendly Next.js stack that is ready for production hosting.
              </p>

              {/* Newsletter Signup */}
              <div className="pt-2">
                <p className="mb-2.5 text-sm font-medium text-muted-foreground">
                  Get notified about new tools and features
                </p>
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      type="email"
                      placeholder="Enter your email for updates"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                      className="h-12 w-full rounded-2xl border border-border/60 bg-background/80 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={subscribed}
                    className="btn-premium inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold disabled:opacity-60"
                  >
                    {subscribed ? (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Subscribed!
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Subscribe
                      </>
                    )}
                  </button>
                </div>
                {subscribeError && (
                  <p className="text-xs text-destructive mt-1">{subscribeError}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/tools/compress-pdf" className="btn-premium inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold">
                Launch PDF workflow
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/80 px-6 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary"
              >
                Explore homepage
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Footer Columns ── */}
      <div className="border-t border-border/30 bg-muted/15">
        <div className="container mx-auto px-4 py-14 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_repeat(4,minmax(0,1fr))]">
            {/* Brand Column */}
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-3" onClick={() => setActiveTool(null)}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sky-500 text-white shadow-lg shadow-primary/20">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-extrabold tracking-tight text-foreground">PdfPixels</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Professional suite</p>
                </div>
              </Link>

              <p className="max-w-sm text-sm leading-7 text-muted-foreground">
                Modern PDF and image tooling for users who want premium polish, dependable processing, and a workflow that feels fast from upload to download.
              </p>

              <div className="flex flex-wrap gap-3">
                {trustFeatures.map((feature) => (
                  <div key={feature.label} className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <feature.icon className="h-3.5 w-3.5 text-primary" />
                    {feature.label}
                  </div>
                ))}
              </div>

              {/* Social Links with Tooltips */}
              <div className="flex items-center gap-3">
                {socialLinks.map((link) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="group relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-card/80 text-muted-foreground transition-all duration-300 hover:border-primary/30 hover:text-primary hover:shadow-lg hover:shadow-primary/5"
                    aria-label={link.label}
                    title={link.tooltip}
                  >
                    <link.icon className="h-[18px] w-[18px]" />
                    {/* Tooltip */}
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-[11px] font-medium text-background opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                      {link.tooltip}
                      <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                    </span>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Dynamic Tool Categories */}
            <div className="lg:hidden">
              <CollapsibleFooterColumn title="Popular tools" links={toolLinks} />
            </div>
            <div className="hidden lg:block">
              <FooterColumn title="Popular tools" links={toolLinks} />
            </div>

            {categoryColumns.map((col) => (
              <div key={col.title} className="lg:hidden">
                <CollapsibleFooterColumn title={col.title} links={col.links} />
              </div>
            ))}
            {categoryColumns.map((col) => (
              <div key={col.title} className="hidden lg:block">
                <FooterColumn title={col.title} links={col.links} />
              </div>
            ))}

            {/* Legal Column */}
            <div className="lg:hidden">
              <CollapsibleFooterColumn title="Legal" links={legalLinks} />
            </div>
            <div className="hidden lg:block">
              <FooterColumn title="Legal" links={legalLinks} />
            </div>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="border-t border-border/30">
          <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-5 lg:px-8">
            {/* Back to Top */}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Back to top
              <ArrowUp className="h-3.5 w-3.5" />
            </button>

            {/* Copyright */}
            <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
              <p>&copy; {currentYear} PdfPixels. All rights reserved.</p>
              <p>Built for clean UX, reliable output, and production deployment.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Desktop-only column ── */
function FooterColumn({ title, links }: { title: string; links: Array<{ name: string; href: string }> }) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Mobile collapsible column ── */
function CollapsibleFooterColumn({ title, links }: { title: string; links: Array<{ name: string; href: string }> }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/30 pb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1"
        aria-expanded={open}
      >
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden space-y-3 pt-3"
          >
            {links.map((link) => (
              <li key={`${title}-${link.href}`}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
