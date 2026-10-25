import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ChevronRight, HelpCircle, ShieldCheck, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { getRegionByCode } from '@/lib/geo-data';
import { INDIAN_EXAM_PRESETS, getExamBySlug, type IndianExamPreset } from '@/lib/indian-exams-data';
import { IndianExamBundleWorkspace } from '@/components/layout/indian-exam-bundle-workspace';
import { siteConfig } from '@/lib/seo-config';
import { absoluteUrl } from '@/lib/seo';

interface IndianExamPageProps {
  params: Promise<{ region: string; slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return INDIAN_EXAM_PRESETS.map((exam) => ({
    region: 'in',
    slug: exam.slug,
  }));
}

export async function generateMetadata({ params }: IndianExamPageProps): Promise<Metadata> {
  const { region, slug } = await params;
  if (region !== 'in') return { title: 'Not Found | PdfPixels' };

  const exam = getExamBySlug(slug);
  if (!exam) return { title: 'Exam Tool Not Found | PdfPixels' };

  const title = `${exam.name} — Free Online Form Tool`;
  const description = `Prepare your photo and signature for ${exam.name} (${exam.authority}). Auto-crop to ${exam.photoSpec.widthMm}x${exam.photoSpec.heightMm}mm, compress to ${exam.photoSpec.minKb}-${exam.photoSpec.maxKb} KB, print applicant name & date of photo, and download 1-click exam pack.`;
  const canonicalUrl = absoluteUrl(`/in/${exam.slug}`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      locale: 'en_IN',
      siteName: siteConfig.name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    keywords: [
      `${exam.shortName.toLowerCase()} photo resizer`,
      `${exam.shortName.toLowerCase()} signature resizer`,
      `${exam.shortName.toLowerCase()} photo size in kb`,
      `${exam.shortName.toLowerCase()} photo with name and date`,
      `${exam.shortName.toLowerCase()} photo dimensions`,
      `${exam.slug}`,
      'indian exam photo resizer',
      'sarkari exam photo compressor',
      'passport size photo with name and date',
      'pdfpixels in',
    ],
  };
}

export default async function IndianExamPage({ params }: IndianExamPageProps) {
  const { region, slug } = await params;
  if (region !== 'in') notFound();

  const exam = getExamBySlug(slug);
  if (!exam) notFound();

  const relatedExams = INDIAN_EXAM_PRESETS
    .filter((e) => e.slug !== exam.slug && (e.category === exam.category || e.category === 'SSC' || e.category === 'UPSC'))
    .slice(0, 8);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: exam.name,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'All',
        url: absoluteUrl(`/in/${exam.slug}`),
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'INR',
        },
        description: `Browser-based photo, signature, and exam bundle tool calibrated to official ${exam.authority} recruitment specifications.`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: absoluteUrl('/'),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'India Exam Hub',
            item: absoluteUrl('/in'),
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: exam.shortName,
            item: absoluteUrl(`/in/${exam.slug}`),
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: exam.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Bar */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 lg:px-8 py-2.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <Link href="/in" className="hover:text-foreground transition-colors">India Hub</Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-semibold truncate max-w-[240px]">{exam.shortName}</span>
          </nav>
        </div>
      </div>

      {/* Main Interactive Tool Workspace */}
      <IndianExamBundleWorkspace exam={exam} />

      {/* Informational & SEO Editorial Section */}
      <div className="container mx-auto px-4 lg:px-8 py-12 max-w-5xl space-y-12">
        {/* Portal Rules & Specifications Guide */}
        <section className="bg-card border rounded-3xl p-6 lg:p-8 space-y-6 shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Official Guidelines & Scrutiny Rules
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              How to Format Your Photo & Signature for {exam.shortName}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every year thousands of candidates face application rejection during the scrutiny stage of {exam.authority} examinations due to minor discrepancies in photograph dimensions, lack of stamped date of photo (DOP), or oversized signature files. Here is the verified official criteria:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border bg-muted/20 space-y-2.5">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Photograph Specifications
              </h3>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li>• Dimensions: {exam.photoSpec.widthMm}mm width x {exam.photoSpec.heightMm}mm height ({exam.photoSpec.dpi} DPI).</li>
                <li>• File Size: Must strictly be between {exam.photoSpec.minKb} KB and {exam.photoSpec.maxKb} KB.</li>
                <li>• Background: {exam.photoSpec.background}.</li>
                <li>• Name & Date Stamp: {exam.photoSpec.requiresNameAndDate ? 'Mandatory candidate name and date of capture at bottom.' : 'Recommended for recent identity confirmation.'}</li>
                <li>• Appearance: 70-80% face coverage, both ears clearly visible, no spectacles with reflection or headwear.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl border bg-muted/20 space-y-2.5">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                Signature & Document Guidelines
              </h3>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li>• Signature Size: {exam.signatureSpec ? `${exam.signatureSpec.minKb} KB to ${exam.signatureSpec.maxKb} KB` : '10 KB to 20 KB'}.</li>
                <li>• Ink & Paper: Sign with a black ballpoint pen on plain unlined white paper.</li>
                <li>• Format: Running handwriting only. Signatures in ALL CAPITAL letters are automatically invalidated.</li>
                <li>• Dossier Bundle: Use our 1-click exam pack to generate a printable PDF with photo and specimen signature.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Step-by-Step Walkthrough */}
        <section className="bg-card border rounded-3xl p-6 lg:p-8 space-y-6 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            3 Simple Steps to Resize and Download Your {exam.shortName} Application Pack
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2.5">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-sm text-foreground">Upload Your Image</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose any recent photo or selfie from your phone or PC. Our smart framing automatically aligns the 3.5x4.5 cm portrait ratio.
              </p>
            </div>
            <div className="space-y-2.5">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-sm text-foreground">Toggle Name & Date</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Switch on "Print Applicant Name & Date of Photo" and type your details. The banner renders cleanly at the bottom without blocking facial features.
              </p>
            </div>
            <div className="space-y-2.5">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-sm text-foreground">1-Click Exam Pack</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click download to get your perfectly compressed {exam.photoSpec.recommendedKb} KB JPEG image, or download the complete PDF dossier containing your photo and signature.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section (Rendered as native details for AEO and LLM crawlability) */}
        <section className="bg-card border rounded-3xl p-6 lg:p-8 space-y-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Frequently Asked Questions: {exam.shortName} Photo & Signature
            </h2>
            <p className="text-xs text-muted-foreground">Official portal requirements, sizing answers, and rejection prevention tips.</p>
          </div>

          <div className="space-y-3">
            {exam.faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-border/60 bg-muted/20 p-4 transition-colors open:bg-muted/40"
              >
                <summary className="cursor-pointer text-sm font-semibold text-foreground list-none flex items-center justify-between">
                  <span>{faq.question}</span>
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Related Exam Form Tools */}
        {relatedExams.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Other Popular Indian Exam Presets</h3>
                <p className="text-xs text-muted-foreground">One-click photo and signature formatting for major sarkari recruitments.</p>
              </div>
              <Link href="/in" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                View All India Tools <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {relatedExams.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/in/${rel.slug}`}
                  className="p-3.5 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-soft transition-all space-y-2 block"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {rel.category}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {rel.photoSpec.minKb}-{rel.photoSpec.maxKb} KB
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground line-clamp-2">
                    {rel.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {rel.photoSpec.widthMm}x{rel.photoSpec.heightMm}mm · {rel.photoSpec.requiresNameAndDate ? 'Name & Date' : 'Direct crop'}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
