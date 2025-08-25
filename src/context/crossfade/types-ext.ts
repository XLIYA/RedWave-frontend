import type { EQBand } from '../crossfade-types';

export type ExtendedCrossfadeCurve =
  | 'linear'
  | 'logarithmic'
  | 'exponential'
  | 'sine'
  | 'custom'
  | 'power2'
  | 'power3'
  | 'power4'
  | 'smoothstep'
  | 'bezier'
  | 'psychoacoustic';

export type ProCrossfadeOptions = {
  // Basic Pro Features
  proMode?: boolean;
  loudnessMatch?: boolean;
  targetLoudnessDb?: number;

  // Advanced EQ
  advancedEQ?: boolean;
  eqBands?: EQBand[];

  // Multi-band Processing
  multibandCompression?: boolean;
  spectralCrossfade?: boolean;

  // Psychoacoustic Features
  psychoacousticMasking?: boolean;
  harmonicEnhancement?: boolean;
  stereoWidthControl?: boolean;

  // Tempo & Beat Matching
  beatMatching?: boolean;
  tempoSync?: boolean;

  // Advanced Bass Management
  advancedBassManagement?: boolean;
  bassMonoMode?: boolean;
  subharmonicSynthesis?: boolean;

  // Dynamic Processing
  adaptiveCompression?: boolean;
  spectralGating?: boolean;
  transientPreservation?: boolean;

  // Quality Enhancement
  antiAliasing?: boolean;
  phaseCoherence?: boolean;
  dithering?: boolean;
  oversamplingFactor?: number; // 2x, 4x, 8x
};
