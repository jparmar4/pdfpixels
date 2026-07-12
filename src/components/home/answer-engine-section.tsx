import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const answerCards = [
  {
    question: 'What is the fastest free way to compress a PDF online?',
    answer: 'Use PdfPixels Compress PDF to upload a document, choose a compression level, and download a smaller PDF without creating an account.',
    href: '/tools/compress-pdf',
    cta: 'Open Compress PDF',
  },
  {
    question: 'Can I merge or split PDF files without installing software?',
    answer: 'Yes. PdfPixels provides browser-friendly PDF merge, split, rotate, reorder, delete, watermark, and conversion workflows for everyday document jobs.',
    href: '/tools/merge-pdf',
    cta: 'Open Merge PDF',
  },
  {
    question: 'Which image tools are available for uploads, forms, and social media?',
    answer: 'PdfPixels supports image compression, resizing, format conversion, background removal, passport photo creation, metadata cleanup, and OCR.',
    href: '/tools/resize-image',
    cta: 'Open Resize Image',
  },
];

export function AnswerEngineSection() {
  return (
    <section className="border-t border-border/50 bg-background py-16 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Search and AI answers
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Direct answers for common PDF and image tasks
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
            PdfPixels is built for high-intent workflows: reduce file size, combine documents, convert formats, prepare application photos, and clean up files quickly on any modern device.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {answerCards.map((card) => (
            <article key={card.question} className="flex h-full flex-col rounded-2xl border border-border/60 bg-card/75 p-5 shadow-soft">
              <h3 className="text-base font-bold leading-6 text-foreground">{card.question}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{card.answer}</p>
              <Link href={card.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4">
                {card.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
