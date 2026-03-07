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
      return NextResponse.json({ error: 'No image provided', success: false }, { status: 400, headers: CACHE_HEADERS });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size for processing is 20MB.', success: false },
        { status: 400, headers: CACHE_HEADERS }
      );
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

        // Hard rule for group reliability:
        // in high/privacy mode, if fewer than 3 faces detected, force 3 face slots.
        if (!expectedFaces && (mode === 'high' || mode === 'privacy-max') && regions.length < 3) {
          const base = regions[0];
          const fw = base?.width ?? Math.round(image.width * 0.16);
          const fh = base?.height ?? Math.round(fw * 1.22);
          const y = base?.top ?? Math.round(image.height * 0.18);

          const centers = [0.18, 0.5, 0.82].map((p) => Math.round(image.width * p));
          regions = centers.map((centerX) => {
            const left = Math.max(0, Math.min(image.width - 1, centerX - Math.round(fw / 2)));
            return {
              left,
              top: Math.max(0, Math.min(image.height - 1, y)),
              width: Math.max(1, Math.min(fw, image.width - left)),
              height: Math.max(1, Math.min(fh, image.height - Math.max(0, Math.min(image.height - 1, y)))),
            };
          });
        }

        if (expectedFaces && regions.length < expectedFaces) {
          const fw = Math.round(image.width * 0.16);
          const fh = Math.round(fw * 1.22);
          const y = Math.round(image.height * 0.18);
          const step = image.width / expectedFaces;
          const forced = Array.from({ length: expectedFaces }).map((_, i) => {
            const centerX = Math.round(step * i + step / 2);
            const left = Math.max(0, Math.min(image.width - 1, centerX - Math.round(fw / 2)));
            return {
              left,
              top: y,
              width: Math.max(1, Math.min(fw, image.width - left)),
              height: Math.max(1, Math.min(fh, image.height - y)),
            };
          });
          regions = forced;
        }

        const sigma = mode === 'privacy-max' ? 34 : mode === 'high' ? 28 : 24;
        out = await applyRegionBlur(sharp, image, regions, sigma);

        if (mode === 'privacy-max') {
          const bandTop = Math.floor(info.height * 0.02);
          const bandHeight = Math.floor(info.height * 0.9);
          const band = await sharp(out)
            .ensureAlpha()
            .extract({ left: 0, top: bandTop, width: info.width, height: Math.max(1, Math.min(bandHeight, info.height - bandTop)) })
            .blur(24)
            .png()
            .toBuffer();

          out = await sharp(out)
            .ensureAlpha()
            .composite([{ input: band, left: 0, top: bandTop }])
            .png()
            .toBuffer();

          engine = `${faces.engine}+band-guard${expectedFaces ? `+expected-${expectedFaces}` : ''}`;
        } else {
          engine = `${faces.engine}${expectedFaces ? `+expected-${expectedFaces}` : ''}`;
        }
        break;
      }

      case 'enhance-image': {
        out = await base
          .sharpen({ sigma: 1.5, m1: 1, m2: 2, x1: 2, y2: 10, y3: 20 })
          .modulate({ brightness: 1.05, saturation: 1.2 })
          .normalize()
          .png({ quality: 100 })
          .toBuffer();
        break;
      }

      case 'beautify':
      case 'retouch': {
        out = await base
          .blur(1.2)
          .sharpen({ sigma: 0.8, m1: 0, m2: 1 })
          .modulate({ brightness: 1.06, saturation: 1.08 })
          .normalize()
          .png({ quality: 100 })
          .toBuffer();
        break;
      }

      case 'upscale': {
        const meta = await base.metadata();
        out = await base
          .resize({
            width: (meta.width || 800) * 2,
            height: (meta.height || 600) * 2,
            kernel: sharp.kernel.lanczos3,
            fastShrinkOnLoad: false,
          })
          .sharpen({ sigma: 1.2 })
          .png({ quality: 100 })
          .toBuffer();
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
    return NextResponse.json(
      { error: 'Image processing failed. Please try a different image.', success: false },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}
