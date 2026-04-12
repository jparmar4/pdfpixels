import type { Metadata } from 'next';
import { Shield } from 'lucide-react';
import { CookieActions, LegalMetaRow, LegalPageLayout } from '@/components/layout/legal-page-layout';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for PdfPixels - Learn how we collect, use, and protect personal information on the platform.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPolicy() {
  const updatedAt = 'February 20, 2026';

  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="How PdfPixels handles uploads, analytics, advertising, cookies, and user privacy rights across the platform."
      updatedAt={updatedAt}
      iconName="shield"
      actions={<><LegalMetaRow updatedAt={updatedAt} /><CookieActions /></>}
    >
      <section>
        <h2>1. Introduction</h2>
        <p>
          Welcome to PdfPixels (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and handling personal information responsibly. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use pdfpixels.com and related services.
        </p>
        <p>
          By using the Service, you agree to the practices described in this policy. If you do not agree, please do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <h3>2.1 Files You Upload</h3>
        <p>When you use image or PDF tools, files may be uploaded for processing. We aim to keep that handling narrow and temporary:</p>
        <ul>
          <li>Uploaded files are processed for the requested workflow and deleted automatically on supported server-side flows.</li>
          <li>We do not treat uploaded files as user content for publication or indexing.</li>
          <li>Uploaded files are not shared with third parties except where required for infrastructure operation.</li>
          <li>Transport is secured using encrypted connections.</li>
        </ul>

        <h3>2.2 Automatically Collected Information</h3>
        <p>We may automatically collect limited technical and usage information, including:</p>
        <ul>
          <li><strong>Device information:</strong> browser, operating system, and device type.</li>
          <li><strong>Usage data:</strong> pages visited, tools used, and interaction timing.</li>
          <li><strong>IP address:</strong> used for security, performance, and analytics.</li>
          <li><strong>Cookies and similar technologies:</strong> as outlined below.</li>
        </ul>

        <h3>2.3 Third-Party Information</h3>
        <p>
          We may receive information from analytics and advertising providers to improve the Service and help fund the platform.
        </p>
      </section>

      <section>
        <h2>3. How We Use Information</h2>
        <ul>
          <li>To provide, maintain, and improve image and PDF workflows.</li>
          <li>To analyze usage patterns and improve user experience.</li>
          <li>To detect abuse, fraud, and security risks.</li>
          <li>To display advertisements through Google AdSense or related partners.</li>
          <li>To communicate about service updates when appropriate.</li>
          <li>To comply with legal obligations.</li>
        </ul>
      </section>

      <section>
        <h2>4. Advertising</h2>
        <p>
          We use Google AdSense to display advertisements. Google and other vendors may use cookies to serve ads based on prior visits to this and other websites.
        </p>
        <ul>
          <li><a href="https://www.google.com/settings/ads">Google Ads Settings</a></li>
          <li><a href="https://www.aboutads.info/choices/">Digital Advertising Alliance</a></li>
          <li><a href="https://www.networkadvertising.org/choices/">Network Advertising Initiative</a></li>
        </ul>
        <p>
          You can opt out of certain personalized advertising experiences using the links above.
        </p>
      </section>

      <section>
        <h2>5. Cookies and Tracking Technologies</h2>
        <p>We use cookies and similar technologies to support the Service and understand performance.</p>
        <ul>
          <li><strong>Essential cookies:</strong> required for core functionality.</li>
          <li><strong>Analytics cookies:</strong> help us understand usage patterns.</li>
          <li><strong>Advertising cookies:</strong> support relevant ads and monetization.</li>
          <li><strong>Preference cookies:</strong> remember settings and consent choices.</li>
        </ul>
        <p>
          You can control cookies through browser settings, but disabling them may affect parts of the Service.
        </p>
      </section>

      <section>
        <h2>6. Data Security</h2>
        <p>We use reasonable technical and organizational measures to protect information, including:</p>
        <ul>
          <li>Encrypted transport for website and tool interactions.</li>
          <li>Infrastructure-level access controls and monitoring.</li>
          <li>Temporary handling and cleanup of processed files on supported flows.</li>
          <li>Ongoing operational review as the platform evolves.</li>
        </ul>
        <p>
          No internet-connected system is perfectly secure, so we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>7. Third-Party Services</h2>
        <p>
          The Service may integrate with or link to third-party services such as analytics providers, advertising platforms, and infrastructure vendors. Their privacy practices are governed by their own policies.
        </p>
      </section>

      <section>
        <h2>8. Children&apos;s Privacy</h2>
        <p>
          The Service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
        </p>
      </section>

      <section>
        <h2>9. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have rights that include:</p>
        <ul>
          <li>Access to personal data we hold about you.</li>
          <li>Correction of inaccurate data.</li>
          <li>Deletion of certain personal data.</li>
          <li>Restriction or objection to certain processing.</li>
          <li>Data portability where applicable.</li>
          <li>Opt-out rights under applicable regional law.</li>
        </ul>
        <p>To make a request, contact <a href="mailto:support@pdfpixels.com">support@pdfpixels.com</a>.</p>
      </section>

      <section>
        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes become effective when posted on this page with an updated revision date.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <div className="legal-callout">
          <p><strong>Email:</strong> <a href="mailto:support@pdfpixels.com">support@pdfpixels.com</a></p>
          <p><strong>Contact page:</strong> <a href="https://www.pdfpixels.com/contact">https://www.pdfpixels.com/contact</a></p>
        </div>
      </section>
    </LegalPageLayout>
  );
}
