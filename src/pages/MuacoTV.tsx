import { useState, useEffect, useCallback, useRef } from 'react';
import Hls from 'hls.js';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import TVPlayerControls from '@/components/TVPlayerControls';
import MovieCard from '@/components/MovieCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tv, Radio, Volume2, VolumeX, Maximize, Globe, Film, Loader2, Calendar, Clock, RotateCw, Settings, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { tmdbApi, TMDBMovie, getImageUrl, getGenreNames } from '@/lib/tmdb';

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
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

    if (audioRef.current) {
      audioRef.current.pause();
      try {
        URL.revokeObjectURL(audioRef.current.src);
      } catch {
        // ignore
      }
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    try {
      await audio.play();
      return true;
    } catch {
      // Autoplay geralmente é bloqueado sem gesto do utilizador
      throw new Error('Autoplay bloqueado');
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
}

interface ProgramGuide {
  time: string;
  title: string;
  duration: string;
}

// Guia de programação simulado
const generateProgramGuide = (channelId: string): ProgramGuide[] => {
  const basePrograms: Record<string, ProgramGuide[]> = {
    news: [
      { time: '06:00', title: 'Notícias da Manhã', duration: '2h' },
      { time: '08:00', title: 'Jornal das 8', duration: '1h' },
      { time: '09:00', title: 'Debate Matinal', duration: '2h' },
      { time: '11:00', title: 'Notícias ao Meio-Dia', duration: '1h' },
      { time: '12:00', title: 'Reportagem Especial', duration: '1h' },
      { time: '13:00', title: 'Jornal da Tarde', duration: '1h30' },
      { time: '14:30', title: 'Atualidade Internacional', duration: '1h30' },
      { time: '16:00', title: 'Economia e Mercados', duration: '1h' },
      { time: '17:00', title: 'Desporto ao Vivo', duration: '1h' },
      { time: '18:00', title: 'Notícias das 6', duration: '1h' },
      { time: '19:00', title: 'Telejornal', duration: '1h' },
      { time: '20:00', title: 'Grande Entrevista', duration: '1h' },
      { time: '21:00', title: 'Documentário', duration: '1h' },
      { time: '22:00', title: 'Jornal da Noite', duration: '1h' },
      { time: '23:00', title: 'Última Hora', duration: '1h' },
    ],
    general: [
      { time: '06:00', title: 'Bom Dia', duration: '3h' },
      { time: '09:00', title: 'Programa da Manhã', duration: '2h' },
      { time: '11:00', title: 'Culinária ao Vivo', duration: '1h' },
      { time: '12:00', title: 'Notícias', duration: '1h' },
      { time: '13:00', title: 'Novela - Tarde', duration: '1h' },
      { time: '14:00', title: 'Sessão da Tarde', duration: '2h' },
      { time: '16:00', title: 'Talk Show', duration: '2h' },
      { time: '18:00', title: 'Novela - Final de Tarde', duration: '1h' },
      { time: '19:00', title: 'Jornal Nacional', duration: '1h' },
      { time: '20:00', title: 'Novela Principal', duration: '1h' },
      { time: '21:00', title: 'Série da Noite', duration: '1h' },
      { time: '22:00', title: 'Filme da Noite', duration: '2h' },
      { time: '00:00', title: 'Jornal da Meia-Noite', duration: '30min' },
    ],
    movies: [
      { time: '06:00', title: 'Cinema Clássico', duration: '2h' },
      { time: '08:00', title: 'Filme de Ação', duration: '2h' },
      { time: '10:00', title: 'Comédia da Manhã', duration: '2h' },
      { time: '12:00', title: 'Drama Intenso', duration: '2h' },
      { time: '14:00', title: 'Aventura', duration: '2h' },
      { time: '16:00', title: 'Ficção Científica', duration: '2h' },
      { time: '18:00', title: 'Romance', duration: '2h' },
      { time: '20:00', title: 'Thriller da Noite', duration: '2h' },
      { time: '22:00', title: 'Terror', duration: '2h' },
      { time: '00:00', title: 'Filme de Culto', duration: '2h' },
    ],
  };

  if (channelId.includes('movie') || channelId.includes('film')) {
    return basePrograms.movies;
  } else if (channelId.includes('news') || channelId.includes('noticias') || channelId.includes('cnn') || channelId.includes('bbc') || channelId.includes('jazeera')) {
    return basePrograms.news;
  }
  return basePrograms.general;
};

// Todos os canais GRATUITOS com streams públicos funcionais
const CHANNELS: TVChannel[] = [
  // Angola - Streams públicos funcionais atualizados
  {
    id: 'tpa1',
    name: 'TPA 1',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Generalista',
    streamUrl: 'https://video.tpa.ao/hls/tpa1_high/index.m3u8',
    isLive: true,
  },
  {
    id: 'tpa2',
    name: 'TPA 2',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Generalista',
    streamUrl: 'https://video.tpa.ao/hls/tpa2_high/index.m3u8',
    isLive: true,
  },
  {
    id: 'tpa-internacional',
    name: 'TPA Internacional',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Internacional',
    streamUrl: 'https://video.tpa.ao/hls/tpai_high/index.m3u8',
    isLive: true,
  },
  {
    id: 'tv-zimbo',
    name: 'TV Zimbo',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Generalista',
    streamUrl: 'https://cdn.zimbo.tv/live/smil:zimbo.smil/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'zap-viva',
    name: 'ZAP Viva',
    logo: '📺',
    country: 'Angola',
    category: 'Entretenimento',
    streamUrl: 'https://stream.ads.ottera.tv/playlist.m3u8?network_id=2706',
    isLive: true,
  },
  {
    id: 'zap-novelas',
    name: 'ZAP Novelas',
    logo: '💫',
    country: 'Angola',
    category: 'Novelas',
    streamUrl: 'https://stream.ads.ottera.tv/playlist.m3u8?network_id=2708',
    isLive: true,
  },
  {
    id: 'blast',
    name: 'Blast TV',
    logo: '💥',
    country: 'Angola',
    category: 'Entretenimento',
    streamUrl: 'https://stream.ads.ottera.tv/playlist.m3u8?network_id=2707',
    isLive: true,
  },
  {
    id: 'rna',
    name: 'RNA - Rádio Nacional',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Rádio',
    streamUrl: 'https://radios.vpn.sapo.pt/AO/radio1.mp3',
    isLive: true,
  },
  {
    id: 'tv-palanca',
    name: 'TV Palanca',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Entretenimento',
    streamUrl: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg00200-tvpalanca-tvpalancaeng-samsung-43692/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'record-angola',
    name: 'Record TV Angola',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Generalista',
    streamUrl: 'https://record-recordangola-1-ao.samsung.wurl.tv/playlist.m3u8',
    isLive: true,
  },
  // Portugal
  {
    id: 'rtp1',
    name: 'RTP 1',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Generalista',
    streamUrl: 'https://streaming-live.rtp.pt/liverepeater/smil:rtp1.smil/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'rtp2',
    name: 'RTP 2',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Cultura',
    streamUrl: 'https://streaming-live.rtp.pt/liverepeater/smil:rtp2.smil/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'rtp3',
    name: 'RTP 3',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Notícias',
    streamUrl: 'https://streaming-live.rtp.pt/liverepeater/smil:rtp3.smil/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'rtp-africa',
    name: 'RTP África',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Internacional',
    streamUrl: 'https://streaming-live.rtp.pt/liverepeater/smil:rtpafrica.smil/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'rtp-internacional',
    name: 'RTP Internacional',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Internacional',
    streamUrl: 'https://streaming-live.rtp.pt/liverepeater/smil:rtpi.smil/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'sic',
    name: 'SIC',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Generalista',
    streamUrl: 'https://d1zx6l1dn8vaj5.cloudfront.net/out/v1/b89cc37caa6d418eb423cf092a2ef970/index.m3u8',
    isLive: true,
  },
  {
    id: 'tvi',
    name: 'TVI',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Generalista',
    streamUrl: 'https://video-auth6.iol.pt/live_tvi/live_tvi/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'cmtv',
    name: 'CMTV',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Notícias',
    streamUrl: 'https://cmtv-live.videocdn.pt/cmtv/smil:cmtv.smil/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'sic-noticias',
    name: 'SIC Notícias',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Notícias',
    streamUrl: 'https://d1zx6l1dn8vaj5.cloudfront.net/out/v1/8c813fd116d8493888a6d9a0e58e1f45/index.m3u8',
    isLive: true,
  },
  // Internacional - Canais de Notícias
  {
    id: 'bbc-world',
    name: 'BBC News (HLS)',
    logo: '🇬🇧',
    country: 'Internacional',
    category: 'Notícias',
    // HLS (mais compatível do que MPD/DASH)
    streamUrl: 'https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/abr_hdtv/ak/bbc_news_channel_hd.m3u8',
    isLive: true,
  },
  {
    id: 'cnn-international',
    name: 'CNN International',
    logo: '🇺🇸',
    country: 'Internacional',
    category: 'Notícias',
    streamUrl: 'https://cnn-cnninternational-1-eu.rakuten.wurl.tv/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera English',
    logo: '🇶🇦',
    country: 'Internacional',
    category: 'Notícias',
    streamUrl: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8',
    isLive: true,
  },
  {
    id: 'france24-en',
    name: 'France 24 English',
    logo: '🇫🇷',
    country: 'Internacional',
    category: 'Notícias',
    streamUrl: 'https://static.france.tv/hls/live/2026349/FTV_FRANCE24_ANG_EXT/master.m3u8',
    isLive: true,
  },
  {
    id: 'france24-fr',
    name: 'France 24 Français',
    logo: '🇫🇷',
    country: 'Internacional',
    category: 'Notícias',
    streamUrl: 'https://static.france.tv/hls/live/2026350/FTV_FRANCE24_FRA_EXT/master.m3u8',
    isLive: true,
  },
  {
    id: 'dw-english',
    name: 'DW English',
    logo: '🇩🇪',
    country: 'Internacional',
    category: 'Notícias',
    streamUrl: 'https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8',
    isLive: true,
  },
  {
    id: 'euronews',
    name: 'Euronews',
    logo: '🇪🇺',
    country: 'Internacional',
    category: 'Notícias',
    streamUrl: 'https://rakuten-euronews-2-eu.samsung.wurl.tv/manifest/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'rt-news',
    name: 'RT News',
    logo: '🇷🇺',
    country: 'Internacional',
    category: 'Notícias',
    streamUrl: 'https://rt-glb.rttv.com/live/rtnews/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'nhk-world',
    name: 'NHK World Japan',
    logo: '🇯🇵',
    country: 'Internacional',
    category: 'Notícias',
    streamUrl: 'https://nhkworld.webcdn.stream.ne.jp/www11/nhkworld-tv/domestic/263942/live.m3u8',
    isLive: true,
  },
  {
    id: 'cgtn',
    name: 'CGTN',
    logo: '🇨🇳',
    country: 'Internacional',
    category: 'Notícias',
    streamUrl: 'https://news.cgtn.com/resource/live/english/cgtn-news.m3u8',
    isLive: true,
  },
  // Brasil
  {
    id: 'tv-brasil',
    name: 'TV Brasil',
    logo: '🇧🇷',
    country: 'Internacional',
    category: 'Generalista',
    streamUrl: 'https://cdn.jmvstream.com/w/LVW-10447/LVW10447_zl8RxT0fQe/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'record-news',
    name: 'Record News',
    logo: '🇧🇷',
    country: 'Internacional',
    category: 'Notícias',
    streamUrl: 'https://record-recordnews-1-br.samsung.wurl.tv/playlist.m3u8',
    isLive: true,
  },
  // Desporto
  {
    id: 'espn-deportes',
    name: 'ESPN Deportes',
    logo: '⚽',
    country: 'Internacional',
    category: 'Desporto',
    streamUrl: 'https://cdn.sportpluscdn.net/hlslive/sporttv1hd/master.m3u8',
    isLive: true,
  },
  // Filmes 24h - Demo streams
  {
    id: 'movies-action',
    name: 'Muaco Action 24h',
    logo: '🎬',
    country: 'Internacional',
    category: 'Filmes',
    streamUrl: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    isLive: true,
  },
  {
    id: 'movies-drama',
    name: 'Muaco Drama 24h',
    logo: '🎭',
    country: 'Internacional',
    category: 'Filmes',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    isLive: true,
  },
  {
    id: 'movies-comedy',
    name: 'Muaco Comédia 24h',
    logo: '😂',
    country: 'Internacional',
    category: 'Filmes',
    streamUrl: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8',
    isLive: true,
  },
];

const COUNTRIES = ['Todos', 'Angola', 'Portugal', 'Internacional'];
const CATEGORIES = ['Todos', 'Generalista', 'Entretenimento', 'Novelas', 'Notícias', 'Filmes', 'Cultura', 'Desporto'];

export default function MuacoTV() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { speak } = useElevenLabsTTS();

  const [selectedChannel, setSelectedChannel] = useState<TVChannel | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('Todos');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [currentMovie, setCurrentMovie] = useState<string>('');
  const [nextMovie, setNextMovie] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [activeTab, setActiveTab] = useState('channels');

  const [dramaMovies, setDramaMovies] = useState<
    {
      id: string;
      title: string;
      poster_url: string | null;
      release_year: number | null;
      rating: number | null;
      genre: string[] | null;
      isTV?: boolean;
    }[]
  >([]);
  const [isDramaLoading, setIsDramaLoading] = useState(false);

  const movieIndexRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // HLS Player setup
  useEffect(() => {
    if (!selectedChannel || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);
    setStreamError(false);

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
        video.play().catch(() => setIsLoading(false));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data);
          setStreamError(true);
          setIsLoading(false);
          
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setTimeout(() => hls.startLoad(), 3000);
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Rotação automática de filmes (announcer)
  useEffect(() => {
    if (!selectedChannel || selectedChannel.category !== 'Filmes') return;

    const randomStart = Math.floor(Math.random() * MOVIE_PLAYLIST.length);
    movieIndexRef.current = randomStart;
    setCurrentMovie(MOVIE_PLAYLIST[randomStart]);
    setNextMovie(MOVIE_PLAYLIST[(randomStart + 1) % MOVIE_PLAYLIST.length]);

    const interval = setInterval(() => {
      const nextIndex = (movieIndexRef.current + 1) % MOVIE_PLAYLIST.length;
      const upcomingMovie = MOVIE_PLAYLIST[nextIndex];

      if (ttsEnabled && !isMuted) {
        speak(`Já a seguir: ${upcomingMovie}`).catch(() => {
          // Se der erro, normalmente é autoplay bloqueado
        });
      }

      setTimeout(() => {
        movieIndexRef.current = nextIndex;
        setCurrentMovie(upcomingMovie);
        setNextMovie(MOVIE_PLAYLIST[(nextIndex + 1) % MOVIE_PLAYLIST.length]);
      }, 3000);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedChannel, isMuted, speak, ttsEnabled]);

  // Feed real (TMDB) para o canal Muaco Drama
  useEffect(() => {
    const run = async () => {
      if (selectedChannel?.id !== 'movies-drama') return;

      setIsDramaLoading(true);
      try {
        const { movies } = await tmdbApi.getByGenre(18, 1); // 18 = Drama
        const mapped = (movies || []).slice(0, 24).map((m: TMDBMovie) => {
          const year = m.release_date ? Number(m.release_date.split('-')[0]) : null;
          return {
            id: String(m.id),
            title: m.title || m.name || 'Sem título',
            poster_url: getImageUrl(m.poster_path, 'w500'),
            release_year: Number.isFinite(year) ? year : null,
            rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
            genre: m.genre_ids ? getGenreNames(m.genre_ids) : null,
          };
        });
        setDramaMovies(mapped);
      } catch {
        toast.error('Não foi possível carregar filmes de Drama.');
        setDramaMovies([]);
      } finally {
        setIsDramaLoading(false);
      }
    };

    run();
  }, [selectedChannel?.id]);

  const enableVoice = async () => {
    try {
      await speak('Som ativado.');
      setTtsEnabled(true);
      toast.success('Voz ativada');
    } catch {
      toast.error('Ative o som: toque em "Voz" e permita áudio no navegador.');
    }
  };

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

  const programGuide = selectedChannel ? generateProgramGuide(selectedChannel.id) : [];
  const currentHour = new Date().getHours();
  const currentProgramIndex = programGuide.findIndex((p, i) => {
    const programHour = parseInt(p.time.split(':')[0]);
    const nextProgramHour = programGuide[i + 1] ? parseInt(programGuide[i + 1].time.split(':')[0]) : 24;
    return currentHour >= programHour && currentHour < nextProgramHour;
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
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
                <p className="text-primary font-medium">IPTV • Canais ao Vivo • 100% Gratuito</p>
              </div>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Assista aos melhores canais de Angola, Portugal, BBC, CNN, Al Jazeera e muito mais. 
              Streaming ao vivo 24 horas por dia, 7 dias por semana - totalmente gratuito!
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Player Section */}
            <div className="lg:col-span-2">
              {selectedChannel ? (
                <TVPlayerControls
                  streamUrl={selectedChannel.streamUrl}
                  channelName={selectedChannel.name}
                  channelLogo={selectedChannel.logo}
                  isLive={selectedChannel.isLive}
                  onError={() => setStreamError(true)}
                  onLoading={setIsLoading}
                />
              ) : (
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-border">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Tv className="w-20 h-20 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Selecione um canal
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Escolha um canal da lista para começar a assistir
                    </p>
                  </div>
                </div>
              )}

              {/* Muaco Drama (TMDB) */}
              {selectedChannel?.id === 'movies-drama' && (
                <div className="mt-4 p-4 bg-card border border-border rounded-xl">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="font-display text-xl text-foreground">MUACO DRAMA</h3>
                    <Button variant="outline" size="sm" onClick={enableVoice} className="gap-2">
                      <Volume2 className="w-4 h-4" />
                      Voz
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground mt-2">
                    Filmes de Drama reais (TMDB). Clique num cartaz para abrir e assistir.
                  </p>

                  {isDramaLoading ? (
                    <div className="mt-4 flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      A carregar filmes...
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {dramaMovies.map((m, idx) => (
                        <MovieCard key={m.id} movie={m} index={idx} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Movie Info for Movie Channels */}
              {selectedChannel?.category === 'Filmes' && selectedChannel?.id !== 'movies-drama' && currentMovie && (
                <div className="mt-4 p-4 bg-card border border-border rounded-xl">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Agora exibindo:</p>
                      <p className="text-foreground font-semibold text-lg">{currentMovie}</p>
                      <p className="text-primary text-sm mt-1">Próximo: {nextMovie}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={enableVoice} className="gap-2">
                      <Volume2 className="w-4 h-4" />
                      Voz
                    </Button>
                  </div>
                </div>
              )}

              {/* Now Playing Info & Program Guide */}
              {selectedChannel && (
                <div className="mt-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="channels" className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Informação
                      </TabsTrigger>
                      <TabsTrigger value="guide" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Guia de Programação
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="channels" className="mt-4">
                      <div className="p-4 bg-card border border-border rounded-xl">
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
                        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Este é um streaming ao vivo. Não é possível pausar, recuar ou avançar.
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="guide" className="mt-4">
                      <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="p-3 bg-primary/10 border-b border-border">
                          <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            Programação de Hoje - {selectedChannel.name}
                          </h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {programGuide.map((program, index) => (
                            <div 
                              key={index}
                              className={`flex items-center gap-3 p-3 border-b border-border/50 last:border-0 ${
                                index === currentProgramIndex ? 'bg-primary/10' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-[80px]">
                                <Clock className={`w-4 h-4 ${index === currentProgramIndex ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className={`text-sm font-medium ${index === currentProgramIndex ? 'text-primary' : 'text-foreground'}`}>
                                  {program.time}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm ${index === currentProgramIndex ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                                  {program.title}
                                </p>
                                <p className="text-xs text-muted-foreground">{program.duration}</p>
                              </div>
                              {index === currentProgramIndex && (
                                <Badge className="bg-primary text-primary-foreground text-xs">
                                  Agora
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>

            {/* Channel List */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-4">
                <h2 className="font-display text-xl text-foreground mb-4">
                  CANAIS DISPONÍVEIS ({filteredChannels.length})
                </h2>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <select 
                    className="flex-1 min-w-[120px] bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                  >
                    {COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  <select 
                    className="flex-1 min-w-[120px] bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
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
                            : 'bg-green-500'
                        }`} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Free Banner */}
                <div className="mt-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Film className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-foreground">100% Gratuito!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Todos os canais estão disponíveis gratuitamente. Aproveite!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
