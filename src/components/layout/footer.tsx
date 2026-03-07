'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { allTools } from '@/lib/tools-data';
import { useAppStore } from '@/store/app-store';

const toolLinkIds = ['compress', 'resize', 'remove-background', 'image-to-pdf', 'pdf-merge', 'pdf-split'];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const setActiveTool = useAppStore((state) => state.setActiveTool);

  const toolLinks = toolLinkIds
    .map((id) => allTools.find((tool) => tool.id === id))
    .filter(Boolean)
    .map((tool) => ({
      name: tool!.name,
      href: `/tools/${tool!.slug}`,
    }));

  const companyLinks = [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
    { name: 'Compare tools', href: '/compare' },
  ];

  const platformLinks = [
    { name: 'All tools', href: '/' },
    { name: 'Use cases', href: '/use-cases' },
    { name: 'Compress PDF', href: '/tools/compress-pdf' },
    { name: 'Image to PDF', href: '/tools/image-to-pdf' },
  ];

  const legalLinks = [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Disclaimer', href: '/disclaimer' },
    { name: 'DMCA', href: '/dmca' },
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/pdfpixels', label: 'Twitter' },
    { icon: Github, href: 'https://github.com/pdfpixels', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com/company/pdfpixels', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:support@pdfpixels.com', label: 'Email' },
  ];

  const trustFeatures = [
    { icon: ShieldCheck, label: 'Secure-by-default' },
    { icon: Zap, label: 'Fast output' },
    { icon: Globe, label: 'Global access' },
  ];

  return (
    <footer className="relative mt-auto border-t border-border/40 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(59,130,246,0.03))]">
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

      <div className="border-t border-border/30 bg-muted/15">
        <div className="container mx-auto px-4 py-14 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_repeat(4,minmax(0,1fr))]">
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

              <div className="flex items-center gap-3">
                {socialLinks.map((link) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-card/80 text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                    aria-label={link.label}
                  >
                    <link.icon className="h-4 w-4" />
                  </motion.a>
                ))}
              </div>
            </div>

            <FooterColumn title="Popular tools" links={toolLinks} />
            <FooterColumn title="Platform" links={platformLinks} />
            <FooterColumn title="Company" links={companyLinks} />
            <FooterColumn title="Legal" links={legalLinks} />
          </div>
        </div>

        <div className="border-t border-border/30">
          <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row lg:px-8">
            <p>© {currentYear} PdfPixels. All rights reserved.</p>
            <p>Built for clean UX, reliable output, and production deployment.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

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
