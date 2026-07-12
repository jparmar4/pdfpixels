import type { Metadata } from 'next';
import { LegalMetaRow, LegalPageLayout } from '@/components/layout/legal-page-layout';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for PdfPixels - the rules and limitations that apply when using the platform.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsOfService() {
  const updatedAt = 'February 20, 2026';

  return (
    <LegalPageLayout
      title="Terms of Service"
      description="The conditions that govern access to PdfPixels, acceptable use of the tools, intellectual property, and platform limitations."
      updatedAt={updatedAt}
      iconName="file-text"
      actions={<LegalMetaRow updatedAt={updatedAt} />}
    >
      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using PdfPixels, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>PdfPixels provides browser-based image and PDF processing tools, including but not limited to:</p>
        <ul>
          <li>Image compression, resizing, and format conversion.</li>
          <li>Image editing such as rotation, cropping, and effects.</li>
          <li>PDF merging, splitting, compression, and conversion.</li>
          <li>AI-assisted enhancement and background workflows where available.</li>
        </ul>
        <p>
          The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. Availability, speed, and output quality can vary depending on input files and infrastructure conditions.
        </p>
      </section>

      <section>
        <h2>3. User Responsibilities</h2>
        <h3>3.1 Acceptable Use</h3>
        <p>You agree not to use the Service for unlawful or abusive purposes. You must not:</p>
        <ul>
          <li>Upload illegal, harmful, or infringing content.</li>
          <li>Attempt to disrupt, overload, or reverse engineer the platform.</li>
          <li>Use automated access in a way that harms service stability.</li>
          <li>Upload malware or other harmful code.</li>
          <li>Use the platform to violate applicable laws or rights of others.</li>
        </ul>

        <h3>3.2 File Uploads</h3>
        <p>By uploading files, you confirm that:</p>
        <ul>
          <li>You have the right to upload and process them.</li>
          <li>The files do not contain prohibited content.</li>
          <li>You understand quality and output may vary by workflow.</li>
          <li>You are responsible for keeping your own backups.</li>
        </ul>
      </section>

      <section>
        <h2>4. Intellectual Property</h2>
        <h3>4.1 Your Content</h3>
        <p>
          You retain ownership of files you upload. We do not claim ownership of your content solely because you use the Service.
        </p>

        <h3>4.2 Our Platform</h3>
        <p>
          The Service, including branding, design, code, and platform features, is owned by PdfPixels and protected by applicable intellectual property laws.
        </p>

        <h3>4.3 Limited License</h3>
        <p>
          We grant you a limited, non-exclusive, revocable license to use the Service in accordance with these Terms.
        </p>
      </section>

      <section>
        <h2>5. Disclaimers</h2>
        <p>
          The Service is provided without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.
        </p>
        <p>We do not guarantee that:</p>
        <ul>
          <li>The Service will always be uninterrupted or error-free.</li>
          <li>Every output will match your exact requirements.</li>
          <li>Any errors will always be corrected immediately.</li>
        </ul>
      </section>

      <section>
        <h2>6. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, PdfPixels and its affiliates will not be liable for indirect, incidental, special, consequential, or punitive damages arising from use of the Service.
        </p>
      </section>

      <section>
        <h2>7. Indemnification</h2>
        <p>
          You agree to indemnify and hold PdfPixels harmless from claims, damages, and costs arising out of your misuse of the Service or violation of these Terms.
        </p>
      </section>

      <section>
        <h2>8. Privacy</h2>
        <p>
          Use of the Service is also governed by the <a href="/privacy">Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2>9. Third-Party Links</h2>
        <p>
          The Service may link to third-party websites and services. We are not responsible for their content, policies, or operations.
        </p>
      </section>

      <section>
        <h2>10. Service Changes</h2>
        <p>
          We may modify, suspend, or discontinue parts of the Service at any time, including features, limits, or access methods.
        </p>
      </section>

      <section>
        <h2>11. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the United States, without regard to conflict-of-law principles.
        </p>
      </section>

      <section>
        <h2>12. Changes to Terms</h2>
        <p>
          We may revise these Terms from time to time. Continued use of the Service after updates are posted constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2>13. Contact</h2>
        <div className="legal-callout">
          <p><strong>Email:</strong> <a href="mailto:support@pdfpixels.com">support@pdfpixels.com</a></p>
          <p><strong>Contact page:</strong> <a href="https://www.pdfpixels.com/contact">https://www.pdfpixels.com/contact</a></p>
        </div>
      </section>
    </LegalPageLayout>
  );
}
