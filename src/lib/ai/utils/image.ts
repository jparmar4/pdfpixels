import type { RGBAImage } from '../pipelines/types';

type Mask = Uint8Array;
type SoftMask = Uint8Array;

export const pIndex = (x: number, y: number, width: number) => y * width + x;
export const rgbaIndex = (x: number, y: number, width: number) => pIndex(x, y, width) * 4;

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function dilate(mask: Mask, width: number, height: number, radius = 1): Mask {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let on = 0;
      for (let dy = -radius; dy <= radius && !on; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          if (mask[pIndex(nx, ny, width)]) {
            on = 1;
            break;
          }
        }
      }
      out[pIndex(x, y, width)] = on;
    }
  }
  return out;
}

export function erode(mask: Mask, width: number, height: number, radius = 1): Mask {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let on = 1;
      for (let dy = -radius; dy <= radius && on; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) {
          on = 0;
          break;
        }
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width || !mask[pIndex(nx, ny, width)]) {
            on = 0;
            break;
          }
        }
      }
      out[pIndex(x, y, width)] = on;
    }
  }
  return out;
}

export function closing(mask: Mask, width: number, height: number, radius = 1): Mask {
  return erode(dilate(mask, width, height, radius), width, height, radius);
}

export function opening(mask: Mask, width: number, height: number, radius = 1): Mask {
  return dilate(erode(mask, width, height, radius), width, height, radius);
}

export function largestComponent(fgMask: Mask, width: number, height: number): Mask {
  const visited = new Uint8Array(fgMask.length);
  let best: number[] = [];
  for (let i = 0; i < fgMask.length; i++) {
    if (!fgMask[i] || visited[i]) continue;
    const q = [i];
    visited[i] = 1;
    const comp: number[] = [];
    let touchesBorder = false;
    while (q.length) {
      const p = q.pop()!;
      comp.push(p);
      const x = p % width;
      const y = Math.floor(p / width);
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesBorder = true;
      const n = [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, y > 0 ? p - width : -1, y < height - 1 ? p + width : -1];
      for (const np of n) {
        if (np >= 0 && !visited[np] && fgMask[np]) {
          visited[np] = 1;
          q.push(np);
        }
      }
    }
    const curScore = comp.length * (touchesBorder ? 0.7 : 1);
    const bestScore = best.length;
    if (curScore > bestScore) best = comp;
  }

  const out = new Uint8Array(fgMask.length);
  for (const p of best) out[p] = 1;
  return out;
}

export function toSoftMaskFromBinary(mask: Mask, width: number, height: number, radius = 4): SoftMask {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = pIndex(x, y, width);
      if (!mask[p]) {
        out[p] = 0;
        continue;
      }
      let minD = radius + 1;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const np = pIndex(nx, ny, width);
          if (mask[np]) continue;
          const d = Math.abs(dx) + Math.abs(dy);
          if (d < minD) minD = d;
        }
      }
      out[p] = minD > radius ? 255 : clamp(Math.round((minD / radius) * 255), 64, 255);
    }
  }
  return out;
}

export function copyRGBA(img: RGBAImage): Uint8Array {
  return Uint8Array.from(img.data);
}
