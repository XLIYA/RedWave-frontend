'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, X, ChevronUp, Heart, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { usePlayer } from '@/hooks/usePlayer'
import { formatDuration, cn } from '@/lib/utils'

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    shuffle,
    repeat,
    play,
    pause,
    setVolume,
    seek,
    next,
    previous,
    toggleShuffle,
    toggleRepeat
  } = usePlayer()

  const audioRef = useRef<HTMLAudioElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    audio.src = currentTrack.audioUrl || currentTrack.fileUrl || ''
    audio.load()
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.play().catch(console.error)
    } else {
      audio.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = isMuted ? 0 : volume / 100
  }, [volume, isMuted])

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (audio) {
      seek(audio.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (audio) {
      // Duration is handled by the player state
    }
  }

  const handleEnded = () => {
    if (repeat === 'one') {
      audioRef.current?.play()
    } else {
      next()
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    const newTime = value[0]
    
    if (audio) {
      audio.currentTime = newTime
      seek(newTime)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleClose = () => {
    setIsVisible(false)
    pause() // فقط pause می‌کنیم
    // اختیاری: می‌تونی current track رو هم reset کنی
    // setCurren‌tTrack(null) اگر این function وجود داشته باشه
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  if (!currentTrack || !isVisible) return null

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out",
      isExpanded ? "h-32" : "h-20"
    )}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
      
      {/* Background with Glass Effect */}
      <div className="absolute inset-0 bg-gray-950/95 backdrop-blur-xl border-t border-gray-800/60">
        <div className="absolute inset-0 bg-gradient-to-t from-red-950/20 to-transparent"></div>
      </div>

      {/* Progress Bar - Top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800/50">
        <div 
          className="h-full bg-gradient-to-r from-red-600 to-rose-600 transition-all duration-300 shadow-lg shadow-red-500/30"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>

      <div className="relative z-10 h-full">
        {/* Main Player Bar */}
        <div className="flex items-center justify-between h-20 px-6">
          {/* Track Info */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="relative group">
              {currentTrack.cover || currentTrack.coverImage ? (
                <img
                  src={currentTrack.cover || currentTrack.coverImage}
                  alt={currentTrack.title}
                  className="w-14 h-14 rounded-lg object-cover shadow-lg ring-2 ring-gray-700/50 group-hover:ring-red-500/50 transition-all duration-300"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-red-600/30 to-rose-700/40 flex items-center justify-center shadow-lg">
                  <span className="text-red-300 text-2xl">🎵</span>
                </div>
              )}
              
              {/* Hover Play Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={isPlaying ? pause : play}
                  className="w-8 h-8 p-0 bg-white/20 hover:bg-white/30"
                >
                  {isPlaying ? (
                    <div className="flex gap-0.5">
                      <div className="w-1 h-3 bg-white rounded-sm"></div>
                      <div className="w-1 h-3 bg-white rounded-sm"></div>
                    </div>
                  ) : (
                    <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-white truncate text-lg">
                {currentTrack.title}
              </h4>
              <p className="text-sm text-gray-400 truncate">
                {currentTrack.artist || 'Unknown Artist'}
              </p>
            </div>

            {/* Like & More Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 text-gray-400 hover:text-red-400 transition-colors duration-300"
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 text-gray-400 hover:text-white transition-colors duration-300"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center gap-3 mx-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleShuffle}
              className={cn(
                "w-8 h-8 p-0 transition-all duration-300",
                shuffle 
                  ? "text-red-400 bg-red-500/10" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={previous}
              className="w-8 h-8 p-0 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              size="lg"
              onClick={isPlaying ? pause : play}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg hover:shadow-red-500/30 transition-all duration-300 hover:scale-105"
            >
              {isPlaying ? (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-4 bg-white rounded-sm"></div>
                  <div className="w-1.5 h-4 bg-white rounded-sm"></div>
                </div>
              ) : (
                <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={next}
              className="w-8 h-8 p-0 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleRepeat}
              className={cn(
                "w-8 h-8 p-0 transition-all duration-300",
                repeat !== 'none' 
                  ? "text-red-400 bg-red-500/10" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </div>

          {/* Right Side - Time & Volume */}
          <div className="flex items-center gap-4 min-w-0 flex-1 justify-end">
            {/* Time Display */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="min-w-[40px] text-right">
                {formatDuration(currentTime)}
              </span>
              <span>/</span>
              <span className="min-w-[40px]">
                {formatDuration(duration || 0)}
              </span>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleMute}
                className="w-8 h-8 p-0 text-gray-400 hover:text-white transition-colors duration-300"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={(value) => setVolume(value[0])}
                max={100}
                step={1}
                className="w-24"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpand}
                className="w-8 h-8 p-0 text-gray-400 hover:text-white transition-all duration-300"
              >
                <ChevronUp className={cn(
                  "h-4 w-4 transition-transform duration-300",
                  isExpanded && "rotate-180"
                )} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="w-8 h-8 p-0 text-gray-400 hover:text-red-400 transition-colors duration-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded Section */}
        {isExpanded && (
          <div className="px-6 pb-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 min-w-[40px]">
                {formatDuration(currentTime)}
              </span>
              
              <Slider
                value={[currentTime]}
                onValueChange={handleSeek}
                max={duration || 100}
                step={1}
                className="flex-1"
              />
              
              <span className="text-xs text-gray-400 min-w-[40px]">
                {formatDuration(duration || 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}