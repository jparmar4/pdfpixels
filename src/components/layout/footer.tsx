'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Github,
  Twitter,
  Linkedin,
  Mail,
  Heart,
  Image as ImageIcon,
  Sparkles,
  Zap,
  Shield,
  Globe
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { allTools } from '@/lib/tools-data';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const setActiveTool = useAppStore((state) => state.setActiveTool);

  const toolLinks = [
    { name: 'Compress Image', id: 'compress' },
    { name: 'Resize Image', id: 'resize' },
    { name: 'Convert Format', id: 'png-to-jpg' },
    { name: 'Remove Background', id: 'remove-background' },
    { name: 'Merge PDF', id: 'pdf-merge' },
    { name: 'Split PDF', id: 'pdf-split' },
  ];

  const companyLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
    { name: 'API Documentation', href: '/api-docs' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Disclaimer', href: '/disclaimer' },
    { name: 'DMCA Policy', href: '/dmca' },
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/pdfpixels', label: 'Twitter' },
    { icon: Github, href: 'https://github.com/pdfpixels', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com/company/pdfpixels', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:support@pdfpixels.com', label: 'Email' },
  ];

  const trustFeatures = [
    { icon: Shield, label: 'Secure' },
    { icon: Zap, label: 'Fast' },
    { icon: Globe, label: 'Free' },
  ];

  return (
    <footer className="relative mt-auto border-t border-border/40">
      {/* CTA Banner */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl bg-gradient-to-br from-primary/8 via-violet-500/5 to-cyan-500/4 border border-primary/15 p-10 md:p-14 text-center overflow-hidden aurora-bg"
        >
          <div className="noise-overlay absolute inset-0 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-5">
              Ready to <span className="gradient-text">Get Started</span>?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed text-lg">
              Compress, resize, convert, and edit your images and PDFs with our suite of {allTools.length}+ professional tools.
              Completely free, no signup required.
            </p>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl btn-premium font-semibold text-sm relative z-10"
            >
              <span className="relative z-10">Try Our Tools Free</span>
              <Zap className="w-4 h-4 group-hover:scale-110 transition-transform relative z-10" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Gradient top border element removed as it's part of the new border-t above */}

      <div className="bg-muted/15 border-t border-border/20">
        <div className="container mx-auto px-4 lg:px-8 py-14 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4 lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6 group" onClick={() => setActiveTool(null)}>
                <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-all duration-300">
                  <ImageIcon className="w-5 h-5 text-white" />
                  <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-white/90" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    <span className="text-shimmer">Pdf</span>Pixels
                  </span>
                  <span className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase font-bold mt-1">Professional Suite</span>
                </div>
              </Link>

              <p className="text-sm text-muted-foreground mb-8 max-w-[280px] leading-relaxed font-medium">
                Free online image and PDF tools for everyone. Fast, secure, and easy to use. No signup required.
              </p>

              {/* Trust features */}
              <div className="flex items-center gap-5 mb-8">
                {trustFeatures.map((feature) => (
                  <div key={feature.label} className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-8 h-8 rounded-xl bg-card border border-border/60 flex items-center justify-center shadow-sm">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-[10px] uppercase tracking-wider">{feature.label}</span>
                  </div>
                ))}
              </div>

              {/* Social links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((link) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-xl bg-card border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 hover:shadow-premium transition-all duration-300"
                    aria-label={link.label}
                  >
                    <link.icon className="w-4 h-4" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5">Tools</h4>
              <ul className="space-y-3">
                {toolLinks.map((tool) => (
                  <li key={tool.name}>
                    <Link
                      href={`/?tool=${tool.id}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5">Company</h4>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5">Legal</h4>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/20">
          <div className="container mx-auto px-4 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground font-medium">
              © {currentYear} PdfPixels. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              Made with{' '}
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.5 }}
              >
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              </motion.span>
              {' '}for everyone
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
