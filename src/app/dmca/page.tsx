import type { Metadata } from 'next';
import { ShieldAlert } from 'lucide-react';
import { LegalMetaRow, LegalPageLayout } from '@/components/layout/legal-page-layout';

export const metadata: Metadata = {
  title: 'DMCA Policy - PdfPixels',
  description: 'DMCA Copyright Policy for PdfPixels, including reporting procedures and file-processing context.',
  alternates: {
    canonical: '/dmca',
  },
};

export default function DMCAPage() {
  const updatedAt = 'February 20, 2026';

  return (
    <LegalPageLayout
      title="DMCA Copyright Policy"
      description="How PdfPixels handles copyright complaints, counter-notices, and temporary file processing within the platform."
      updatedAt={updatedAt}
      iconName="shield-alert"
      actions={<LegalMetaRow updatedAt={updatedAt} />}
    >
      <section>
        <h2>1. Overview</h2>
        <p>
          PdfPixels respects the intellectual property rights of others and expects users to do the same. We respond to valid DMCA notices concerning alleged infringement connected to the Service.
        </p>
        <p>
          PdfPixels operates as a file-processing platform rather than a public content host. Uploaded files are processed for tool workflows and are not intended to remain publicly available.
        </p>
      </section>

      <section>
        <h2>2. Reporting Copyright Infringement</h2>
        <p>A DMCA notice should include:</p>
        <ol>
          <li>A physical or electronic signature of the copyright owner or authorized representative.</li>
          <li>Identification of the copyrighted work claimed to be infringed.</li>
          <li>Identification of the allegedly infringing material and enough detail to help locate it.</li>
          <li>Contact information for the complaining party.</li>
          <li>A good-faith statement that the use is not authorized.</li>
          <li>A statement under penalty of perjury that the notice is accurate and authorized.</li>
        </ol>
      </section>

      <section>
        <h2>3. Counter-Notification</h2>
        <p>If you believe material was removed or access was disabled by mistake, a counter-notice should include:</p>
        <ol>
          <li>Your physical or electronic signature.</li>
          <li>Identification of the removed or disabled material and its prior location.</li>
          <li>A good-faith statement that removal resulted from mistake or misidentification.</li>
          <li>Your contact details and consent to the appropriate legal jurisdiction.</li>
        </ol>
      </section>

      <section>
        <h2>4. Repeat Infringers</h2>
        <p>
          We may restrict or terminate access for users who are determined to be repeat infringers where appropriate.
        </p>
      </section>

      <section>
        <h2>5. File Processing and Deletion</h2>
        <p>Files uploaded to PdfPixels are intended to be:</p>
        <ul>
          <li>Processed in real time for the requested operation.</li>
          <li>Automatically deleted after processing on supported workflows.</li>
          <li>Unavailable for public indexing or publication.</li>
          <li>Not distributed to third parties except where required by infrastructure operation.</li>
        </ul>
        <p>
          Because processing is temporary, allegedly infringing material may no longer be present by the time a notice is reviewed. We still take valid notices seriously and will respond appropriately.
        </p>
      </section>

      <section>
        <h2>6. User Responsibility</h2>
        <p>By using the Service, you represent that:</p>
        <ul>
          <li>You own the content you upload or have proper authorization.</li>
          <li>Your use of the Service does not infringe the rights of others.</li>
          <li>You will not use the platform to process copyrighted material without permission.</li>
        </ul>
      </section>

      <section>
        <h2>7. Contact</h2>
        <div className="legal-callout">
          <p><strong>Email:</strong> <a href="mailto:support@pdfpixels.com">support@pdfpixels.com</a></p>
          <p><strong>Subject line:</strong> DMCA Takedown Notice</p>
          <p><strong>Contact page:</strong> <a href="https://www.pdfpixels.com/contact">https://www.pdfpixels.com/contact</a></p>
        </div>
        <p>
          Misrepresentations in a DMCA notice may create liability under applicable law.
        </p>
      </section>

      <section>
        <h2>8. Policy Changes</h2>
        <p>
          We may update this policy from time to time by posting an updated version on this page.
        </p>
      </section>
    </LegalPageLayout>
  );
}
