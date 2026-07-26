import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { segmentForeground } from '@/lib/ai/pipelines/segmentation';
import { applyBackgroundBlur, applyRegionBlur, applyTransparentBackground } from '@/lib/ai/pipelines/compositor';
import { detectFaceRegions, type FaceMode } from '@/lib/ai/pipelines/face-detection';
import { detectFaceRegionsONNX } from '@/lib/ai/pipelines/face-detection-onnx';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_EDGE = 4096;
const MAX_OUTPUT_EDGE = 4096;

type QualityMode = FaceMode; // balanced | high | privacy-max

function clampDimension(width: number, height: number, maxEdge: number) {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function toPngDataUrl(buffer: Buffer, maxEdge = MAX_OUTPUT_EDGE) {
  const sharpModule = await import('sharp');
  const sharp = sharpModule.default;
  const meta = await sharp(buffer, { failOn: 'none' }).metadata();
  const w = meta.width || 1;
  const h = meta.height || 1;
  const dims = clampDimension(w, h, maxEdge);

  let pipeline = sharp(buffer, { failOn: 'none' });
  if (dims.width !== w || dims.height !== h) {
    pipeline = pipeline.resize(dims.width, dims.height, {
      fit: 'inside',
      withoutEnlargement: true,
      kernel: 'lanczos3',
    });
  }

  const out = await pipeline.png({ compressionLevel: 6, adaptiveFiltering: true }).toBuffer();
  // Cap ~12MB base64 payload
  if (out.length > 12 * 1024 * 1024) {
    const smaller = await sharp(out)
      .resize({ width: Math.min(dims.width, 2048), height: Math.min(dims.height, 2048), fit: 'inside' })
      .png({ compressionLevel: 8 })
      .toBuffer();
    return {
      imageUrl: `data:image/png;base64,${smaller.toString('base64')}`,
      bytes: smaller.length,
    };
  }

  return {
    imageUrl: `data:image/png;base64,${out.toString('base64')}`,
    bytes: out.length,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const tool = (formData.get('tool') as string) || 'enhance-image';
    const modeRaw = (formData.get('mode') as string) || 'balanced';
    const mode: QualityMode =
      modeRaw === 'privacy-max' ? 'privacy-max' : modeRaw === 'high' ? 'high' : 'balanced';
    const expectedFacesRaw = parseInt((formData.get('expectedFaces') as string) || '', 10);
    const expectedFaces =
      Number.isFinite(expectedFacesRaw) && expectedFacesRaw > 0 ? Math.min(8, expectedFacesRaw) : null;

    if (!file) {
      return apiError('No image provided', 400);
    }

    if (file.size > MAX_BYTES) {
      return apiError('File too large. Maximum size for AI processing is 20MB.', 400);
    }

    if (file.type && !file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|heic|avif|bmp|tiff?)$/i.test(file.name)) {
      return apiError('Only image files are supported for AI tools.', 400);
    }

    const sharpModule = await import('sharp');
    const sharp = sharpModule.default;
    let input = Buffer.from(await file.arrayBuffer());

    // Normalize orientation + cap working resolution for speed/stability
    const meta = await sharp(input, { failOn: 'none' }).metadata();
    const srcW = meta.width || 1;
    const srcH = meta.height || 1;
    const work = clampDimension(srcW, srcH, MAX_EDGE);

    let base = sharp(input, { failOn: 'none' }).rotate(); // honor EXIF orientation
    if (work.width !== srcW || work.height !== srcH) {
      base = base.resize(work.width, work.height, {
        fit: 'inside',
        withoutEnlargement: true,
        kernel: 'lanczos3',
      });
      input = Buffer.from(await base.toBuffer());
      base = sharp(input, { failOn: 'none' });
    }

    let out: Buffer;
    let engine = 'sharp-basic-v1';
    let faceCount: number | undefined;

    switch (tool) {
      case 'remove-background': {
        const seg = await segmentForeground(sharp, input);
        out = await applyTransparentBackground(sharp, seg.image, seg.softFgMask);
        engine = `${seg.engine}:${mode}`;
        break;
      }

      case 'blur-background': {
        const seg = await segmentForeground(sharp, input);
        // Optional client-provided blur strength 1–100 (preferred over coarse mode)
        const strengthRaw = parseInt((formData.get('blurStrength') as string) || '', 10);
        let sigma: number;
        if (Number.isFinite(strengthRaw) && strengthRaw > 0) {
          // Map 1–100 → ~6–40 Gaussian sigma (portrait-friendly)
          const t = Math.max(1, Math.min(100, strengthRaw)) / 100;
          sigma = 6 + t * 34;
        } else {
          // Mode fallbacks for older clients
          sigma = mode === 'privacy-max' ? 32 : mode === 'high' ? 22 : 14;
        }
        out = await applyBackgroundBlur(sharp, seg.image, seg.softFgMask, sigma);
        engine = `${seg.engine}:blur-bg:s${Math.round(sigma)}:${mode}`;
        break;
      }

      case 'blur-face': {
        const { data, info } = await base.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const image = { data, width: info.width, height: info.height };

        const onnx = await detectFaceRegionsONNX(image, mode);
        const faces = onnx && onnx.regions.length > 0 ? onnx : await detectFaceRegions(sharp, image, mode);
        const regions = faces.regions;

        if (expectedFaces && regions.length > 0 && regions.length < expectedFaces) {
          const template = regions[0];
          const fw = template.width || Math.round(image.width * 0.16);
          const fh = template.height || Math.round(fw * 1.22);
          const y = template.top ?? Math.round(image.height * 0.18);
          const step = image.width / expectedFaces;
          while (regions.length < expectedFaces) {
            const i = regions.length;
            const centerX = Math.round(step * i + step / 2);
            const left = Math.max(0, Math.min(image.width - 1, centerX - Math.round(fw / 2)));
            regions.push({
              left,
              top: Math.max(0, Math.min(image.height - 1, y)),
              width: Math.max(1, Math.min(fw, image.width - left)),
              height: Math.max(1, Math.min(fh, image.height - y)),
            });
          }
        }

        if (regions.length === 0) {
          return NextResponse.json(
            {
              error: 'No faces detected. Try a clearer portrait, better lighting, or Balanced mode.',
              success: false,
              engine: faces.engine,
              faceCount: 0,
            },
            { status: 422, headers: CACHE_HEADERS },
          );
        }

        // blurStrength 1–100 optional; faceStyle blur | pixelate
        const strengthRaw = parseInt((formData.get('blurStrength') as string) || '', 10);
        const faceStyle = ((formData.get('faceStyle') as string) || 'blur').toLowerCase();
        let sigma: number;
        if (Number.isFinite(strengthRaw) && strengthRaw > 0) {
          const t = Math.max(1, Math.min(100, strengthRaw)) / 100;
          sigma = 14 + t * 36; // ~14–50
        } else {
          sigma = mode === 'privacy-max' ? 40 : mode === 'high' ? 30 : 22;
        }

        const expandPad =
          mode === 'privacy-max' || (Number.isFinite(strengthRaw) && strengthRaw >= 75) ? 0.28 : 0.12;

        const expanded = regions.map((r) => {
          const padX = Math.round(r.width * expandPad);
          const padY = Math.round(r.height * (expandPad + 0.06));
          const left = Math.max(0, r.left - padX);
          const top = Math.max(0, r.top - padY);
          return {
            left,
            top,
            width: Math.min(info.width - left, r.width + padX * 2),
            height: Math.min(info.height - top, r.height + padY * 2),
          };
        });

        if (faceStyle === 'pixelate') {
          // Mosaic faces: extract → pixelate via resize down/up → composite
          let pipeline = sharp(image.data, {
            raw: { width: image.width, height: image.height, channels: 4 },
          });
          const block = Math.max(4, Math.round(6 + (sigma / 50) * 22));
          for (const r of expanded) {
            const smallW = Math.max(1, Math.round(r.width / block));
            const smallH = Math.max(1, Math.round(r.height / block));
            const tile = await sharp(image.data, {
              raw: { width: image.width, height: image.height, channels: 4 },
            })
              .extract({ left: r.left, top: r.top, width: r.width, height: r.height })
              .resize(smallW, smallH, { kernel: 'nearest' })
              .resize(r.width, r.height, { kernel: 'nearest' })
              .png()
              .toBuffer();
            pipeline = pipeline.composite([{ input: tile, left: r.left, top: r.top }]);
          }
          out = await pipeline.png().toBuffer();
          engine = `${faces.engine}+pixelate:b${block}:n${regions.length}`;
        } else {
          out = await applyRegionBlur(sharp, image, expanded, sigma);
          if (mode === 'privacy-max' || (Number.isFinite(strengthRaw) && strengthRaw >= 85)) {
            // Second pass for heavy privacy
            out = await applyRegionBlur(
              sharp,
              await sharp(out)
                .ensureAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true })
                .then((raw) => ({
                  data: raw.data,
                  width: raw.info.width,
                  height: raw.info.height,
                })),
              expanded,
              Math.max(12, sigma * 0.55),
            );
            engine = `${faces.engine}+blur-x2:s${Math.round(sigma)}:n${regions.length}`;
          } else {
            engine = `${faces.engine}+blur:s${Math.round(sigma)}:n${regions.length}`;
          }
        }

        faceCount = regions.length;
        break;
      }

      case 'enhance-image': {
        // Mode-aware enhance: balanced = gentle, high = punchier, privacy-max unused → treat as high
        const strength = mode === 'balanced' ? 0.85 : 1.15;
        // Natural = mild polish; Vivid/high = stronger contrast + color
        out = await base
          .clone()
          .blur(mode === 'balanced' ? 0.28 : 0.18)
          .sharpen({
            sigma: 0.9 * strength,
            m1: 0.5,
            m2: 2.8,
            x1: 2,
            y2: 10,
            y3: 20,
          })
          .normalize()
          .modulate({
            brightness: mode === 'balanced' ? 1.02 : 1.05,
            saturation: mode === 'balanced' ? 1.12 : 1.22,
          })
          .sharpen({ sigma: 0.45 * strength, m1: 0.7, m2: 1.2, x1: 2, y2: 10, y3: 20 })
          .png({ compressionLevel: 6 })
          .toBuffer();
        engine = `sharp-enhanced-v3:${mode}`;
        break;
      }

      case 'beautify': {
        const blurAmt = mode === 'balanced' ? 0.55 : 0.9;
        out = await base
          .clone()
          .blur(blurAmt)
          .sharpen({ sigma: mode === 'balanced' ? 0.5 : 0.7, m1: 0.25, m2: 1.1, x1: 3, y2: 15, y3: 25 })
          .modulate({
            brightness: mode === 'balanced' ? 1.05 : 1.09,
            saturation: mode === 'balanced' ? 1.06 : 1.12,
          })
          .normalize()
          .png({ compressionLevel: 6 })
          .toBuffer();
        engine = `sharp-beautify-v3:${mode}`;
        break;
      }

      case 'retouch': {
        out = await base
          .clone()
          .blur(mode === 'balanced' ? 0.35 : 0.55)
          .sharpen({ sigma: mode === 'balanced' ? 0.55 : 0.75, m1: 0.3, m2: 1.2, x1: 2, y2: 12, y3: 22 })
          .normalize()
          .modulate({
            brightness: 1.04,
            saturation: mode === 'balanced' ? 1.08 : 1.14,
          })
          .sharpen({ sigma: 0.35, m1: 0.45, m2: 0.8 })
          .png({ compressionLevel: 6 })
          .toBuffer();
        engine = `sharp-retouch-v3:${mode}`;
        break;
      }

      case 'upscale': {
        const m = await base.metadata();
        const scale = mode === 'balanced' ? 2 : mode === 'high' ? 2 : 2;
        // Cap upscaled edge so we don't OOM
        const targetW = Math.min((m.width || 800) * scale, MAX_OUTPUT_EDGE);
        const targetH = Math.min((m.height || 600) * scale, MAX_OUTPUT_EDGE);
        out = await base
          .clone()
          .resize({
            width: targetW,
            height: targetH,
            fit: 'inside',
            kernel: sharp.kernel.lanczos3,
            fastShrinkOnLoad: false,
          })
          .sharpen({
            sigma: mode === 'balanced' ? 0.8 : 1.1,
            m1: 0.9,
            m2: 2.2,
            x1: 2,
            y2: 10,
            y3: 20,
          })
          .modulate({ brightness: 1.01, saturation: 1.05 })
          .png({ compressionLevel: 6 })
          .toBuffer();
        engine = `sharp-upscale-v3-${scale}x:${mode}`;
        break;
      }

      default: {
        out = await base.png({ compressionLevel: 6 }).toBuffer();
        engine = 'sharp-passthrough';
      }
    }

    const payload = await toPngDataUrl(out);

    return NextResponse.json(
      {
        success: true,
        imageUrl: payload.imageUrl,
        tool,
        engine,
        mode,
        outputBytes: payload.bytes,
        ...(faceCount !== undefined ? { faceCount } : {}),
      },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error('AI route error:', error);
    const message = error instanceof Error ? error.message : '';
    if (message.toLowerCase().includes('unsupported image') || message.toLowerCase().includes('input buffer')) {
      return apiError('Could not read this image. Try JPG or PNG.', 400);
    }
    return apiError('Image processing failed. Please try a different image or quality mode.', 500);
  }
}
