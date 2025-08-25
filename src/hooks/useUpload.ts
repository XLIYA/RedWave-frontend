'use client'

import { useState, useCallback } from 'react'
import { api } from '@/lib/api'

export interface UploadProgress {
  audio: number
  cover: number
}

export const useUpload = () => {
  const [progress, setProgress] = useState<UploadProgress>({ audio: 0, cover: 0 })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // استفاده از useCallback برای جلوگیری از infinite loop
  const uploadCover = useCallback(async (file: File): Promise<string> => {
    setError(null)
    setProgress(prev => ({ ...prev, cover: 0 }))
    
    try {
      console.log('📤 Starting cover upload:', file.name)
      
      const result = await api.uploadCover(file, (progress: any) => {
        console.log(`Cover upload progress: ${progress}%`)
        setProgress(prev => ({ ...prev, cover: progress }))
      })
      
      console.log('✅ Cover uploaded successfully:', result.url)
      setProgress(prev => ({ ...prev, cover: 100 }))
      
      return result.url
    } catch (error: any) {
      console.error('❌ Cover upload error:', error)
      setError(`Cover upload failed: ${error.message}`)
      setProgress(prev => ({ ...prev, cover: 0 }))
      throw error
    }
  }, [])

  const uploadAudio = useCallback(async (file: File): Promise<string> => {
    setError(null)
    setProgress(prev => ({ ...prev, audio: 0 }))
    
    try {
      console.log('📤 Starting audio upload:', file.name)
      
      const result = await api.uploadAudio(file, (progress: any) => {
        console.log(`Audio upload progress: ${progress}%`)
        setProgress(prev => ({ ...prev, audio: progress }))
      })
      
      console.log('✅ Audio uploaded successfully:', result.url)
      setProgress(prev => ({ ...prev, audio: 100 }))
      
      return result.url
    } catch (error: any) {
      console.error('❌ Audio upload error:', error)
      setError(`Audio upload failed: ${error.message}`)
      setProgress(prev => ({ ...prev, audio: 0 }))
      throw error
    }
  }, [])

  const uploadSong = useCallback(async (data: {
    title: string
    artist: string
    genre: string
    releaseDate: string
    audioFile: File
    coverFile?: File
  }) => {
    setUploading(true)
    setError(null)
    setProgress({ audio: 0, cover: 0 })

    try {
      console.log('🎵 Starting song upload process...')
      
      // 1. Upload audio file (required)
      console.log('📤 Step 1: Uploading audio file...')
      const audioUrl = await uploadAudio(data.audioFile)
      
      // 2. Upload cover image (optional)
      let coverUrl = ''
      if (data.coverFile) {
        console.log('📤 Step 2: Uploading cover image...')
        coverUrl = await uploadCover(data.coverFile)
      } else {
        console.log('⏭️ Step 2: Skipping cover upload (no file provided)')
        setProgress(prev => ({ ...prev, cover: 100 }))
      }

      // 3. Create song record in database
      console.log('💾 Step 3: Creating song record in database...')
      const songData = {
        title: data.title,
        artist: data.artist,
        genre: data.genre,
        releaseDate: data.releaseDate,
        coverImage: coverUrl,
        fileUrl: audioUrl,
      }

      console.log('📝 Song data to create:', songData)
      const song = await api.createSong(songData)
      
      console.log('✅ Song created successfully:', song)
      return song

    } catch (error: any) {
      console.error('❌ Song upload failed:', error)
      setError(`Song upload failed: ${error.message}`)
      throw error
    } finally {
      setUploading(false)
      // Don't reset progress immediately to show completion
      setTimeout(() => {
        setProgress({ audio: 0, cover: 0 })
      }, 2000)
    }
  }, [uploadAudio, uploadCover]) // dependencies را درست کردیم

  const resetProgress = useCallback(() => {
    setProgress({ audio: 0, cover: 0 })
    setError(null)
  }, [])

  const resetAll = useCallback(() => {
    setProgress({ audio: 0, cover: 0 })
    setUploading(false)
    setError(null)
  }, [])

  return {
    uploadCover,
    uploadAudio,
    uploadSong,
    progress,
    uploading,
    error,
    resetProgress,
    resetAll
  }
}