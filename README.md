# PdfPixels - Online Premium PDF & Image Tools

PdfPixels is a robust, production-ready platform for compressing, merging, splitting, converting, and optimizing PDF and image files completely online. It focuses on providing a sleek, modern SaaS interface with high-performance background processing.

## ✨ Key Features

- **PDF Tools**: Compress, Merge, Split, Reorder Pages, Rotate, Watermark, Protect, and Unlock PDFs.
- **Image Editing**: Compress, Resize, Crop (Square, Circle, Freehand), Format Conversions (WebP, JPG, PNG, HEIC).
- **Advanced Processing**: Metadata extraction/removal, OCR text extraction, DPI conversion, and picture-to-pixel art generation. 
- **Privacy-First**: Designed with secure processing workflows and swift execution speeds.

## 🛠 Technology Stack

This project is built using exceptional state-of-the-art tools:
- **Core Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling & UI**: Tailwind CSS 4, shadcn/ui, Radix UI
- **Interactions**: Framer Motion (for physics-based tab highlighting & transitions)
- **Document Tooling Engine**: `pdf-lib`, `pdf2pic`
- **Image Tooling Engine**: `sharp`, `tesseract.js`, `onnxruntime-node`

## 🚀 Quick Start Instructions

### 1. Install Dependencies
Make sure you have Node > 20.19 installed.
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to begin developing.

### 3. Production Build
```bash
npm run build
```
This triggers the Next.js build along with our custom `postbuild.mjs` script, which gracefully clones static assets (images, CSS) to support the stripped-down deployment proxy.

### 4. Start Production Server
```bash
npm run start
```
Starts the optimized standalone server environment.

## 🌐 Deployment Architecture

PdfPixels is uniquely configured to run safely in strict hardware environments (such as Hostinger Virtual Servers and Shared setups). 
By strictly enforcing the `output: "standalone"` directive in `next.config.ts`, the application drastically reduces its startup RAM footprint from >1.5GB down to ~50MB, preventing generic web hosting Out Of Memory (OOM) crashes without sacrificing processing fidelity.

## 📬 Contact & Support

For business inquiries, support requests, or feature ideas:
**Email:** [support@pdfpixels.com](mailto:support@pdfpixels.com)
**Website:** [https://www.pdfpixels.com](https://www.pdfpixels.com)

---

&copy; PdfPixels. All rights reserved.
