import type { CurveBuildParams, CrossfadeCurve } from '../crossfade-types';
import type { ExtendedCrossfadeCurve } from './types-ext';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function buildAdvancedCurve(
  type: ExtendedCrossfadeCurve,
  steps = 512,
  mode: 'up' | 'down' = 'up',
  params?: CurveBuildParams
): Float32Array {
  const s = Math.max(128, steps | 0);
  const arr = new Float32Array(s);

  for (let i = 0; i < s; i++) {
    const p = i / (s - 1);
    let v: number;

    switch (type) {
      case 'linear': v = p; break;
      case 'logarithmic': {
        const x = mode === 'up' ? p : 1 - p;
        v = Math.log10(1 + 9 * x) / Math.log10(10);
        break;
      }
      case 'exponential': {
        const x = mode === 'up' ? p : 1 - p;
        v = Math.pow(x, 3);
        break;
      }
      case 'sine':
        v = mode === 'up' ? Math.sin((Math.PI/2) * p) : Math.cos((Math.PI/2) * p);
        break;

      case 'power2': {
        const x = mode === 'up' ? p : 1 - p;
        v = Math.pow(x, params?.power || 2);
        break;
      }
      case 'power3': {
        const x = mode === 'up' ? p : 1 - p;
        v = Math.pow(x, 3);
        break;
      }
      case 'power4': {
        const x = mode === 'up' ? p : 1 - p;
        v = Math.pow(x, 4);
        break;
      }
      case 'smoothstep': {
        const x = mode === 'up' ? p : 1 - p;
        v = x * x * (3 - 2 * x);
        break;
      }
      case 'bezier': {
        const [x1, y1, x2, y2] = params?.bezierPoints || [0.25, 0.1, 0.75, 0.9];
        const x = mode === 'up' ? p : 1 - p;
        const t = x, mt = 1 - t, mt2 = mt * mt, t2 = t * t;
        v = mt2 * mt * 0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t2 * t * 1;
        break;
      }
      case 'psychoacoustic': {
        const x = mode === 'up' ? p : 1 - p;
        const freq_weight = 1 + 0.3 * Math.sin(Math.PI * x);
        v = Math.pow(x, 2.2) * freq_weight;
        v = clamp(v, 0, 1);
        break;
      }
      case 'custom': {
        const ss = p * p * (3 - 2 * p);
        v = mode === 'up' ? ss : (1 - ss);
        break;
      }
      default: v = p;
    }

    arr[i] = clamp(v, 0, 1);
  }
  return arr;
}

// سازگاری با API قدیمی
export function buildCurve(type: CrossfadeCurve, steps = 256, mode: 'up' | 'down' = 'up') {
  return buildAdvancedCurve(type as ExtendedCrossfadeCurve, steps, mode);
}
