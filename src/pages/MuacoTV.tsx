import { useState, useEffect, useCallback, useRef } from 'react';
import Hls from 'hls.js';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tv, Radio, Volume2, VolumeX, Maximize, Globe, Film, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Filmes para rotação automática nos canais de filmes
const MOVIE_PLAYLIST = [
  'Vingadores: Ultimato',
  'Avatar: O Caminho da Água',
  'Homem-Aranha: Sem Volta Para Casa',
  'Top Gun: Maverick',
  'Jurassic World: Domínio',
  'Doutor Estranho no Multiverso da Loucura',
  'Batman',
  'Pantera Negra: Wakanda Para Sempre',
  'Thor: Amor e Trovão',
  'Minions 2: A Origem de Gru',
];

// Hook para síntese de voz com ElevenLabs
const useElevenLabsTTS = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cleanup previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      await audio.play();
    } catch (error) {
      console.error("ElevenLabs TTS error:", error);
    }
  }, []);

  return { speak };
};

interface TVChannel {
  id: string;
  name: string;
  logo: string;
  country: string;
  category: string;
  streamUrl: string;
  isLive: boolean;
  isPremium: boolean;
}

const CHANNELS: TVChannel[] = [
  // Angola - URLs públicas de streams africanos/lusófonos
  {
    id: 'tpa1',
    name: 'TPA 1',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Generalista',
    streamUrl: 'https://cdn.digitaltv-cloud.com/tpa/index.m3u8',
    isLive: true,
    isPremium: false,
  },
  {
    id: 'tpa2',
    name: 'TPA 2',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Generalista',
    streamUrl: 'https://cdn.digitaltv-cloud.com/tpa2/index.m3u8',
    isLive: true,
    isPremium: false,
  },
  {
    id: 'tpa-internacional',
    name: 'TPA Internacional',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Internacional',
    streamUrl: 'https://cdn.digitaltv-cloud.com/tpa-int/index.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'zap-viva',
    name: 'ZAP Viva',
    logo: '📺',
    country: 'Angola',
    category: 'Entretenimento',
    streamUrl: 'https://stream.zapviva.ao/live/stream.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'zap-novelas',
    name: 'ZAP Novelas',
    logo: '💫',
    country: 'Angola',
    category: 'Novelas',
    streamUrl: 'https://stream.zapnovelas.ao/live/stream.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'tv-zimbo',
    name: 'TV Zimbo',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Generalista',
    streamUrl: 'https://cdn.digitaltv-cloud.com/tvzimbo/index.m3u8',
    isLive: true,
    isPremium: false,
  },
  // Portugal - Streams públicos RTP
  {
    id: 'rtp1',
    name: 'RTP 1',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Generalista',
    streamUrl: 'https://streaming-live.rtp.pt/liverepeater/smil:rtp1.smil/playlist.m3u8',
    isLive: true,
    isPremium: false,
  },
  {
    id: 'rtp2',
    name: 'RTP 2',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Cultura',
    streamUrl: 'https://streaming-live.rtp.pt/liverepeater/smil:rtp2.smil/playlist.m3u8',
    isLive: true,
    isPremium: false,
  },
  {
    id: 'rtp3',
    name: 'RTP 3',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Notícias',
    streamUrl: 'https://streaming-live.rtp.pt/liverepeater/smil:rtp3.smil/playlist.m3u8',
    isLive: true,
    isPremium: false,
  },
  {
    id: 'rtp-africa',
    name: 'RTP África',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Internacional',
    streamUrl: 'https://streaming-live.rtp.pt/liverepeater/smil:rtpafrica.smil/playlist.m3u8',
    isLive: true,
    isPremium: false,
  },
  {
    id: 'rtp-internacional',
    name: 'RTP Internacional',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Internacional',
    streamUrl: 'https://streaming-live.rtp.pt/liverepeater/smil:rtpi.smil/playlist.m3u8',
    isLive: true,
    isPremium: false,
  },
  {
    id: 'sic',
    name: 'SIC',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Generalista',
    streamUrl: 'https://d1zx6l1dn8vaj5.cloudfront.net/out/v1/b89cc37caa6d418eb423cf092a2ef970/index.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'tvi',
    name: 'TVI',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Generalista',
    streamUrl: 'https://video-auth6.iol.pt/live_tvi/live_tvi/playlist.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'cmtv',
    name: 'CMTV',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Notícias',
    streamUrl: 'https://cmtv-live.videocdn.pt/cmtv/smil:cmtv.smil/playlist.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'sic-noticias',
    name: 'SIC Notícias',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Notícias',
    streamUrl: 'https://d1zx6l1dn8vaj5.cloudfront.net/out/v1/8c813fd116d8493888a6d9a0e58e1f45/index.m3u8',
    isLive: true,
    isPremium: true,
  },
  // Filmes 24h - Using demo streams for movie channels
  {
    id: 'movies-action',
    name: 'Muaco Action 24h',
    logo: '🎬',
    country: 'Internacional',
    category: 'Filmes',
    streamUrl: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'movies-drama',
    name: 'Muaco Drama 24h',
    logo: '🎭',
    country: 'Internacional',
    category: 'Filmes',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'movies-comedy',
    name: 'Muaco Comédia 24h',
    logo: '😂',
    country: 'Internacional',
    category: 'Filmes',
    streamUrl: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8',
    isLive: true,
    isPremium: true,
  },
];

const COUNTRIES = ['Todos', 'Angola', 'Portugal', 'Internacional'];
const CATEGORIES = ['Todos', 'Generalista', 'Entretenimento', 'Novelas', 'Notícias', 'Filmes', 'Cultura'];

export default function MuacoTV() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { speak } = useElevenLabsTTS();
  
  const [selectedChannel, setSelectedChannel] = useState<TVChannel | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('Todos');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [currentMovie, setCurrentMovie] = useState<string>('');
  const [nextMovie, setNextMovie] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const movieIndexRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // HLS Player setup
  useEffect(() => {
    if (!selectedChannel || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);
    setStreamError(false);

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      
      hlsRef.current = hls;
      hls.loadSource(selectedChannel.streamUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {
          // Autoplay blocked, user needs to interact
          setIsLoading(false);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data);
          setStreamError(true);
          setIsLoading(false);
          
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            // Try to recover
            setTimeout(() => hls.startLoad(), 3000);
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = selectedChannel.streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => setIsLoading(false));
      });
      video.addEventListener('error', () => {
        setStreamError(true);
        setIsLoading(false);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedChannel]);

  // Sync mute state with video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Rotação automática de filmes nos canais de filmes
  useEffect(() => {
    if (!selectedChannel || selectedChannel.category !== 'Filmes') return;

    // Seleciona filme inicial
    const randomStart = Math.floor(Math.random() * MOVIE_PLAYLIST.length);
    movieIndexRef.current = randomStart;
    setCurrentMovie(MOVIE_PLAYLIST[randomStart]);
    setNextMovie(MOVIE_PLAYLIST[(randomStart + 1) % MOVIE_PLAYLIST.length]);

    // Simula transição de filme a cada 30 segundos (demo)
    const interval = setInterval(() => {
      const nextIndex = (movieIndexRef.current + 1) % MOVIE_PLAYLIST.length;
      const upcomingMovie = MOVIE_PLAYLIST[nextIndex];
      
      // Anuncia o próximo filme com voz
      if (!isMuted) {
        speak(`Já a seguir: ${upcomingMovie}`);
      }
      
      // Após 3 segundos, troca para o próximo filme
      setTimeout(() => {
        movieIndexRef.current = nextIndex;
        setCurrentMovie(upcomingMovie);
        setNextMovie(MOVIE_PLAYLIST[(nextIndex + 1) % MOVIE_PLAYLIST.length]);
      }, 3000);
    }, 30000); // Troca a cada 30 segundos (para demo)

    return () => clearInterval(interval);
  }, [selectedChannel, isMuted, speak]);

  const filteredChannels = CHANNELS.filter(channel => {
    if (selectedCountry !== 'Todos' && channel.country !== selectedCountry) return false;
    if (selectedCategory !== 'Todos' && channel.category !== selectedCategory) return false;
    return true;
  });

  const handleSelectChannel = (channel: TVChannel) => {
    if (!user) {
      toast.error('Faça login para assistir');
      navigate('/auth');
      return;
    }

    if (channel.isPremium && !isPremium) {
      toast.error('Este canal requer assinatura Premium');
      navigate('/premium');
      return;
    }

    setSelectedChannel(channel);
  };

  const toggleFullscreen = () => {
    const videoElement = document.getElementById('tv-player');
    if (videoElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoElement.requestFullscreen();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/20 to-background py-8 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Tv className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-display text-foreground">
                  MUACO TV STREAMING
                </h1>
                <p className="text-primary font-medium">IPTV • Canais ao Vivo</p>
              </div>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Assista aos melhores canais de Angola, Portugal e muito mais. 
              Streaming ao vivo 24 horas por dia, 7 dias por semana.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Player Section */}
            <div className="lg:col-span-2">
              <div 
                id="tv-player"
                className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-border"
              >
                {selectedChannel ? (
                  <>
                    {/* Video Player */}
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-contain bg-black"
                      playsInline
                      muted={isMuted}
                      autoPlay
                      controls={false}
                    />
                    
                    {/* Loading Overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-white">A carregar stream...</p>
                      </div>
                    )}
                    
                    {/* Error Overlay */}
                    {streamError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                        <div className="text-6xl mb-4">{selectedChannel.logo}</div>
                        <h2 className="text-2xl font-display text-white mb-2">
                          {selectedChannel.name}
                        </h2>
                        <p className="text-red-400 text-center max-w-md">
                          Stream indisponível no momento. A tentar reconectar...
                        </p>
                      </div>
                    )}
                    
                    {/* Movie Info Overlay for Film Channels */}
                    {selectedChannel.category === 'Filmes' && currentMovie && !isLoading && !streamError && (
                      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 z-10">
                        <p className="text-white/70 text-xs mb-1">Agora exibindo:</p>
                        <p className="text-white font-semibold">{currentMovie}</p>
                        <p className="text-primary text-xs mt-1">
                          Próximo: {nextMovie}
                        </p>
                      </div>
                    )}

                    {/* Controls Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-red-500 text-white animate-pulse">
                            <Radio className="w-3 h-3 mr-1" />
                            AO VIVO
                          </Badge>
                          <span className="text-white font-medium">{selectedChannel.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={() => setIsMuted(!isMuted)}
                          >
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={toggleFullscreen}
                          >
                            <Maximize className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Tv className="w-20 h-20 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Selecione um canal
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Escolha um canal da lista para começar a assistir
                    </p>
                  </div>
                )}
              </div>

              {/* Now Playing Info */}
              {selectedChannel && (
                <div className="mt-4 p-4 bg-card border border-border rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{selectedChannel.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedChannel.category} • {selectedChannel.country}
                      </p>
                    </div>
                    <Badge variant="outline">
                      <Globe className="w-3 h-3 mr-1" />
                      {selectedChannel.country}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    ⚠️ Este é um streaming ao vivo. Não é possível pausar, recuar ou avançar.
                  </p>
                </div>
              )}
            </div>

            {/* Channel List */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-4">
                <h2 className="font-display text-xl text-foreground mb-4">
                  CANAIS DISPONÍVEIS
                </h2>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <select 
                    className="flex-1 min-w-[120px] bg-background border border-border rounded-lg px-3 py-2 text-sm"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                  >
                    {COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  <select 
                    className="flex-1 min-w-[120px] bg-background border border-border rounded-lg px-3 py-2 text-sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Channel Grid */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {filteredChannels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => handleSelectChannel(channel)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        selectedChannel?.id === channel.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-background hover:bg-muted'
                      }`}
                    >
                      <div className="text-2xl">{channel.logo}</div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{channel.name}</span>
                          {channel.isPremium && !isPremium && (
                            <Lock className="w-3 h-3 text-primary" />
                          )}
                        </div>
                        <span className={`text-xs ${
                          selectedChannel?.id === channel.id 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {channel.category}
                        </span>
                      </div>
                      {channel.isLive && (
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                          selectedChannel?.id === channel.id 
                            ? 'bg-primary-foreground' 
                            : 'bg-red-500'
                        }`} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Premium Banner */}
                {!isPremium && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl border border-primary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Film className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-foreground">Seja Premium</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Desbloqueie todos os canais e assista sem limites.
                    </p>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate('/premium')}
                    >
                      Ver Planos
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
