import type { CrossfadeCurve, CrossfadeParams } from '../crossfade-types';
import type { ProCrossfadeOptions, ExtendedCrossfadeCurve } from './types-ext';

export { preloadStandbyNext } from './preload';
export { performAdvancedCrossfadeTo } from './perform';
export { buildAdvancedCurve, buildCurve } from './curves';

// پریست‌ها (اختیاری – مثل قبل)
export const CrossfadePresets: Record<string, ProCrossfadeOptions> = {
  radio: {
    proMode: true,
    loudnessMatch: true,
    targetLoudnessDb: -16,
    advancedEQ: true,
    eqBands: [
      { type: 'highpass' as const, frequency: 80, gain: 0, Q: 0.7, enabled: true },
      { type: 'peaking' as const, frequency: 2500, gain: 1, Q: 1.4, enabled: true },
      { type: 'lowpass' as const, frequency: 15000, gain: 0, Q: 0.7, enabled: true }
    ],
    multibandCompression: true,
    psychoacousticMasking: true,
    antiAliasing: true
  },
  club: {
    proMode: true,
    loudnessMatch: true,
    targetLoudnessDb: -14,
    beatMatching: true,
    advancedBassManagement: true,
    bassMonoMode: true,
    spectralCrossfade: true,
    stereoWidthControl: true,
    harmonicEnhancement: true
  },
  broadcast: {
    proMode: true,
    loudnessMatch: true,
    targetLoudnessDb: -23,
    multibandCompression: true,
    spectralGating: true,
    adaptiveCompression: true,
    phaseCoherence: true,
    dithering: true
  },
  audiophile: {
    proMode: true,
    loudnessMatch: false,
    advancedEQ: true,
    transientPreservation: true,
    phaseCoherence: true,
    antiAliasing: true,
    oversamplingFactor: 4,
    dithering: true
  }
};

// Wrapper سازگار با API قدیمی شما
import { performAdvancedCrossfadeTo } from './perform';

export async function performCrossfadeTo(opts: CrossfadeParams) {
  const extendedCurve: ExtendedCrossfadeCurve = opts.curve as ExtendedCrossfadeCurve;
  const newProOptions: ProCrossfadeOptions = {
    proMode: opts.pro?.proMode,
    loudnessMatch: opts.pro?.loudnessMatch,
    targetLoudnessDb: opts.pro?.targetLoudnessDb,
    advancedEQ: opts.pro?.bassDucking,           // نگاشت قدیمی → جدید (درصورت استفاده قبلی)
    multibandCompression: opts.pro?.softLimiter, // نگاشت قدیمی → جدید
  };

  return performAdvancedCrossfadeTo({
    ...opts,
    curve: extendedCurve,
    pro: newProOptions
  });
}
