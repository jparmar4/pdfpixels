import type { Metadata } from 'next';
import { TriangleAlert } from 'lucide-react';
import { LegalMetaRow, LegalPageLayout } from '@/components/layout/legal-page-layout';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'Disclaimer for PdfPixels - important limitations and responsibility notes for using our image and PDF processing services.',
  alternates: {
    canonical: '/disclaimer',
  },
};

export default function DisclaimerPage() {
  const updatedAt = 'February 20, 2026';

  return (
    <LegalPageLayout
      title="Disclaimer"
      description="Important limitations, quality caveats, and user responsibility guidance for working with files through PdfPixels."
      updatedAt={updatedAt}
      iconName="triangle-alert"
      actions={<LegalMetaRow updatedAt={updatedAt} />}
    >
      <section>
        <h2>1. General Disclaimer</h2>
        <p>
          PdfPixels provides information and processing tools in good faith for general utility purposes. We make no representation or warranty regarding completeness, reliability, or fitness for a specific purpose.
        </p>
      </section>

      <section>
        <h2>2. Use at Your Own Risk</h2>
        <p>
          Your use of the Service is at your own risk. The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind.
        </p>
        <p>We do not warrant that:</p>
        <ul>
          <li>The Service will always be secure or continuously available.</li>
          <li>All defects or errors will be corrected immediately.</li>
          <li>The Service is free of harmful components.</li>
          <li>Results will always meet every specific requirement.</li>
        </ul>
      </section>

      <section>
        <h2>3. No Professional Advice</h2>
        <p>
          Content on the site is informational and operational in nature. It does not constitute legal, technical, compliance, or other professional advice.
        </p>
      </section>

      <section>
        <h2>4. Processing Results</h2>
        <p>Output quality can vary based on multiple factors, including:</p>
        <ul>
          <li>Source file quality and resolution.</li>
          <li>Selected format, compression, or resize settings.</li>
          <li>Complexity of the original document or image.</li>
          <li>Browser, device, and infrastructure constraints.</li>
        </ul>
        <p>
          You should keep backup copies of important files and verify outputs before relying on them in production or official workflows.
        </p>
      </section>

      <section>
        <h2>5. Third-Party Content</h2>
        <p>
          Links to third-party websites or services are provided for convenience. We do not control and are not responsible for their content, practices, or accuracy.
        </p>
      </section>

      <section>
        <h2>6. User Responsibility</h2>
        <p>Users are responsible for:</p>
        <ul>
          <li>Ensuring they have the right to process uploaded files.</li>
          <li>Maintaining backups of important content.</li>
          <li>Complying with copyright, privacy, and other applicable laws.</li>
          <li>Using the Service in accordance with the Terms of Service.</li>
        </ul>
      </section>

      <section>
        <h2>7. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, PdfPixels and its affiliates are not liable for indirect, incidental, special, consequential, or punitive damages arising from use of the Service.
        </p>
      </section>

      <section>
        <h2>8. Accuracy of Information</h2>
        <p>
          We do not guarantee that all information on the site is always complete, current, or error-free. Any reliance you place on the information is at your own risk.
        </p>
      </section>

      <section>
        <h2>9. Consent</h2>
        <p>
          By using the site, you agree to this disclaimer and the related platform terms.
        </p>
      </section>

      <section>
        <h2>10. Updates</h2>
        <p>
          We may revise this Disclaimer from time to time by posting an updated version on this page.
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
