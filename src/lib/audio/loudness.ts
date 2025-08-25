// src/lib/audio/loudness.ts
const cache = new Map<string, { db: number; lufs: number; peak: number }>()

export function dbToGain(db: number): number {
  return Math.pow(10, db / 20)
}

export function gainToDb(gain: number): number {
  return 20 * Math.log10(Math.max(1e-6, gain))
}

/** RMS to dBFS conversion */
export function rmsToDbfs(rms: number): number {
  return 20 * Math.log10(Math.max(1e-6, rms))
}

/** Simple peak detection */
function findPeak(audioBuffer: AudioBuffer): number {
  let peak = 0
  const { numberOfChannels, length } = audioBuffer
  
  for (let ch = 0; ch < numberOfChannels; ch++) {
    const data = audioBuffer.getChannelData(ch)
    for (let i = 0; i < data.length; i++) {
      peak = Math.max(peak, Math.abs(data[i]))
    }
  }
  
  return peak
}

/** Simple RMS calculation */
function calculateRMS(audioBuffer: AudioBuffer): number {
  const { numberOfChannels, length } = audioBuffer
  if (!length) return 1e-6
  
  let sumSq = 0
  for (let ch = 0; ch < numberOfChannels; ch++) {
    const data = audioBuffer.getChannelData(ch)
    for (let i = 0; i < data.length; i++) {
      sumSq += data[i] * data[i]
    }
  }
  
  const totalSamples = length * numberOfChannels
  return Math.sqrt(sumSq / totalSamples)
}

/** 
 * Simplified LUFS calculation (not fully ITU-R BS.1770 compliant, but good approximation)
 * Real LUFS requires K-weighting filter and gating
 */
function calculateSimpleLUFS(audioBuffer: AudioBuffer): number {
  const rms = calculateRMS(audioBuffer)
  // Simple approximation: LUFS ≈ RMS in dBFS - 0.691 (K-weighting compensation)
  const lufsApprox = rmsToDbfs(rms) - 0.691
  return lufsApprox
}

/** Enhanced loudness measurement with multiple metrics */
export async function measureTrackLoudness(url: string): Promise<{ 
  db: number;      // RMS in dBFS
  lufs: number;    // Approximate LUFS 
  peak: number;    // Peak level in dBFS
  rms: number;     // Raw RMS value
}> {
  if (cache.has(url)) {
    const cached = cache.get(url)!
    return {
      db: cached.db,
      lufs: cached.lufs,
      peak: cached.peak,
      rms: dbToGain(cached.db)
    }
  }

  try {
    // Fetch and decode audio
    const response = await fetch(url, { 
      mode: 'cors',
      cache: 'force-cache' // Try to use browser cache
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    
    // Create temporary context for decoding
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    const tempContext = new AudioContext()
    
    let audioBuffer: AudioBuffer
    try {
      audioBuffer = await tempContext.decodeAudioData(arrayBuffer.slice(0)) // Clone to avoid detached buffer
    } finally {
      // Always clean up context
      if (tempContext.state !== 'closed') {
        try {
          await tempContext.close()
        } catch (e) {
          console.warn('Failed to close audio context:', e)
        }
      }
    }

    const { length } = audioBuffer
    if (!length) {
      // Empty audio file fallback
      const fallback = { db: -60, lufs: -60, peak: -60 }
      cache.set(url, fallback)
      return { ...fallback, rms: 1e-6 }
    }

    // Calculate metrics
    const rms = calculateRMS(audioBuffer)
    const db = rmsToDbfs(rms)
    const lufs = calculateSimpleLUFS(audioBuffer)
    const peak = findPeak(audioBuffer)
    const peakDb = rmsToDbfs(peak)

    // Cache results
    const result = { db, lufs, peak: peakDb }
    cache.set(url, result)

    return {
      db,
      lufs,
      peak: peakDb,
      rms
    }

  } catch (error) {
    console.warn(`Failed to measure loudness for ${url}:`, error)
    
    // Fallback values for failed measurements
    const fallback = { 
      db: -16,    // Typical music RMS level
      lufs: -16,  // Typical LUFS level
      peak: -6,   // Typical peak level
      rms: dbToGain(-16)
    }
    
    // Don't cache failed measurements in case it's a temporary network issue
    return fallback
  }
}

/** 
 * Get cached loudness if available, otherwise return default
 * Useful for quick lookups without triggering network requests
 */
export function getCachedLoudness(url: string): { db: number; lufs: number; peak: number } | null {
  return cache.get(url) || null
}

/** Clear loudness cache (useful for memory management) */
export function clearLoudnessCache(): void {
  cache.clear()
}

/** Get cache size for debugging */
export function getLoudnessCacheSize(): number {
  return cache.size
}

/** 
 * Loudness compensation calculation
 * Returns gain adjustment needed to match target loudness
 */
export function calculateLoudnessCompensation(
  currentLufs: number, 
  targetLufs: number, 
  maxAdjustmentDb: number = 12
): number {
  const adjustment = targetLufs - currentLufs
  return Math.max(-maxAdjustmentDb, Math.min(maxAdjustmentDb, adjustment))
}

/**
 * Professional loudness standards
 */
export const LoudnessStandards = {
  // Broadcasting standards
  EBU_R128: -23,           // European Broadcasting Union
  ATSC_A85: -24,           // US Television
  ARIB_TR_B32: -24,        // Japan Broadcasting
  
  // Streaming platforms (approximate)
  SPOTIFY: -14,            // Spotify normalization target
  YOUTUBE: -14,            // YouTube normalization
  APPLE_MUSIC: -16,        // Apple Music
  TIDAL: -14,              // Tidal
  
  // Other standards
  CINEMA: -18,             // Cinema mixing
  RADIO: -16,              // Radio broadcasting
  PODCAST: -18,            // Podcast recommendation
  
  // Dynamic range
  CD_STANDARD: -12,        // Traditional CD mastering
  AUDIOPHILE: -18,         // High dynamic range
} as const

/**
 * Get recommended target loudness for different contexts
 */
export function getRecommendedTargetLoudness(context: keyof typeof LoudnessStandards): number {
  return LoudnessStandards[context]
}

/**
 * Analyze dynamic range (difference between peak and RMS)
 */
export function analyzeDynamicRange(peak: number, rms: number): {
  dynamicRange: number;
  category: 'compressed' | 'normal' | 'dynamic' | 'very_dynamic';
  description: string;
} {
  const dr = peak - rms // Dynamic range in dB
  
  let category: 'compressed' | 'normal' | 'dynamic' | 'very_dynamic'
  let description: string
  
  if (dr < 6) {
    category = 'compressed'
    description = 'Heavily compressed/limited'
  } else if (dr < 12) {
    category = 'normal'
    description = 'Normal commercial loudness'
  } else if (dr < 20) {
    category = 'dynamic'
    description = 'Good dynamic range'
  } else {
    category = 'very_dynamic'
    description = 'Excellent dynamic range'
  }
  
  return {
    dynamicRange: dr,
    category,
    description
  }
}