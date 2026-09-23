import { faqData } from '@/lib/seo-config';
import { NativeAd } from '@/components/ads/ad-banner';

// Server component using native <details>/<summary> so every Q&A pair is
// present in the served HTML (AEO extraction) and works without JS.
// The expand affordance is the browser's own, which is accessible by default.
export function FAQSection() {
  // Renders the full faqData list — the same source the homepage FAQPage
  // schema is built from, so structured data always matches visible HTML.
  const visibleFaqs = faqData;

  return (
    <section id="faq-section" className="py-16 md:py-20 bg-muted/20 border-t border-border/50">
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">FAQ</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mt-3 mb-4">
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
              className="group rounded-2xl border bg-card/60 dark:bg-card/40 backdrop-blur-sm overflow-hidden transition-all duration-300 border-border/60 hover:border-primary/15 open:border-primary/30 open:shadow-lg open:shadow-primary/5"
            >
              <summary className="w-full flex items-center justify-between p-5 text-left hover:bg-primary/[0.02] transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="font-semibold text-sm pr-4">{faq.question}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 bg-muted group-open:bg-primary/10 group-open:rotate-180">
                  <svg
                    className="w-4 h-4 text-muted-foreground group-open:text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </summary>
              <div className="px-5 pb-5 flex gap-3">
                <div className="w-0.5 rounded-full bg-gradient-to-b from-primary/60 via-violet-500/40 to-transparent flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}

          <div className="py-4">
            <NativeAd />
          </div>
        </div>
      </div>
    </section>
  );
}
