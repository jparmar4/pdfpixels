import type { BlurRegion, RGBAImage, SoftMask } from './types';

export async function applyTransparentBackground(sharp: any, image: RGBAImage, softFgMask: SoftMask) {
  const out = Uint8Array.from(image.data);
  for (let p = 0; p < softFgMask.length; p++) out[p * 4 + 3] = softFgMask[p];
  return sharp(out, { raw: { width: image.width, height: image.height, channels: 4 } }).png().toBuffer();
}

export async function applyBackgroundBlur(sharp: any, image: RGBAImage, softFgMask: SoftMask, sigma = 16) {
  const blurred = await sharp(image.data, { raw: { width: image.width, height: image.height, channels: 4 } })
    .blur(sigma)
    .raw()
    .toBuffer();

  const out = Uint8Array.from(image.data);
  for (let p = 0; p < softFgMask.length; p++) {
    const i = p * 4;
    const fg = softFgMask[p] / 255;
    const bg = 1 - fg;
    out[i] = Math.round(image.data[i] * fg + blurred[i] * bg);
    out[i + 1] = Math.round(image.data[i + 1] * fg + blurred[i + 1] * bg);
    out[i + 2] = Math.round(image.data[i + 2] * fg + blurred[i + 2] * bg);
  }

  return sharp(out, { raw: { width: image.width, height: image.height, channels: 4 } }).png().toBuffer();
}

export async function applyRegionBlur(sharp: any, image: RGBAImage, regions: BlurRegion[], sigma = 24) {
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
