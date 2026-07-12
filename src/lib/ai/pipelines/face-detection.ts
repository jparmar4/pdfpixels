import type { BlurRegion, FaceDetectionResult, RGBAImage, SharpLib } from './types';

function isLikelySkin(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const ruleA = r > 92 && g > 35 && b > 18 && max - min > 15 && Math.abs(r - g) > 12 && r > g && r > b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  const ruleB = cb >= 76 && cb <= 128 && cr >= 132 && cr <= 176;
  return ruleA && ruleB;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function iou(a: { x1: number; y1: number; x2: number; y2: number }, b: { x1: number; y1: number; x2: number; y2: number }) {
  const xA = Math.max(a.x1, b.x1);
  const yA = Math.max(a.y1, b.y1);
  const xB = Math.min(a.x2, b.x2);
  const yB = Math.min(a.y2, b.y2);
  const inter = Math.max(0, xB - xA + 1) * Math.max(0, yB - yA + 1);
  const areaA = (a.x2 - a.x1 + 1) * (a.y2 - a.y1 + 1);
  const areaB = (b.x2 - b.x1 + 1) * (b.y2 - b.y1 + 1);
  return inter / Math.max(1, areaA + areaB - inter);
}

export type FaceMode = 'balanced' | 'high' | 'privacy-max';

export async function detectFaceRegions(sharp: SharpLib, image: RGBAImage, mode: FaceMode = 'balanced'): Promise<FaceDetectionResult> {
  const downW = Math.max(180, Math.min(mode === 'privacy-max' ? 620 : 520, image.width));
  const downH = Math.max(180, Math.round((image.height / image.width) * downW));

  const small = await sharp(image.data, { raw: { width: image.width, height: image.height, channels: 4 } })
    .resize({ width: downW, height: downH, fit: 'fill' })
    .raw()
    .toBuffer();

  let mask = new Uint8Array(downW * downH);
  for (let i = 0, p = 0; i < small.length; i += 4, p++) mask[p] = isLikelySkin(small[i], small[i + 1], small[i + 2]) ? 1 : 0;

  // denoise
  for (let pass = 0; pass < 2; pass++) {
    const next = new Uint8Array(mask.length);
    for (let y = 1; y < downH - 1; y++) {
      for (let x = 1; x < downW - 1; x++) {
        let c = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) c += mask[(y + dy) * downW + (x + dx)];
        next[y * downW + x] = c >= 5 ? 1 : 0;
      }
    }
    mask = next;
  }

  const visited = new Uint8Array(mask.length);
  const candidates: Array<{ x1: number; y1: number; x2: number; y2: number; score: number }> = [];
  const minRegion = Math.max(mode === 'high' ? 60 : 80, Math.floor(downW * downH * (mode === 'high' ? 0.0009 : 0.0012)));

  for (let y = 0; y < downH; y++) {
    for (let x = 0; x < downW; x++) {
      const s = y * downW + x;
      if (!mask[s] || visited[s]) continue;
      const q = [s];
      visited[s] = 1;
      let x1 = x, y1 = y, x2 = x, y2 = y, n = 0;
      while (q.length) {
        const p = q.pop()!;
        const px = p % downW;
        const py = Math.floor(p / downW);
        n++;
        x1 = Math.min(x1, px); y1 = Math.min(y1, py); x2 = Math.max(x2, px); y2 = Math.max(y2, py);
        const nn = [px > 0 ? p - 1 : -1, px < downW - 1 ? p + 1 : -1, py > 0 ? p - downW : -1, py < downH - 1 ? p + downW : -1];
        for (const np of nn) if (np >= 0 && !visited[np] && mask[np]) { visited[np] = 1; q.push(np); }
      }

      const w = x2 - x1 + 1;
      const h = y2 - y1 + 1;
      const aspect = w / Math.max(1, h);
      const fill = n / Math.max(1, w * h);
      const yc = (y1 + y2) / 2;
      if (n < minRegion || w < 10 || h < 10) continue;
      if (aspect < 0.35 || aspect > 2.2) continue;
      if (fill < (mode === 'high' ? 0.11 : 0.14) || fill > 0.95) continue;
      if (yc > downH * 0.88) continue;
      const pos = 1 - Math.abs(yc / downH - 0.35);
      candidates.push({ x1, y1, x2, y2, score: n * (0.6 + 0.4 * Math.max(0.1, pos)) });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const selected: typeof candidates = [];
  for (const c of candidates) {
    if (selected.some((s) => iou(s, c) > 0.28)) continue;
    selected.push(c);
    if (selected.length >= (mode === 'privacy-max' ? 18 : mode === 'high' ? 16 : 12)) break;
  }

  const sx = image.width / downW;
  const sy = image.height / downH;

  const padFactorX = mode === 'privacy-max' ? 0.95 : mode === 'high' ? 0.8 : 0.7;
  const padFactorY = mode === 'privacy-max' ? 1.15 : mode === 'high' ? 1.0 : 0.9;

  let regions: BlurRegion[] = selected.map((b) => {
    const padX = Math.round((b.x2 - b.x1 + 1) * padFactorX);
    const padY = Math.round((b.y2 - b.y1 + 1) * padFactorY);
    const left = clamp(Math.floor(b.x1 * sx) - padX, 0, image.width - 1);
    const top = clamp(Math.floor(b.y1 * sy) - padY, 0, image.height - 1);
    const right = clamp(Math.ceil(b.x2 * sx) + padX, 0, image.width - 1);
    const bottom = clamp(Math.ceil(b.y2 * sy) + padY, 0, image.height - 1);
    return { left, top, width: Math.max(1, right - left + 1), height: Math.max(1, bottom - top + 1) };
  });

  // hard fallback for group photos: estimate likely face centers from skin-density peaks.
  const area = regions.reduce((s, r) => s + r.width * r.height, 0) / Math.max(1, image.width * image.height);
  const minCoverage = mode === 'privacy-max' ? 0.1 : mode === 'high' ? 0.06 : 0.04;
  if (regions.length === 0 || area < minCoverage) {
    const colScore = new Float32Array(downW);
    const rowScore = new Float32Array(downH);

    // emphasize upper 75% where faces are likely
    for (let y = 0; y < Math.floor(downH * 0.75); y++) {
      for (let x = 0; x < downW; x++) {
        const v = mask[y * downW + x];
        colScore[x] += v;
        rowScore[y] += v;
      }
    }

    const pickPeaks = (arr: Float32Array, count: number, minGap: number) => {
      const picked: number[] = [];
      const used = new Uint8Array(arr.length);
      for (let k = 0; k < count; k++) {
        let bestIdx = -1;
        let bestVal = -1;
        for (let i = 0; i < arr.length; i++) {
          if (used[i]) continue;
          if (arr[i] > bestVal) {
            bestVal = arr[i];
            bestIdx = i;
          }
        }
        if (bestIdx < 0 || bestVal <= 0) break;
        picked.push(bestIdx);
        for (let i = Math.max(0, bestIdx - minGap); i <= Math.min(arr.length - 1, bestIdx + minGap); i++) used[i] = 1;
      }
      return picked.sort((a, b) => a - b);
    };

    const peakCols = pickPeaks(colScore, 4, Math.max(10, Math.floor(downW * 0.12)));
    const peakRows = pickPeaks(rowScore, 2, Math.max(8, Math.floor(downH * 0.15)));

    const faceY = peakRows.length ? peakRows[0] : Math.floor(downH * 0.3);
    const sx2 = image.width / downW;
    const sy2 = image.height / downH;

    const fallback: BlurRegion[] = peakCols.map((cx) => {
      const fw = Math.round(image.width * (mode === 'privacy-max' ? 0.2 : 0.16));
      const fh = Math.round(fw * 1.2);
      const centerX = Math.round(cx * sx2);
      const centerY = Math.round(faceY * sy2);
      const left = clamp(centerX - Math.round(fw / 2), 0, image.width - 1);
      const top = clamp(centerY - Math.round(fh * 0.45), 0, image.height - 1);
      return {
        left,
        top,
        width: Math.max(1, Math.min(fw, image.width - left)),
        height: Math.max(1, Math.min(fh, image.height - top)),
      };
    });

    if (fallback.length > 0) {
      regions = fallback;
    } else {
      // last resort: 3 face-sized regions in upper row (still face-focused, not full-frame blur)
      const fw = Math.round(image.width * 0.18);
      const fh = Math.round(fw * 1.2);
      const y = Math.round(image.height * 0.22);
      regions = [
        { left: clamp(Math.round(image.width * 0.14), 0, image.width - 1), top: y, width: fw, height: fh },
        { left: clamp(Math.round(image.width * 0.41), 0, image.width - 1), top: y, width: fw, height: fh },
        { left: clamp(Math.round(image.width * 0.68), 0, image.width - 1), top: y, width: fw, height: fh },
      ];
    }
  }

  // Group-photo completion rule:
  // In high/privacy modes, if we detected too few faces, add missing face-sized regions
  // across the likely portrait row to avoid under-blurring in 3-person photos.
  if ((mode === 'high' || mode === 'privacy-max') && regions.length < 3) {
    // Aggressive skin-component fallback: pick up to 3 upper skin clusters as likely faces.
    const visited3 = new Uint8Array(mask.length);
    const loose: Array<{ x1: number; y1: number; x2: number; y2: number; score: number }> = [];
    const minN = Math.max(28, Math.floor((downW * downH) * 0.00035));

    for (let y = 0; y < downH; y++) {
      for (let x = 0; x < downW; x++) {
        const s = y * downW + x;
        if (!mask[s] || visited3[s]) continue;

        const q = [s];
        visited3[s] = 1;
        let x1 = x, y1 = y, x2 = x, y2 = y, n = 0;

        while (q.length) {
          const p = q.pop()!;
          const px = p % downW;
          const py = Math.floor(p / downW);
          n++;
          x1 = Math.min(x1, px); y1 = Math.min(y1, py); x2 = Math.max(x2, px); y2 = Math.max(y2, py);
          const nn = [px > 0 ? p - 1 : -1, px < downW - 1 ? p + 1 : -1, py > 0 ? p - downW : -1, py < downH - 1 ? p + downW : -1];
          for (const np of nn) if (np >= 0 && !visited3[np] && mask[np]) { visited3[np] = 1; q.push(np); }
        }

        const w = x2 - x1 + 1;
        const h = y2 - y1 + 1;
        const aspect = w / Math.max(1, h);
        const yc = (y1 + y2) / 2;
        if (n < minN || w < 6 || h < 6) continue;
        if (aspect < 0.2 || aspect > 3.2) continue;

        const upperWeight = 1.15 - Math.min(1, yc / Math.max(1, downH));
        loose.push({ x1, y1, x2, y2, score: n * Math.max(0.2, upperWeight) });
      }
    }

    loose.sort((a, b) => b.score - a.score);

    const sx3 = image.width / downW;
    const sy3 = image.height / downH;
    const looseRegions: BlurRegion[] = [];

    for (const b of loose) {
      const padX = Math.round((b.x2 - b.x1 + 1) * (mode === 'privacy-max' ? 1.0 : 0.85));
      const padY = Math.round((b.y2 - b.y1 + 1) * (mode === 'privacy-max' ? 1.25 : 1.05));
      const left = clamp(Math.floor(b.x1 * sx3) - padX, 0, image.width - 1);
      const top = clamp(Math.floor(b.y1 * sy3) - padY, 0, image.height - 1);
      const right = clamp(Math.ceil(b.x2 * sx3) + padX, 0, image.width - 1);
      const bottom = clamp(Math.ceil(b.y2 * sy3) + padY, 0, image.height - 1);
      const cand: BlurRegion = { left, top, width: Math.max(1, right - left + 1), height: Math.max(1, bottom - top + 1) };

      const overlaps = looseRegions.some((r) => {
        const ax2 = r.left + r.width - 1; const ay2 = r.top + r.height - 1;
        const bx2 = cand.left + cand.width - 1; const by2 = cand.top + cand.height - 1;
        const xA = Math.max(r.left, cand.left); const yA = Math.max(r.top, cand.top);
        const xB = Math.min(ax2, bx2); const yB = Math.min(ay2, by2);
        const inter = Math.max(0, xB - xA + 1) * Math.max(0, yB - yA + 1);
        const areaA = r.width * r.height; const areaB = cand.width * cand.height;
        return inter / Math.max(1, areaA + areaB - inter) > 0.25;
      });

      if (!overlaps) looseRegions.push(cand);
      if (looseRegions.length >= 3) break;
    }

    if (looseRegions.length >= 2) {
      regions = looseRegions;
    } else {
      // Last resort deterministic 3-slot fallback.
      const fw = Math.round(image.width * (mode === 'privacy-max' ? 0.24 : 0.2));
      const fh = Math.round(fw * 1.22);
      const y = Math.round(image.height * 0.2);
      regions = [
        { left: clamp(Math.round(image.width * 0.08), 0, image.width - 1), top: y, width: fw, height: fh },
        { left: clamp(Math.round(image.width * 0.39), 0, image.width - 1), top: y, width: fw, height: fh },
        { left: clamp(Math.round(image.width * 0.70), 0, image.width - 1), top: y, width: fw, height: fh },
      ];
    }
  }

  return { regions, engine: `classic-face-v2:${mode}` };
}
