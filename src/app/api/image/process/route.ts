import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';

// Cache control for API responses
const CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

// Formats that CANNOT carry an alpha (transparency) channel
const LOSSY_FORMATS = new Set(['jpg', 'jpeg']);

// Maximum file sizes
const MAX_IMAGE_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_DIMENSION = 20_000;

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return apiError('No image provided', 400);
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return apiError('File too large. Maximum size is 100 MB', 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const sharpModule = await import('sharp');
    const sharp = sharpModule.default;
    const params = parseParams(formData);

    // Create sharp instance
    let image = sharp(buffer, { failOn: 'none', limitInputPixels: 500_000_000 });

    // Get metadata ONCE before any transformation
    const metadata = await image.metadata();

    // Respect requested output format; only fallback when missing/invalid
    const validFormats = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'tiff']);
    if (!params.format || !validFormats.has(params.format)) {
      params.format = metadata.format || 'jpg';
    }

    if (
      (metadata.width && metadata.width > MAX_DIMENSION) ||
      (metadata.height && metadata.height > MAX_DIMENSION)
    ) {
      return apiError('Image dimensions too large. Maximum is 20,000 px per side.', 400);
    }

    // ── Fix 1: Convert non-sRGB colorspaces to sRGB ───────────────────────────
    // CMYK, Lab, XYZ etc. will produce severe color shifts without this.
    if (metadata.space && !['srgb', 'rgb'].includes(metadata.space)) {
      image = image.toColorspace('srgb');
    }

    // ── Preserve metadata (ICC profiles, EXIF, DPI) ───────────────────────────
    if (params.density) {
      image = image.withMetadata({ density: params.density });
    } else {
      image = image.withMetadata(); // keeps ICC + EXIF + orientation
    }

    // Apply geometric + color transformations
    image = applyTransformations(image, params, metadata);

    // ── Fix 2: Flatten alpha BEFORE any lossy output ──────────────────────────
    // Transparent pixels become black/purple/yellow in JPEG without this.
    if (LOSSY_FORMATS.has(params.format) && metadata.hasAlpha) {
      image = image.flatten({ background: { r: 255, g: 255, b: 255 } });
    }

    // Process output
    const { outputBuffer, mimeType } = await processOutput(image, params, metadata);

    // Binary-search optimize for target file size (if requested)
    const finalBuffer = params.targetSize
      ? await optimizeForTargetSize(buffer, params, params.targetSize * 1024, params.format)
      : outputBuffer;

    const base64 = finalBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;
    const savedBytes = buffer.length - finalBuffer.length;

    return NextResponse.json({
      success: true,
      imageUrl: dataUrl,
      originalSize: buffer.length,
      processedSize: finalBuffer.length,
      savedBytes: Math.max(0, savedBytes),
      savedPercent: Math.max(0, Math.round((savedBytes / buffer.length) * 100)),
      originalDimensions: { width: metadata.width, height: metadata.height },
      format: params.format,
      mimeType,
      quality: params.quality,
      processingTime: Math.round(performance.now() - startTime),
    }, { headers: CACHE_HEADERS });

  } catch (error) {
    console.error('Image processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

// ─── Parameters ───────────────────────────────────────────────────────────────

function parseParams(formData: FormData) {
  const requestedFormat = ((formData.get('format') as string) || '').toLowerCase().replace('jpeg', 'jpg');

  return {
    // Default quality raised to 92 — more faithful color reproduction than 85
    quality: Math.min(100, Math.max(1, parseInt(formData.get('quality') as string) || 92)),
    format: requestedFormat || undefined,
    width: parsePositiveInt(formData.get('width')),
    height: parsePositiveInt(formData.get('height')),
    fit: (formData.get('fit') as string) || 'inside',
    withoutEnlargement: formData.get('withoutEnlargement') !== 'false',
    targetSize: parsePositiveInt(formData.get('targetSize')),
    compressionLevel: Math.min(9, Math.max(0, parseInt(formData.get('compressionLevel') as string) || 6)),
    rotate: parseInt(formData.get('rotate') as string) || 0,
    flip: formData.get('flip') === 'true',
    flop: formData.get('flop') === 'true',
    cropLeft: parsePositiveInt(formData.get('cropLeft')),
    cropTop: parsePositiveInt(formData.get('cropTop')),
    cropWidth: parsePositiveInt(formData.get('cropWidth')),
    cropHeight: parsePositiveInt(formData.get('cropHeight')),
    brightness: parseFloat(formData.get('brightness') as string) || undefined,
    contrast: parseFloat(formData.get('contrast') as string) || undefined,
    saturation: parseFloat(formData.get('saturation') as string) || undefined,
    hue: parseInt(formData.get('hue') as string) || undefined,
    blur: parseFloat(formData.get('blur') as string) || undefined,
    sharpen: parseFloat(formData.get('sharpen') as string) || undefined,
    grayscale: formData.get('grayscale') === 'true',
    negate: formData.get('negate') === 'true',
    sepia: formData.get('sepia') === 'true',
    normalise: formData.get('normalise') === 'true',
    density: parsePositiveInt(formData.get('density')),
  };
}

function parsePositiveInt(value: FormDataEntryValue | null): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value as string);
  return n > 0 ? n : undefined;
}

// ─── Transformations ───────────────────────────────────────────────────────────

type SharpInstance = any;
type Metadata = any;
type Params = ReturnType<typeof parseParams>;

function applyTransformations(image: SharpInstance, params: Params, metadata: Metadata): SharpInstance {
  // Rotation — fill exposed areas with white, not black
  if (params.rotate !== 0) {
    image = image.rotate(params.rotate, { background: { r: 255, g: 255, b: 255, alpha: 1 } });
  }

  if (params.flip) image = image.flip();
  if (params.flop) image = image.flop();

  // Crop
  if (params.cropWidth && params.cropHeight &&
    params.cropLeft !== undefined && params.cropTop !== undefined) {
    image = image.extract({
      left: params.cropLeft,
      top: params.cropTop,
      width: Math.min(params.cropWidth, (metadata.width ?? 0) - params.cropLeft),
      height: Math.min(params.cropHeight, (metadata.height ?? 0) - params.cropTop),
    });
  }

  // Resize — Lanczos3 for highest quality
  if (params.width || params.height) {
    image = image.resize(params.width, params.height, {
      fit: params.fit as 'cover' | 'contain' | 'fill' | 'inside' | 'outside',
      withoutEnlargement: params.withoutEnlargement,
      kernel: 'lanczos3',
      fastShrinkOnLoad: false,
    });
  }

  // Color adjustments — modulate handles brightness, saturation, hue via HSL
  if (params.brightness !== undefined || params.saturation !== undefined || params.hue !== undefined) {
    image = image.modulate({
      brightness: params.brightness,
      saturation: params.saturation,
      hue: params.hue,
    });
  }

  // Contrast — apply via linear transform: output = contrast * input + shift
  if (params.contrast !== undefined) {
    const c = Math.max(0.1, params.contrast); // prevent divide by zero
    image = image.linear(c, -(128 * c) + 128);
  }

  // Effects
  if (params.blur && params.blur > 0.3) image = image.blur(Math.min(params.blur, 100));
  if (params.sharpen && params.sharpen > 0) {
    image = image.sharpen({ sigma: Math.max(0.5, params.sharpen), m1: 1.5, m2: 0.7, x1: 2, y2: 10, y3: 20 });
  }

  // Filters
  if (params.grayscale) image = image.grayscale();
  if (params.negate) image = image.negate({ alpha: false });
  if (params.normalise) image = image.normalise();

  // True sepia via colour recombination matrix (better than tint)
  if (params.sepia) {
    image = image.recomb([
      [0.3588, 0.7044, 0.1368],
      [0.2990, 0.5870, 0.1140],
      [0.2392, 0.4696, 0.0912],
    ]);
  }

  return image;
}

// ─── Output format encoding ────────────────────────────────────────────────────

async function processOutput(
  image: SharpInstance,
  params: Params,
  metadata: Metadata
): Promise<{ outputBuffer: Buffer; mimeType: string }> {
  let outputBuffer: Buffer;
  let mimeType: string;

  switch (params.format) {
    case 'png':
      outputBuffer = await image
        .png({
          compressionLevel: params.compressionLevel,
          adaptiveFiltering: true,
          // Use palette (lossy compression) if quality < 100, otherwise 24-bit full colour (lossless)
          palette: params.quality < 100,
          quality: params.quality < 100 ? params.quality : undefined,
          colors: params.quality < 100 ? Math.max(2, Math.round(256 * (params.quality / 100))) : 256,
        })
        .toBuffer();
      mimeType = 'image/png';
      break;

    case 'webp':
      outputBuffer = await image
        .webp({
          quality: params.quality,
          lossless: params.quality >= 100,
          nearLossless: params.quality >= 95,
          smartSubsample: true,
          effort: 5,
          preset: 'photo',
        })
        .toBuffer();
      mimeType = 'image/webp';
      break;

    case 'avif':
      outputBuffer = await image
        .avif({
          quality: params.quality,
          lossless: params.quality >= 100,
          effort: 5,
          // 4:4:4 = full chroma — no colour bleed at high quality
          chromaSubsampling: params.quality >= 80 ? '4:4:4' : '4:2:0',
        })
        .toBuffer();
      mimeType = 'image/avif';
      break;

    case 'gif':
      outputBuffer = await image
        .gif({ effort: 7, dither: 1.0 })
        .toBuffer();
      mimeType = 'image/gif';
      break;

    case 'tiff':
      outputBuffer = await image
        .tiff({
          quality: params.quality,
          compression: 'lzw',
          predictor: 'horizontal',
          xres: (metadata.density ?? 300) / 25.4,
          yres: (metadata.density ?? 300) / 25.4,
          bitdepth: 8,
        })
        .toBuffer();
      mimeType = 'image/tiff';
      break;

    default: // jpg / jpeg
      outputBuffer = await image
        .jpeg({
          quality: params.quality,
          // ── KEY FIX — these three settings eliminate the white→yellow shift ──
          mozjpeg: false,              // mozjpeg's aggressive DCT shifts hue on near-whites
          chromaSubsampling: '4:4:4', // full chroma preserves every colour exactly
          trellisQuantisation: false, // avoids quantisation that yellows near-white regions
          // ── Other quality options ────────────────────────────────────────────
          optimizeCoding: true,
          overshootDeringing: true,
          optimizeScans: false,
          force: true,
        })
        .toBuffer();
      mimeType = 'image/jpeg';
  }

  return { outputBuffer, mimeType };
}

// ─── Target size binary-search optimisation ───────────────────────────────────

async function optimizeForTargetSize(
  originalBuffer: Buffer,
  params: Params,
  targetBytes: number,
  format: string
): Promise<Buffer> {
  const sharpModule = await import('sharp');
  const sharp = sharpModule.default;

  let minQ = 5;
  let maxQ = 99;
  let bestBuffer: Buffer | null = null;

  for (let i = 0; i < 8; i++) {
    const q = Math.round((minQ + maxQ) / 2);

    let img = sharp(originalBuffer, { failOn: 'none' });
    const meta = await img.metadata();

    if (LOSSY_FORMATS.has(format) && meta.hasAlpha) {
      img = img.flatten({ background: { r: 255, g: 255, b: 255 } });
    }
    if (params.width || params.height) {
      img = img.resize(params.width, params.height, { fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' });
    }
    if (params.rotate) img = img.rotate(params.rotate, { background: { r: 255, g: 255, b: 255 } });
    if (params.flip) img = img.flip();
    if (params.flop) img = img.flop();
    if (params.grayscale) img = img.grayscale();
    if (params.blur && params.blur > 0.3) img = img.blur(params.blur);

    let buf: Buffer;
    switch (format) {
      case 'png':
        buf = await img.png({ compressionLevel: 9 }).toBuffer();
        break;
      case 'webp':
        buf = await img.webp({ quality: q, smartSubsample: true }).toBuffer();
        break;
      case 'avif':
        buf = await img.avif({ quality: q }).toBuffer();
        break;
      default:
        buf = await img.jpeg({ quality: q, chromaSubsampling: '4:4:4', mozjpeg: false, optimizeCoding: true, force: true }).toBuffer();
    }

    if (buf.length <= targetBytes) {
      bestBuffer = buf;
      minQ = q + 1;
      if (Math.abs(buf.length - targetBytes) < targetBytes * 0.03) break;
    } else {
      maxQ = q - 1;
    }
  }

  if (!bestBuffer) {
    // Last resort: use very low quality
    let img = sharp(originalBuffer, { failOn: 'none' });
    const meta = await img.metadata();
    if (LOSSY_FORMATS.has(format) && meta.hasAlpha) {
      img = img.flatten({ background: { r: 255, g: 255, b: 255 } });
    }

    switch (format) {
      case 'png':
        bestBuffer = await img.png({ compressionLevel: 9, palette: true, colors: 32 }).toBuffer();
        break;
      case 'webp':
        bestBuffer = await img.webp({ quality: 5 }).toBuffer();
        break;
      case 'avif':
        bestBuffer = await img.avif({ quality: 5, chromaSubsampling: '4:2:0' }).toBuffer();
        break;
      default:
        bestBuffer = await img.jpeg({ quality: 5, chromaSubsampling: '4:4:4', mozjpeg: false, force: true }).toBuffer();
    }
  }

  return bestBuffer;
}
