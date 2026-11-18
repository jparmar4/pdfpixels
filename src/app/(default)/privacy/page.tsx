import type { Metadata } from 'next';
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
        <h3>2.1 Files You Upload & Data Handling</h3>
        <p>When you use image or PDF tools on PdfPixels, we strictly prioritize your document privacy through minimal, temporary processing:</p>
        <ul>
          <li><strong>Client-Side Processing (Zero Server Transmission):</strong> The majority of our browser tools (such as image cropping, resizing, canvas filtering, rotation, and client-side PDF utilities) execute entirely inside your local web browser via HTML5 Canvas and WebAssembly. Your files stay on your local device and are never transmitted to or processed by our servers.</li>
          <li><strong>Server-Side Processing:</strong> For advanced workflows that require backend computing (such as HEIC photo decoding, optical character recognition (OCR), or complex multi-page PDF rendering), files are transmitted to our secure servers solely to complete the requested operation.</li>
          <li><strong>Zero Permanent Storage (60-Minute Purge SLA):</strong> Files uploaded for server processing are stored in isolated, temporary volatile storage for the duration of your session. Temporary files are automatically deleted immediately upon task completion or purged by automated cleanup cycles within 60 minutes. We never store, archive, or retain your files permanently.</li>
          <li><strong>No Content Inspection or Indexing:</strong> We do not inspect, read, sell, share, or use your uploaded files or document contents for artificial intelligence training, search engine indexing, or public distribution.</li>
          <li><strong>Encrypted in Transit:</strong> All data transmitted between your browser and our servers is protected using industry-standard TLS 1.3 / HTTPS encryption.</li>
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
        <h2>4. Advertising & Google AdSense Disclosures</h2>
        <p>
          We use Google AdSense and other third-party advertising vendors to serve advertisements when you visit our website. These companies may use cookies, web beacons, and similar tracking technologies to collect non-personally identifiable information (such as browser type, IP address, time and date, subject of advertisements clicked or scrolled over) during your visits to this and other websites in order to provide advertisements about goods and services likely to be of greater interest to you.
        </p>
        <h3>4.1 Google DoubleClick DART Cookie</h3>
        <p>
          Google, as a third-party vendor, uses cookies to serve ads on PdfPixels. Google&apos;s use of the DART cookie enables it to serve ads to our users based on their visit to our site and other sites on the Internet. Users may opt out of the use of the DART cookie by visiting the Google Ad and Content Network Privacy Policy at{' '}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">https://policies.google.com/technologies/ads</a>.
        </p>
        <p>
          You can customize or opt out of personalized advertising at any time by visiting{' '}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>. You can also learn how Google processes data across its partner network at{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses information from sites or apps that use our services</a>.
        </p>
        <ul>
          <li><a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a></li>
          <li><a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Google Partner Sites Policy</a></li>
          <li><a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance (DAA) Opt-Out</a></li>
          <li><a href="https://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer">Network Advertising Initiative (NAI) Opt-Out</a></li>
        </ul>
        <p>
          You can also configure or revoke your advertising cookie consent at any time via the cookie preferences button in our footer or banner. Non-personalized ads (NPA) will be served when consent is withheld.
        </p>
      </section>

      <section id="cookies">
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
          <li><strong>TLS 1.3 Transport Encryption:</strong> End-to-end cryptographic protection for all browser-to-server data transfers.</li>
          <li><strong>Ephemeral Processing:</strong> In-memory and volatile execution environments where files are automatically expunged after processing.</li>
          <li><strong>Automated 60-Minute Purge:</strong> Scheduled daemon processes that scrub all temporary directories on backend servers every hour.</li>
          <li><strong>Restricted Infrastructure Access:</strong> Principle of least privilege, strict network firewalls, and comprehensive intrusion monitoring.</li>
          <li><strong>Zero Persistent Storage:</strong> No permanent relational database or object bucket storage of customer file payloads.</li>
        </ul>
        <p>
          While no digital transmission or electronic storage method can guarantee 100% absolute security, we engineer our pipelines with security-by-default and zero-retention principles to minimize risk.
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
        <h2>9. Your Privacy Rights (GDPR, UK GDPR, CCPA/CPRA)</h2>
        <h3>9.1 European Economic Area (EEA) and UK Residents (GDPR)</h3>
        <p>If you are an EEA or UK resident, you have the following data protection rights under the General Data Protection Regulation (GDPR):</p>
        <ul>
          <li><strong>Right of Access:</strong> Request a copy of personal information we maintain.</li>
          <li><strong>Right to Rectification:</strong> Request correction of inaccurate personal data.</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your personal information.</li>
          <li><strong>Right to Restrict or Object:</strong> Object to processing or request restricted handling.</li>
          <li><strong>Right to Withdraw Consent:</strong> Revoke cookie or marketing consent at any time.</li>
        </ul>

        <h3>9.2 California Residents (CCPA / CPRA)</h3>
        <p>
          Under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), California consumers have specific rights:
        </p>
        <ul>
          <li><strong>Right to Know:</strong> Know what categories of personal information are collected and how they are used.</li>
          <li><strong>Right to Delete:</strong> Request deletion of personal information collected from you.</li>
          <li><strong>Do Not Sell or Share My Personal Information:</strong> We do not sell user personal data or file contents. We use third-party advertising partners like Google AdSense who may collect browsing identifiers. You may opt out of personalized ads via our cookie consent settings or through global privacy control signals.</li>
          <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
        </ul>
        <p>To exercise any of these rights, contact us at <a href="mailto:support@pdfpixels.com">support@pdfpixels.com</a>.</p>
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
