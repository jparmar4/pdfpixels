import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { segmentForeground } from '@/lib/ai/pipelines/segmentation';
import { applyBackgroundBlur, applyRegionBlur, applyTransparentBackground } from '@/lib/ai/pipelines/compositor';
import { detectFaceRegions, type FaceMode } from '@/lib/ai/pipelines/face-detection';
import { detectFaceRegionsONNX } from '@/lib/ai/pipelines/face-detection-onnx';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const tool = (formData.get('tool') as string) || 'enhance-image';
    const modeRaw = (formData.get('mode') as string) || 'balanced';
    const mode: FaceMode = modeRaw === 'privacy-max' ? 'privacy-max' : modeRaw === 'high' ? 'high' : 'balanced';
    const expectedFacesRaw = parseInt((formData.get('expectedFaces') as string) || '', 10);
    const expectedFaces = Number.isFinite(expectedFacesRaw) && expectedFacesRaw > 0 ? Math.min(8, expectedFacesRaw) : null;

    if (!file) {
      return apiError('No image provided', 400);
    }

    if (file.size > 20 * 1024 * 1024) {
      return apiError('File too large. Maximum size for processing is 20MB.', 400);
    }

    const sharpModule = await import('sharp');
    const sharp = sharpModule.default;
    const input = Buffer.from(await file.arrayBuffer());
    const base = sharp(input, { failOn: 'none' });

    let out: Buffer;
    let engine = 'sharp-basic-v1';

    switch (tool) {
      case 'remove-background': {
        const seg = await segmentForeground(sharp, input);
        out = await applyTransparentBackground(sharp, seg.image, seg.softFgMask);
        engine = `${seg.engine}:${mode}`;
        break;
      }

      case 'blur-background': {
        const seg = await segmentForeground(sharp, input);
        const sigma = mode === 'privacy-max' ? 26 : mode === 'high' ? 20 : 16;
        out = await applyBackgroundBlur(sharp, seg.image, seg.softFgMask, sigma);
        engine = `${seg.engine}:${mode}`;
        break;
      }

      case 'blur-face': {
        const { data, info } = await base.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const image = { data, width: info.width, height: info.height };

        const onnx = await detectFaceRegionsONNX(image, mode);
        const faces = onnx && onnx.regions.length > 0 ? onnx : await detectFaceRegions(sharp, image, mode);

        let regions = faces.regions;

        // Only pad with synthetic slots when the user explicitly expects more faces.
        // Never invent faces when detection found none (avoids random full-image blur).
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
              error: 'No faces detected. Try a clearer portrait photo or lower the detection mode.',
              success: false,
              engine: faces.engine,
            },
            { status: 422, headers: CACHE_HEADERS },
          );
        }

        const sigma = mode === 'privacy-max' ? 34 : mode === 'high' ? 28 : 24;
        out = await applyRegionBlur(sharp, image, regions, sigma);

        // privacy-max: slightly expand each face region blur, not the whole image
        if (mode === 'privacy-max') {
          const expanded = regions.map((r) => {
            const padX = Math.round(r.width * 0.2);
            const padY = Math.round(r.height * 0.25);
            const left = Math.max(0, r.left - padX);
            const top = Math.max(0, r.top - padY);
            return {
              left,
              top,
              width: Math.min(info.width - left, r.width + padX * 2),
              height: Math.min(info.height - top, r.height + padY * 2),
            };
          });
          out = await applyRegionBlur(
            sharp,
            await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true }).then((raw) => ({
              data: raw.data,
              width: raw.info.width,
              height: raw.info.height,
            })),
            expanded,
            18,
          );
          engine = `${faces.engine}+expand${expectedFaces ? `+expected-${expectedFaces}` : ''}`;
        } else {
          engine = `${faces.engine}${expectedFaces ? `+expected-${expectedFaces}` : ''}`;
        }
        break;
      }

      case 'enhance-image': {
        // Multi-step enhancement: denoise, sharpen, improve contrast, boost vibrance
        out = await base
          .clone()
          // Step 1: Reduce noise and smooth artifacts
          .blur(0.3)
          // Step 2: Apply unsharp mask (sharpen) for crisp edges
          .sharpen({ sigma: 1.2, m1: 0.5, m2: 3, x1: 2, y2: 10, y3: 20 })
          // Step 3: Normalize brightness and contrast
          .normalize()
          // Step 4: Boost saturation slightly for richer colors
          .modulate({ brightness: 1.04, saturation: 1.25 })
          // Step 5: Final sharpen pass for edge definition
          .sharpen({ sigma: 0.6, m1: 0.8, m2: 1.5, x1: 2, y2: 10, y3: 20 })
          .png({ quality: 100, compressionLevel: 6 })
          .toBuffer();
        engine = 'sharp-enhanced-v2';
        break;
      }

      case 'beautify': {
        // Portrait beautification: smooth skin, brighten, enhance eyes area
        out = await base
          .clone()
          // Gentle blur for skin smoothing (simulates bilateral filter)
          .blur(0.8)
          // Re-sharpen eyes/edges selectively
          .sharpen({ sigma: 0.6, m1: 0.2, m2: 1, x1: 3, y2: 15, y3: 25 })
          // Slight brightness boost for glowing skin
          .modulate({ brightness: 1.08, saturation: 1.1 })
          // Soft contrast enhancement
          .normalize()
          .png({ quality: 100, compressionLevel: 6 })
          .toBuffer();
        engine = 'sharp-beautify-v2';
        break;
      }
      case 'retouch': {
        // Photo retouching: blemish removal simulation, clarity, color correction
        out = await base
          .clone()
          // Light blur to reduce blemishes/spots
          .blur(0.5)
          // Re-sharpen to maintain detail
          .sharpen({ sigma: 0.7, m1: 0.3, m2: 1.2, x1: 2, y2: 12, y3: 22 })
          // Color correction and normalization
          .normalize()
          // Subtle warm tone adjustment
          .modulate({ brightness: 1.05, saturation: 1.12 })
          // Final clarity pass
          .sharpen({ sigma: 0.4, m1: 0.5, m2: 0.8 })
          .png({ quality: 100, compressionLevel: 6 })
          .toBuffer();
        engine = 'sharp-retouch-v2';
        break;
      }

      case 'upscale': {
        const meta = await base.metadata();
        const scale = 2;
        const newWidth = (meta.width || 800) * scale;
        const newHeight = (meta.height || 600) * scale;
        
        // Multi-step upscale for better quality
        // Step 1: Upscale by 2x with lanczos3
        out = await base
          .clone()
          .resize({
            width: newWidth,
            height: newHeight,
            kernel: sharp.kernel.lanczos3,
            fastShrinkOnLoad: false,
          })
          // Step 2: Sharpen to recover detail lost during upscaling
          .sharpen({ sigma: 1.0, m1: 1.0, m2: 2.5, x1: 2, y2: 10, y3: 20 })
          // Step 3: Mild unsharp mask
          .sharpen({ sigma: 0.5, m1: 0.3, m2: 1.0, x1: 3, y2: 15, y3: 25 })
          // Step 4: Normalize to fix contrast loss
          .normalize()
          .png({ quality: 100, compressionLevel: 6 })
          .toBuffer();
        engine = `sharp-upscale-v2-${scale}x`;
        break;
      }

      default: {
        out = await base.png({ quality: 100 }).toBuffer();
      }
    }

    return NextResponse.json(
      {
        success: true,
        imageUrl: `data:image/png;base64,${out.toString('base64')}`,
        tool,
        engine,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error('AI route error:', error);
    return apiError('Image processing failed. Please try a different image.', 500);
  }
}
