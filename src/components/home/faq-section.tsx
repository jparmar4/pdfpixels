'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { faqData } from '@/lib/seo-config';
import { NativeAd } from '@/components/ads/ad-banner';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const visibleFaqs = faqData.slice(0, 10);

  return (
    <section id="faq-section" className="py-16 md:py-20 bg-muted/20 border-t border-border/50">
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">FAQ</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mt-3 mb-4">
            Frequently Asked <span className="text-foreground">Questions</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Quick answers about our free image and PDF processing tools.
          </p>
        </motion.div>

        <div className="space-y-3">
          {visibleFaqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.03 }}
              className={`rounded-2xl border bg-card/60 dark:bg-card/40 backdrop-blur-sm overflow-hidden transition-all duration-300 ${openIndex === idx ? 'border-primary/30 shadow-lg shadow-primary/5' : 'border-border/60 hover:border-primary/15'}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-primary/[0.02] transition-colors"
              >
                <span className="font-semibold text-sm pr-4">{faq.question}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${openIndex === idx ? 'bg-primary/10 rotate-180' : 'bg-muted'}`}>
                  <ChevronDown className={`w-4 h-4 ${openIndex === idx ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 flex gap-3">
                      <div className="w-0.5 rounded-full bg-gradient-to-b from-primary/60 via-violet-500/40 to-transparent flex-shrink-0" />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          <div className="py-4">
            <NativeAd />
          </div>
        </div>
      </div>
    </section>
  );
}
