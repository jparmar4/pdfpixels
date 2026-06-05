import Link from 'next/link';
import { ChevronDown, CheckCircle2, Users, Sparkles, Shield, FileType, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { toolContentMap, type ToolContent } from '@/lib/tool-content-data';
import { getToolBySlug, type Tool } from '@/lib/tools-data';
import { blogPosts } from '@/config/blog';
import { FAQAccordion } from '@/components/layout/faq-accordion';
import { InContentAd } from '@/components/ads/ad-banner';

/* ── Gradient accent line for section headers ── */
function SectionHeader({ icon: Icon, iconColor = 'text-primary', children }: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="h-1 w-16 rounded-full bg-gradient-to-r from-primary via-sky-400 to-emerald-400" />
      <h2 className="text-xl font-bold flex items-center gap-2.5">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        {children}
      </h2>
    </div>
  );
}

function SubHeader({ icon: Icon, iconColor = 'text-primary', children }: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="h-[3px] w-12 rounded-full bg-gradient-to-r from-primary/80 to-sky-400/60" />
      <h3 className="text-lg font-semibold flex items-center gap-2.5">
        <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
        {children}
      </h3>
    </div>
  );
}

/* ── Related Tool Card ── */
function RelatedToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-primary/40 hover:bg-muted/30 transition-all duration-200"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{tool.name}</p>
        <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

/* ── How It Works Step ── */
function StepItem({ number, title, description, isLast }: { number: number; title: string; description: string; isLast: boolean }) {
  return (
    <div className="flex gap-4">
      {/* Connecting line and step number */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky-500 text-white text-xs font-bold shadow-sm shadow-primary/20 ring-4 ring-primary/10">
          {number}
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-gradient-to-b from-primary/30 to-primary/5 mt-1" />
        )}
      </div>
      {/* Content */}
      <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
        <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ── Related Article Card ── */
function RelatedArticleCard({ slug, title, excerpt, date, readTime }: {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
}) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group block rounded-xl border border-border/40 p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-sm hover:shadow-primary/5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-sky-500/10 text-primary group-hover:from-primary/20 group-hover:to-sky-500/20 transition-colors">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
            {title}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{excerpt}</p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>{date}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {readTime}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Find related blog posts by matching tool slug keywords to blog post keywords ── */
function findRelatedArticles(toolSlug: string, toolName: string): typeof blogPosts {
  const slugParts = toolSlug.split('-').filter(Boolean);
  const keywords = slugParts.length > 0 ? slugParts : [toolName.toLowerCase()];

  const scored = blogPosts
    .map((post) => {
      let score = 0;
      const postKeywordsLower = post.keywords.map((k) => k.toLowerCase());
      const titleLower = post.title.toLowerCase();
      const excerptLower = post.excerpt.toLowerCase();

      for (const kw of keywords) {
        if (kw.length < 2) continue;
        for (const pk of postKeywordsLower) {
          if (pk.includes(kw)) score += 2;
        }
        if (titleLower.includes(kw)) score += 1;
        if (excerptLower.includes(kw)) score += 1;
      }
      return { post, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map((item) => item.post);
}

/* ── Main Component ── */
export function ToolContentSection({ toolSlug, toolName, isAI, processing }: {
  toolSlug: string;
  toolName: string;
  isAI?: boolean;
  processing: 'client' | 'server' | 'ai';
}) {
  const content = toolContentMap[toolSlug];
  const relatedArticles = findRelatedArticles(toolSlug, toolName);

  // Fallback for tools without content data
  if (!content) {
    return (
      <section className="container mx-auto px-4 lg:px-8 py-12 border-t border-border/30">
        <div className="max-w-3xl mx-auto">
          <SectionHeader icon={Sparkles} iconColor="text-primary">
            About {toolName}
          </SectionHeader>
          <p className="text-muted-foreground text-sm leading-relaxed mt-4">
            {toolName} is a free online tool by PdfPixels.
            {processing === 'client' ? ' All processing happens in your browser — your files never leave your device.' : ' Files are processed securely on our servers and automatically deleted.'}
            {isAI && ' Powered by advanced AI technology for professional-quality results.'}
            {' '}No registration, no watermarks, completely free.
          </p>

          {/* Related articles even in fallback */}
          {relatedArticles.length > 0 && (
            <div className="mt-10">
              <SubHeader icon={BookOpen} iconColor="text-sky-500">
                Related Articles
              </SubHeader>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {relatedArticles.map((article) => (
                  <RelatedArticleCard
                    key={article.slug}
                    slug={article.slug}
                    title={article.title}
                    excerpt={article.excerpt}
                    date={article.date}
                    readTime={article.readTime}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  const relatedTools = content.relatedTools
    .map(slug => getToolBySlug(slug))
    .filter((t): t is Tool => !!t);

  return (
    <section className="container mx-auto px-4 lg:px-8 py-12 border-t border-border/30">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* About Section */}
        <div>
          <SectionHeader icon={Sparkles} iconColor="text-primary">
            About {toolName}
          </SectionHeader>
          <p className="text-muted-foreground text-sm leading-relaxed mt-4">
            {content.about}
          </p>
        </div>

        {/* Key Features */}
        <div>
          <SubHeader icon={CheckCircle2} iconColor="text-emerald-500">
            Key Features
          </SubHeader>
          <ul className="grid sm:grid-cols-2 gap-3 mt-4">
            {content.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Use Cases */}
        <div>
          <SubHeader icon={Users} iconColor="text-sky-500">
            Who Uses This Tool?
          </SubHeader>
          <ul className="space-y-2.5 mt-4">
            {content.useCases.map((useCase, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-500 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                {useCase}
              </li>
            ))}
          </ul>
        </div>

        {/* How to Use */}
        <div>
          <SubHeader icon={Sparkles} iconColor="text-violet-500">
            How to Use {toolName}
          </SubHeader>
          <div className="mt-4 space-y-0">
            <StepItem
              number={1}
              title="Upload"
              description={`Drag and drop your file or click to browse. Supports ${content.supportedFormats}.`}
              isLast={false}
            />
            <StepItem
              number={2}
              title="Configure"
              description="Adjust settings like quality, size, effects, or format to match your needs."
              isLast={false}
            />
            <StepItem
              number={3}
              title="Download"
              description={`Click process and download your result. ${processing === 'ai' ? 'AI processing takes 10-30 seconds.' : 'Results are instant.'}`}
              isLast={true}
            />
          </div>
        </div>

        {/* High RPM InContent Ad unit */}
        <InContentAd />

        {/* FAQ Accordion */}
        {content.faqs.length > 0 && (
          <div>
            <SubHeader icon={BookOpen} iconColor="text-amber-500">
              Frequently Asked Questions
            </SubHeader>
            <FAQAccordion faqs={content.faqs} />
          </div>
        )}

        {/* Trust Signals */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full">
            <Shield className="w-3.5 h-3.5" /> 100% Free — No Signup
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full">
            <Shield className="w-3.5 h-3.5" /> {processing === 'client' ? 'Client-Side — Files Never Uploaded' : 'Secure Server — Auto-Deleted'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full">
            <FileType className="w-3.5 h-3.5" /> {content.supportedFormats}
          </div>
          {isAI && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> AI-Powered
            </div>
          )}
        </div>

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <div>
            <SubHeader icon={ArrowRight} iconColor="text-primary">
              Related Tools
            </SubHeader>
            <div className="grid sm:grid-cols-2 gap-2.5 mt-4">
              {relatedTools.map(rt => (
                <RelatedToolCard key={rt.id} tool={rt} />
              ))}
            </div>
          </div>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div>
            <SubHeader icon={BookOpen} iconColor="text-sky-500">
              Related Articles
            </SubHeader>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {relatedArticles.map((article) => (
                <RelatedArticleCard
                  key={article.slug}
                  slug={article.slug}
                  title={article.title}
                  excerpt={article.excerpt}
                  date={article.date}
                  readTime={article.readTime}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
