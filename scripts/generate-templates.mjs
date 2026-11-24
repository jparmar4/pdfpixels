// Generate free template PDFs for /templates — real, downloadable files.
// Run: node scripts/generate-templates.mjs   (reruns are idempotent)
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'templates');
mkdirSync(outDir, { recursive: true });

const ink = rgb(0.12, 0.13, 0.18);
const muted = rgb(0.42, 0.45, 0.52);
const accent = rgb(0.31, 0.27, 0.9);
const rule = rgb(0.87, 0.88, 0.92);
const softFill = rgb(0.955, 0.96, 0.985);

const CREDIT = 'Free template by PdfPixels — pdfpixels.com/templates';

function credit(_doc, page, _PH) {
  page.drawText(CREDIT, { x: 40, y: 24, size: 7.5, font: page._creditFont, color: rgb(0.62, 0.64, 0.7) });
}

async function makeInvoiceTemplate({ file, accentHeader = false, sample = false, title }) {
  const doc = await PDFDocument.create();
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 792]);
  page._creditFont = helv;
  const M = 48;
  let y = 792 - M;

  if (accentHeader) {
    page.drawRectangle({ x: 0, y: 792 - 70, width: 612, height: 70, color: accent });
    page.drawText('INVOICE', { x: M, y: 792 - 46, size: 24, font: bold, color: rgb(1, 1, 1) });
    page.drawText(title, { x: 612 - M - bold.widthOfTextAtSize(title, 11), y: 792 - 44, size: 11, font: bold, color: rgb(1, 1, 1) });
    y = 792 - 96;
  } else {
    page.drawText('INVOICE', { x: M, y: y - 22, size: 24, font: bold, color: ink });
    page.drawLine({ start: { x: M, y: y - 34 }, end: { x: 612 - M, y: y - 34 }, thickness: 2, color: accent });
    y -= 48;
  }

  // Meta fields
  const meta = [
    ['Invoice #', sample ? 'INV-2026-001' : ''],
    ['Date', sample ? 'Nov 19, 2026' : ''],
    ['Due date', sample ? 'Dec 3, 2026' : ''],
  ];
  let metaY = y;
  for (const [label, value] of meta) {
    page.drawText(label + ':', { x: M, y: metaY, size: 9, font: bold, color: muted });
    if (value) page.drawText(value, { x: M + 62, y: metaY, size: 9, font: helv, color: ink });
    else page.drawLine({ start: { x: M + 62, y: metaY - 2 }, end: { x: M + 200, y: metaY - 2 }, thickness: 0.7, color: rule });
    metaY -= 16;
  }
  y = metaY - 8;

  // From / Bill To
  const colW = (612 - M * 2 - 24) / 2;
  const block = (x, label, lines) => {
    page.drawText(label.toUpperCase(), { x, y, size: 8, font: bold, color: muted });
    let by = y - 15;
    for (const line of lines) {
      if (line) page.drawText(line, { x, y: by, size: 10, font: helv, color: ink });
      else page.drawLine({ start: { x, y: by - 2 }, end: { x: x + colW, y: by - 2 }, thickness: 0.7, color: rule });
      by -= 15;
    }
    return by;
  };
  const fromLines = sample ? ['Acme Studio LLC', '123 Design Avenue, Suite 400', 'Austin, TX 78701', 'billing@acme.example'] : ['', '', '', ''];
  const toLines = sample ? ['Northwind Trading Co.', '88 Commerce Street', 'Seattle, WA 98104', 'accounts@northwind.example'] : ['', '', '', ''];
  const leftBottom = block(M, 'From', fromLines);
  const rightBottom = block(M + colW + 24, 'Bill To', toLines);
  y = Math.min(leftBottom, rightBottom) - 16;

  // Items table (8 blank rows; sample data fills first 3)
  const qtyW = 45, priceW = 90, amountW = 90;
  const descW = 612 - M * 2 - qtyW - priceW - amountW;
  const drawHeader = (topY) => {
    page.drawRectangle({ x: M, y: topY - 6, width: 612 - M * 2, height: 20, color: softFill });
    page.drawText('DESCRIPTION', { x: M + 8, y: topY, size: 8, font: bold, color: muted });
    page.drawText('QTY', { x: M + descW + qtyW / 2 - bold.widthOfTextAtSize('QTY', 8) / 2, y: topY, size: 8, font: bold, color: muted });
    page.drawText('UNIT PRICE', { x: M + descW + qtyW + priceW - bold.widthOfTextAtSize('UNIT PRICE', 8) - 4, y: topY, size: 8, font: bold, color: muted });
    page.drawText('AMOUNT', { x: 612 - M - bold.widthOfTextAtSize('AMOUNT', 8) - 4, y: topY, size: 8, font: bold, color: muted });
    return topY - 26;
  };
  y = drawHeader(y);
  const items = sample
    ? [['Brand identity design', '1', '2,400.00', '2,400.00'], ['Landing page design & build', '2', '850.00', '1,700.00'], ['Monthly support retainer', '3', '450.00', '1,350.00']]
    : [];
  for (let i = 0; i < 8; i++) {
    const item = items[i];
    const rowY = y;
    if (item) {
      page.drawText(item[0], { x: M + 8, y: rowY, size: 9.5, font: helv, color: ink });
      page.drawText(item[1], { x: M + descW + qtyW / 2 - helv.widthOfTextAtSize(item[1], 9.5) / 2, y: rowY, size: 9.5, font: helv, color: ink });
      page.drawText('$ ' + item[2], { x: M + descW + qtyW + priceW - helv.widthOfTextAtSize('$ ' + item[2], 9.5) - 4, y: rowY, size: 9.5, font: helv, color: ink });
      page.drawText('$ ' + item[3], { x: 612 - M - helv.widthOfTextAtSize('$ ' + item[3], 9.5) - 4, y: rowY, size: 9.5, font: helv, color: ink });
    }
    page.drawLine({ start: { x: M, y: rowY - 10 }, end: { x: 612 - M, y: rowY - 10 }, thickness: 0.6, color: rule });
    y -= 24;
  }
  y -= 6;

  // Totals
  const totalX = 612 - M - 230;
  const totalRow = (label, value, isBold = false) => {
    const f = isBold ? bold : helv;
    page.drawText(label, { x: totalX, y, size: isBold ? 12 : 10, font: f, color: isBold ? accent : ink });
    const v = value;
    page.drawText(v, { x: 612 - M - f.widthOfTextAtSize(v, isBold ? 12 : 10), y, size: isBold ? 12 : 10, font: f, color: isBold ? accent : ink });
    y -= isBold ? 22 : 16;
  };
  totalRow('Subtotal', sample ? '$ 5,450.00' : '$');
  totalRow('Tax (%)', sample ? '$ 449.63' : '$');
  totalRow('TOTAL DUE', sample ? '$ 5,899.63' : '$', true);

  // Notes lines
  page.drawText('NOTES / PAYMENT TERMS', { x: M, y: y - 6, size: 8, font: bold, color: muted });
  let ny = y - 22;
  for (let i = 0; i < 2; i++) {
    page.drawLine({ start: { x: M, y: ny }, end: { x: 612 - M, y: ny }, thickness: 0.7, color: rule });
    ny -= 18;
  }

  credit(doc, page, 792);
  const bytes = await doc.save();
  writeFileSync(path.join(outDir, file), bytes);
  console.log(file, '→', bytes.length, 'bytes');
}

async function makeResumeTemplate({ file, accentHeading = false, sample = true }) {
  const doc = await PDFDocument.create();
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const page = doc.addPage([612, 792]);
  page._creditFont = helv;
  const M = 54;
  const W = 612;
  let y = 792 - M;

  const heading = (text) => {
    page.drawText(text.toUpperCase(), { x: M, y, size: 10.5, font: bold, color: accentHeading ? accent : ink });
    y -= 6;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.8, color: accentHeading ? accent : rule });
    y -= 15;
  };
  const line = (text, size = 10, f = helv, color = ink) => {
    page.drawText(text, { x: M, y, size, font: f, color });
    y -= size + 3.5;
  };

  // Header
  page.drawText(sample ? 'Jordan Taylor' : 'Your Name', { x: M, y: y - 22, size: 24, font: bold, color: ink });
  y -= 32;
  line(sample ? 'Senior Operations Analyst' : 'Professional Title', 11.5, italic, muted);
  line(sample ? '(555) 210-4477  ·  jordan.taylor@email.example  ·  Chicago, IL  ·  linkedin.com/in/jordan-taylor' : '(555) 555-5555  ·  you@email.example  ·  City, State  ·  linkedin.com/in/you', 9, helv, muted);
  y -= 6;

  heading('Professional Summary');
  line(sample
    ? 'Operations analyst with 6 years of experience turning messy processes into measurable systems. Specialized in vendor management, workflow automation, and reporting that leadership actually reads.'
    : 'Two to three sentences summarizing who you are, your strongest skills, and the value you bring to employers.', 10, helv, sample ? ink : muted);
  y -= 6;

  heading('Experience');
  const roles = sample
    ? [
        { role: 'Senior Operations Analyst', company: 'Meridian Logistics — Chicago, IL', dates: '2022 – Present', bullets: ['Cut order-processing time 34% by redesigning the intake workflow across 3 teams.', 'Built automated weekly reporting used by 40+ stakeholders.', 'Managed 12 vendor relationships with a combined $2.1M annual spend.'] },
        { role: 'Operations Coordinator', company: 'Brightline Retail Group — Chicago, IL', dates: '2019 – 2022', bullets: ['Coordinated daily fulfillment for 2 regional warehouses (8,000+ orders/month).', 'Introduced SOP documentation that reduced onboarding time from 6 weeks to 3.'] },
      ]
    : [
        { role: 'Job Title', company: 'Company Name — City, State', dates: '20XX – 20XX', bullets: ['Achievement with a number or measurable outcome.', 'Achievement with a number or measurable outcome.'] },
      ];
  for (const r of roles) {
    page.drawText(r.role, { x: M, y, size: 11.5, font: bold, color: ink });
    const dw = bold.widthOfTextAtSize(r.dates, 9);
    page.drawText(r.dates, { x: W - M - dw, y: y + 1, size: 9, font: bold, color: muted });
    y -= 15;
    line(r.company, 10, italic, muted);
    for (const b of r.bullets) {
      page.drawText('•', { x: M + 2, y, size: 9.5, font: helv, color: ink });
      const words = b.split(' ');
      let cur = '';
      for (const wd of words) {
        const cand = cur ? `${cur} ${wd}` : wd;
        if (helv.widthOfTextAtSize(cand, 9.5) > W - M * 2 - 14 && cur) {
          page.drawText(cur, { x: M + 14, y, size: 9.5, font: helv, color: ink });
          y -= 12.5;
          cur = wd;
        } else cur = cand;
      }
      if (cur) { page.drawText(cur, { x: M + 14, y, size: 9.5, font: helv, color: ink }); y -= 12.5; }
    }
    y -= 8;
  }

  heading('Education');
  const edu = sample
    ? [['B.S. Business Administration', 'University of Illinois', '2019']]
    : [['Degree / Certification', 'School Name', '20XX']];
  for (const [degree, school, year] of edu) {
    page.drawText(degree, { x: M, y, size: 10.5, font: bold, color: ink });
    const yw = helv.widthOfTextAtSize(year, 9);
    page.drawText(year, { x: W - M - yw, y: y + 1, size: 9, font: helv, color: muted });
    y -= 13;
    line(school, 9.5, helv, muted);
    y -= 2;
  }

  heading('Skills');
  line(sample
    ? 'Process mapping · SQL reporting · Vendor management · Salesforce · Tableau · Lean operations'
    : 'Skill one · Skill two · Skill three · Skill four · Skill five', 10, helv, sample ? ink : muted);

  credit(doc, page, 792);
  const bytes = await doc.save();
  writeFileSync(path.join(outDir, file), bytes);
  console.log(file, '→', bytes.length, 'bytes');
}

await Promise.all([
  makeInvoiceTemplate({ file: 'blank-invoice-template.pdf', title: 'Blank invoice template', accentHeader: false, sample: false }),
  makeInvoiceTemplate({ file: 'freelance-invoice-template.pdf', title: 'Freelance invoice template', accentHeader: false, sample: true }),
  makeInvoiceTemplate({ file: 'small-business-invoice-template.pdf', title: 'Small business invoice template', accentHeader: true, sample: true }),
  makeInvoiceTemplate({ file: 'consulting-invoice-template.pdf', title: 'Consulting invoice template', accentHeader: false, sample: true }),
  makeResumeTemplate({ file: 'classic-resume-template.pdf', title: 'Classic resume template', accentHeading: false, sample: true }),
  makeResumeTemplate({ file: 'modern-resume-template.pdf', title: 'Modern resume template', accentHeading: true, sample: true }),
  makeResumeTemplate({ file: 'minimal-resume-template.pdf', title: 'Minimal resume template', accentHeading: false, sample: false }),
  makeResumeTemplate({ file: 'student-resume-template.pdf', title: 'Student resume template', accentHeading: true, sample: true }),
]);
console.log('All templates generated →', outDir);
