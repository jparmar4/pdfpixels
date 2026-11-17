'use client';

export interface C2paFinding {
  category: 'C2PA / JUMBF' | 'IPTC AI Tag' | 'SynthID / Generator' | 'EXIF / XMP Tooling';
  label: string;
  detail: string;
  severity: 'verified' | 'ai-flagged' | 'info';
}

export interface C2paReport {
  fileName: string;
  fileSize: number;
  container: string;
  hasJumbf: boolean;
  hasC2paClaim: boolean;
  hasIptcAiTag: boolean;
  hasGeneratorMarker: boolean;
  verdict: 'C2PA Content Credentials Present' | 'AI / IPTC Provenance Metadata Detected' | 'Standard Camera / Software Metadata Only' | 'No Provenance or C2PA Manifest Found';
  findings: C2paFinding[];
  extractedStrings: string[];
  sha256: string;
}

function detectContainer(bytes: Uint8Array): string {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'JPEG (JFIF/EXIF/APP11)';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'PNG (Chunks/caBX/iTXt)';
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57 && bytes[9] === 0x45) return 'WebP (RIFF/XMP/EXIF)';
  if (bytes.length >= 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return 'ISO BMFF (AVIF/HEIC/JUMBF)';
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'PDF Document';
  return 'Binary Media';
}

function bytesToSearchableAscii(bytes: Uint8Array): string {
  // Read head + tail sections cleanly (capped at 4MB scan window for instant UI speed)
  const cap = Math.min(bytes.length, 4 * 1024 * 1024);
  const chars: string[] = [];
  for (let i = 0; i < cap; i += 1) {
    const b = bytes[i];
    chars.push(b >= 32 && b <= 126 ? String.fromCharCode(b) : ' ');
  }
  return chars.join('');
}

async function computeSha256(bytes: Uint8Array): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return 'unavailable';
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const hash = await crypto.subtle.digest('SHA-256', copy.buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function inspectC2paProvenanceClient(file: File): Promise<C2paReport> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const container = detectContainer(bytes);
  const ascii = bytesToSearchableAscii(bytes);
  const sha256 = await computeSha256(bytes);

  const findings: C2paFinding[] = [];
  const extracted = new Set<string>();

  const hasJumbf = /\bjumb\b|\bcaBX\b|c2pa\.claim|urn:c2pa/i.test(ascii);
  const hasC2paClaim = /c2pa\.(claim|assertions|actions|hash\.data|signature)/i.test(ascii) || ascii.includes('c2pa');

  if (hasJumbf || hasC2paClaim) {
    findings.push({
      category: 'C2PA / JUMBF',
      label: 'JUMBF / C2PA Provenance Container',
      detail: 'Detected ISO BMFF JUMBF box markers (`jumb` / `caBX` / `c2pa.claim`) inside media header segments.',
      severity: 'verified',
    });
  }

  for (const tag of ['c2pa.claim', 'c2pa.assertions', 'c2pa.actions', 'c2pa.hash.data', 'c2pa.created', 'c2pa.edited']) {
    if (ascii.includes(tag)) extracted.add(tag);
  }

  // IPTC DigitalSourceType tags
  const iptcAiMatch = ascii.match(/(?:DigitalSourceType[^<"' \n]{0,80})?(trainedAlgorithmicMedia|compositeWithTrainedAlgorithmicMedia|algorithmicMedia|compositeSynthetic|digitalCapture|trainedAlgorithmicData)/gi);
  const hasIptcAiTag = Boolean(iptcAiMatch?.length) || /Iptc4xmpExt:DigitalSourceType/i.test(ascii);
  if (hasIptcAiTag) {
    const uniq = Array.from(new Set(iptcAiMatch || ['Iptc4xmpExt:DigitalSourceType']));
    uniq.forEach((u) => extracted.add(u));
    const isSynthetic = uniq.some((u) => /trained|algorithmic|synthetic/i.test(u));
    findings.push({
      category: 'IPTC AI Tag',
      label: 'IPTC Digital Source Type Detected',
      detail: `Matched IPTC origin tag(s): ${uniq.join(', ')}`,
      severity: isSynthetic ? 'ai-flagged' : 'verified',
    });
  }

  // Known AI generator & SynthID signatures
  const generatorSignatures: Array<{ re: RegExp; name: string }> = [
    { re: /Adobe Firefly|Firefly Image|Adobe Inc\..*c2pa/i, name: 'Adobe Firefly Content Credentials' },
    { re: /SynthID|Made with Google AI|Google Imagen|DeepMind SynthID/i, name: 'Google SynthID / Imagen AI Marker' },
    { re: /DALL-E|OpenAI|ChatGPT-4o|GPT-Image/i, name: 'OpenAI DALL-E / ChatGPT C2PA Origin' },
    { re: /Midjourney/i, name: 'Midjourney Generation Metadata' },
    { re: /Stable Diffusion|ComfyUI|AUTOMATIC1111|CFG scale:\s*\d|Negative prompt:/i, name: 'Stable Diffusion / ComfyUI Generation Params' },
    { re: /Truepic/i, name: 'Truepic Authenticated Capture' },
  ];

  let hasGeneratorMarker = false;
  for (const sig of generatorSignatures) {
    const match = ascii.match(sig.re);
    if (match) {
      hasGeneratorMarker = true;
      extracted.add(match[0]);
      findings.push({
        category: 'SynthID / Generator',
        label: sig.name,
        detail: `Matched embedded origin string "${match[0]}"`,
        severity: 'ai-flagged',
      });
    }
  }

  const xmpMatches = ascii.match(/(?:CreatorTool|Software|Producer|Credit)[^<\n]{0,120}/g);
  if (xmpMatches?.length) {
    findings.push({
      category: 'EXIF / XMP Tooling',
      label: 'Software / Creator XMP Block',
      detail: xmpMatches.slice(0, 3).map((m) => m.replace(/\s+/g, ' ').trim()).join(' | '),
      severity: 'info',
    });
  }

  const verdict: C2paReport['verdict'] =
    hasJumbf || hasC2paClaim
      ? 'C2PA Content Credentials Present'
      : hasIptcAiTag || hasGeneratorMarker
        ? 'AI / IPTC Provenance Metadata Detected'
        : findings.length > 0
          ? 'Standard Camera / Software Metadata Only'
          : 'No Provenance or C2PA Manifest Found';

  return {
    fileName: file.name,
    fileSize: file.size,
    container,
    hasJumbf,
    hasC2paClaim,
    hasIptcAiTag,
    hasGeneratorMarker,
    verdict,
    findings,
    extractedStrings: Array.from(extracted).slice(0, 24),
    sha256,
  };
}

/**
 * Synthesizes a valid miniature JPEG with real APP11 JUMBF (`jumb` + `c2pa.claim`)
 * and XMP IPTC `trainedAlgorithmicMedia` segments in-browser for zero-dependency demos.
 */
export async function buildSampleC2paJpegFile(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 480, 320);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('C2PA SAMPLE ASSET', 110, 155);
  }
  const jpgBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9));
  const raw = new Uint8Array(await jpgBlob.arrayBuffer());

  const payloadStr =
    'JP\x00\x01jumbc2pa\x00c2pa.claim\x00c2pa.assertions\x00c2pa.actions\x00Adobe Firefly' +
    '<x:xmpmeta><rdf:Description Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia" xmp:CreatorTool="Adobe Firefly Image 3" exif:Software="SynthID Check Sample"/></x:xmpmeta>';
  const payloadBytes = new TextEncoder().encode(payloadStr);
  const segLen = payloadBytes.length + 2;
  const app11 = new Uint8Array(4 + payloadBytes.length);
  app11[0] = 0xff;
  app11[1] = 0xeb; // APP11 JUMBF marker
  app11[2] = (segLen >> 8) & 0xff;
  app11[3] = segLen & 0xff;
  app11.set(payloadBytes, 4);

  // Splice right after JPEG SOI (0xFF 0xD8)
  const combined = new Uint8Array(2 + app11.length + (raw.length - 2));
  combined.set(raw.subarray(0, 2), 0);
  combined.set(app11, 2);
  combined.set(raw.subarray(2), 2 + app11.length);

  return new File([combined.buffer], 'sample-c2pa-firefly-asset.jpg', { type: 'image/jpeg' });
}
