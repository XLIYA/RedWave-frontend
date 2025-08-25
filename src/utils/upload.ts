import { api } from '@/lib/api'

/**
 * Utility functions for file uploads
 */

import { MAX_AUDIO_BYTES, MAX_IMAGE_BYTES, ALLOWED_AUDIO_MIMES, ALLOWED_IMAGE_MIMES } from '@/lib/fileValidators'

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

export const validateImageFile = (file: File): FileValidationResult => {
  if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
    return { isValid: false, error: 'Only JPG, PNG, WEBP are allowed' }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { isValid: false, error: 'Image must be ≤ 10 MB' }
  }
  return { isValid: true }
}

export const validateAudioFile = (file: File): FileValidationResult => {
  if (!ALLOWED_AUDIO_MIMES.includes(file.type)) {
    return { isValid: false, error: 'Audio must be MP3/WAV/OGG/FLAC/AAC/M4A/WEBM' }
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return { isValid: false, error: 'Audio must be ≤ 100 MB' }
  }
  return { isValid: true }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = getFileExtension(originalName)
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_')
  
  return `${timestamp}_${random}_${baseName}.${extension}`
}

/**
 * Upload single file with progress tracking
 */
export const uploadSingleFile = async (
  file: File,
  type: 'audio' | 'cover',
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    console.log(`📤 Starting ${type} upload:`, {
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type
    })

    const result = type === 'audio' 
      ? await api.uploadAudio(file, onProgress)
      : await api.uploadCover(file, onProgress)

    console.log(`✅ ${type} upload completed:`, result.url)
    return result.url

  } catch (error: any) {
    console.error(`❌ ${type} upload failed:`, error)
    throw new Error(`${type} upload failed: ${error.message}`)
  }
}

/**
 * Upload multiple files concurrently
 */
export const uploadMultipleFiles = async (
  files: { file: File; type: 'audio' | 'cover' }[],
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<string[]> => {
  const uploads = files.map(({ file, type }, index) => 
    uploadSingleFile(file, type, (progress) => {
      onProgress?.(index, progress)
    })
  )

  try {
    const results = await Promise.all(uploads)
    console.log('✅ All uploads completed:', results)
    return results
  } catch (error) {
    console.error('❌ Multiple upload failed:', error)
    throw error
  }
}

/**
 * Create song with file uploads
 */
export const createSongWithFiles = async (data: {
  title: string
  artist: string
  genre: string
  releaseDate: string
  audioFile: File
  coverFile?: File
  onAudioProgress?: (progress: number) => void
  onCoverProgress?: (progress: number) => void
}): Promise<any> => {
  try {
    console.log('🎵 Starting song creation with file uploads...')

    // Upload audio file (required)
    const audioUrl = await uploadSingleFile(data.audioFile, 'audio', data.onAudioProgress)

    // Upload cover image (optional)
    let coverUrl = ''
    if (data.coverFile) {
      coverUrl = await uploadSingleFile(data.coverFile, 'cover', data.onCoverProgress)
    }

    // Create song record
    const songData = {
      title: data.title,
      artist: data.artist,
      genre: data.genre,
      releaseDate: data.releaseDate,
      coverImage: coverUrl,
      fileUrl: audioUrl,
    }

    console.log('💾 Creating song record:', songData)
    const song = await api.createSong(songData)

    console.log('✅ Song created successfully:', song)
    return song

  } catch (error: any) {
    console.error('❌ Song creation failed:', error)
    throw new Error(`Song creation failed: ${error.message}`)
  }
}

/**
 * Retry upload with exponential backoff
 */
export const uploadWithRetry = async (
  uploadFn: () => Promise<string>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<string> => {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Upload attempt ${attempt}/${maxRetries}`)
      return await uploadFn()
    } catch (error: any) {
      lastError = error
      console.warn(`❌ Upload attempt ${attempt} failed:`, error.message)

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`⏳ Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  console.error(`💥 All ${maxRetries} upload attempts failed`)
  throw lastError!
}

/**
 * Check if file is audio
 */
export const isAudioFile = (file: File): boolean => {
  return file.type.startsWith('audio/') || 
         ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'webm'].includes(getFileExtension(file.name).toLowerCase())
}

/**
 * Check if file is image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/') || 
         ['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(getFileExtension(file.name).toLowerCase())
}

/**
 * Get audio file duration (requires HTML5 Audio API)
 */
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    const url = URL.createObjectURL(file)
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url)
      resolve(audio.duration)
    })
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load audio file'))
    })
    
    audio.src = url
  })
}

/**
 * Get image dimensions
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.addEventListener('load', () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    })
    
    img.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image file'))
    })
    
    img.src = url
  })
}

/**
 * Convert file to base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert file to base64'))
      }
    })
    
    reader.addEventListener('error', () => {
      reject(new Error('File reading error'))
    })
    
    reader.readAsDataURL(file)
  })
}

/**
 * Compress image file (basic quality reduction)
 */
export const compressImage = (
  file: File, 
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1920
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }
    
    img.addEventListener('load', () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          resolve(compressedFile)
        } else {
          reject(new Error('Image compression failed'))
        }
      }, file.type, quality)
    })
    
    img.addEventListener('error', () => {
      reject(new Error('Image loading failed'))
    })
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Batch file operations
 */
export interface BatchUploadResult {
  success: boolean
  url?: string
  error?: string
  fileName: string
}

export const batchUploadFiles = async (
  files: { file: File; type: 'audio' | 'cover'; name: string }[],
  onProgress?: (fileName: string, progress: number) => void,
  onComplete?: (fileName: string, result: BatchUploadResult) => void
): Promise<BatchUploadResult[]> => {
  const results: BatchUploadResult[] = []
  
  for (const { file, type, name } of files) {
    try {
      console.log(`📤 Starting batch upload for: ${name}`)
      
      const url = await uploadSingleFile(file, type, (progress) => {
        onProgress?.(name, progress)
      })
      
      const result: BatchUploadResult = {
        success: true,
        url,
        fileName: name
      }
      
      results.push(result)
      onComplete?.(name, result)
      
      console.log(`✅ Batch upload completed for: ${name}`)
      
    } catch (error: any) {
      console.error(`❌ Batch upload failed for: ${name}`, error)
      
      const result: BatchUploadResult = {
        success: false,
        error: error.message,
        fileName: name
      }
      
      results.push(result)
      onComplete?.(name, result)
    }
  }
  
  return results
}