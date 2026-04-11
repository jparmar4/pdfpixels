'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Globe,
  Mail,
  MessageCircle,
  Send,
  Sparkles,
  Twitter,
  Github,
  Linkedin,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AnimatedMeshBg } from '@/components/ui/animated-mesh-bg';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subject, setSubject] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success("Message sent successfully. We'll get back to you soon.");
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      description: 'Drop us a line anytime. We read every message.',
      value: 'support@pdfpixels.com',
      href: 'mailto:support@pdfpixels.com',
      gradient: 'from-violet-500 to-indigo-600',
    },
    {
      icon: Clock,
      title: 'Response Time',
      description: 'We aim to respond promptly during business hours.',
      value: 'Within 24 hours',
      href: '#',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: Globe,
      title: 'Location',
      description: 'Our tools are available worldwide, 24/7.',
      value: 'Available Worldwide',
      href: '#',
      gradient: 'from-amber-500 to-orange-600',
    },
  ];

  const faqItems = [
    {
      question: 'How quickly do you respond to inquiries?',
      answer:
        'We typically respond within 24 hours during business days. For urgent technical issues, we prioritize those messages and often reply within a few hours. Weekends and holidays may have slightly longer response times.',
    },
    {
      question: 'Can I request a new tool or feature?',
      answer:
        'Absolutely! We love hearing from our users. Feature requests are one of the main ways we decide what to build next. Just use the form above and select "Feature Request" as the subject. Describe what you need and we will consider it for our roadmap.',
    },
    {
      question: 'Is there a premium plan available?',
      answer:
        'PdfPixels offers free tools with generous usage limits. We are working on a premium tier with higher limits, batch processing, and priority support. Stay tuned by subscribing to our newsletter or following us on social media.',
    },
    {
      question: 'How do I report a bug or broken tool?',
      answer:
        'If something is not working correctly, please use the contact form and select "Bug Report" as the subject. Include details about what you were trying to do, what happened, and your browser/device. Screenshots help us fix things faster.',
    },
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/pdfpixels', label: 'Twitter' },
    { icon: Github, href: 'https://github.com/pdfpixels', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com/company/pdfpixels', label: 'LinkedIn' },
  ];

  return (
    <div className="premium-page-bg min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="flex-1">
        {/* ─── Hero Section ─── */}
        <section className="relative overflow-hidden">
          <AnimatedMeshBg />
          <div className="hero-grid absolute inset-0 opacity-60" />

          <div className="container relative z-10 mx-auto px-4 py-24 text-center lg:px-8 md:py-32">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-3xl"
            >
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                <MessageCircle className="h-3.5 w-3.5" />
                Contact
              </span>

              <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Get in <span className="gradient-text">Touch</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                Our team is friendly, responsive, and always happy to help.
                Whether you have a question, feedback, or a partnership idea — we are here.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {['Fast response', 'Friendly team', 'Real humans'].map((point) => (
                  <span
                    key={point}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground shadow-soft backdrop-blur-xl"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {point}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* ─── Contact Method Cards ─── */}
        <section className="container mx-auto px-4 pb-12 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
            {contactMethods.map((method, index) => (
              <motion.a
                key={method.title}
                href={method.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4 }}
                className="group glass-card relative flex flex-col items-center gap-4 rounded-[1.75rem] p-6 text-center transition-all duration-300 hover:shadow-premium"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${method.gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                >
                  <method.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{method.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{method.description}</p>
                  <p className="mt-3 text-sm font-semibold text-primary">{method.value}</p>
                </div>
                <ChevronRight className="absolute right-5 top-5 h-4 w-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
              </motion.a>
            ))}
          </div>
        </section>

        {/* ─── Contact Form ─── */}
        <section className="container mx-auto px-4 pb-16 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="section-panel rounded-[2rem] p-6 md:p-10"
            >
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="flex min-h-[420px] flex-col items-center justify-center text-center"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-foreground">Message Sent!</h2>
                    <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                      Thank you for reaching out. We have received your message and will get back to you as soon as possible.
                    </p>
                    <Button
                      onClick={() => setSubmitted(false)}
                      variant="outline"
                      className="mt-8 rounded-2xl px-6"
                    >
                      Send another message
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                        Send a Message
                      </h2>
                      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
                        Fill out the form below and we will get back to you. The more detail you provide, the faster we can help.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="contact-name" className="text-sm font-semibold">
                            Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="contact-name"
                            placeholder="Your full name"
                            required
                            className="h-12 rounded-xl border-border/60 bg-background/60 px-4 transition-all duration-200 focus-visible:border-primary/40 focus-visible:ring-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-email" className="text-sm font-semibold">
                            Email <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="contact-email"
                            type="email"
                            placeholder="you@email.com"
                            required
                            className="h-12 rounded-xl border-border/60 bg-background/60 px-4 transition-all duration-200 focus-visible:border-primary/40 focus-visible:ring-primary/20"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact-subject" className="text-sm font-semibold">
                          Subject <span className="text-destructive">*</span>
                        </Label>
                        <Select value={subject} onValueChange={setSubject} required>
                          <SelectTrigger className="h-12 w-full rounded-xl border-border/60 bg-background/60 px-4 transition-all duration-200 focus-visible:border-primary/40 focus-visible:ring-primary/20">
                            <SelectValue placeholder="What is this about?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Inquiry</SelectItem>
                            <SelectItem value="support">Technical Support</SelectItem>
                            <SelectItem value="bug">Bug Report</SelectItem>
                            <SelectItem value="feature">Feature Request</SelectItem>
                            <SelectItem value="business">Business / Partnership</SelectItem>
                            <SelectItem value="feedback">Feedback</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact-message" className="text-sm font-semibold">
                          Message <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="contact-message"
                          placeholder="Tell us what you need, which tool is involved, and what happened..."
                          required
                          className="min-h-[160px] resize-none rounded-xl border-border/60 bg-background/60 px-4 py-3 text-sm transition-all duration-200 focus-visible:border-primary/40 focus-visible:ring-primary/20"
                        />
                      </div>

                      <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/40 p-4">
                        <input
                          type="checkbox"
                          id="contact-privacy"
                          required
                          className="mt-0.5 h-4 w-4 rounded border-input"
                        />
                        <Label
                          htmlFor="contact-privacy"
                          className="text-sm leading-6 text-muted-foreground"
                        >
                          I agree to the{' '}
                          <Link href="/privacy" className="font-semibold text-primary hover:underline">
                            Privacy Policy
                          </Link>{' '}
                          and understand this form is for website communication only.
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        className="btn-premium h-13 w-full rounded-2xl text-sm font-bold"
                        size="lg"
                        disabled={isSubmitting || !subject}
                      >
                        {isSubmitting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent"
                            />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>

                      <p className="text-center text-xs text-muted-foreground">
                        <Clock className="mr-1 inline h-3 w-3" />
                        We typically respond within 24 hours
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        {/* ─── FAQ Teaser ─── */}
        <section className="container mx-auto px-4 pb-16 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                FAQ
              </span>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">Common Questions</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Quick answers to questions we get asked most often.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="mt-8 section-panel rounded-[1.75rem] p-6 md:p-8"
            >
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`faq-${index}`}
                    className="border-border/40"
                  >
                    <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:text-primary hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-7 text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* ─── Social Links ─── */}
        <section className="container mx-auto px-4 pb-16 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-lg text-center"
          >
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Connect with us
            </p>
            <div className="flex items-center justify-center gap-4">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-card/80 text-muted-foreground shadow-soft transition-all duration-300 hover:border-primary/30 hover:text-primary hover:shadow-premium"
                  aria-label={link.label}
                >
                  <link.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                </motion.a>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Follow us for updates, tips, and announcements.
            </p>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
