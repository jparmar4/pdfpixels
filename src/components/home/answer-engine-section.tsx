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
  {
    question: 'How do I convert HEIC photos from iPhone to JPG?',
    answer: 'Open the HEIC to JPG converter, upload your photo, and download a widely compatible JPG ready for email, web, or forms.',
    href: '/tools/heic-to-jpg',
    cta: 'Open HEIC to JPG',
  },
  {
    question: 'How can I remove an image background for free?',
    answer: 'Use Remove Background on PdfPixels: upload a photo, let AI isolate the subject, and download a transparent PNG with no signup.',
    href: '/tools/remove-image-background',
    cta: 'Remove Background',
  },
  {
    question: 'How do I increase image file size for upload portals?',
    answer: 'If a form rejects files under a minimum KB size, use Increase Image Size, set the target KB, and download a larger-compliant file.',
    href: '/tools/increase-image-size-in-kb',
    cta: 'Increase Image Size',
  },
  {
    question: 'How do I convert a PDF bank statement to Excel or CSV for QuickBooks and Xero?',
    answer: 'Open the Bank Statement to Excel tool, upload your digital or scanned bank statement PDF, and extract transaction tables into a clean XLSX or CSV spreadsheet. All account numbers and balances are processed locally in your browser without cloud uploads.',
    href: '/tools/bank-statement-to-excel',
    cta: 'Convert Bank Statement',
  },
  {
    question: 'How do I permanently redact confidential text and Bates stamp legal PDFs?',
    answer: 'Use Redact PDF to burn black redaction boxes directly into the page image and strip hidden text layers or metadata, then apply sequential court exhibit labels with Bates Numbering PDF before e-filing.',
    href: '/tools/redact-pdf',
    cta: 'Redact PDF Permanently',
  },
];

export function AnswerEngineSection() {
  return (
    <section className="border-t border-border/50 bg-background py-16 md:py-20" aria-labelledby="aeo-heading">
      <div className="container mx-auto max-w-6xl px-4 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Search and AI answers
          </span>
          <h2 id="aeo-heading" className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Direct answers for common PDF and image tasks
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
            PdfPixels is built for high-intent workflows: reduce file size, combine documents, convert formats, prepare application photos, and clean up files quickly on any modern device.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {answerCards.map((card) => (
            <article
              key={card.question}
              className="group card-shine flex h-full flex-col rounded-2xl border border-border/60 bg-card/75 p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-premium"
              itemScope
              itemType="https://schema.org/Question"
            >
              <h3 className="text-base font-bold leading-6 text-foreground transition-colors group-hover:text-primary" itemProp="name">
                {card.question}
              </h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" className="mt-3 flex-1">
                <p className="text-sm leading-6 text-muted-foreground" itemProp="text">
                  {card.answer}
                </p>
              </div>
              <Link
                href={card.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
              >
                {card.cta}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
