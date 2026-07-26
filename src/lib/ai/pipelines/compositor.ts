import type { BlurRegion, RGBAImage, SharpLib, SoftMask } from './types';

export async function applyTransparentBackground(sharp: SharpLib, image: RGBAImage, softFgMask: SoftMask) {
  const out = Uint8Array.from(image.data);
  for (let p = 0; p < softFgMask.length; p++) out[p * 4 + 3] = softFgMask[p];
  return sharp(out, { raw: { width: image.width, height: image.height, channels: 4 } }).png().toBuffer();
}

/**
 * Portrait-style background blur.
 * Multi-pass blur produces smoother bokeh-like falloff than a single sharp.blur call.
 * Subject is composited back with soft mask edges from segmentation.
 */
export async function applyBackgroundBlur(
  sharp: SharpLib,
  image: RGBAImage,
  softFgMask: SoftMask,
  sigma = 16,
) {
  // Sharp Gaussian blur sigma is clamped ~0.3–1000; keep practical portrait range
  const s = Math.max(0.5, Math.min(80, sigma));

  // Downscale → heavy blur → upscale softens and speeds strong blurs (bokeh-like)
  const blurScale = s >= 22 ? 0.35 : s >= 14 ? 0.5 : 0.7;
  const smallW = Math.max(8, Math.round(image.width * blurScale));
  const smallH = Math.max(8, Math.round(image.height * blurScale));
  // Compensate sigma for downscale so perceived blur stays strong
  const scaledSigma = Math.max(0.5, Math.min(100, s * blurScale * 1.15));

  let pipeline = sharp(image.data, {
    raw: { width: image.width, height: image.height, channels: 4 },
  })
    .resize(smallW, smallH, { fit: 'fill', kernel: 'lanczos3' })
    .blur(scaledSigma);

  // Second light pass on strong settings for creamier defocus
  if (s >= 18) {
    pipeline = pipeline.blur(Math.min(12, scaledSigma * 0.45));
  }

  const blurred = await pipeline
    .resize(image.width, image.height, { fit: 'fill', kernel: 'lanczos3' })
    .raw()
    .toBuffer();

  const out = new Uint8Array(image.data.length);
  for (let p = 0; p < softFgMask.length; p++) {
    const i = p * 4;
    // Smoothstep the mask slightly so edge transitions look less hard
    const t = softFgMask[p] / 255;
    const fg = t * t * (3 - 2 * t);
    const bg = 1 - fg;
    out[i] = Math.round(image.data[i] * fg + blurred[i] * bg);
    out[i + 1] = Math.round(image.data[i + 1] * fg + blurred[i + 1] * bg);
    out[i + 2] = Math.round(image.data[i + 2] * fg + blurred[i + 2] * bg);
    out[i + 3] = 255;
  }

  return sharp(out, { raw: { width: image.width, height: image.height, channels: 4 } })
    .png({ compressionLevel: 6, adaptiveFiltering: true })
    .toBuffer();
}

export async function applyRegionBlur(sharp: SharpLib, image: RGBAImage, regions: BlurRegion[], sigma = 24) {
  let pipeline = sharp(image.data, { raw: { width: image.width, height: image.height, channels: 4 } });

  for (const r of regions) {
    const input = await sharp(image.data, { raw: { width: image.width, height: image.height, channels: 4 } })
      .extract({ left: r.left, top: r.top, width: r.width, height: r.height })
      .blur(sigma)
      .png()
      .toBuffer();

    pipeline = pipeline.composite([{ input, left: r.left, top: r.top }]);
  }

  return pipeline.png().toBuffer();
}
