import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Shield, Globe, Users } from 'lucide-react';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'About Us - PdfPixels | Free Online Image & PDF Tools',
  description: 'Learn about PdfPixels - Free online image and PDF processing tools. Compress, resize, convert images and manage PDFs with no registration required.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  const stats = [
    { label: 'Free Tools', value: '55+' },
    { label: 'Uptime', value: '99.9%' },
    { label: 'Cost', value: 'Free' },
    { label: 'Registration', value: 'None' },
  ];

  const values = [
    {
      icon: Zap,
      title: 'Speed & Efficiency',
      description: 'Our optimized infrastructure processes images with lightning speed, delivering results in seconds.',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Privacy-focused processing with secure transport and temporary cleanup on supported workflows.',
    },
    {
      icon: Globe,
      title: 'Free for Everyone',
      description: 'All our tools are completely free with no hidden fees, no watermarks, and no registration required.',
    },
    {
      icon: Users,
      title: 'User-Focused',
      description: 'We continuously improve based on user feedback, adding new features and optimizing existing ones.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl relative">
            <div className="text-center">
              <Badge className="mb-4">About Us</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Making Image & PDF Editing <span className="gradient-text">Accessible to Everyone</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                PdfPixels is a free online platform providing professional-grade image and PDF
                processing tools. No signup, no watermarks, no hidden costs.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y border-border bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground">
                At PdfPixels, we believe that powerful image editing tools should be accessible
                to everyone, regardless of technical expertise or budget. Our mission is to provide
                a comprehensive suite of free, professional-grade tools that help individuals and
                businesses process their images and documents efficiently.
              </p>
              <p className="text-lg text-muted-foreground">
                We understand the frustration of complex software installations, expensive
                subscriptions, and limited free tools. That&apos;s why we&apos;ve built a platform that
                works directly in your browser, requires no registration, and delivers instant
                results without compromising on quality.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value) => (
                <div
                  key={value.title}
                  className="p-6 rounded-2xl bg-card border border-border"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Offer Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">What We Offer</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-lg text-muted-foreground text-center mb-8">
                Our platform provides a comprehensive set of tools for all your image and PDF needs:
              </p>
              <div className="grid md:grid-cols-2 gap-6 not-prose">
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h3 className="font-semibold text-lg mb-3">Image Tools</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>✓ Image compression and optimization</li>
                    <li>✓ Resize by pixels, centimeters, or inches</li>
                    <li>✓ Format conversion (JPG, PNG, WebP, HEIC)</li>
                    <li>✓ Rotation, cropping, and flipping</li>
                    <li>✓ Filters and effects</li>
                    <li>✓ AI-powered background removal</li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h3 className="font-semibold text-lg mb-3">PDF Tools</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>✓ Merge multiple PDFs</li>
                    <li>✓ Split PDF into pages</li>
                    <li>✓ Compress PDF files</li>
                    <li>✓ PDF to image conversion</li>
                    <li>✓ Image to PDF conversion</li>
                    <li>✓ Page extraction and reordering</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy & Security Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-8">Your Privacy Matters</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-8">
                We take your privacy seriously. Here&apos;s how we protect your data:
              </p>
              <div className="grid md:grid-cols-3 gap-6 not-prose">
                <div className="p-6 rounded-2xl bg-card border border-border text-center">
                  <div className="text-3xl mb-3">🔒</div>
                  <h3 className="font-semibold mb-2">256-bit SSL</h3>
                  <p className="text-sm text-muted-foreground">All data transfers are encrypted with industry-standard SSL encryption.</p>
                </div>
                <div className="p-6 rounded-2xl bg-card border border-border text-center">
                  <div className="text-3xl mb-3">🗑️</div>
                  <h3 className="font-semibold mb-2">Auto-Delete</h3>
                  <p className="text-sm text-muted-foreground">Your files are automatically deleted from our servers within 1 hour.</p>
                </div>
                <div className="p-6 rounded-2xl bg-card border border-border text-center">
                  <div className="text-3xl mb-3">🛡️</div>
                  <h3 className="font-semibold mb-2">GDPR Compliant</h3>
                  <p className="text-sm text-muted-foreground">We comply with GDPR and respect your data privacy rights.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8 max-w-2xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Try our free image and PDF tools today. No signup required.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/">
                <Button size="lg" className="gap-2">
                  Start Using Tools
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="gap-2">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
