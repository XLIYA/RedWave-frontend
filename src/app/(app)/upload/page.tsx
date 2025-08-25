//src/app/(app)/upload/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UploadAlbumWizard } from '@/components/upload/UploadAlbumWizard'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { useUpload } from '@/hooks/useUpload'
import { ACCEPT_AUDIO, ACCEPT_IMAGE, validateAudioFile, validateImageFile } from '@/lib/fileValidators'

const musicGenres = [
  'Pop', 'Rock', 'Classical', 'Traditional', 'Electronic', 'Rap', 'Jazz', 'Blues', 'Folk', 'Country'
]

interface FormData {
  title: string
  artist: string
  genre: string
  releaseDate: string
  audioFile: File | null
  coverFile: File | null
}

export default function UploadPage() {
  const { user } = useAuth()
  const { uploadSong, progress, uploading, error: uploadError, resetAll } = useUpload()
  const router = useRouter()

  const [formData, setFormData] = useState<FormData>({
    title: '',
    artist: '',
    genre: '',
    releaseDate: new Date().toISOString().split('T')[0],
    audioFile: null,
    coverFile: null,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState('')

  // Check admin permissions
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/')
    }
  }, [user, router])

  // Reset upload state when component mounts - FIXED: removed resetAll dependency
  useEffect(() => {
    resetAll()
  }, []) // خالی! resetAll dependency حذف شد

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (user.role?.toUpperCase?.() !== 'ADMIN') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive">Unauthorized access</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You do not have permission to access this page. Only admins can upload songs.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'cover') => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log(`📁 File selected (${type}):`, {
      name: file.name,
      size: file.size,
      type: file.type
    })

    const validationError = type === 'audio'
      ? validateAudioFile(file)
      : validateImageFile(file)

    if (validationError) {
      console.error(`❌ File validation failed (${type}):`, validationError)
      setErrors(prev => ({ ...prev, [type]: validationError }))
      e.currentTarget.value = ''
      return
    }

    console.log(`✅ File validation passed (${type})`)
    setErrors(prev => ({ ...prev, [type]: '' }))
    setFormData(prev => ({
      ...prev,
      [type === 'audio' ? 'audioFile' : 'coverFile']: file
    }))
  }

  const removeFile = (type: 'audio' | 'cover') => {
    console.log(`🗑️ Removing ${type} file`)
    setFormData(prev => ({
      ...prev,
      [type === 'audio' ? 'audioFile' : 'coverFile']: null
    }))
    setErrors(prev => ({ ...prev, [type]: '' }))
    
    // Reset file input
    const fileInput = document.querySelector(`input[type="file"][data-kind="${type}"]`) as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Song title is required'
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Song title must be at least 2 characters'
    }

    if (!formData.artist.trim()) {
      newErrors.artist = 'Artist name is required'
    } else if (formData.artist.trim().length < 2) {
      newErrors.artist = 'Artist name must be at least 2 characters'
    }

    if (!formData.genre) {
      newErrors.genre = 'Genre selection is required'
    }

    if (!formData.audioFile) {
      newErrors.audio = 'Audio file is required'
    }

    // Validate release date
    const releaseDate = new Date(formData.releaseDate)
    const today = new Date()
    if (releaseDate > today) {
      newErrors.releaseDate = 'Release date cannot be in the future'
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('📝 Form submitted')

    // Clear previous errors and success
    setErrors({})
    setSuccess('')

    // Validation
    const newErrors = validateForm()

    if (Object.keys(newErrors).length > 0) {
      console.error('❌ Form validation failed:', newErrors)
      setErrors(newErrors)
      return
    }

    console.log('✅ Form validation passed')

    try {
      console.log('🚀 Starting upload process...')
      
      const uploadData = {
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        genre: formData.genre,
        releaseDate: formData.releaseDate,
        audioFile: formData.audioFile!,
        coverFile: formData.coverFile || undefined,
      }

      console.log('📋 Upload data:', {
        ...uploadData,
        audioFile: uploadData.audioFile.name,
        coverFile: uploadData.coverFile?.name || 'No cover file'
      })

      const result = await uploadSong(uploadData)
      
      console.log('🎉 Upload completed successfully:', result)
      setSuccess('Song successfully uploaded!')

      // Reset form
      setFormData({
        title: '',
        artist: '',
        genre: '',
        releaseDate: new Date().toISOString().split('T')[0],
        audioFile: null,
        coverFile: null,
      })

      // Clear file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>
      fileInputs.forEach(input => input.value = '')

      // Redirect after success
      setTimeout(() => {
        console.log('🔄 Redirecting to home page...')
        router.push('/')
      }, 3000)

    } catch (error: any) {
      console.error('❌ Upload failed:', error)
      setErrors({ 
        general: error.message || 'Error uploading song. Please try again.' 
      })
    }
  }

  const isFormValid = formData.title.trim() && 
                     formData.artist.trim() && 
                     formData.genre && 
                     formData.audioFile

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload
          </CardTitle>
          <CardDescription>Single track or album upload for admins</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="single">
            <TabsList className="mb-4">
              <TabsTrigger value="single">Single Track</TabsTrigger>
              <TabsTrigger value="album">Album</TabsTrigger>
            </TabsList>
            <TabsContent value="single">
          {/* General Error */}
          {(errors.general || uploadError) && (
            <Alert className="mb-4 border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-destructive">
                {errors.general || uploadError}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="mb-4 border-green-500/50 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title of the song *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter song title"
                  className={errors.title ? 'border-destructive' : ''}
                  disabled={uploading}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="artist">Artist *</Label>
                <Input
                  id="artist"
                  value={formData.artist}
                  onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
                  placeholder="Enter artist name"
                  className={errors.artist ? 'border-destructive' : ''}
                  disabled={uploading}
                />
                {errors.artist && (
                  <p className="text-sm text-destructive">{errors.artist}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Genre *</Label>
                <Select
                  value={formData.genre}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
                  disabled={uploading}
                >
                  <SelectTrigger className={errors.genre ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select music genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {musicGenres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.genre && (
                  <p className="text-sm text-destructive">{errors.genre}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="releaseDate">Release date</Label>
                <Input
                  id="releaseDate"
                  type="date"
                  value={formData.releaseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className={errors.releaseDate ? 'border-destructive' : ''}
                  disabled={uploading}
                />
                {errors.releaseDate && (
                  <p className="text-sm text-destructive">{errors.releaseDate}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* File Uploads */}
            <div className="space-y-6">
              {/* Audio File */}
              <div className="space-y-2">
                <Label>Audio file *</Label>
                <div className={`border-2 border-dashed rounded-lg p-6 ${
                  errors.audio ? 'border-destructive' : 'border-muted-foreground/25'
                }`}>
                  {formData.audioFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-2">
                          <p className="text-sm font-medium truncate">{formData.audioFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(formData.audioFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('audio')}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {progress.audio > 0 && (
                        <div className="space-y-1">
                          <Progress value={progress.audio} className="w-full" />
                          <p className="text-xs text-muted-foreground">
                            Audio upload: {progress.audio}%
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Audio: Select audio file (MP3, WAV, OGG, FLAC, AAC, M4A, WEBM – max 100 MB)
                      </p>
                      <Input
                        type="file"
                        accept={ACCEPT_AUDIO}
                        data-kind="audio"
                        onChange={(e) => handleFileChange(e, 'audio')}
                        className="max-w-xs mx-auto"
                        disabled={uploading}
                      />
                    </div>
                  )}
                </div>
                {errors.audio && (
                  <p className="text-sm text-destructive">{errors.audio}</p>
                )}
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <Label>Cover image (optional)</Label>
                <div className={`border-2 border-dashed rounded-lg p-6 ${
                  errors.cover ? 'border-destructive' : 'border-muted-foreground/25'
                }`}>
                  {formData.coverFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-2">
                          <p className="text-sm font-medium truncate">{formData.coverFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(formData.coverFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('cover')}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {progress.cover > 0 && (
                        <div className="space-y-1">
                          <Progress value={progress.cover} className="w-full" />
                          <p className="text-xs text-muted-foreground">
                            Cover upload: {progress.cover}%
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Image: Select cover image (JPG, PNG, WEBP – max 10 MB)
                      </p>
                      <Input
                        type="file"
                        accept={ACCEPT_IMAGE}
                        data-kind="cover"
                        onChange={(e) => handleFileChange(e, 'cover')}
                        className="max-w-xs mx-auto"
                        disabled={uploading}
                      />
                    </div>
                  )}
                </div>
                {errors.cover && (
                  <p className="text-sm text-destructive">{errors.cover}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Submit Button */}
            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={uploading || !isFormValid}
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Uploading...
                  </div>
                ) : (
                  'Upload song'
                )}
              </Button>
              
              {uploading && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Please wait while your song is being uploaded...
                  </p>
                </div>
              )}
            </div>
          </form>
            </TabsContent>
            <TabsContent value="album">
              <UploadAlbumWizard />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}