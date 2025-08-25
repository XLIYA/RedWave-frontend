export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;   // 10MB
export const MAX_AUDIO_BYTES = 100 * 1024 * 1024;  // 100MB

export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp']; // no GIF
export const ALLOWED_AUDIO_MIMES = [
  'audio/mpeg', // mp3
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/mp4',  // m4a (MIME often audio/mp4)
  'audio/webm',
  'audio/m4a'   // some browsers expose this
];

export function validateImageFile(file: File): string {
  if (!ALLOWED_IMAGE_MIMES.includes(file.type)) return 'Only JPG, PNG, WEBP are allowed';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be ≤ 10 MB';
  return '';
}

export function validateAudioFile(file: File): string {
  if (!ALLOWED_AUDIO_MIMES.includes(file.type)) return 'Audio must be MP3/WAV/OGG/FLAC/AAC/M4A/WEBM';
  if (file.size > MAX_AUDIO_BYTES) return 'Audio must be ≤ 100 MB';
  return '';
}

// Use these for <input accept="...">
export const ACCEPT_IMAGE = 'image/jpeg,image/png,image/webp';
export const ACCEPT_AUDIO = 'audio/mpeg,audio/wav,audio/ogg,audio/flac,audio/aac,audio/mp4,audio/webm,audio/m4a';


