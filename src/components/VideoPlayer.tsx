import { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack, 
  SkipForward,
  Settings,
  RotateCw
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface VideoPlayerProps {
  videoUrl: string | null;
  posterUrl: string | null;
  title: string;
}

const QUALITY_OPTIONS = [
  { label: 'Auto', value: 'auto' },
  { label: '4K', value: '2160' },
  { label: '1440p', value: '1440' },
  { label: '1080p', value: '1080' },
  { label: '720p', value: '720' },
  { label: '480p', value: '480' },
  { label: '360p', value: '360' },
];

export default function VideoPlayer({ videoUrl, posterUrl, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('auto');

  // Demo video if no URL provided
  const demoVideo = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const src = videoUrl || demoVideo;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const hideControls = () => {
      if (isPlaying) {
        timeout = setTimeout(() => setShowControls(false), 3000);
      }
    };

    hideControls();
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    const newVolume = value[0];
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        if (screen.orientation && 'unlock' in screen.orientation) {
          (screen.orientation as any).unlock();
        }
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const toggleRotation = async () => {
    try {
      if (screen.orientation && 'lock' in screen.orientation) {
        if (isLandscape) {
          (screen.orientation as any).unlock();
          setIsLandscape(false);
        } else {
          await (screen.orientation as any).lock('landscape');
          setIsLandscape(true);
          // Also go fullscreen when rotating
          if (containerRef.current && !document.fullscreenElement) {
            await containerRef.current.requestFullscreen();
          }
        }
      }
    } catch (error) {
      console.error('Orientation lock error:', error);
      // Fallback: just toggle fullscreen
      toggleFullscreen();
    }
  };

  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality);
    // In a real implementation, this would switch the video source
    // For now, we just store the preference
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={posterUrl || undefined}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        playsInline
      />

      {/* Play button overlay when paused */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-background/30 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-gold hover:scale-110 transition-transform">
            <Play className="w-10 h-10 text-primary-foreground fill-primary-foreground ml-1" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Title */}
        <p className="text-white font-display text-xl mb-3">{title}</p>

        {/* Progress bar */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            {/* Skip buttons */}
            <button onClick={() => skip(-10)} className="text-white hover:text-primary transition-colors hidden sm:block">
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={() => skip(10)} className="text-white hover:text-primary transition-colors hidden sm:block">
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div className="w-20 hidden sm:block">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-white/80 text-sm hidden sm:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quality Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 gap-1 h-8 px-2"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">
                    {QUALITY_OPTIONS.find(q => q.value === selectedQuality)?.label || 'Auto'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuLabel>Qualidade</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {QUALITY_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleQualityChange(option.value)}
                    className={selectedQuality === option.value ? 'bg-primary/20 text-primary' : ''}
                  >
                    {option.label}
                    {option.value === '2160' && (
                      <Badge className="ml-2 bg-primary/20 text-primary text-xs">4K</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Rotate button */}
            <button 
              onClick={toggleRotation} 
              className="text-white hover:text-primary transition-colors"
              title="Rodar ecrã"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Fullscreen button */}
            <button 
              onClick={toggleFullscreen} 
              className="text-white hover:text-primary transition-colors"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
