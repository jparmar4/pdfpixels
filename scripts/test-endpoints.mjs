import { PDFDocument, StandardFonts } from 'pdf-lib';
import sharp from 'sharp';

async function makePng() {
  return await sharp({ create: { width: 100, height: 100, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } }).png().toBuffer();
}

async function makePdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([600, 800]);
  page.drawText('Test document line 1', { x: 50, y: 700, font, size: 14 });
  page.drawText('Test document line 2 with table cell A1 and B2', { x: 50, y: 650, font, size: 12 });
  page.drawText('01/15/2026 Direct Deposit Payroll 3,500.00 5,000.00', { x: 50, y: 600, font, size: 12 });
  page.drawText('01/18/2026 Grocery Store Payment -120.00 4,880.00', { x: 50, y: 550, font, size: 12 });
  const pngBytes = await makePng();
  const embeddedPng = await doc.embedPng(pngBytes);
  page.drawImage(embeddedPng, { x: 50, y: 400, width: 50, height: 50 });
  const page2 = doc.addPage([600, 800]);
  page2.drawText('Test page 2', { x: 50, y: 700, font, size: 14 });
  return Buffer.from(await doc.save());
}

async function run() {
  const pdfBytes = await makePdf();
  const pngBytes = await makePng();

  const tests = [
    {
      name: 'add-page-numbers',
      url: '/api/pdf/add-page-numbers',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('position', 'bottom-center');
        fd.append('format', 'Page {n} of {total}');
        return fd;
      }
    },
    {
      name: 'bank-statement-to-excel',
      url: '/api/pdf/bank-statement-to-excel',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'statement.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'bates-numbering',
      url: '/api/pdf/bates-numbering',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('prefix', 'CASE-');
        fd.append('startNumber', '1');
        fd.append('digits', '6');
        return fd;
      }
    },
    {
      name: 'compare',
      url: '/api/pdf/compare',
      form: () => {
        const fd = new FormData();
        fd.append('file1', new File([pdfBytes], 'doc1.pdf', { type: 'application/pdf' }));
        fd.append('file2', new File([pdfBytes], 'doc2.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'compress',
      url: '/api/pdf/compress',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('level', 'recommended');
        return fd;
      }
    },
    {
      name: 'crop',
      url: '/api/pdf/crop',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('top', '20');
        fd.append('bottom', '20');
        fd.append('left', '20');
        fd.append('right', '20');
        fd.append('pages', 'all');
        return fd;
      }
    },
    {
      name: 'delete-pages',
      url: '/api/pdf/delete-pages',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('pages', '2');
        return fd;
      }
    },
    {
      name: 'extract',
      url: '/api/pdf/extract',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('pages', '1');
        return fd;
      }
    },
    {
      name: 'extract-images',
      url: '/api/pdf/extract-images',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'fill',
      url: '/api/pdf/fill',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('textEntries', JSON.stringify([{ pageNumber: 1, x: 50, y: 50, text: 'Sample Text' }]));
        return fd;
      }
    },
    {
      name: 'flatten',
      url: '/api/pdf/flatten',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'from-image',
      url: '/api/pdf/from-image',
      form: () => {
        const fd = new FormData();
        fd.append('files', new File([pngBytes], 'img.png', { type: 'image/png' }));
        return fd;
      }
    },
    {
      name: 'from-text',
      url: '/api/pdf/from-text',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File(['Hello World! Sample Text'], 'notes.txt', { type: 'text/plain' }));
        return fd;
      }
    },
    {
      name: 'grayscale',
      url: '/api/pdf/grayscale',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'linearize',
      url: '/api/pdf/linearize',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'merge',
      url: '/api/pdf/merge',
      form: () => {
        const fd = new FormData();
        fd.append('files', new File([pdfBytes], 'a.pdf', { type: 'application/pdf' }));
        fd.append('files', new File([pdfBytes], 'b.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'metadata',
      url: '/api/pdf/metadata',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('title', 'New Title');
        return fd;
      }
    },
    {
      name: 'n-up',
      url: '/api/pdf/n-up',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('layout', '2');
        fd.append('sheet', 'a4');
        return fd;
      }
    },
    {
      name: 'ocr',
      url: '/api/pdf/ocr',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'protect',
      url: '/api/pdf/protect',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('password', 'secret123');
        fd.append('action', 'protect');
        return fd;
      }
    },
    {
      name: 'redact',
      url: '/api/pdf/redact',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('areas', JSON.stringify([{ page: 1, x: 50, y: 50, width: 100, height: 20 }]));
        return fd;
      }
    },
    {
      name: 'reorder',
      url: '/api/pdf/reorder',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('order', JSON.stringify([2, 1]));
        return fd;
      }
    },
    {
      name: 'repair',
      url: '/api/pdf/repair',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'resize',
      url: '/api/pdf/resize',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('sheet', 'a4');
        fd.append('orientation', 'auto');
        return fd;
      }
    },
    {
      name: 'rotate',
      url: '/api/pdf/rotate',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('angle', '90');
        fd.append('pages', 'all');
        return fd;
      }
    },
    {
      name: 'sanitize',
      url: '/api/pdf/sanitize',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'sign',
      url: '/api/pdf/sign',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('signature', 'data:image/png;base64,' + pngBytes.toString('base64'));
        fd.append('page', '1');
        fd.append('x', '100');
        fd.append('y', '100');
        fd.append('width', '100');
        fd.append('height', '50');
        return fd;
      }
    },
    {
      name: 'split',
      url: '/api/pdf/split',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('mode', 'extract');
        fd.append('pages', '1');
        return fd;
      }
    },
    {
      name: 'to-cmyk',
      url: '/api/pdf/to-cmyk',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'to-excel',
      url: '/api/pdf/to-excel',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('format', 'xlsx');
        return fd;
      }
    },
    {
      name: 'to-image',
      url: '/api/pdf/to-image',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('format', 'png');
        return fd;
      }
    },
    {
      name: 'to-pdfa',
      url: '/api/pdf/to-pdfa',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'to-pptx',
      url: '/api/pdf/to-pptx',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'to-text',
      url: '/api/pdf/to-text',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'to-word',
      url: '/api/pdf/to-word',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        return fd;
      }
    },
    {
      name: 'watermark',
      url: '/api/pdf/watermark',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pdfBytes], 'test.pdf', { type: 'application/pdf' }));
        fd.append('text', 'CONFIDENTIAL');
        fd.append('opacity', '0.3');
        fd.append('fontSize', '48');
        return fd;
      }
    },
    {
      name: 'image-process',
      url: '/api/image/process',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pngBytes], 'test.png', { type: 'image/png' }));
        fd.append('action', 'resize');
        fd.append('width', '50');
        fd.append('height', '50');
        return fd;
      }
    },
    {
      name: 'image-ico',
      url: '/api/image/ico',
      form: () => {
        const fd = new FormData();
        fd.append('file', new File([pngBytes], 'test.png', { type: 'image/png' }));
        return fd;
      }
    },
  ];

  let passed = 0;
  let failed = 0;
  for (const t of tests) {
    try {
      const res = await fetch('http://127.0.0.1:3999' + t.url, { method: 'POST', body: t.form() });
      if (res.status === 200) {
        console.log(`  PASS: ${t.name} (200 OK)`);
        passed++;
      } else {
        const err = await res.text();
        console.error(`  FAIL: ${t.name} (${res.status}) ${err.slice(0, 150)}`);
        failed++;
      }
    } catch (e) {
      console.error(`  ERROR: ${t.name} ${e.message}`);
      failed++;
    }
  }
  console.log(`\nSummary: ${passed} passed, ${failed} failed out of ${tests.length}`);
}
run();
