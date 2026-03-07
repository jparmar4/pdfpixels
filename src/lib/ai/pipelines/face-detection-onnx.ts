import fs from 'fs';
import path from 'path';
import type { FaceDetectionResult, RGBAImage } from './types';

export type FaceOnnxMode = 'balanced' | 'high' | 'privacy-max';
type OrthoBox = { x1: number; y1: number; x2: number; y2: number; score: number };

type OrtTensorLike = { data?: Float32Array; dims?: number[] };

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function iou(a: OrthoBox, b: OrthoBox): number {
  const xA = Math.max(a.x1, b.x1);
  const yA = Math.max(a.y1, b.y1);
  const xB = Math.min(a.x2, b.x2);
  const yB = Math.min(a.y2, b.y2);
  const inter = Math.max(0, xB - xA + 1) * Math.max(0, yB - yA + 1);
  const areaA = (a.x2 - a.x1 + 1) * (a.y2 - a.y1 + 1);
  const areaB = (b.x2 - b.x1 + 1) * (b.y2 - b.y1 + 1);
  return inter / Math.max(1, areaA + areaB - inter);
}

/**
 * ONNX Face Detection V2 adapter
 *
 * Required env:
 *  - FACE_ONNX_MODEL_PATH=/abs/path/to/model.onnx
 * Optional env:
 *  - FACE_ONNX_MODEL_TYPE=ultraface|generic (default ultraface)
 */
export async function detectFaceRegionsONNX(image: RGBAImage, mode: FaceOnnxMode = 'balanced'): Promise<FaceDetectionResult | null> {
  const configuredPath = process.env.FACE_ONNX_MODEL_PATH;
  const bundledPath = path.resolve(process.cwd(), 'models', 'face', 'ultraface-rfb-320.onnx');
  const modelPath = configuredPath || (fs.existsSync(bundledPath) ? bundledPath : undefined);
  if (!modelPath) return null;

  let ort: any;
  try {
    ort = await import('onnxruntime-node');
  } catch {
    return null;
  }

  try {
    const modelType = (process.env.FACE_ONNX_MODEL_TYPE || 'ultraface').toLowerCase();
    const inputW = modelType === 'ultraface' ? 320 : (mode === 'privacy-max' ? 640 : 512);
    const inputH = modelType === 'ultraface' ? 240 : (mode === 'privacy-max' ? 640 : 512);

    const resized = resizeRGBA(image, inputW, inputH);
    const chw = toInputTensor(resized, inputW, inputH, modelType);

    const session = await ort.InferenceSession.create(modelPath, {
      graphOptimizationLevel: 'all',
    });

    const inputName = session.inputNames[0];
    const tensor = new ort.Tensor('float32', chw, [1, 3, inputH, inputW]);
    const raw = await session.run({ [inputName]: tensor });

    const decoded = decodeFaceOutputs(raw, inputW, inputH, image.width, image.height, mode);
    if (!decoded.length) return null;

    const picked = nonMaxSuppression(decoded, mode === 'privacy-max' ? 0.35 : 0.4).slice(0, mode === 'privacy-max' ? 24 : 16);
    const padScale = mode === 'privacy-max' ? 0.55 : mode === 'high' ? 0.45 : 0.35;

    const regions = picked.map((b) => {
      const w = b.x2 - b.x1 + 1;
      const h = b.y2 - b.y1 + 1;
      const px = Math.round(w * padScale);
      const py = Math.round(h * (padScale + 0.15));

      const left = clamp(b.x1 - px, 0, image.width - 1);
      const top = clamp(b.y1 - py, 0, image.height - 1);
      const right = clamp(b.x2 + px, 0, image.width - 1);
      const bottom = clamp(b.y2 + py, 0, image.height - 1);

      return { left, top, width: Math.max(1, right - left + 1), height: Math.max(1, bottom - top + 1) };
    });

    return { regions, engine: `onnx-face-v2:${modelType}` };
  } catch {
    return null;
  }
}

function toInputTensor(rgba: Uint8Array, w: number, h: number, modelType: string): Float32Array {
  const out = new Float32Array(3 * w * h);
  const size = w * h;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4;
      const di = y * w + x;

      const r = rgba[si];
      const g = rgba[si + 1];
      const b = rgba[si + 2];

      if (modelType === 'ultraface') {
        // UltraFace expects BGR normalized to roughly [-1,1]
        out[di] = (b - 127) / 128;
        out[size + di] = (g - 127) / 128;
        out[2 * size + di] = (r - 127) / 128;
      } else {
        out[di] = r / 255;
        out[size + di] = g / 255;
        out[2 * size + di] = b / 255;
      }
    }
  }

  return out;
}

function nonMaxSuppression(boxes: OrthoBox[], iouThreshold: number): OrthoBox[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score);
  const picked: OrthoBox[] = [];
  while (sorted.length) {
    const cur = sorted.shift()!;
    picked.push(cur);
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (iou(cur, sorted[i]) > iouThreshold) sorted.splice(i, 1);
    }
  }
  return picked;
}

function decodeFaceOutputs(outputs: Record<string, any>, inW: number, inH: number, outW: number, outH: number, mode: FaceOnnxMode): OrthoBox[] {
  const vals = Object.values(outputs) as OrtTensorLike[];

  // Find candidate box and score tensors in either [N,4]/[N,2] or [1,N,4]/[1,N,2]
  const boxOut = vals.find((v) => !!v.data && !!v.dims && ((v.dims.length === 2 && v.dims[1] === 4) || (v.dims.length === 3 && v.dims[2] === 4)));
  const scoreOut = vals.find((v) => !!v.data && !!v.dims && ((v.dims.length === 2 && (v.dims[1] === 1 || v.dims[1] === 2)) || (v.dims.length === 3 && (v.dims[2] === 1 || v.dims[2] === 2))));

  if (!boxOut?.data || !boxOut.dims || !scoreOut?.data || !scoreOut.dims) return [];

  const boxStride = boxOut.dims[boxOut.dims.length - 1];
  const scoreStride = scoreOut.dims[scoreOut.dims.length - 1];
  const boxN = boxOut.dims.length === 3 ? boxOut.dims[1] : boxOut.dims[0];
  const scoreN = scoreOut.dims.length === 3 ? scoreOut.dims[1] : scoreOut.dims[0];
  const n = Math.min(boxN, scoreN);

  const confTh = mode === 'privacy-max' ? 0.25 : mode === 'high' ? 0.33 : 0.42;
  const out: OrthoBox[] = [];

  for (let i = 0; i < n; i++) {
    const bi = i * boxStride;
    const si = i * scoreStride;
    const score = scoreStride >= 2 ? scoreOut.data[si + 1] : scoreOut.data[si];
    if (score < confTh) continue;

    let x1 = boxOut.data[bi];
    let y1 = boxOut.data[bi + 1];
    let x2 = boxOut.data[bi + 2];
    let y2 = boxOut.data[bi + 3];

    const normalized = x1 >= 0 && y1 >= 0 && x2 <= 1.2 && y2 <= 1.2;
    if (normalized) {
      x1 *= outW; y1 *= outH; x2 *= outW; y2 *= outH;
    } else {
      x1 = (x1 / inW) * outW;
      y1 = (y1 / inH) * outH;
      x2 = (x2 / inW) * outW;
      y2 = (y2 / inH) * outH;
    }

    if (x2 <= x1 || y2 <= y1) continue;
    out.push({ x1: Math.round(x1), y1: Math.round(y1), x2: Math.round(x2), y2: Math.round(y2), score });
  }

  return out;
}

function resizeRGBA(image: RGBAImage, targetW: number, targetH: number): Uint8Array {
  const out = new Uint8Array(targetW * targetH * 4);
  const sx = image.width / targetW;
  const sy = image.height / targetH;
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const srcX = Math.min(image.width - 1, Math.floor(x * sx));
      const srcY = Math.min(image.height - 1, Math.floor(y * sy));
      const si = (srcY * image.width + srcX) * 4;
      const di = (y * targetW + x) * 4;
      out[di] = image.data[si];
      out[di + 1] = image.data[si + 1];
      out[di + 2] = image.data[si + 2];
      out[di + 3] = image.data[si + 3];
    }
  }
  return out;
}
