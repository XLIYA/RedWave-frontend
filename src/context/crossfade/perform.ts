import { dbToGain, measureTrackLoudness } from '@/lib/audio/loudness';
import { toAbsolute } from '../AudioProvider/helpers';
import { buildAdvancedCurve } from './curves';
import { SpectralAnalyzer } from './spectral';
import { ProfessionalAudioChain } from './pro-chains';
import { clearAutomation, pinValue, EPS } from './automation-utils';
import type { ExtendedCrossfadeCurve, ProCrossfadeOptions } from './types-ext';
import type {
  AdvancedCrossfadeParams,
  SpectralBand,
} from '../crossfade-types';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export async function performAdvancedCrossfadeTo(opts: AdvancedCrossfadeParams) {
  const {
    toIndex, queue, crossfadeEnabled, fadeSeconds, curve,
    active, setActive, setIndex, ac,
    activeAudio, standbyAudio, activeGain, standbyGain, masterGain,
    pro = {},
  } = opts;

  const target = queue[toIndex];
  if (!target?.fileUrl) {
    setIndex(toIndex);
    setActive(active === 'A' ? 'B' : 'A');
    return;
  }

  const expectedUrl = toAbsolute(target.fileUrl);
  if (standbyAudio.src !== expectedUrl) {
    standbyAudio.src = expectedUrl;
    try { standbyAudio.load(); } catch {}
  }

  // زنجیره‌های پردازش
  const activeChain = new ProfessionalAudioChain(ac, {
    advancedEQ: pro.advancedEQ, eqBands: pro.eqBands,
    multibandCompression: pro.multibandCompression,
    stereoWidthControl: pro.stereoWidthControl,
  });
  const standbyChain = new ProfessionalAudioChain(ac, {
    advancedEQ: pro.advancedEQ, eqBands: pro.eqBands,
    multibandCompression: pro.multibandCompression,
    stereoWidthControl: pro.stereoWidthControl,
  });

  activeGain.connect(activeChain.input);
  standbyGain.connect(standbyChain.input);
  activeChain.output.connect(masterGain);
  standbyChain.output.connect(masterGain);

  const activeAnalyzer = new SpectralAnalyzer(ac, activeGain);
  const standbyAnalyzer = new SpectralAnalyzer(ac, standbyGain);

  // Loudness matching
  let standbyCompensation = 0;
  if (pro.loudnessMatch) {
    try {
      const { db: targetLUFS } = await measureTrackLoudness(expectedUrl);
      const targetDb = pro.targetLoudnessDb ?? -14;
      standbyCompensation = clamp(targetDb - targetLUFS, -12, 12);
    } catch {
      console.warn('Loudness measurement failed, using default compensation');
    }
  }

  try { await ac.resume(); } catch {}

  if (pro.beatMatching) {
    try { standbyAudio.currentTime = 0; } catch {}
  }

  try { await standbyAudio.play(); } catch {}

  const fade = Math.max(0, +fadeSeconds || 0);

  // شاخه بدون کراس‌فید
  if (!crossfadeEnabled || fade < 0.02) {
    const now = ac.currentTime;
    const standbyTarget = standbyCompensation !== 0
      ? clamp(dbToGain(standbyCompensation) * (standbyGain.gain.value || 0), 0, 4)
      : 1;

    pinValue(activeGain.gain, ac, 0, now);
    pinValue(standbyGain.gain, ac, standbyTarget, now);

    try { activeAudio.pause(); } catch {}
    setIndex(toIndex);
    setActive(active === 'A' ? 'B' : 'A');
    return;
  }

  // آماده‌سازی اتومیشن امن
  const steps = Math.max(256, Math.floor(fade * 120));
  const upCurve = buildAdvancedCurve(curve as ExtendedCrossfadeCurve, steps, 'up');
  const downCurve = buildAdvancedCurve(curve as ExtendedCrossfadeCurve, steps, 'down');

  if (pro.psychoacousticMasking) {
    const activeCentroid = activeAnalyzer.getSpectralCentroid();
    const standbyCentroid = standbyAnalyzer.getSpectralCentroid();
    const spectralSimilarity = 1 - Math.abs(activeCentroid - standbyCentroid) / 10000;
    if (spectralSimilarity > 0.7) {
      for (let i = 0; i < steps; i++) {
        const maskingFactor = 1 + spectralSimilarity * 0.2;
        upCurve[i] = Math.pow(upCurve[i], 1 / maskingFactor);
        downCurve[i] = Math.pow(downCurve[i], maskingFactor);
      }
    }
  }

  const now = ac.currentTime;
  const start = now + EPS;
  const end   = start + fade;
  const endPin = end + EPS;

  clearAutomation(activeGain.gain, ac, start);
  clearAutomation(standbyGain.gain, ac, start);

  const aStart = (activeGain.gain.value ?? 1);
  const bStart = (standbyGain.gain.value ?? 0);
  const compensatedStart = clamp(dbToGain(standbyCompensation) * bStart, 0, 4);

  activeGain.gain.setValueAtTime(aStart, start);
  standbyGain.gain.setValueAtTime(compensatedStart, start);

  // مقیاس نهایی
  const scaledDown = new Float32Array(steps);
  const scaledUp = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    scaledDown[i] = downCurve[i] * aStart;
    scaledUp[i] = compensatedStart + upCurve[i] * (1 - compensatedStart);
  }

  activeGain.gain.setValueCurveAtTime(scaledDown, start, fade);
  standbyGain.gain.setValueCurveAtTime(scaledUp, start, fade);

  // پین نهایی بدون overlap
  activeGain.gain.setValueAtTime(0, endPin);
  standbyGain.gain.setValueAtTime(1, endPin);

  // پردازش‌های اختیاری که AudioParam دست‌کاری مستقیم نمی‌کنند
  if (pro.harmonicEnhancement && activeChain.eq && standbyChain.eq) {
    const enhancementFreq = 3000;
    activeChain.eq.updateBand(0, { frequency: enhancementFreq, gain: 1.5 });
    standbyChain.eq.updateBand(0, { frequency: enhancementFreq, gain: 1.5 });
    setTimeout(() => {
      activeChain.eq?.updateBand(0, { gain: 0 });
      standbyChain.eq?.updateBand(0, { gain: 0 });
    }, fade * 1000);
  }

  if (pro.stereoWidthControl && activeChain.stereoProcessor && standbyChain.stereoProcessor) {
    activeChain.stereoProcessor.setWidth(0.8);
    standbyChain.stereoProcessor.setWidth(0.8);
    setTimeout(() => {
      activeChain.stereoProcessor?.setWidth(1.0);
      standbyChain.stereoProcessor?.setWidth(1.0);
    }, fade * 1000);
  }

  if (pro.spectralCrossfade && activeChain.eq && standbyChain.eq) {
    const spectralBands: SpectralBand[] = [
      { lowFreq: 20, highFreq: 200, fadeType: 'power2', fadeTime: 1.2, gain: 0 },
      { lowFreq: 200, highFreq: 2000, fadeType: 'smoothstep', fadeTime: 1.0, gain: 0 },
      { lowFreq: 2000, highFreq: 8000, fadeType: 'sine', fadeTime: 0.8, gain: 0 },
      { lowFreq: 8000, highFreq: 20000, fadeType: 'exponential', fadeTime: 0.6, gain: 0 }
    ];
    // (پیاده‌سازی کامل نیاز به باندهای EQ جداگانه دارد)
  }

  if (pro.transientPreservation) {
    const checkTransients = () => {
      if (activeAnalyzer.detectTransients() || standbyAnalyzer.detectTransients()) {
        // Placeholder: امکان توقف لحظه‌ای کراس‌فید در صورت transient
      }
    };
    const transientCheckInterval = setInterval(checkTransients, 10);
    setTimeout(() => clearInterval(transientCheckInterval), fade * 1000);
  }

  // پایان: فقط کنترل پخش و state (AudioParam دست نمی‌زنیم)
  setTimeout(() => {
    try { activeAudio.pause(); } catch {}
    setIndex(toIndex);
    setActive(active === 'A' ? 'B' : 'A');
    // console.log(...)
  }, Math.max(50, fade * 1000 + 50));
}
