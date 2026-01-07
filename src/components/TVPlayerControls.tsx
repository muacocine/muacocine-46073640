import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  RotateCw,
  Settings,
  Loader2,
  Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface QualityLevel {
  height: number;
  bitrate: number;
  level: number;
}

interface TVPlayerControlsProps {
  streamUrl: string;
  channelName: string;
  channelLogo: string;
  isLive?: boolean;
  onError?: () => void;
  onLoading?: (loading: boolean) => void;
}

export default function TVPlayerControls({
  streamUrl,
  channelName,
  channelLogo,
  isLive = true,
  onError,
  onLoading
}: TVPlayerControlsProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = auto
  const [isLandscape, setIsLandscape] = useState(false);

  // HLS setup
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('.m3u');
    const isAudio = streamUrl.endsWith('.mp3') || streamUrl.includes('.mp3?');

    const PROXY_BYPASS_HOSTS = new Set([
      // Alguns domínios falham no proxy (DNS/rota) — tocar direto no browser
      'video.tpa.ao',
      'live-hls-web-aje.getaj.net',
    ]);

    const isProxyBypassedHost = (hostname: string) => {
      if (PROXY_BYPASS_HOSTS.has(hostname)) return true;
      // Vários endpoints de TV têm DNS bloqueado no proxy, mas abrem direto no browser
      if (hostname.endsWith('samsung.wurl.tv')) return true;
      return false;
    };

    const proxyUrl = (rawUrl: string) =>
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hls-proxy?url=${encodeURIComponent(rawUrl)}`;

    const shouldUseProxy = (() => {
      if (!isHls) return false;
      if (streamUrl.includes('/functions/v1/hls-proxy')) return false;
      try {
        const host = new URL(streamUrl).hostname;
        if (isProxyBypassedHost(host)) return false;
      } catch {
        // ignore
      }
      return true;
    })();

    const rawUrl = streamUrl;
    const proxiedUrl = shouldUseProxy ? proxyUrl(rawUrl) : rawUrl;

    setIsLoading(true);
    setHasError(false);
    onLoading?.(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Audio
    if (isAudio) {
      video.src = proxiedUrl;
      video.load();
      video.play().catch(() => {});
      setIsLoading(false);
      onLoading?.(false);
      return;
    }

    let disposed = false;
    let hasTriedDirectFallback = false;

    const init = (urlToUse: string, canFallbackToDirect: boolean) => {
      if (disposed) return;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // HLS via hls.js
      if (Hls.isSupported() && isHls) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          capLevelToPlayerSize: true,
        });

        hlsRef.current = hls;
        hls.loadSource(urlToUse);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (disposed) return;
          setIsLoading(false);
          onLoading?.(false);

          const levels = hls.levels
            .map((level, index) => ({
              height: level.height,
              bitrate: level.bitrate,
              level: index,
            }))
            .sort((a, b) => b.height - a.height);

          setQualityLevels(levels);
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.error('[HLS]', data);

          if (!data.fatal) return;

          // Se o proxy falhar (ex.: DNS/rota), tenta 1x tocar direto
          if (canFallbackToDirect && !hasTriedDirectFallback) {
            hasTriedDirectFallback = true;
            setHasError(false);
            setIsLoading(true);
            onLoading?.(true);
            init(rawUrl, false);
            return;
          }

          setHasError(true);
          setIsLoading(false);
          onLoading?.(false);
          onError?.();

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setTimeout(() => hls.startLoad(), 2000);
          }
        });

        return;
      }

      // Fallback: HLS nativo (Safari) ou MP4
      video.src = urlToUse;
      const onLoaded = () => {
        if (disposed) return;
        setIsLoading(false);
        onLoading?.(false);
        video.play().catch(() => {});
      };
      const onErr = () => {
        if (disposed) return;
        setHasError(true);
        setIsLoading(false);
        onLoading?.(false);
        onError?.();
      };

      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', onErr);

      // limpeza dos listeners deste init
      return () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onErr);
      };
    };

    const cleanupListeners = init(proxiedUrl, shouldUseProxy);

    return () => {
      disposed = true;
      cleanupListeners?.();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, onError, onLoading]);

  // Mute toggle
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const hideControls = () => {
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    if (!isLoading && !hasError) {
      hideControls();
    }

    return () => clearTimeout(timeout);
  }, [showControls, isLoading, hasError]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        // Try to unlock screen orientation when exiting fullscreen
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

  const setQuality = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setCurrentQuality(level);
    }
  };

  const getQualityLabel = (height: number) => {
    if (height >= 2160) return '4K';
    if (height >= 1440) return '1440p';
    if (height >= 1080) return '1080p';
    if (height >= 720) return '720p';
    if (height >= 480) return '480p';
    if (height >= 360) return '360p';
    return `${height}p`;
  };

  const getCurrentQualityLabel = () => {
    if (currentQuality === -1) return 'Auto';
    const level = qualityLevels.find(q => q.level === currentQuality);
    return level ? getQualityLabel(level.height) : 'Auto';
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-2xl overflow-hidden"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain bg-black"
        playsInline
        muted={isMuted}
        autoPlay
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-white">A carregar stream...</p>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <div className="text-6xl mb-4">{channelLogo}</div>
          <h2 className="text-2xl font-display text-white mb-2">{channelName}</h2>
          <p className="text-red-400 text-center max-w-md">
            Stream indisponível no momento. A tentar reconectar...
          </p>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLive && (
              <Badge className="bg-red-500 text-white animate-pulse">
                <Radio className="w-3 h-3 mr-1" />
                AO VIVO
              </Badge>
            )}
            <span className="text-white font-medium">{channelName}</span>
          </div>

          {/* Quality Selector */}
          {qualityLevels.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 gap-2"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-xs">{getCurrentQualityLabel()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuLabel>Qualidade</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setQuality(-1)}
                  className={currentQuality === -1 ? 'bg-primary/20 text-primary' : ''}
                >
                  Auto
                </DropdownMenuItem>
                {qualityLevels.map((level) => (
                  <DropdownMenuItem
                    key={level.level}
                    onClick={() => setQuality(level.level)}
                    className={currentQuality === level.level ? 'bg-primary/20 text-primary' : ''}
                  >
                    {getQualityLabel(level.height)}
                    {level.height >= 2160 && (
                      <Badge className="ml-2 bg-primary/20 text-primary text-xs">4K</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* Rotate button - mainly for mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleRotation}
              >
                <RotateCw className="w-5 h-5" />
              </Button>

              {/* Fullscreen button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
