'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  FileJson,
  FileText,
  Image as ImageIcon,
  Shield,
  Terminal,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SitePageShell } from '@/components/layout/site-page-shell';

export function ApiDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const endpoints = [
    { method: 'POST', path: '/api/image/process', description: 'Process images with compression, resizing, conversion, and effects', category: 'Image' },
    { method: 'POST', path: '/api/pdf/merge', description: 'Merge multiple PDF files into one', category: 'PDF' },
    { method: 'POST', path: '/api/pdf/split', description: 'Split PDF into individual pages or extract specific pages', category: 'PDF' },
    { method: 'POST', path: '/api/pdf/compress', description: 'Compress PDF to reduce file size', category: 'PDF' },
    { method: 'POST', path: '/api/pdf/to-image', description: 'Convert PDF pages to images', category: 'PDF' },
    { method: 'POST', path: '/api/pdf/from-image', description: 'Create PDF from images', category: 'PDF' },
  ];

  const codeExamples = {
    compress: `// Compress an image\nconst formData = new FormData();\nformData.append('image', imageFile);\nformData.append('quality', '85');\nformData.append('format', 'webp');\n\nconst response = await fetch('https://www.pdfpixels.com/api/image/process', {\n  method: 'POST',\n  body: formData\n});\n\nconst result = await response.json();\nconsole.log(result.imageUrl);`,
    resize: `// Resize an image\nconst formData = new FormData();\nformData.append('image', imageFile);\nformData.append('width', '800');\nformData.append('height', '600');\n\nconst response = await fetch('https://www.pdfpixels.com/api/image/process', {\n  method: 'POST',\n  body: formData\n});\n\nconst result = await response.json();\nconsole.log(result.originalDimensions);`,
    pdfMerge: `// Merge PDFs\nconst formData = new FormData();\nformData.append('files', pdfFile1);\nformData.append('files', pdfFile2);\n\nconst response = await fetch('https://www.pdfpixels.com/api/pdf/merge', {\n  method: 'POST',\n  body: formData\n});\n\nconst result = await response.json();\nconsole.log(result.pdfUrl);`,
  };

  const parameters = [
    { name: 'image', type: 'File', required: true, description: 'Image file to process.' },
    { name: 'quality', type: 'Integer', required: false, description: 'Output quality from 1 to 100.' },
    { name: 'format', type: 'String', required: false, description: 'Output format: jpg, png, webp, avif, gif, tiff.' },
    { name: 'width', type: 'Integer', required: false, description: 'Target width in pixels.' },
    { name: 'height', type: 'Integer', required: false, description: 'Target height in pixels.' },
    { name: 'targetSize', type: 'Integer', required: false, description: 'Target file size in KB.' },
    { name: 'rotate', type: 'Integer', required: false, description: 'Rotation angle from -360 to 360.' },
    { name: 'brightness', type: 'Float', required: false, description: 'Brightness from 0.5 to 2.0.' },
    { name: 'contrast', type: 'Float', required: false, description: 'Contrast from 0.5 to 2.0.' },
    { name: 'saturation', type: 'Float', required: false, description: 'Saturation from 0.5 to 2.0.' },
  ];

  const exampleCards: Array<{
    key: keyof typeof codeExamples;
    title: string;
    icon: typeof ImageIcon;
  }> = [
    { key: 'compress', title: 'Compress image', icon: ImageIcon },
    { key: 'resize', title: 'Resize image', icon: ImageIcon },
    { key: 'pdfMerge', title: 'Merge PDFs', icon: FileText },
  ];

  return (
    <SitePageShell
      eyebrow="API docs"
      title="Public endpoints for image and PDF processing."
      description="A clean reference for the PdfPixels public API with example requests, parameter summaries, and format expectations."
      icon={Terminal}
      align="center"
      stats={[
        { label: 'Auth', value: 'None' },
        { label: 'Rate limit', value: '60/min' },
        { label: 'Image cap', value: '100 MB' },
        { label: 'PDF cap', value: '500 MB' },
      ]}
      contentClassName="max-w-6xl"
    >
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">Getting started</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            PdfPixels exposes simple HTTP endpoints for public image and PDF processing. The goal is quick integration for demos, utilities, and lightweight automation.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1.5"><Zap className="mr-1 h-3.5 w-3.5" />Free to use</Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1.5"><Shield className="mr-1 h-3.5 w-3.5" />No auth required</Badge>
          </div>
        </div>

        <div className="section-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground">Reference links</h2>
          <div className="mt-6 flex flex-col gap-3">
            <a href="/openapi.yaml" target="_blank" rel="noopener noreferrer" className="rounded-[1.25rem] border border-border/60 bg-background/75 px-4 py-4 text-sm font-semibold text-foreground hover:border-primary/25">
              OpenAPI specification
            </a>
            <a href="/.well-known/ai-plugin.json" target="_blank" rel="noopener noreferrer" className="rounded-[1.25rem] border border-border/60 bg-background/75 px-4 py-4 text-sm font-semibold text-foreground hover:border-primary/25">
              AI plugin manifest
            </a>
          </div>
        </div>
      </section>

      <section className="section-panel mt-8 rounded-[2rem] p-6 md:p-8">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground"><Terminal className="h-5 w-5 text-primary" />Endpoints</h2>
        <div className="mt-6 space-y-3">
          {endpoints.map((endpoint, index) => (
            <motion.div key={endpoint.path} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="flex flex-col gap-3 rounded-[1.35rem] border border-border/60 bg-background/75 p-4 md:flex-row md:items-center">
              <Badge className={`w-fit font-mono ${endpoint.method === 'POST' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'}`}>
                {endpoint.method}
              </Badge>
              <code className="text-sm font-semibold text-foreground md:min-w-[220px]">{endpoint.path}</code>
              <p className="flex-1 text-sm text-muted-foreground">{endpoint.description}</p>
              <Badge variant="outline">{endpoint.category}</Badge>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        {exampleCards.map(({ key, title, icon: Icon }) => (
          <div key={key} className="section-panel rounded-[2rem] overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/40 bg-background/70 px-5 py-4">
              <div className="flex items-center gap-2 text-foreground">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-semibold">{title}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyCode(codeExamples[key as keyof typeof codeExamples], key)}>
                {copiedCode === key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <pre className="overflow-x-auto p-5 text-sm leading-7 text-muted-foreground"><code>{codeExamples[key as keyof typeof codeExamples]}</code></pre>
          </div>
        ))}
      </section>

      <section className="section-panel mt-8 rounded-[2rem] p-6 md:p-8">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground"><FileJson className="h-5 w-5 text-primary" />Parameters</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-border/40 text-sm text-muted-foreground">
                <th className="pb-3 pr-4">Parameter</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Required</th>
                <th className="pb-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((param) => (
                <tr key={param.name} className="border-b border-border/30 last:border-b-0">
                  <td className="py-4 pr-4"><code className="font-semibold text-primary">{param.name}</code></td>
                  <td className="py-4 pr-4 text-sm text-muted-foreground">{param.type}</td>
                  <td className="py-4 pr-4">{param.required ? <Badge className="bg-red-500/10 text-red-700 dark:text-red-300">Yes</Badge> : <Badge variant="secondary">No</Badge>}</td>
                  <td className="py-4 text-sm text-muted-foreground">{param.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section-panel mt-8 rounded-[2rem] p-6 md:p-8">
        <h2 className="text-2xl font-bold text-foreground">Success response</h2>
        <pre className="mt-5 overflow-x-auto rounded-[1.35rem] border border-border/60 bg-background/75 p-5 text-sm leading-7 text-muted-foreground"><code>{`{\n  "success": true,\n  "imageUrl": "data:image/webp;base64,...",\n  "originalSize": 1048576,\n  "processedSize": 524288,\n  "savedBytes": 524288,\n  "savedPercent": 50,\n  "originalDimensions": {\n    "width": 1920,\n    "height": 1080\n  },\n  "format": "webp",\n  "mimeType": "image/webp",\n  "quality": 85\n}`}</code></pre>
      </section>
    </SitePageShell>
  );
}

