import { faqData } from '@/lib/seo-config';

// Server component using native <details>/<summary> so every Q&A pair is
// present in the served HTML (AEO extraction) and works without JS.
export function FAQSection() {
  const visibleFaqs = faqData.slice(0, 6);

  return (
    <section id="faq-section" className="py-16 md:py-20 bg-muted/20 border-t border-border/50">
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3 mb-3">
            Frequently Asked <span className="text-foreground">Questions</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Quick answers about our free image and PDF processing tools.
          </p>
        </div>

        <div className="space-y-3">
          {visibleFaqs.map((faq, idx) => (
            <details
              key={idx}
              className="group rounded-2xl border border-border/60 bg-card/60 overflow-hidden transition-colors hover:border-primary/25 open:border-primary/30"
            >
              <summary className="w-full flex items-center justify-between p-5 text-left cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="font-semibold text-sm pr-4">{faq.question}</span>
                <span
                  aria-hidden="true"
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-muted text-xs text-muted-foreground transition-transform duration-200 group-open:rotate-180 group-open:text-primary"
                >
                  ▾
                </span>
              </summary>
              <div className="px-5 pb-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
