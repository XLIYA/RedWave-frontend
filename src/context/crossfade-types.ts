// src/context/crossfade-types.ts
// Type compatibility layer for crossfade system

// Basic crossfade curve types (existing) - removed export to avoid conflicts
type CrossfadeCurve = 
  | 'linear' 
  | 'logarithmic' 
  | 'exponential' 
  | 'sine' 
  | 'custom'

// Extended crossfade curves with professional options
type ExtendedCrossfadeCurve = CrossfadeCurve 
  | 'power2' 
  | 'power3' 
  | 'power4' 
  | 'smoothstep' 
  | 'bezier' 
  | 'psychoacoustic'

// Any crossfade curve type (for flexibility)
type AnyCrossfadeCurve = CrossfadeCurve | ExtendedCrossfadeCurve

// Original Pro options (legacy)
interface ProXfOptions {
  proMode?: boolean
  loudnessMatch?: boolean
  bassDucking?: boolean
  softLimiter?: boolean
  targetLoudnessDb?: number
}

// Advanced Pro options (new)
interface ProCrossfadeOptions {
  // Basic Pro Features
  proMode?: boolean
  loudnessMatch?: boolean
  targetLoudnessDb?: number // LUFS target (-14, -16, -23)
  
  // Advanced EQ
  advancedEQ?: boolean
  eqBands?: EQBand[]
  
  // Multi-band Processing
  multibandCompression?: boolean
  spectralCrossfade?: boolean
  
  // Psychoacoustic Features
  psychoacousticMasking?: boolean
  harmonicEnhancement?: boolean
  stereoWidthControl?: boolean
  
  // Tempo & Beat Matching
  beatMatching?: boolean
  tempoSync?: boolean
  
  // Advanced Bass Management
  advancedBassManagement?: boolean
  bassMonoMode?: boolean
  subharmonicSynthesis?: boolean
  
  // Dynamic Processing
  adaptiveCompression?: boolean
  spectralGating?: boolean
  transientPreservation?: boolean
  
  // Quality Enhancement
  antiAliasing?: boolean
  phaseCoherence?: boolean
  dithering?: boolean
  oversamplingFactor?: number // 2x, 4x, 8x
}

// EQ Band configuration
interface EQBand {
  type: 'lowpass' | 'highpass' | 'bandpass' | 'lowshelf' | 'highshelf' | 'peaking' | 'notch'
  frequency: number
  gain: number // dB
  Q: number
  enabled: boolean
}

// Spectral band for frequency-specific crossfading
interface SpectralBand {
  lowFreq: number
  highFreq: number
  fadeType: ExtendedCrossfadeCurve
  fadeTime: number // relative to main fade (0.5 = half time)
  gain: number // dB adjustment
}

// Track information structure
interface Track {
  id?: string
  title?: string
  artist?: string
  album?: string
  fileUrl?: string
  duration?: number
  loudness?: {
    lufs: number
    peak: number
    rms: number
  }
}

// Active audio channel indicator
type ActiveAB = 'A' | 'B'

// Crossfade function parameters (legacy compatible)
interface CrossfadeParams {
  toIndex: number
  queue: Track[]
  crossfadeEnabled: boolean
  fadeSeconds: number
  curve: CrossfadeCurve
  active: ActiveAB
  setActive: (ab: ActiveAB) => void
  setIndex: (i: number) => void
  ac: AudioContext
  activeAudio: HTMLAudioElement
  standbyAudio: HTMLAudioElement
  activeGain: GainNode
  standbyGain: GainNode
  masterGain: GainNode
  pro?: ProXfOptions
}

// Advanced crossfade function parameters
interface AdvancedCrossfadeParams {
  toIndex: number
  queue: Track[]
  crossfadeEnabled: boolean
  fadeSeconds: number
  curve: ExtendedCrossfadeCurve
  active: ActiveAB
  setActive: (ab: ActiveAB) => void
  setIndex: (i: number) => void
  ac: AudioContext
  activeAudio: HTMLAudioElement
  standbyAudio: HTMLAudioElement
  activeGain: GainNode
  standbyGain: GainNode
  masterGain: GainNode
  pro?: ProCrossfadeOptions
}

// Preload function parameters
interface PreloadParams {
  queue: Track[]
  index: number
  nextIndex: number
  standbyAudio: HTMLAudioElement | null
}

// Crossfade preset configuration
interface CrossfadePreset {
  enabled: boolean
  seconds: number
  curve: AnyCrossfadeCurve
  pro?: Partial<ProCrossfadeOptions>
}

// Curve building parameters
interface CurveBuildParams {
  power?: number
  bezierPoints?: [number, number, number, number]
  smoothing?: number
  asymmetry?: number
}

// Audio analysis results
interface AudioAnalysis {
  spectralCentroid: number
  rms: number
  peak: number
  hasTransients: boolean
  dynamicRange: number
  estimatedTempo?: number
}

// Export everything for easy importing
export type {
  CrossfadeCurve,
  ExtendedCrossfadeCurve,
  AnyCrossfadeCurve,
  ProXfOptions,
  ProCrossfadeOptions,
  EQBand,
  SpectralBand,
  Track,
  ActiveAB,
  CrossfadeParams,
  AdvancedCrossfadeParams,
  PreloadParams,
  CrossfadePreset,
  CurveBuildParams,
  AudioAnalysis
}