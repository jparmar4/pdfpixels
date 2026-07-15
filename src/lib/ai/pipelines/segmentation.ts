import type { SegmentationResult, SharpLib } from './types';
import { closing, largestComponent, opening, pIndex, rgbaIndex, toSoftMaskFromBinary } from '../utils/image';

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export async function segmentForeground(sharp: SharpLib, input: Buffer): Promise<SegmentationResult> {
  const { data, info } = await sharp(input, { failOn: 'none' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  const pxCount = width * height;

  // Estimate background from corner patches
  const corner = Math.max(3, Math.min(24, Math.floor(Math.min(width, height) * 0.05)));
  let rs = 0, gs = 0, bs = 0, n = 0;
  const sampleCorner = (sx: number, sy: number) => {
    for (let y = sy; y < sy + corner; y++) {
      for (let x = sx; x < sx + corner; x++) {
        const i = rgbaIndex(Math.min(width - 1, x), Math.min(height - 1, y), width);
        rs += data[i]; gs += data[i + 1]; bs += data[i + 2]; n++;
      }
    }
  };
  sampleCorner(0, 0);
  sampleCorner(Math.max(0, width - corner), 0);
  sampleCorner(0, Math.max(0, height - corner));
  sampleCorner(Math.max(0, width - corner), Math.max(0, height - corner));
  const br = rs / n;
  const bg = gs / n;
  const bb = bs / n;

  // Border flood fill for background
  const visited = new Uint8Array(pxCount);
  let bgMask = new Uint8Array(pxCount);
  const q: number[] = [];
  // Slightly tighter thresholds reduce background bleed into subject edges
  const seedT = 52;
  const growT = 68;

  const trySeed = (x: number, y: number) => {
    const p = pIndex(x, y, width);
    if (visited[p]) return;
    const i = p * 4;
    const d = colorDistance(data[i], data[i + 1], data[i + 2], br, bg, bb);
    if (d <= seedT) {
      visited[p] = 1;
      bgMask[p] = 1;
      q.push(p);
    }
  };

  for (let x = 0; x < width; x++) { trySeed(x, 0); trySeed(x, height - 1); }
  for (let y = 0; y < height; y++) { trySeed(0, y); trySeed(width - 1, y); }

  while (q.length) {
    const p = q.pop()!;
    const x = p % width;
    const y = Math.floor(p / width);
    const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const np = pIndex(nx, ny, width);
      if (visited[np]) continue;
      visited[np] = 1;
      const i = np * 4;
      const d = colorDistance(data[i], data[i + 1], data[i + 2], br, bg, bb);
      if (d <= growT) {
        bgMask[np] = 1;
        q.push(np);
      }
    }
  }

  // Morphology cleanup
  bgMask = new Uint8Array(closing(bgMask, width, height, 1));
  bgMask = new Uint8Array(opening(bgMask, width, height, 1));

  const fgRaw = new Uint8Array(pxCount);
  let bgPixels = 0;
  for (let p = 0; p < pxCount; p++) {
    if (bgMask[p]) bgPixels++;
    else fgRaw[p] = 1;
  }

  let fgMask = largestComponent(fgRaw, width, height);

  // fallback if component too small
  let fgPixels = 0;
  for (let p = 0; p < pxCount; p++) if (fgMask[p]) fgPixels++;
  if (fgPixels < pxCount * 0.01) fgMask = fgRaw;

  // Feather edges (~6px) for cleaner cutouts without hard fringing
  const softFgMask = toSoftMaskFromBinary(fgMask, width, height, 6);

  return {
    image: { data: new Uint8Array(data), width, height },
    bgMask: new Uint8Array(bgMask),
    fgMask: new Uint8Array(fgMask),
    softFgMask: new Uint8Array(softFgMask),
    bgRatio: bgPixels / pxCount,
    engine: 'classic-seg-v2',
  };
}
