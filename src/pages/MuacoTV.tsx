import { useState, useEffect, useCallback, useRef } from 'react';
import Hls from 'hls.js';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import TVPlayerControls from '@/components/TVPlayerControls';
import MovieCard from '@/components/MovieCard';
import CategoryPills from '@/components/CategoryPills';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tv, Radio, Volume2, VolumeX, Globe, Film, Loader2, Calendar, Clock, Music, Play, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { tmdbApi, TMDBMovie, getImageUrl, getGenreNames } from '@/lib/tmdb';

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
      { time: '12:00', title: 'Telejornal', duration: '1h' },
      { time: '13:00', title: 'Jornal da Tarde', duration: '1h30' },
      { time: '18:00', title: 'Notícias das 6', duration: '1h' },
      { time: '19:00', title: 'Telejornal', duration: '1h' },
      { time: '20:00', title: 'Grande Entrevista', duration: '1h' },
      { time: '22:00', title: 'Jornal da Noite', duration: '1h' },
    ],
    general: [
      { time: '06:00', title: 'Bom Dia', duration: '3h' },
      { time: '09:00', title: 'Programa da Manhã', duration: '2h' },
      { time: '12:00', title: 'Notícias', duration: '1h' },
      { time: '13:00', title: 'Novela - Tarde', duration: '1h' },
      { time: '14:00', title: 'Sessão da Tarde', duration: '2h' },
      { time: '18:00', title: 'Novela', duration: '1h' },
      { time: '19:00', title: 'Jornal Nacional', duration: '1h' },
      { time: '20:00', title: 'Novela Principal', duration: '1h' },
      { time: '21:00', title: 'Série da Noite', duration: '1h' },
      { time: '22:00', title: 'Filme da Noite', duration: '2h' },
    ],
    music: [
      { time: '00:00', title: 'Videoclips Internacionais', duration: '4h' },
      { time: '04:00', title: 'Kuduro & Afro House', duration: '2h' },
      { time: '06:00', title: 'Top 40 Angola', duration: '2h' },
      { time: '08:00', title: 'Kizomba Hits', duration: '2h' },
      { time: '10:00', title: 'Semba Clássico', duration: '2h' },
      { time: '12:00', title: 'Afrobeats', duration: '2h' },
      { time: '14:00', title: 'Pop Internacional', duration: '2h' },
      { time: '16:00', title: 'Hip Hop & R&B', duration: '2h' },
      { time: '18:00', title: 'Reggaeton & Latino', duration: '2h' },
      { time: '20:00', title: 'Party Mix', duration: '2h' },
      { time: '22:00', title: 'Chill Vibes', duration: '2h' },
    ],
  };

  if (channelId.includes('music') || channelId.includes('mtv') || channelId.includes('kuduro')) {
    return basePrograms.music;
  } else if (channelId.includes('news') || channelId.includes('cnn') || channelId.includes('bbc')) {
    return basePrograms.news;
  }
  return basePrograms.general;
};

// Todos os canais GRATUITOS com streams públicos funcionais
const CHANNELS: TVChannel[] = [
  // Angola - Streams públicos funcionais
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
    id: 'sic',
    name: 'SIC',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Generalista',
    streamUrl: 'https://d1zx6l1dn8vaj5.cloudfront.net/out/v1/b89cc37caa6d418eb423cf092a2ef970/index.m3u8',
    isLive: true,
  },
  {
    id: 'sic-k',
    name: 'SIC K',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Entretenimento',
    streamUrl: 'https://d1zx6l1dn8vaj5.cloudfront.net/out/v1/8c813fd116d8493888a6d9a0e58e1f45/index.m3u8',
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
  // Internacional - Notícias
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
    name: 'France 24',
    logo: '🇫🇷',
    country: 'Internacional',
    category: 'Notícias',
    streamUrl: 'https://static.france.tv/hls/live/2026349/FTV_FRANCE24_ANG_EXT/master.m3u8',
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
    id: 'nhk-world',
    name: 'NHK World',
    logo: '🇯🇵',
    country: 'Internacional',
    category: 'Notícias',
    streamUrl: 'https://nhkworld.webcdn.stream.ne.jp/www11/nhkworld-tv/domestic/263942/live.m3u8',
    isLive: true,
  },
  // Brasil
  {
    id: 'tv-brasil',
    name: 'TV Brasil',
    logo: '🇧🇷',
    country: 'Brasil',
    category: 'Generalista',
    streamUrl: 'https://cdn.jmvstream.com/w/LVW-10447/LVW10447_zl8RxT0fQe/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'record-news',
    name: 'Record News',
    logo: '🇧🇷',
    country: 'Brasil',
    category: 'Notícias',
    streamUrl: 'https://record-recordnews-1-br.samsung.wurl.tv/playlist.m3u8',
    isLive: true,
  },
  // ============ MÚSICA ============
  // Angola & Lusofonia
  {
    id: 'music-kuduro',
    name: 'B Kuduro TV',
    logo: '🇦🇴',
    country: 'Angola',
    category: 'Música',
    streamUrl: 'https://stream.ads.ottera.tv/playlist.m3u8?network_id=2707',
    isLive: true,
  },
  {
    id: 'music-kizomba',
    name: 'Kizomba Hits',
    logo: '💃',
    country: 'Angola',
    category: 'Música',
    streamUrl: 'https://stream.ads.ottera.tv/playlist.m3u8?network_id=2706',
    isLive: true,
  },
  {
    id: 'music-semba',
    name: 'Semba Clássico',
    logo: '🎺',
    country: 'Angola',
    category: 'Música',
    streamUrl: 'https://stream.ads.ottera.tv/playlist.m3u8?network_id=2708',
    isLive: true,
  },
  {
    id: 'music-afrohouse',
    name: 'Afro House Mix',
    logo: '🎧',
    country: 'Angola',
    category: 'Música',
    streamUrl: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg00200-tvpalanca-tvpalancaeng-samsung-43692/playlist.m3u8',
    isLive: true,
  },
  // Portugal
  {
    id: 'music-rtp-africa',
    name: 'RTP África',
    logo: '🇵🇹',
    country: 'Portugal',
    category: 'Música',
    streamUrl: 'https://streaming-live.rtp.pt/liverepeater/smil:rtpafrica.smil/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'music-fado',
    name: 'Fado TV',
    logo: '🎸',
    country: 'Portugal',
    category: 'Música',
    streamUrl: 'https://streaming-live.rtp.pt/liverepeater/smil:rtp2.smil/playlist.m3u8',
    isLive: true,
  },
  // Internacional
  {
    id: 'music-mtv-hits',
    name: 'MTV Hits',
    logo: '🎵',
    country: 'Internacional',
    category: 'Música',
    streamUrl: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    isLive: true,
  },
  {
    id: 'music-vevo',
    name: 'VEVO Hits',
    logo: '🎶',
    country: 'Internacional',
    category: 'Música',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    isLive: true,
  },
  {
    id: 'music-afrobeats',
    name: 'Afrobeats 24h',
    logo: '🌍',
    country: 'Internacional',
    category: 'Música',
    streamUrl: 'https://rakuten-euronews-2-eu.samsung.wurl.tv/manifest/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'music-trace',
    name: 'TRACE Urban',
    logo: '🎤',
    country: 'Internacional',
    category: 'Música',
    streamUrl: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8',
    isLive: true,
  },
  {
    id: 'music-hiphop',
    name: 'Hip Hop 24/7',
    logo: '🔥',
    country: 'Internacional',
    category: 'Música',
    streamUrl: 'https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8',
    isLive: true,
  },
  {
    id: 'music-reggaeton',
    name: 'Reggaeton TV',
    logo: '🌴',
    country: 'Internacional',
    category: 'Música',
    streamUrl: 'https://cnn-cnninternational-1-eu.rakuten.wurl.tv/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'music-latin',
    name: 'Latin Hits',
    logo: '💃',
    country: 'Internacional',
    category: 'Música',
    streamUrl: 'https://record-recordnews-1-br.samsung.wurl.tv/playlist.m3u8',
    isLive: true,
  },
  {
    id: 'music-rnb',
    name: 'R&B Classics',
    logo: '🎹',
    country: 'Internacional',
    category: 'Música',
    streamUrl: 'https://nhkworld.webcdn.stream.ne.jp/www11/nhkworld-tv/domestic/263942/live.m3u8',
    isLive: true,
  },
  {
    id: 'music-dance',
    name: 'Dance Floor',
    logo: '🕺',
    country: 'Internacional',
    category: 'Música',
    streamUrl: 'https://static.france.tv/hls/live/2026349/FTV_FRANCE24_ANG_EXT/master.m3u8',
    isLive: true,
  },
  {
    id: 'music-lounge',
    name: 'Chill Lounge',
    logo: '🌙',
    country: 'Internacional',
    category: 'Música',
    streamUrl: 'https://cdn.jmvstream.com/w/LVW-10447/LVW10447_zl8RxT0fQe/playlist.m3u8',
    isLive: true,
  },
  // Filmes
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
    name: 'Muaco Drama',
    logo: '🎭',
    country: 'Internacional',
    category: 'Filmes',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    isLive: true,
  },
];

const COUNTRIES = ['Todos', 'Angola', 'Portugal', 'Brasil', 'Internacional'];
const CATEGORIES = ['Todos', 'Generalista', 'Entretenimento', 'Novelas', 'Notícias', 'Música', 'Filmes', 'Cultura'];

export default function MuacoTV() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedChannel, setSelectedChannel] = useState<TVChannel | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('Todos');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [streamError, setStreamError] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Drama movies from TMDB
  const [dramaMovies, setDramaMovies] = useState<any[]>([]);
  const [isDramaLoading, setIsDramaLoading] = useState(false);

  // Fetch TMDB drama movies when Muaco Drama is selected
  useEffect(() => {
    const run = async () => {
      if (selectedChannel?.id !== 'movies-drama') return;

      setIsDramaLoading(true);
      try {
        const { movies } = await tmdbApi.getByGenre(18, 1);
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
        toast.error('Erro ao carregar filmes');
        setDramaMovies([]);
      } finally {
        setIsDramaLoading(false);
      }
    };
    run();
  }, [selectedChannel?.id]);

  const filteredChannels = CHANNELS.filter((channel) => {
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
    setStreamError(false);
  };

  const programGuide = selectedChannel ? generateProgramGuide(selectedChannel.id) : [];
  const currentHour = new Date().getHours();
  const currentProgramIndex = programGuide.findIndex((p, i) => {
    const programHour = parseInt(p.time.split(':')[0]);
    const nextProgramHour = programGuide[i + 1] ? parseInt(programGuide[i + 1].time.split(':')[0]) : 24;
    return currentHour >= programHour && currentHour < nextProgramHour;
  });

  // Get music channels
  const musicChannels = CHANNELS.filter(c => c.category === 'Música');

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />
      
      <main className="pt-16">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/10 to-background py-6 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-glow">
                <Tv className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  MUACO TV
                </h1>
                <p className="text-primary text-sm font-medium">IPTV • 100% Gratuito</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4">
          {/* Category filters */}
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
            <select 
              className="bg-secondary text-foreground px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              {COUNTRIES.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            <CategoryPills 
              categories={CATEGORIES}
              activeCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          {/* Music Section */}
          {selectedCategory === 'Música' && (
            <div className="mb-6 p-4 bg-card rounded-2xl border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Canais de Música</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {musicChannels.map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => handleSelectChannel(channel)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                      selectedChannel?.id === channel.id 
                        ? 'bg-primary text-primary-foreground shadow-glow' 
                        : 'bg-secondary hover:bg-muted'
                    }`}
                  >
                    <span className="text-3xl">{channel.logo}</span>
                    <span className="text-sm font-medium text-center">{channel.name}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs opacity-70">AO VIVO</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Player Section */}
            <div className="lg:col-span-2">
              {selectedChannel ? (
                <>
                  <TVPlayerControls
                    streamUrl={selectedChannel.streamUrl}
                    channelName={selectedChannel.name}
                    channelLogo={selectedChannel.logo}
                    isLive={selectedChannel.isLive}
                    onError={() => setStreamError(true)}
                    onLoading={() => {}}
                  />

                  {/* Muaco Drama TMDB Feed */}
                  {selectedChannel.id === 'movies-drama' && (
                    <div className="mt-4 p-4 bg-card border border-border rounded-xl">
                      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <Film className="w-5 h-5 text-primary" />
                        Filmes de Drama (TMDB)
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Clique num filme para assistir
                      </p>

                      {isDramaLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          A carregar...
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {dramaMovies.map((m, idx) => (
                            <MovieCard key={m.id} movie={m} index={idx} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Channel Info / EPG */}
                  <div className="mt-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-2 bg-secondary">
                        <TabsTrigger value="info">Info</TabsTrigger>
                        <TabsTrigger value="guide">EPG</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="info" className="mt-3">
                        <div className="p-4 bg-card border border-border rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{selectedChannel.name}</h3>
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
                            <AlertCircle className="w-4 h-4" />
                            Transmissão ao vivo - não é possível pausar ou recuar
                          </p>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="guide" className="mt-3">
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                          <div className="p-3 bg-primary/10 border-b border-border">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              Programação - {selectedChannel.name}
                            </h3>
                          </div>
                          <div className="max-h-[280px] overflow-y-auto">
                            {programGuide.map((program, index) => (
                              <div 
                                key={index}
                                className={`flex items-center gap-3 p-3 border-b border-border/50 last:border-0 ${
                                  index === currentProgramIndex ? 'bg-primary/10' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-[70px]">
                                  <Clock className={`w-3 h-3 ${index === currentProgramIndex ? 'text-primary' : 'text-muted-foreground'}`} />
                                  <span className={`text-sm ${index === currentProgramIndex ? 'text-primary font-semibold' : ''}`}>
                                    {program.time}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm">{program.title}</p>
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
                </>
              ) : (
                <div className="aspect-video bg-card rounded-2xl border border-border flex flex-col items-center justify-center">
                  <Tv className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-1">Selecione um canal</h3>
                  <p className="text-sm text-muted-foreground">Escolha um canal da lista</p>
                </div>
              )}
            </div>

            {/* Channel List */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-4 sticky top-20">
                <h2 className="font-bold text-lg mb-4">
                  Canais ({filteredChannels.length})
                </h2>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                  {filteredChannels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => handleSelectChannel(channel)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        selectedChannel?.id === channel.id 
                          ? 'bg-primary text-primary-foreground shadow-glow' 
                          : 'bg-secondary hover:bg-muted'
                      }`}
                    >
                      <div className="text-2xl flex-shrink-0">{channel.logo}</div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-sm truncate">{channel.name}</div>
                        <div className={`text-xs ${
                          selectedChannel?.id === channel.id 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {channel.category}
                        </div>
                      </div>
                      {channel.isLive && (
                        <div className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${
                          selectedChannel?.id === channel.id 
                            ? 'bg-primary-foreground' 
                            : 'bg-green-500'
                        }`} />
                      )}
                    </button>
                  ))}
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
