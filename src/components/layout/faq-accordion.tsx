import { ChevronDown } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

// Server-rendered native <details>/<summary> accordion so all 83 tools' FAQ
// Q&A text lands in the served static HTML for answer engines (AEO/GEO),
// crawlers, and no-JS visitors while preserving sleek styling and interaction.
export function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
  return (
    <div className="space-y-2.5 mt-4" role="region" aria-label="Tool FAQ Section">
      {faqs.map((faq, i) => (
        <FAQItem key={i} question={faq.question} answer={faq.answer} index={i} />
      ))}
    </div>
  );
}

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const badge = String(index + 1).padStart(2, '0');

  return (
    <details
      className="group rounded-xl border border-border/40 overflow-hidden transition-all duration-300 hover:border-primary/20 open:border-primary/30 open:shadow-sm open:shadow-primary/5 open:bg-gradient-to-r open:from-primary/[0.02] open:to-transparent"
    >
      <summary className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-300 bg-muted/60 text-muted-foreground group-open:bg-gradient-to-br group-open:from-primary group-open:to-sky-500 group-open:text-white group-open:shadow-sm group-open:shadow-primary/20">
          {badge}
        </span>
        <span className="font-medium text-sm flex-1 pr-4 text-foreground">{question}</span>
        <span className="shrink-0 transition-transform duration-200 group-open:rotate-180">
          <ChevronDown className="w-4 h-4 text-muted-foreground group-open:text-primary" />
        </span>
      </summary>
      <div className="border-l-2 border-l-primary/40 mx-5 pb-4 pt-1 pl-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {answer}
        </p>
      </div>
    </details>
  );
}
