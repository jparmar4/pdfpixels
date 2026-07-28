export type UseCasePage = {
  slug: string;
  title: string;
  description: string;
  targetToolSlug: string;
  intent: string;
  /** Unique editorial body for AdSense/quality reviewers — not shared template copy */
  overview: string;
  whoItsFor: string[];
  steps: { title: string; description: string }[];
  tips: string[];
  pitfalls: { problem: string; solution: string }[];
  faqs: { question: string; answer: string }[];
};

export const useCasePages: UseCasePage[] = [
  {
    slug: 'compress-image-to-20kb',
    title: 'Compress Image to 20KB Online Free',
    description: 'Reduce JPG, PNG, or WebP images to around 20KB for forms and uploads without major quality loss.',
    targetToolSlug: 'compress-image',
    intent: 'compress image to 20kb',
    overview:
      'Many government forms, exam portals, and membership applications cap photo uploads at 20KB. A phone photo is usually 1–5MB, so naive resizing alone rarely hits that limit. The practical approach is to reduce dimensions first (face and document photos often only need 300–600px on the long edge), then compress to the 20KB target. PdfPixels Compress Image lets you set an exact KB target and preview the result before download. Expect some softness at 20KB — that is normal for such a tight budget — but ID-style photos with plain backgrounds usually stay readable.',
    whoItsFor: [
      'Students uploading photos to exam or scholarship portals',
      'Applicants filling government or bank KYC forms',
      'Anyone stuck with a hard 20KB photo limit',
    ],
    steps: [
      { title: 'Start with a simpler photo', description: 'Use a clear headshot or document scan with a plain background. Busy scenes compress poorly at 20KB.' },
      { title: 'Upload to Compress Image', description: 'Open the free Compress Image tool and drop your JPG, PNG, or WebP file.' },
      { title: 'Set target to 20 KB', description: 'Enter 20 as the target size in KB so the compressor aims for that budget automatically.' },
      { title: 'Preview, then download', description: 'Check face or text readability. If it is too soft, crop tighter first, then compress again.' },
    ],
    tips: [
      'Crop to the subject first — less empty background means more quality at the same file size.',
      'JPEG usually beats PNG for tiny photo targets; convert if needed.',
      'If 20KB still fails quality checks, try a slightly lower resolution rather than extreme quality only.',
    ],
    pitfalls: [
      { problem: 'Result looks blocky or blurry', solution: 'Start from a smaller crop (face only) instead of a full-body phone photo.' },
      { problem: 'Portal still rejects the file', solution: 'Confirm the site wants KB not MB, and that the format is JPG not HEIC or PNG.' },
    ],
    faqs: [
      { question: 'Is 20KB possible without destroying the photo?', answer: 'Yes for small ID-style images. Large group photos will look soft; crop and reduce resolution first.' },
      { question: 'Does this work on mobile?', answer: 'Yes. You can compress on phone or desktop browsers without installing software.' },
    ],
  },
  {
    slug: 'compress-image-to-50kb',
    title: 'Compress Image to 50KB Online',
    description: 'Quickly optimize image file size to 50KB for portals, job forms, and exam applications.',
    targetToolSlug: 'compress-image',
    intent: 'compress image to 50kb',
    overview:
      'A 50KB image limit is common on job sites, college applications, and many Indian government forms. It is usually enough for a clear passport-style portrait if you control resolution. Start around 600–900px on the long side for a face photo, then compress to 50KB. That balance keeps eyes, hairline, and text on ID cards readable while meeting the upload cap. PdfPixels targets exact KB values so you do not need trial-and-error quality sliders for every attempt.',
    whoItsFor: [
      'Job applicants uploading profile photos',
      'Students submitting application photos',
      'Users preparing images for CMS or form uploads',
    ],
    steps: [
      { title: 'Upload your image', description: 'Use a well-lit portrait or document scan in JPG/PNG/WebP.' },
      { title: 'Set target size to 50 KB', description: 'Enter 50 in the KB target field on Compress Image.' },
      { title: 'Check clarity', description: 'Zoom the preview if available and confirm facial features or text are still clear.' },
      { title: 'Download and upload to the portal', description: 'Save the file and submit it to the form that required 50KB.' },
    ],
    tips: [
      'Prefer JPEG for photographic content at 50KB.',
      'Strip EXIF if the portal is picky about file size after metadata.',
      'If quality dips, resize to a slightly smaller pixel size then re-compress.',
    ],
    pitfalls: [
      { problem: 'File is 51–55KB and still rejected', solution: 'Re-run with target 45–48KB to leave headroom for portal rounding.' },
      { problem: 'Colors look flat', solution: 'Avoid double-compressing an already tiny web image; start from the original camera file.' },
    ],
    faqs: [
      { question: 'Can I compress PNG logos to 50KB?', answer: 'Yes, but complex PNGs may need conversion to JPEG or WebP for best results at that size.' },
      { question: 'Is signup required?', answer: 'No. Core compression on PdfPixels works without an account.' },
    ],
  },
  {
    slug: 'compress-image-to-100kb',
    title: 'Compress Image to 100KB Without Losing Quality',
    description: 'Resize and optimize images to 100KB for online uploads while preserving readability and clarity.',
    targetToolSlug: 'compress-image',
    intent: 'compress image to 100kb',
    overview:
      '100KB is a practical sweet spot for many websites, email signatures, and marketplace listings. You can usually keep strong visual quality if the image is not enormous. For a typical product or portrait photo, resize to the display size you actually need (for example 1200px wide for web), then compress to 100KB. That avoids over-compressing a 12MP original. PdfPixels helps you hit 100KB directly so uploads succeed on the first try.',
    whoItsFor: [
      'Web and blog authors optimizing article images',
      'Sellers preparing product photos for listings',
      'Users attaching photos to tickets or support forms',
    ],
    steps: [
      { title: 'Choose the right source', description: 'Use the highest-quality original you have, not a screenshot of a screenshot.' },
      { title: 'Upload and target 100 KB', description: 'Open Compress Image and set the target to 100KB.' },
      { title: 'Compare before and after', description: 'Confirm edges and text remain sharp enough for your use case.' },
      { title: 'Download the optimized file', description: 'Save and use it on the site or form that requested ~100KB.' },
    ],
    tips: [
      'For screenshots with text, try PNG or higher quality JPEG; for photos, JPEG/WebP usually wins.',
      'Match output dimensions to where the image will appear — full camera resolution is rarely needed.',
    ],
    pitfalls: [
      { problem: 'Quality is fine but dimensions are huge', solution: 'Resize first if the host also enforces max width/height.' },
    ],
    faqs: [
      { question: 'Will 100KB look good on retina screens?', answer: 'For small UI images yes. For hero banners you may need larger files; use the limit your host allows.' },
    ],
  },
  {
    slug: 'resize-image-for-passport',
    title: 'Resize Image for Passport Photo',
    description: 'Create passport-size photos in the correct dimensions (2x2 inch, 35x45 mm, and more).',
    targetToolSlug: 'passport-size-photo',
    intent: 'resize image for passport photo',
    overview:
      'Passport and visa photos fail rejections for size, head position, and background more often than for “quality” alone. US passports commonly need a 2×2 inch photo; many countries use 35×45 mm. Lighting should be even, the face centered, and the background plain (often light). PdfPixels Passport Photo tools help crop to official proportions so you can print or upload without visiting a studio for a first draft. Always double-check the latest rules for your country before submitting.',
    whoItsFor: [
      'Travelers preparing passport or visa applications',
      'Users renewing IDs that need standard photo sizes',
      'Anyone who wants a print-ready passport crop at home',
    ],
    steps: [
      { title: 'Take or choose a compliant photo', description: 'Face the camera, keep a neutral expression if required, and use a plain light background.' },
      { title: 'Open Passport Size Photo', description: 'Upload the portrait and pick the size that matches your document (for example 2×2 in or 35×45 mm).' },
      { title: 'Align the face in the crop', description: 'Keep eyes at the recommended height and leave space above the head per guidelines.' },
      { title: 'Export and verify', description: 'Download the result and compare against your embassy or passport office checklist.' },
    ],
    tips: [
      'Do not wear hats or heavy filters unless your country’s rules allow them.',
      'Print at the correct DPI (often 300 DPI) if you need a paper photo.',
    ],
    pitfalls: [
      { problem: 'Photo rejected for background', solution: 'Retake against a plain wall or use a tool that can clean the background, then re-crop.' },
      { problem: 'Face too small in frame', solution: 'Move closer or crop tighter so the head occupies the required portion of the frame.' },
    ],
    faqs: [
      { question: 'Is a home-printed passport photo accepted?', answer: 'Many countries accept home prints if size and quality rules are met. Confirm with the issuing authority.' },
    ],
  },
  {
    slug: 'resize-image-for-instagram',
    title: 'Resize Image for Instagram Post and Story',
    description: 'Set exact Instagram dimensions for feed, story, and reel covers in one click.',
    targetToolSlug: 'resize-image',
    intent: 'resize image for instagram',
    overview:
      'Instagram crops aggressively. A landscape photo posted as a square can cut off important edges; a story needs a tall 9:16 frame. Common targets include 1080×1080 for feed posts, 1080×1350 for portrait posts, and 1080×1920 for stories and reels covers. Resizing before upload keeps control in your hands instead of letting the app guess. PdfPixels Resize Image supports pixel-accurate dimensions so brands and creators can stay consistent across posts.',
    whoItsFor: [
      'Content creators preparing feed and story assets',
      'Small businesses standardizing brand images',
      'Designers exporting social-ready sizes quickly',
    ],
    steps: [
      { title: 'Pick the placement', description: 'Decide whether the image is for feed square, portrait, or story/reel.' },
      { title: 'Upload and set pixels', description: 'Enter 1080×1080, 1080×1350, or 1080×1920 as needed.' },
      { title: 'Lock aspect ratio when scaling', description: 'Avoid stretching logos or faces; crop first if composition matters.' },
      { title: 'Export and post', description: 'Download and upload to Instagram or your scheduler.' },
    ],
    tips: [
      'Keep critical text inside a safe margin — Instagram UI overlays the edges on stories.',
      'Compress after resize if upload is slow, but do not crush quality for brand photos.',
    ],
    pitfalls: [
      { problem: 'Image looks stretched', solution: 'Unlock only when you intentionally change aspect ratio; otherwise crop then scale.' },
    ],
    faqs: [
      { question: 'Do I need 1080px exactly?', answer: 'It is the common export size. Larger can work, but consistent 1080-based sizes are easiest to manage.' },
    ],
  },
  {
    slug: 'convert-heic-to-jpg-online',
    title: 'Convert HEIC to JPG Online',
    description: 'Turn iPhone HEIC photos into JPG for universal compatibility on all devices.',
    targetToolSlug: 'heic-to-jpg',
    intent: 'convert heic to jpg online',
    overview:
      'iPhones often save photos as HEIC to save storage. Many Windows PCs, older apps, and web forms still expect JPG. When someone says “your photo won’t open,” HEIC is a frequent cause. Converting online is the fastest fix: upload the HEIC, download a standard JPG, and share or submit it anywhere. PdfPixels HEIC to JPG is built for that one job without forcing an app install.',
    whoItsFor: [
      'iPhone users sharing photos with Windows users',
      'People uploading iPhone photos to websites that reject HEIC',
      'Anyone archiving photos in a widely compatible format',
    ],
    steps: [
      { title: 'Select the HEIC file', description: 'Export or AirDrop/email the photo to the device you will convert from.' },
      { title: 'Upload to HEIC to JPG', description: 'Drop the file into the converter on PdfPixels.' },
      { title: 'Convert and download', description: 'Save the JPG and open it to confirm it displays correctly.' },
    ],
    tips: [
      'Keep the original HEIC if you want maximum quality later; convert copies for sharing.',
      'For many photos, convert in batches when the tool supports multiple files.',
    ],
    pitfalls: [
      { problem: 'Upload fails', solution: 'Confirm the extension is .heic/.heif and the file is not corrupted mid-transfer.' },
    ],
    faqs: [
      { question: 'Is quality lost converting HEIC to JPG?', answer: 'JPG is lossy, but a high-quality export is usually indistinguishable for social and form use.' },
    ],
  },
  {
    slug: 'png-to-jpg-converter',
    title: 'PNG to JPG Converter Online',
    description: 'Convert PNG files to JPG quickly with adjustable quality for web and email.',
    targetToolSlug: 'png-to-jpeg',
    intent: 'png to jpg converter',
    overview:
      'PNG is excellent for graphics with sharp edges and transparency. It is often oversized for photographs. Converting PNG photos to JPG can cut file size dramatically for email and web. Note that JPG does not support transparency — transparent areas become a solid background (usually white unless you choose otherwise). Use PNG when you need a clear logo cutout; use JPG when you need a smaller photo.',
    whoItsFor: [
      'Users emailing large PNG screenshots or photos',
      'Developers optimizing content images',
      'Anyone reducing storage for photo-like PNGs',
    ],
    steps: [
      { title: 'Upload the PNG', description: 'Open PNG to JPEG on PdfPixels and add your file.' },
      { title: 'Choose quality if available', description: 'Higher quality keeps detail; lower quality shrinks the file further.' },
      { title: 'Download the JPG', description: 'Verify colors look correct, especially for screenshots with text.' },
    ],
    tips: [
      'For logos that need a transparent background, stay on PNG or WebP with alpha.',
      'Screenshots with lots of text may look better as PNG or a higher-quality JPEG.',
    ],
    pitfalls: [
      { problem: 'Transparent areas turned white', solution: 'That is expected with JPG. Keep PNG if you need transparency.' },
    ],
    faqs: [
      { question: 'Should product photos be PNG or JPG?', answer: 'JPG or WebP is usually better for photos; PNG is better for UI graphics and transparent assets.' },
    ],
  },
  {
    slug: 'merge-pdf-files-online-free',
    title: 'Merge PDF Files Online Free',
    description: 'Combine multiple PDF files into one document without sign-up or watermark.',
    targetToolSlug: 'merge-pdf',
    intent: 'merge pdf files online free',
    overview:
      'Merging PDFs is a daily task for invoices, applications, and report packs. Desktop software works, but an online merge is faster when you only need to combine a few files. Order matters: upload in the sequence you want, or reorder before processing. PdfPixels Merge PDF is aimed at quick, no-account combining so you can attach one file instead of many.',
    whoItsFor: [
      'Freelancers combining invoices and contracts',
      'Students assembling multi-part submissions',
      'Office users packaging reports for email',
    ],
    steps: [
      { title: 'Gather your PDFs', description: 'Make sure each file opens correctly on its own first.' },
      { title: 'Upload in order', description: 'Add files to Merge PDF in the sequence you want the final document to follow.' },
      { title: 'Merge and download', description: 'Process the job and open the result to confirm page order.' },
    ],
    tips: [
      'Rename files 01, 02, 03 beforehand if you need a strict order.',
      'Compress after merging if the combined file exceeds email limits.',
    ],
    pitfalls: [
      { problem: 'Pages out of order', solution: 'Re-upload or reorder before merging; check the preview order carefully.' },
    ],
    faqs: [
      { question: 'Can I merge password-protected PDFs?', answer: 'Usually you must unlock them first. Protect the final file again after merging if needed.' },
    ],
  },
  {
    slug: 'split-pdf-pages-online',
    title: 'Split PDF Pages Online',
    description: 'Extract specific pages or split full PDF files into smaller documents instantly.',
    targetToolSlug: 'split-pdf',
    intent: 'split pdf pages online',
    overview:
      'Sometimes you only need pages 2–4 of a long PDF, or one appendix for a client. Splitting avoids sending the entire file. You can extract a page range or separate every page depending on the tool mode. PdfPixels Split PDF is useful when you want a smaller attachment or a clean excerpt without desktop Acrobat.',
    whoItsFor: [
      'Users extracting a single form page from a packet',
      'Teams sharing only relevant sections of a report',
      'Anyone reducing attachment size by removing extra pages',
    ],
    steps: [
      { title: 'Upload the PDF', description: 'Open Split PDF and add the source document.' },
      { title: 'Choose pages or ranges', description: 'Specify what to keep (for example pages 1, 3–5).' },
      { title: 'Download the new file', description: 'Open it to confirm only the intended pages remain.' },
    ],
    tips: [
      'If page numbers in the UI differ from printed numbers, trust the PDF page index shown by the tool.',
    ],
    pitfalls: [
      { problem: 'Wrong pages extracted', solution: 'Double-check zero-based vs one-based numbering is not confusing you; verify with the preview.' },
    ],
    faqs: [
      { question: 'Can I split into multiple files at once?', answer: 'Depending on mode, you can extract ranges or separate pages. Use the option that matches your goal.' },
    ],
  },
  {
    slug: 'compress-pdf-for-email',
    title: 'Compress PDF for Email Attachment',
    description: 'Reduce PDF size for Gmail, Outlook, and portal upload limits without losing readability.',
    targetToolSlug: 'compress-pdf',
    intent: 'compress pdf for email',
    overview:
      'Email providers cap attachments — Gmail is commonly cited around 25MB for the whole message, and many corporate systems are stricter. Scanned PDFs balloon because each page is a high-resolution image. Compression reduces image fidelity inside the PDF while keeping text readable for most business use. If a file is still huge after compression, split it or share via a link. PdfPixels Compress PDF is tuned for this email-and-portal workflow.',
    whoItsFor: [
      'Anyone whose PDF bounce with “attachment too large”',
      'HR and admissions teams receiving application packets',
      'Users submitting PDFs to portals with 1–5MB caps',
    ],
    steps: [
      { title: 'Upload the oversized PDF', description: 'Open Compress PDF and add the file that failed to send.' },
      { title: 'Choose a stronger compression if needed', description: 'Start moderate; increase compression if the file is still over your limit.' },
      { title: 'Spot-check text and images', description: 'Open the result and ensure critical pages remain legible.' },
      { title: 'Attach and send', description: 'Use the smaller file in Gmail, Outlook, or your portal.' },
    ],
    tips: [
      'For scanned homework or IDs, slightly lower scan DPI next time (200–300) prevents huge originals.',
      'Merge only what you need — fewer pages means a smaller email.',
    ],
    pitfalls: [
      { problem: 'Text becomes hard to read', solution: 'Use a lighter compression level or compress only image-heavy sections by splitting first.' },
    ],
    faqs: [
      { question: 'What size should I aim for?', answer: 'Stay under your provider or portal limit with headroom (for example under 20MB for Gmail, or under 1MB when a form requires it).' },
    ],
  },
  {
    slug: 'remove-background-from-image',
    title: 'Remove Background from Image Online',
    description: 'Use AI to remove photo backgrounds and export transparent PNG in seconds.',
    targetToolSlug: 'remove-image-background',
    intent: 'remove background from image',
    overview:
      'Background removal used to mean careful pen-tool work in Photoshop. Modern AI removes most subjects in seconds for product shots, headshots, and social creatives. Best results come from clear contrast between subject and background. Output is typically a transparent PNG you can drop onto any new backdrop. PdfPixels Remove Background focuses on that quick path without a design-suite learning curve.',
    whoItsFor: [
      'E-commerce sellers making clean product images',
      'Job seekers preparing profile photos',
      'Creators building thumbnails and stickers',
    ],
    steps: [
      { title: 'Upload a clear photo', description: 'Prefer sharp focus and separation between subject and background.' },
      { title: 'Run AI removal', description: 'Let the tool isolate the subject automatically.' },
      { title: 'Download transparent PNG', description: 'Place the PNG on white, brand colors, or a new scene in your editor.' },
    ],
    tips: [
      'Hair and semi-transparent objects are harder — use a higher-contrast source photo when possible.',
      'After removal, compress the PNG if your storefront has size limits.',
    ],
    pitfalls: [
      { problem: 'Parts of the subject missing', solution: 'Retake with better lighting/contrast or touch up in an editor after export.' },
    ],
    faqs: [
      { question: 'Can I get a white background instead of transparent?', answer: 'Yes — export transparent PNG, then place it on a white canvas in any editor, or use a tool that composites a solid background.' },
    ],
  },
  {
    slug: 'convert-pdf-to-jpg',
    title: 'Convert PDF to JPG Online',
    description: 'Convert PDF pages into high-quality JPG images for sharing and editing.',
    targetToolSlug: 'pdf-to-jpg',
    intent: 'convert pdf to jpg',
    overview:
      'Sometimes you need a PDF page as an image: social posts, slides, chat apps that prefer photos, or quick markup. Converting PDF to JPG rasterizes each page at a chosen resolution. Higher DPI means sharper text and larger files. PdfPixels PDF to JPG is for straightforward page-to-image export without installing a desktop suite.',
    whoItsFor: [
      'Users sharing a single PDF page in chat or email as an image',
      'Designers extracting a page visual for mockups',
      'Anyone who cannot open a PDF on a locked-down device but can view JPG',
    ],
    steps: [
      { title: 'Upload the PDF', description: 'Add the document to PDF to JPG.' },
      { title: 'Pick pages if needed', description: 'Convert all pages or only the ones you need, depending on options.' },
      { title: 'Download JPG output', description: 'Save images and confirm text is sharp enough for your purpose.' },
    ],
    tips: [
      'Use higher resolution when the page contains small text.',
      'For multi-page PDFs, expect one image per page.',
    ],
    pitfalls: [
      { problem: 'Text looks fuzzy', solution: 'Increase output resolution/DPI and reconvert.' },
    ],
    faqs: [
      { question: 'Is the JPG editable like a Word file?', answer: 'No. It is a picture of the page. For text editing, use a PDF editor instead.' },
    ],
  },
  {
    slug: 'compress-pdf-to-300kb',
    title: 'Compress PDF to 300KB Online',
    description: 'Reduce PDF file size to 300KB or less without losing document quality.',
    targetToolSlug: 'compress-pdf',
    intent: 'compress pdf to 300kb',
    overview:
      'Some application portals enforce very small PDF limits such as 300KB. That is tight for multi-page scans but achievable for short text PDFs or heavily optimized scans. Strategy: remove unnecessary pages, use stronger compression, and ensure the source is not a 600 DPI color scan of a simple form. PdfPixels helps you iterate quickly until the file is under 300KB.',
    whoItsFor: [
      'Applicants facing strict portal file caps',
      'Users uploading single-form PDFs to government sites',
    ],
    steps: [
      { title: 'Trim the PDF', description: 'Split out only the pages required by the form.' },
      { title: 'Compress aggressively', description: 'Run Compress PDF and check the resulting size.' },
      { title: 'Re-check legibility', description: 'Confirm stamps, signatures, and IDs remain readable.' },
    ],
    tips: [
      'Black-and-white scans compress far better than full-color photos of paper.',
      'If still too large, rescan at 150–200 DPI when possible.',
    ],
    pitfalls: [
      { problem: 'Cannot reach 300KB', solution: 'Reduce page count first; compression alone cannot fix a 40-page photo scan.' },
    ],
    faqs: [
      { question: 'Will 300KB be accepted everywhere?', answer: 'Only if that is your portal’s rule. Always follow the specific limit shown on the form.' },
    ],
  },
  {
    slug: 'compress-pdf-to-100kb',
    title: 'Compress PDF to 100KB Online Free',
    description: 'Compress large PDF files down to 100KB for easy uploading and emailing.',
    targetToolSlug: 'compress-pdf',
    intent: 'compress pdf to 100kb',
    overview:
      'A 100KB PDF limit is extreme and usually applies to single-page forms or tiny receipts. Multi-page color scans will not survive at readable quality. Treat 100KB as a special case: one page, minimal graphics, strong compression, or recreate the content as a cleaner digital PDF when possible. Use PdfPixels to try compression first, then fall back to fewer pages or a fresh export from the original document.',
    whoItsFor: [
      'Users with unusually strict 100KB upload fields',
      'People submitting simple one-page declarations',
    ],
    steps: [
      { title: 'Isolate one page if possible', description: 'Split the PDF to the single page the form needs.' },
      { title: 'Compress to the lowest acceptable quality', description: 'Run compression and inspect readability carefully.' },
      { title: 'Validate the upload', description: 'Try the portal; if it fails, recreate a cleaner digital PDF from source.' },
    ],
    tips: [
      'Export from Word/Google Docs to PDF often beats compressing a photo scan for tiny limits.',
    ],
    pitfalls: [
      { problem: 'Unreadable after compression', solution: '100KB may be impossible for that scan — reduce content or regenerate the file digitally.' },
    ],
    faqs: [
      { question: 'Is 100KB realistic for a passport scan?', answer: 'Rarely at good quality. Check whether the portal allows 200–500KB or image formats instead.' },
    ],
  },
  {
    slug: 'compress-image-to-200kb',
    title: 'Compress Image to 200KB Online',
    description: 'Easily compress JPEG and PNG images to 200KB while maintaining clarity.',
    targetToolSlug: 'compress-image',
    intent: 'compress image to 200kb',
    overview:
      '200KB is a comfortable target for many web images, email photos, and application uploads. You can usually keep good detail on a resized photo. Think of it as “web quality”: sharp enough for screens, small enough for slow connections. Set the PdfPixels target to 200KB after choosing sensible dimensions for the destination.',
    whoItsFor: [
      'Bloggers and marketers preparing web images',
      'Users attaching photos under common 200KB rules',
    ],
    steps: [
      { title: 'Upload the image', description: 'Prefer the original file over a messaging-app compress copy.' },
      { title: 'Target 200 KB', description: 'Enter 200 in the compressor target field.' },
      { title: 'Download and use', description: 'Confirm the file size in your file explorer if the portal is strict.' },
    ],
    tips: [
      'For full-width website heroes you may need more than 200KB — follow your site’s performance budget.',
    ],
    pitfalls: [
      { problem: 'Slightly over 200KB', solution: 'Target 190KB to allow for encoder variance.' },
    ],
    faqs: [
      { question: 'Is WebP better than JPEG at 200KB?', answer: 'Often yes for web, but only if your destination accepts WebP.' },
    ],
  },
  {
    slug: 'resize-image-to-kb',
    title: 'Resize Image to Specific KB',
    description: 'Resize and compress your image to an exact KB size requirement.',
    targetToolSlug: 'compress-image',
    intent: 'resize image to kb',
    overview:
      'People say “resize to KB” when they mean “make the file weigh X kilobytes,” not just change width and height. True KB targeting is compression (and sometimes dimension reduction) until the byte size matches. PdfPixels Compress Image is the right tool: set the KB target and let the engine balance quality and size. Pair with Resize Image when a form also demands exact pixel or print dimensions.',
    whoItsFor: [
      'Anyone filling forms that list a maximum KB size',
      'Users who tried only changing width/height and still failed the limit',
    ],
    steps: [
      { title: 'Note the exact limit', description: 'Read whether the form says max 50KB, 100KB, or another value.' },
      { title: 'Compress to that target', description: 'Enter the number in Compress Image.' },
      { title: 'Also match dimensions if required', description: 'Use Resize Image when the form lists pixels or inches too.' },
    ],
    tips: [
      'Dimensions and file size are related but not the same — you often need both tools.',
    ],
    pitfalls: [
      { problem: 'Resized pixels but file still too big', solution: 'You changed resolution only; run KB compression next.' },
    ],
    faqs: [
      { question: 'Why did my 500px image stay 2MB?', answer: 'It may be an uncompressed format or high bit depth. Compression, not just width, reduces KB.' },
    ],
  },
  {
    slug: 'resize-image-in-cm',
    title: 'Resize Image in CM Online',
    description: 'Easily resize your photo in centimeters for printing or documents.',
    targetToolSlug: 'resize-image',
    intent: 'resize image in cm',
    overview:
      'Print sizes are specified in centimeters or inches, not raw pixels. A 10×15 cm photo at 300 DPI needs a different pixel count than the same print at 150 DPI. When you resize in cm, always consider DPI for print sharpness. PdfPixels Resize Image supports cm/mm/inch style workflows so school forms, lab prints, and document photos land at the right physical size.',
    whoItsFor: [
      'Users preparing photos for print labs',
      'Students submitting documents with cm photo requirements',
    ],
    steps: [
      { title: 'Confirm print size and DPI', description: 'Example: 3.5×4.5 cm at 300 DPI for some ID photos.' },
      { title: 'Upload and choose cm units', description: 'Enter width and height in centimeters.' },
      { title: 'Export and print-test', description: 'Print one copy to verify size before submitting many copies.' },
    ],
    tips: [
      '300 DPI is a solid default for small photo prints; large posters can use lower DPI.',
    ],
    pitfalls: [
      { problem: 'Print came out tiny', solution: 'You may have set pixels equal to cm numbers. Use real cm units with proper DPI.' },
    ],
    faqs: [
      { question: 'Can I resize in cm for on-screen use only?', answer: 'Screens care about pixels. Use cm when the destination is print or a form that specifies physical size.' },
    ],
  },
  {
    slug: 'convert-heic-to-jpg-windows',
    title: 'Convert HEIC to JPG on Windows',
    description: 'Convert iPhone HEIC images to JPG format directly on your Windows PC.',
    targetToolSlug: 'heic-to-jpg',
    intent: 'convert heic to jpg windows',
    overview:
      'Windows does not always open HEIC out of the box. Microsoft Store codecs help, but an online converter is often faster when you just need a JPG for a form or email. Transfer the photo from iPhone (cable, OneDrive, email, or chat), then convert on the PC. PdfPixels runs in the browser on Windows 10/11 with Chrome, Edge, or Firefox — no extra codec required for the conversion step.',
    whoItsFor: [
      'Windows users receiving iPhone photos',
      'Offices standardizing on JPG for records',
    ],
    steps: [
      { title: 'Copy HEIC files to the PC', description: 'Use your preferred transfer method.' },
      { title: 'Open HEIC to JPG in the browser', description: 'Upload and convert without installing desktop software.' },
      { title: 'Save JPG to a known folder', description: 'Use the JPG for Outlook, Word, or web uploads.' },
    ],
    tips: [
      'If you convert often, you can also enable HEIF support in Windows — but a browser tool works immediately.',
    ],
    pitfalls: [
      { problem: 'File explorer shows blank thumbnail', solution: 'That can still convert; blank thumbs often mean missing codec, not a bad file.' },
    ],
    faqs: [
      { question: 'Does this work offline?', answer: 'The online tool needs a network connection. For offline, install a local HEIC codec or app.' },
    ],
  },
  {
    slug: 'reduce-photo-size-for-email',
    title: 'Reduce Photo Size for Email',
    description: 'Shrink photo file sizes to attach them to emails easily without limits.',
    targetToolSlug: 'compress-image',
    intent: 'reduce photo size for email',
    overview:
      'Modern phone photos are several megabytes each. A handful of originals can exceed email limits or clog inboxes. For email, you rarely need full camera resolution — a 1280–1920px wide JPEG at moderate quality is usually enough to view on phones and desktops. Compress Image on PdfPixels reduces weight quickly; resize first if you are sending many pictures.',
    whoItsFor: [
      'Families sharing event photos by email',
      'Workers sending site or receipt photos to colleagues',
    ],
    steps: [
      { title: 'Pick only the photos you need', description: 'Fewer attachments beat aggressive compression of a whole camera roll.' },
      { title: 'Compress or resize', description: 'Target a few hundred KB per photo for smooth sending.' },
      { title: 'Attach and send a test', description: 'Send to yourself first if the photos are critical.' },
    ],
    tips: [
      'For dozens of photos, a shared album link may be better than email attachments.',
    ],
    pitfalls: [
      { problem: 'Email still rejects', solution: 'Check total message size, not just one file; compress further or split across messages.' },
    ],
    faqs: [
      { question: 'Should I use ZIP for photos?', answer: 'ZIP rarely helps already-compressed JPEGs. Resize/compress images instead.' },
    ],
  },
  {
    slug: 'merge-pdf-files-windows',
    title: 'Merge PDF Files on Windows',
    description: 'Quickly merge and combine multiple PDF files on Windows without installing software.',
    targetToolSlug: 'merge-pdf',
    intent: 'merge pdf files windows',
    overview:
      'Windows users often look for “free PDF merger” software and end up with toolbars or trials. A browser-based merge avoids installs on locked work PCs. Upload PDFs from File Explorer into PdfPixels Merge PDF, order them, and download a single document. That is usually enough for office and school tasks without admin rights to install apps.',
    whoItsFor: [
      'Windows office users without install permissions',
      'Students combining assignment PDFs on a PC',
    ],
    steps: [
      { title: 'Locate files in File Explorer', description: 'Note the correct order for the final packet.' },
      { title: 'Upload to Merge PDF', description: 'Drag files from the desktop or downloads folder into the browser tool.' },
      { title: 'Download the merged PDF', description: 'Open in Edge or another reader to verify order.' },
    ],
    tips: [
      'Edge can print to PDF, but merging multiple existing PDFs is still easier in a dedicated merge tool.',
    ],
    pitfalls: [
      { problem: 'Work browser blocks uploads', solution: 'Try another approved browser or ask IT; do not upload confidential files to untrusted tools.' },
    ],
    faqs: [
      { question: 'Is this a Windows app?', answer: 'No — it is a web tool that runs in your Windows browser.' },
    ],
  },
  {
    slug: 'jpg-to-pdf-converter',
    title: 'JPG to PDF Converter Online Free',
    description: 'Convert JPG, JPEG, and PNG images into a single PDF document quickly and securely.',
    targetToolSlug: 'image-to-pdf',
    intent: 'jpg to pdf converter',
    overview:
      'Turning images into a PDF is ideal for applications that only accept PDF uploads: photo sets, signed forms photographed on a phone, or multi-page scans. Order the images as pages, then export one PDF. PdfPixels Image to PDF keeps the flow simple for phone and desktop users who do not want a full desktop publisher.',
    whoItsFor: [
      'Users submitting photo evidence as PDF',
      'Anyone converting scans to a single PDF packet',
    ],
    steps: [
      { title: 'Upload images in page order', description: 'Add JPGs/PNGs in the sequence you want.' },
      { title: 'Convert to PDF', description: 'Generate the document and review page order.' },
      { title: 'Compress if needed', description: 'Run Compress PDF when the combined file is too large for the portal.' },
    ],
    tips: [
      'Capture pages straight-on with good light to avoid unreadable scans.',
    ],
    pitfalls: [
      { problem: 'PDF too large', solution: 'Compress images before conversion or compress the PDF after.' },
    ],
    faqs: [
      { question: 'Can I mix PNG and JPG?', answer: 'Yes on most converters, including typical image-to-PDF workflows.' },
    ],
  },
  {
    slug: 'jpeg-to-png-converter-online',
    title: 'JPEG to PNG Converter Online',
    description: 'Convert standard JPEG files into high-quality PNG format with transparent support.',
    targetToolSlug: 'jpeg-to-png',
    intent: 'jpeg to png converter online',
    overview:
      'JPEG to PNG is useful when you need a lossless-style export for editing, or a format some tools prefer. Converting JPEG to PNG does not magically restore quality lost in the original JPEG, and PNG files are often larger. Transparency is only available if you add it later (JPEG has no alpha). Use this conversion when a workflow requires PNG, not as a general way to shrink files.',
    whoItsFor: [
      'Editors who need PNG for a design tool',
      'Users meeting a “PNG only” upload requirement',
    ],
    steps: [
      { title: 'Upload the JPEG', description: 'Open JPEG to PNG and add your file.' },
      { title: 'Convert and download', description: 'Save the PNG and open it to verify colors.' },
    ],
    tips: [
      'If your goal is smaller files, convert the other way (PNG to JPEG) or use WebP.',
    ],
    pitfalls: [
      { problem: 'File got bigger', solution: 'Expected for many photos. PNG is not a compression upgrade over JPEG for camera images.' },
    ],
    faqs: [
      { question: 'Will PNG fix blurry JPEG artifacts?', answer: 'No. Artifacts remain; PNG just stores them in another container.' },
    ],
  },
  {
    slug: 'increase-image-size-to-100kb',
    title: 'Increase Image Size to 100KB',
    description: 'Easily increase your photo file size to 100KB for application and portal limits.',
    targetToolSlug: 'increase-image-size-in-kb',
    intent: 'increase image size to 100kb',
    overview:
      'Some portals reject files that are too small (minimum size rules) as well as too large. If your image is 20KB and the form wants at least 100KB, you need to increase file weight carefully. Padding or re-encoding can raise bytes; avoid tricks that break the image format. PdfPixels Increase Image Size is built for minimum-KB requirements that confuse applicants who already compressed too far.',
    whoItsFor: [
      'Applicants hitting minimum file size errors',
      'Users who over-compressed and need to meet a floor',
    ],
    steps: [
      { title: 'Upload the too-small image', description: 'Start from the best quality version you still have if possible.' },
      { title: 'Set target around 100 KB', description: 'Raise the file size to meet the portal minimum.' },
      { title: 'Re-upload to the form', description: 'Confirm the error is gone and the image still previews correctly.' },
    ],
    tips: [
      'If you still have the original camera file, using a moderately compressed original is better than padding a tiny thumbnail.',
    ],
    pitfalls: [
      { problem: 'Portal still says invalid image', solution: 'Check format (JPG vs PNG) and dimensions; minimum KB is only one rule.' },
    ],
    faqs: [
      { question: 'Does increasing KB improve quality?', answer: 'Not if you only pad a small image. Quality comes from the source pixels, not file size alone.' },
    ],
  },
  {
    slug: 'remove-image-metadata-online',
    title: 'Remove Image Metadata Online',
    description: 'Strip EXIF data, location tags, and metadata from your photos for privacy and security.',
    targetToolSlug: 'remove-image-metadata',
    intent: 'remove image metadata online',
    overview:
      'Photos can embed EXIF metadata: camera model, timestamps, and sometimes GPS location. Before publishing sensitive images online, many people strip metadata for privacy. Removing metadata does not change what is visible in the picture itself — it clears hidden fields. Use PdfPixels metadata tools when you want a cleaner file for public posts or client delivery.',
    whoItsFor: [
      'Users sharing photos publicly without location data',
      'Professionals delivering files without camera EXIF clutter',
    ],
    steps: [
      { title: 'Upload the image', description: 'Add the photo that may contain EXIF/GPS data.' },
      { title: 'Strip metadata', description: 'Run removal and download the cleaned file.' },
      { title: 'Verify if needed', description: 'Check properties on your OS or an EXIF viewer to confirm tags are gone.' },
    ],
    tips: [
      'Screenshots usually have less EXIF than camera photos, but documents can still carry author metadata in other formats.',
    ],
    pitfalls: [
      { problem: 'Location still visible in the picture', solution: 'Metadata removal cannot hide landmarks or street signs in the image pixels.' },
    ],
    faqs: [
      { question: 'Is metadata removal permanent?', answer: 'For the exported file yes. Keep the original separately if you still need EXIF for your archive.' },
    ],
  },
  {
    slug: 'create-passport-size-photo-free',
    title: 'Create Passport Size Photo Free',
    description: 'Crop and generate passport and visa photos matching official ID dimension requirements.',
    targetToolSlug: 'passport-size-photo',
    intent: 'create passport size photo free',
    overview:
      'Studio passport photos are convenient but not always necessary for a first draft. With a clear selfie or portrait, a plain background, and correct crop ratios, you can produce a free passport-size photo at home for many applications. Rules differ by country (size, expression, glasses, background). Use PdfPixels to get dimensions right, then validate against the official checklist for your document type.',
    whoItsFor: [
      'Travelers drafting passport or visa photos',
      'Users renewing IDs with standard photo sizes',
    ],
    steps: [
      { title: 'Capture a compliant portrait', description: 'Even lighting, plain background, face clearly visible.' },
      { title: 'Generate the passport size crop', description: 'Choose the correct country size template when available.' },
      { title: 'Export print or digital copy', description: 'Follow whether your application wants a digital upload or printed photos.' },
    ],
    tips: [
      'Read the latest official photo guide — automated crops help size, not every legal rule.',
    ],
    pitfalls: [
      { problem: 'Rejected for shadows or background', solution: 'Retake the photo; editing cannot always fix poor lighting acceptably.' },
    ],
    faqs: [
      { question: 'Is a free online passport photo always accepted?', answer: 'Acceptance depends on meeting official rules, not on the tool brand. Always verify requirements.' },
    ],
  },
];
