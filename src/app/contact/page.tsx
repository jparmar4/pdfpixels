'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Mail, MapPin, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SitePageShell } from '@/components/layout/site-page-shell';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      title: 'Support',
      description: 'Questions about tools, bugs, or workflow issues.',
      value: 'support@pdfpixels.com',
      href: 'mailto:support@pdfpixels.com',
    },
    {
      icon: MessageSquare,
      title: 'Business',
      description: 'Partnerships, integrations, and commercial discussions.',
      value: 'business@pdfpixels.com',
      href: 'mailto:business@pdfpixels.com',
    },
    {
      icon: MapPin,
      title: 'Coverage',
      description: 'The product is built for global users and distributed teams.',
      value: 'Worldwide',
      href: '#',
    },
    {
      icon: Clock,
      title: 'Response window',
      description: 'Typical turnaround for non-urgent inquiries.',
      value: '24 to 48 hours',
      href: '#',
    },
  ];

  return (
    <SitePageShell
      eyebrow="Contact"
      title="Talk to the team behind PdfPixels."
      description="Use this page for support, product feedback, business conversations, or anything that helps improve the platform."
      iconName="mail"
      align="center"
      stats={[
        { label: 'Primary inboxes', value: '2' },
        { label: 'Response target', value: '24-48h' },
        { label: 'Coverage', value: 'Global' },
        { label: 'Best for', value: 'Support + business' },
      ]}
      contentClassName="max-w-6xl"
    >
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {contactMethods.map((method, index) => (
              <motion.a
                key={method.title}
                href={method.href}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="section-panel rounded-[1.75rem] p-5 transition-colors hover:border-primary/25"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <method.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground">{method.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{method.description}</p>
                <p className="mt-3 text-sm font-semibold text-primary">{method.value}</p>
              </motion.a>
            ))}
          </div>

          <div className="section-panel rounded-[1.75rem] p-6">
            <h2 className="text-xl font-bold text-foreground">When to contact us</h2>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
              <li>Report broken tools, output issues, or reliability problems.</li>
              <li>Suggest premium UI improvements or workflow ideas.</li>
              <li>Ask about partnerships, integrations, or business opportunities.</li>
              <li>Request clarification on policy or product behavior.</li>
            </ul>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="section-panel rounded-[2rem] p-6 md:p-8">
          {submitted ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="flex h-18 w-18 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-foreground">Message sent</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                Thank you for reaching out. We will review your message and respond as soon as possible.
              </p>
              <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-6 rounded-2xl px-6">
                Send another message
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-foreground">Send a message</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Share enough detail for us to reproduce the issue or understand the business context. Clear messages help us respond faster.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" required className="rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="What is this about?" required className="rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    className="min-h-[160px] w-full resize-none rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Tell us what you need, what tool is involved, and what happened."
                    required
                  />
                </div>

                <div className="flex items-start gap-3 rounded-[1.25rem] border border-border/60 bg-background/70 p-4">
                  <input type="checkbox" id="privacy" required className="mt-1 rounded border-input" />
                  <Label htmlFor="privacy" className="text-sm leading-6 text-muted-foreground">
                    I agree to the <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and understand this form is for website communication only.
                  </Label>
                </div>

                <Button type="submit" className="btn-premium h-12 w-full rounded-2xl" size="lg" disabled={isSubmitting}>
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
                      Send message
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </section>
    </SitePageShell>
  );
}
