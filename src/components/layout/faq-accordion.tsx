'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

export function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
  return (
    <div className="space-y-2 mt-4" role="region" aria-label="Tool FAQ Section">
      {faqs.map((faq, i) => (
        <FAQItem key={i} question={faq.question} answer={faq.answer} index={i} />
      ))}
    </div>
  );
}

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  const badge = String(index + 1).padStart(2, '0');

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-300 ${
        open
          ? 'border border-primary/30 shadow-sm shadow-primary/5 bg-gradient-to-r from-primary/[0.02] to-transparent'
          : 'border border-border/40'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={open}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-300 ${
          open
            ? 'bg-gradient-to-br from-primary to-sky-500 text-white shadow-sm shadow-primary/20'
            : 'bg-muted/60 text-muted-foreground'
        }`}>
          {badge}
        </span>
        <span className="font-medium text-sm flex-1 pr-4 text-foreground">{question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-l-2 border-l-primary/40 mx-5">
              <div className="pl-4 pb-4 pt-1">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {answer}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
