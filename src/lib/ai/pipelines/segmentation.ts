import fs from 'fs';
import path from 'path';
import type { FaceMode } from './face-detection';
import { detectFaceRegions } from './face-detection';
import { detectFaceRegionsONNX } from './face-detection-onnx';
import type { SegmentationResult, SharpLib } from './types';
import { closing, opening, pIndex, rgbaIndex, toSoftMaskFromBinary } from '../utils/image';

const ONNX_SESSION_TIMEOUT_MS = 25_000;
const ONNX_RUN_TIMEOUT_MS = 20_000;

type CachedSession = { session: any; inputName: string; outputName: string; type: 'rmbg' | 'u2netp' };
const segSessionCache = new Map<string, CachedSession>();
const segSessionInflight = new Map<string, Promise<CachedSession>>();
let cachedOrtModule: any = null;

async function loadOrtModule(): Promise<any> {
  if (cachedOrtModule) return cachedOrtModule;
  cachedOrtModule = await import('onnxruntime-node');
  return cachedOrtModule;
}

function withTimeout<T>(work: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([work, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  }) as Promise<T>;
}

async function getSegmentationSession(modelPath: string, type: 'rmbg' | 'u2netp'): Promise<CachedSession | null> {
  if (!fs.existsSync(modelPath)) return null;
  const cached = segSessionCache.get(modelPath);
  if (cached) return cached;
  const pending = segSessionInflight.get(modelPath);
  if (pending) return pending;

  const ort = await loadOrtModule();
  const created = (async () => {
    try {
      const session = await withTimeout<any>(
        ort.InferenceSession.create(modelPath, { graphOptimizationLevel: 'all' }) as Promise<any>,
        ONNX_SESSION_TIMEOUT_MS,
        'Segmentation model loading timed out.',
      );
      const entry: CachedSession = {
        session,
        inputName: session.inputNames[0],
        outputName: session.outputNames[0],
        type,
      };
      segSessionCache.set(modelPath, entry);
      return entry;
    } catch (err) {
      console.warn(`Failed to initialize segmentation session for ${modelPath}:`, err);
      return null as any;
    } finally {
      segSessionInflight.delete(modelPath);
    }
  })();

  segSessionInflight.set(modelPath, created);
  return created;
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Ensures any detected faces/heads are preserved in the mask,
 * protecting against accidental face cutouts or under-segmentation.
 */
function protectFaceRegions(
  softMask: Uint8Array,
  width: number,
  height: number,
  faces: Array<{ left: number; top: number; width: number; height: number }>,
) {
  for (const face of faces) {
    // Expand face box slightly upward for hair and downward for chin/neck
    const padTop = Math.round(face.height * 0.45);
    const padSides = Math.round(face.width * 0.25);
    const padBottom = Math.round(face.height * 0.35);

    const x1 = Math.max(0, face.left - padSides);
    const y1 = Math.max(0, face.top - padTop);
    const x2 = Math.min(width - 1, face.left + face.width + padSides);
    const y2 = Math.min(height - 1, face.top + face.height + padBottom);

    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const rx = (x2 - x1) / 2;
    const ry = (y2 - y1) / 2;

    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const dx = (x - cx) / Math.max(1, rx);
        const dy = (y - cy) / Math.max(1, ry);
        const distSq = dx * dx + dy * dy;
        const p = y * width + x;
        if (distSq <= 1.0) {
          softMask[p] = Math.max(softMask[p], 255);
        } else if (distSq <= 1.4) {
          const blend = (1.4 - distSq) / 0.4;
          softMask[p] = Math.max(softMask[p], Math.round(blend * 255));
        }
      }
    }
  }
}

/**
 * Neural segmentation using RMBG-1.4 or U2NetP via ONNX Runtime.
 */
async function segmentForegroundONNX(
  sharp: SharpLib,
  input: Buffer,
  mode: FaceMode = 'balanced',
): Promise<SegmentationResult | null> {
  const rmbgPath =
    process.env.RMBG_ONNX_MODEL_PATH ||
    path.resolve(process.cwd(), 'models', 'segmentation', 'rmbg-1.4.onnx');
  const u2netpPath =
    process.env.SEGMENTATION_ONNX_MODEL_PATH ||
    path.resolve(process.cwd(), 'models', 'segmentation', 'u2netp.onnx');

  // Select candidate session based on quality mode and file availability
  let candidate: CachedSession | null = null;
  if (mode === 'high' || mode === 'privacy-max') {
    candidate =
      (await getSegmentationSession(rmbgPath, 'rmbg')) ||
      (await getSegmentationSession(u2netpPath, 'u2netp'));
  } else {
    candidate =
      (await getSegmentationSession(u2netpPath, 'u2netp')) ||
      (await getSegmentationSession(rmbgPath, 'rmbg'));
  }

  if (!candidate) return null;

  const ort = await loadOrtModule();
  const { session, inputName, outputName, type } = candidate;

  // Retrieve source image dimensions and full RGBA buffer
  const { data: origRgba, info: origInfo } = await sharp(input, { failOn: 'none' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const origW = origInfo.width;
  const origH = origInfo.height;
  const pxCount = origW * origH;

  const inputSize = type === 'rmbg' ? 1024 : 320;

  const { data: rawInput } = await sharp(input, { failOn: 'none' })
    .resize(inputSize, inputSize, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const chSize = inputSize * inputSize;
  const floatData = new Float32Array(3 * chSize);

  if (type === 'rmbg') {
    // BRIA RMBG-1.4 normalization: (pixel / 255.0 - 0.5) / 1.0 -> pixel / 255.0 - 0.5
    for (let i = 0; i < chSize; i++) {
      floatData[i] = rawInput[i * 3] / 255 - 0.5;
      floatData[chSize + i] = rawInput[i * 3 + 1] / 255 - 0.5;
      floatData[chSize * 2 + i] = rawInput[i * 3 + 2] / 255 - 0.5;
    }
  } else {
    // U2NetP ImageNet normalization: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
    for (let i = 0; i < chSize; i++) {
      floatData[i] = (rawInput[i * 3] / 255 - 0.485) / 0.229;
      floatData[chSize + i] = (rawInput[i * 3 + 1] / 255 - 0.456) / 0.224;
      floatData[chSize * 2 + i] = (rawInput[i * 3 + 2] / 255 - 0.406) / 0.225;
    }
  }

  const tensor = new ort.Tensor('float32', floatData, [1, 3, inputSize, inputSize]);
  const results = await withTimeout<Record<string, any>>(
    session.run({ [inputName]: tensor }),
    ONNX_RUN_TIMEOUT_MS,
    'Segmentation model inference timed out.',
  );

  const outData = results[outputName].data as Float32Array;
  if (!outData || outData.length !== chSize) {
    throw new Error(`Unexpected output size from segmentation model: ${outData?.length}`);
  }

  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < chSize; i++) {
    if (outData[i] < min) min = outData[i];
    if (outData[i] > max) max = outData[i];
  }
  const range = max - min || 1;

  const mask8 = new Uint8Array(chSize);
  if (type === 'rmbg') {
    for (let i = 0; i < chSize; i++) {
      mask8[i] = Math.round(((outData[i] - min) / range) * 255);
    }
  } else {
    // Refine U2NetP predictions: clean background floor and smooth subject transition
    for (let i = 0; i < chSize; i++) {
      const norm = (outData[i] - min) / range;
      let alpha: number;
      if (norm <= 0.12) alpha = 0;
      else if (norm >= 0.70) alpha = 1;
      else {
        const t = (norm - 0.12) / (0.70 - 0.12);
        alpha = t * t * (3 - 2 * t);
      }
      mask8[i] = Math.round(alpha * 255);
    }
  }

  // Resize mask to original image dimensions preserving 1-channel format
  const { data: maskResized } = await sharp(mask8, {
    raw: { width: inputSize, height: inputSize, channels: 1 },
  })
    .resize(origW, origH, { fit: 'fill', kernel: 'lanczos3' })
    .toColourspace('b-w')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const softFgMask = new Uint8Array(maskResized);

  // Face protection check: ensure detected faces are completely retained
  try {
    const rawImage = { data: new Uint8Array(origRgba), width: origW, height: origH };
    const onnxFaces = await detectFaceRegionsONNX(rawImage, mode);
    const faces = onnxFaces && onnxFaces.regions.length > 0
      ? onnxFaces.regions
      : (await detectFaceRegions(sharp, rawImage, mode)).regions;

    if (faces.length > 0) {
      protectFaceRegions(softFgMask, origW, origH, faces);
    }
  } catch (faceErr) {
    // Face protection is a safety pass; do not abort if face detection fails
    console.warn('Face protection check error:', faceErr);
  }

  const fgMask = new Uint8Array(pxCount);
  const bgMask = new Uint8Array(pxCount);
  let bgPixels = 0;

  for (let p = 0; p < pxCount; p++) {
    if (softFgMask[p] >= 128) {
      fgMask[p] = 1;
    } else {
      bgMask[p] = 1;
      bgPixels++;
    }
  }

  return {
    image: { data: new Uint8Array(origRgba), width: origW, height: origH },
    bgMask,
    fgMask,
    softFgMask,
    bgRatio: bgPixels / pxCount,
    engine: `onnx-${type}-${inputSize}:${mode}`,
  };
}

/**
 * Intelligent heuristic segmentation fallback with face preservation.
 * Used when ONNX models are unavailable or uninitialized.
 */
async function segmentForegroundHeuristic(
  sharp: SharpLib,
  input: Buffer,
  mode: FaceMode = 'balanced',
): Promise<SegmentationResult> {
  const { data, info } = await sharp(input, { failOn: 'none' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  const pxCount = width * height;

  // Face detection pass for protection
  let detectedFaces: Array<{ left: number; top: number; width: number; height: number }> = [];
  try {
    const rawImage = { data: new Uint8Array(data), width, height };
    const onnxFaces = await detectFaceRegionsONNX(rawImage, mode);
    detectedFaces = onnxFaces && onnxFaces.regions.length > 0
      ? onnxFaces.regions
      : (await detectFaceRegions(sharp, rawImage, mode)).regions;
  } catch {
    detectedFaces = [];
  }

  // Create protected mask for all face and head regions
  const isProtected = new Uint8Array(pxCount);
  for (const f of detectedFaces) {
    const padTop = Math.round(f.height * 0.4);
    const padSide = Math.round(f.width * 0.2);
    const padBottom = Math.round(f.height * 0.35);

    const x1 = Math.max(0, f.left - padSide);
    const y1 = Math.max(0, f.top - padTop);
    const x2 = Math.min(width - 1, f.left + f.width + padSide);
    const y2 = Math.min(height - 1, f.top + f.height + padBottom);

    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        isProtected[y * width + x] = 1;
      }
    }
  }

  // Estimate background from top corners and top border only
  // (Avoid sampling bottom corners where shirt, hands, or subject torso sit)
  const corner = Math.max(3, Math.min(24, Math.floor(Math.min(width, height) * 0.05)));
  let rs = 0, gs = 0, bs = 0, n = 0;
  const samplePatch = (sx: number, sy: number) => {
    for (let y = sy; y < sy + corner; y++) {
      for (let x = sx; x < sx + corner; x++) {
        const i = rgbaIndex(Math.min(width - 1, x), Math.min(height - 1, y), width);
        rs += data[i]; gs += data[i + 1]; bs += data[i + 2]; n++;
      }
    }
  };
  samplePatch(0, 0);
  samplePatch(Math.max(0, width - corner), 0);
  // Sample along the top-middle border if not in face region
  const midX = Math.floor(width / 2);
  if (!isProtected[midX]) {
    samplePatch(Math.max(0, midX - Math.floor(corner / 2)), 0);
  }

  const br = n > 0 ? rs / n : 240;
  const bg = n > 0 ? gs / n : 240;
  const bb = n > 0 ? bs / n : 240;

  const visited = new Uint8Array(pxCount);
  let bgMask = new Uint8Array(pxCount);
  const q: number[] = [];
  const seedT = 45;
  const growT = 60;

  const trySeed = (x: number, y: number) => {
    const p = pIndex(x, y, width);
    if (visited[p] || isProtected[p]) return;
    const i = p * 4;
    const d = colorDistance(data[i], data[i + 1], data[i + 2], br, bg, bb);
    if (d <= seedT) {
      visited[p] = 1;
      bgMask[p] = 1;
      q.push(p);
    }
  };

  // Seed top and side borders (skip bottom border to avoid seeding subject body)
  for (let x = 0; x < width; x++) trySeed(x, 0);
  for (let y = 0; y < Math.floor(height * 0.7); y++) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }

  while (q.length) {
    const p = q.pop()!;
    const x = p % width;
    const y = Math.floor(p / width);
    const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const np = pIndex(nx, ny, width);
      if (visited[np] || isProtected[np]) continue;
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
    if (bgMask[p] && !isProtected[p]) {
      bgPixels++;
    } else {
      fgRaw[p] = 1;
    }
  }

  // Retain all connected components that have significant size (>0.8% of pixels)
  // or contain protected face regions, rather than dropping the head or body.
  const visitedComp = new Uint8Array(pxCount);
  const fgMask = new Uint8Array(pxCount);
  const minCompSize = Math.max(20, Math.floor(pxCount * 0.008));

  for (let i = 0; i < pxCount; i++) {
    if (!fgRaw[i] || visitedComp[i]) continue;
    const compQ = [i];
    visitedComp[i] = 1;
    const comp: number[] = [];
    let hasProtected = false;

    while (compQ.length) {
      const p = compQ.pop()!;
      comp.push(p);
      if (isProtected[p]) hasProtected = true;
      const x = p % width;
      const y = Math.floor(p / width);
      const n2 = [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        y > 0 ? p - width : -1,
        y < height - 1 ? p + width : -1,
      ];
      for (const np of n2) {
        if (np >= 0 && !visitedComp[np] && fgRaw[np]) {
          visitedComp[np] = 1;
          compQ.push(np);
        }
      }
    }

    if (comp.length >= minCompSize || hasProtected) {
      for (const p of comp) {
        fgMask[p] = 1;
      }
    }
  }

  // Ensure all protected pixels are unconditionally active in fgMask
  for (let p = 0; p < pxCount; p++) {
    if (isProtected[p]) fgMask[p] = 1;
  }

  // Feather edges (~5px) for smooth cutout transitions
  const softFgMask = toSoftMaskFromBinary(fgMask, width, height, 5);

  return {
    image: { data: new Uint8Array(data), width, height },
    bgMask: new Uint8Array(bgMask),
    fgMask: new Uint8Array(fgMask),
    softFgMask: new Uint8Array(softFgMask),
    bgRatio: bgPixels / pxCount,
    engine: `face-safe-heuristic:${mode}`,
  };
}

export async function segmentForeground(
  sharp: SharpLib,
  input: Buffer,
  mode: FaceMode = 'balanced',
): Promise<SegmentationResult> {
  try {
    const onnxResult = await segmentForegroundONNX(sharp, input, mode);
    if (onnxResult) {
      return onnxResult;
    }
  } catch (err) {
    console.warn('ONNX foreground segmentation error, falling back to heuristic:', err);
  }

  return segmentForegroundHeuristic(sharp, input, mode);
}
