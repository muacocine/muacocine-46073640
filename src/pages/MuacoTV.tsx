import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tv, Radio, Play, Volume2, VolumeX, Maximize, Globe, Film, Lock } from 'lucide-react';
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

// Hook para síntese de voz
const useSpeechSynthesis = () => {
  const synth = useRef<SpeechSynthesis | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synth.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const voices = synth.current?.getVoices() || [];
        // Procura voz masculina em português (Google ou Microsoft)
        const ptMaleVoice = voices.find(v => 
          (v.lang.includes('pt') || v.lang.includes('PT')) && 
          (v.name.toLowerCase().includes('male') || 
           v.name.includes('Google') || 
           v.name.includes('Microsoft') ||
           !v.name.toLowerCase().includes('female'))
        ) || voices.find(v => v.lang.includes('pt')) || voices[0];
        
        voiceRef.current = ptMaleVoice;
      };

      loadVoices();
      synth.current.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!synth.current) return;
    
    // Cancela qualquer fala anterior
    synth.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voiceRef.current;
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 0.8; // Voz mais grave (masculina)
    utterance.volume = 1;
    
    synth.current.speak(utterance);
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
  // Angola
  {
    id: 'tpa1',
    name: 'TPA 1',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Generalista',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
    isLive: true,
    isPremium: false,
  },
  {
    id: 'tpa2',
    name: 'TPA 2',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Generalista',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
    isLive: true,
    isPremium: false,
  },
  {
    id: 'tpa-internacional',
    name: 'TPA Internacional',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Internacional',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'zap-viva',
    name: 'ZAP Viva',
    logo: '📺',
    country: 'Angola',
    category: 'Entretenimento',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'zap-novelas',
    name: 'ZAP Novelas',
    logo: '💫',
    country: 'Angola',
    category: 'Novelas',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'tv-zimbo',
    name: 'TV Zimbo',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Generalista',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
    isLive: true,
    isPremium: false,
  },
  // Portugal
  {
    id: 'rtp1',
    name: 'RTP 1',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Generalista',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
    isLive: true,
    isPremium: false,
  },
  {
    id: 'rtp2',
    name: 'RTP 2',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Cultura',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
    isLive: true,
    isPremium: false,
  },
  {
    id: 'sic',
    name: 'SIC',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Generalista',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'tvi',
    name: 'TVI',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Generalista',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'cmtv',
    name: 'CMTV',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Notícias',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'sic-noticias',
    name: 'SIC Notícias',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Notícias',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
    isLive: true,
    isPremium: true,
  },
  // Filmes 24h
  {
    id: 'movies-action',
    name: 'Muaco Action 24h',
    logo: '🎬',
    country: 'Internacional',
    category: 'Filmes',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'movies-drama',
    name: 'Muaco Drama 24h',
    logo: '🎭',
    country: 'Internacional',
    category: 'Filmes',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
    isLive: true,
    isPremium: true,
  },
  {
    id: 'movies-comedy',
    name: 'Muaco Comédia 24h',
    logo: '😂',
    country: 'Internacional',
    category: 'Filmes',
    streamUrl: 'https://videos3.earthcam.com/fecnetwork/4017.flv/chunklist_w770267498.m3u8',
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
  const { speak } = useSpeechSynthesis();
  
  const [selectedChannel, setSelectedChannel] = useState<TVChannel | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('Todos');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [currentMovie, setCurrentMovie] = useState<string>('');
  const [nextMovie, setNextMovie] = useState<string>('');
  const movieIndexRef = useRef(0);

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
                    {/* Placeholder for actual stream - shows message */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-background">
                      <div className="text-6xl mb-4">{selectedChannel.logo}</div>
                      <h2 className="text-2xl font-display text-foreground mb-2">
                        {selectedChannel.name}
                      </h2>
                      <div className="flex items-center gap-2 text-primary">
                        <Radio className="w-4 h-4 animate-pulse" />
                        <span className="font-medium">AO VIVO</span>
                      </div>
                      
                      {/* Mostra filme atual para canais de filmes */}
                      {selectedChannel.category === 'Filmes' && currentMovie && (
                        <div className="mt-6 text-center">
                          <p className="text-muted-foreground text-sm mb-1">Agora exibindo:</p>
                          <p className="text-xl font-semibold text-foreground">{currentMovie}</p>
                          <p className="text-primary text-sm mt-2">
                            Próximo: {nextMovie}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-muted-foreground mt-4 text-sm text-center max-w-md">
                        Streaming ativo. Os controles de reprodução estão desabilitados 
                        para manter a experiência de TV ao vivo.
                      </p>
                    </div>

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
