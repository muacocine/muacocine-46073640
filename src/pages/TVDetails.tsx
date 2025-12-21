import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCoins } from '@/hooks/useCoins';
import { usePremium } from '@/hooks/usePremium';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import RatingStars from '@/components/RatingStars';
import Comments from '@/components/Comments';
import DownloadModal from '@/components/DownloadModal';
import { tmdbApi, TMDBMovie, getImageUrl, getBackdropUrl, getGenreNames } from '@/lib/tmdb';
import { 
  Play, 
  Heart, 
  ArrowLeft, 
  Star, 
  Calendar,
  X,
  Users,
  Tv,
  Subtitles,
  Coins,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  still_path: string | null;
  air_date: string;
  runtime: number;
}

const EPISODE_COST = 3;
const REFUND_TIME = 120000; // 2 minutes

export default function TVDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coins, spendCoins, refundCoins, refreshCoins } = useCoins();
  const { needsCoins } = usePremium();
  
  const [show, setShow] = useState<TMDBMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [playerSource, setPlayerSource] = useState(1);
  const [watchStartTime, setWatchStartTime] = useState<number | null>(null);
  const [coinsPaid, setCoinsPaid] = useState(false);
  const [currentWatchId, setCurrentWatchId] = useState<string | null>(null);
  const serverScrollRef = useRef<HTMLDivElement>(null);

  const getVideoSources = () => {
    if (!show) return [];
    return [
      { id: 1, name: 'Servidor 1', url: `https://vidsrc.cc/v2/embed/tv/${show.id}/${selectedSeason}/${selectedEpisode}` },
      { id: 2, name: 'Servidor 2', url: `https://vidsrc.pro/embed/tv/${show.id}/${selectedSeason}/${selectedEpisode}` },
      { id: 3, name: 'Servidor 3', url: `https://www.2embed.cc/embedtv/${show.id}&s=${selectedSeason}&e=${selectedEpisode}` },
      { id: 4, name: 'Servidor 4', url: `https://multiembed.mov/?video_id=${show.id}&tmdb=1&s=${selectedSeason}&e=${selectedEpisode}` },
      { id: 5, name: 'Servidor 5', url: `https://autoembed.co/tv/tmdb/${show.id}-${selectedSeason}-${selectedEpisode}` },
      { id: 6, name: 'Servidor 6', url: `https://moviesapi.club/tv/${show.id}-${selectedSeason}-${selectedEpisode}` },
      { id: 7, name: 'Servidor 7', url: `https://embed.su/embed/tv/${show.id}/${selectedSeason}/${selectedEpisode}` },
      { id: 8, name: 'Servidor 8', url: `https://player.videasy.net/tv/${show.id}/${selectedSeason}/${selectedEpisode}` },
    ];
  };

  useEffect(() => {
    async function fetchShow() {
      if (!id) return;

      try {
        const showData = await tmdbApi.getTVDetails(parseInt(id));
        setShow(showData);

        if (showData.seasons && showData.seasons.length > 0) {
          const firstSeason = showData.seasons.find(s => s.season_number > 0);
          if (firstSeason) {
            setSelectedSeason(firstSeason.season_number);
          }
        }

        if (user) {
          const { data: fav } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('movie_id', `tv-${id}`)
            .maybeSingle();

          setIsFavorite(!!fav);

          const { data: rating } = await supabase
            .from('ratings')
            .select('rating')
            .eq('user_id', user.id)
            .eq('movie_id', `tv-${id}`)
            .maybeSingle();

          if (rating) setUserRating(rating.rating);
        }

        const { data: ratings } = await supabase
          .from('ratings')
          .select('rating')
          .eq('movie_id', `tv-${id}`);

        if (ratings && ratings.length > 0) {
          const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
          setAverageRating(Math.round(avg * 10) / 10);
          setRatingCount(ratings.length);
        }
      } catch (error) {
        console.error('Error fetching TV show:', error);
        toast.error('Série não encontrada');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    fetchShow();
  }, [id, user, navigate]);

  useEffect(() => {
    async function fetchEpisodes() {
      if (!id || !selectedSeason) return;

      try {
        const seasonData = await tmdbApi.getTVSeasonEpisodes(parseInt(id), selectedSeason);
        setEpisodes(seasonData.episodes || []);
        setSelectedEpisode(1);
      } catch (error) {
        console.error('Error fetching episodes:', error);
      }
    }

    fetchEpisodes();
  }, [id, selectedSeason]);

  const handleWatchEpisode = async (episodeNumber: number) => {
    if (!user) {
      toast.error('Faça login para assistir');
      navigate('/auth');
      return;
    }

    if (coins < EPISODE_COST) {
      toast.error(`Você precisa de ${EPISODE_COST} moedas para assistir. Vá ao seu perfil para ganhar mais!`);
      navigate('/profile');
      return;
    }

    // Check if already watching this episode (prevent double charge)
    const watchId = `tv-${show?.id}-s${selectedSeason}e${episodeNumber}`;
    if (currentWatchId === watchId && coinsPaid) {
      setSelectedEpisode(episodeNumber);
      setShowPlayer(true);
      return;
    }

    const success = await spendCoins(EPISODE_COST, `Assistir: ${show?.name} T${selectedSeason}E${episodeNumber}`);
    if (success) {
      setCoinsPaid(true);
      setCurrentWatchId(watchId);
      setWatchStartTime(Date.now());
      setSelectedEpisode(episodeNumber);
      setShowPlayer(true);

      if (show) {
        await supabase.from('watch_history').insert({
          user_id: user.id,
          media_id: `tv-${show.id}`,
          media_type: 'tv',
          media_title: `${show.name} - T${selectedSeason}E${episodeNumber}`,
          media_poster: getImageUrl(show.poster_path),
          coins_spent: EPISODE_COST,
        });
      }

      toast.success(`-${EPISODE_COST} moedas. Bom episódio!`);
    }
  };

  const handleClosePlayer = async () => {
    if (watchStartTime && coinsPaid && show) {
      const watchedTime = Date.now() - watchStartTime;
      if (watchedTime < REFUND_TIME) {
        await refundCoins(EPISODE_COST, `Reembolso - ${show.name} T${selectedSeason}E${selectedEpisode}`);
      }
    }
    setShowPlayer(false);
    setCoinsPaid(false);
    setWatchStartTime(null);
    setCurrentWatchId(null);
    refreshCoins();
  };

  const handleDownload = () => {
    setShowDownload(true);
  };

  const scrollServers = (direction: 'left' | 'right') => {
    if (serverScrollRef.current) {
      const scrollAmount = 200;
      serverScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Faça login para adicionar aos favoritos');
      navigate('/auth');
      return;
    }

    if (!show) return;

    if (isFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', `tv-${show.id}`);

      if (!error) {
        setIsFavorite(false);
        toast.success('Removido dos favoritos');
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, movie_id: `tv-${show.id}` });

      if (!error) {
        setIsFavorite(true);
        toast.success('Adicionado aos favoritos');
      }
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) {
      toast.error('Faça login para avaliar');
      navigate('/auth');
      return;
    }

    if (!show) return;

    const { error } = await supabase
      .from('ratings')
      .upsert({ 
        user_id: user.id, 
        movie_id: `tv-${show.id}`, 
        rating,
        updated_at: new Date().toISOString()
      });

    if (!error) {
      setUserRating(rating);
      toast.success('Avaliação salva!');
    }
  };

  const getTrailerKey = () => {
    if (!show?.videos?.results) return null;
    const trailer = show.videos.results.find(
      v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    return trailer?.key || show.videos.results[0]?.key;
  };

  const trailerKey = getTrailerKey();
  const videoSources = getVideoSources();

  if (loading || !show) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const genres = show.genres?.map(g => g.name) || (show.genre_ids ? getGenreNames(show.genre_ids) : []);
  const cast = show.credits?.cast.slice(0, 6) || [];
  const seasons = show.seasons?.filter(s => s.season_number > 0) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Player Modal */}
      {showPlayer && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between p-4 bg-card flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleClosePlayer}
                className="text-foreground hover:text-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <span className="font-display text-lg text-foreground">
                {show.name} - T{selectedSeason} E{selectedEpisode}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Subtitles className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Legendas PT</span>
              </div>
              
              {/* Server selector with scroll */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollServers('left')}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div 
                  ref={serverScrollRef}
                  className="flex gap-1 overflow-x-auto scrollbar-hide max-w-[400px]"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {videoSources.map((source) => (
                    <button
                      key={source.id}
                      onClick={() => setPlayerSource(source.id)}
                      className={`px-3 py-1 text-xs rounded whitespace-nowrap flex-shrink-0 ${
                        playerSource === source.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {source.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => scrollServers('right')}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <iframe
              src={videoSources.find(s => s.id === playerSource)?.url || videoSources[0].url}
              title={show.name}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
            />
          </div>
        </div>
      )}

      {/* Trailer Modal */}
      {showTrailer && trailerKey && (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
          <button 
            onClick={() => setShowTrailer(false)}
            className="absolute top-6 right-6 text-foreground hover:text-primary transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="w-full max-w-5xl aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
              title={show.name}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[70vh] w-full overflow-hidden pt-20">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${getBackdropUrl(show.backdrop_path) || getImageUrl(show.poster_path)})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-hero-bottom" />
        <div className="absolute inset-0 bg-background/40" />

        <div className="relative h-full container mx-auto px-4 flex items-center py-16">
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start animate-slide-up">
            <div className="flex-shrink-0">
              <img 
                src={getImageUrl(show.poster_path, 'w500')} 
                alt={show.name}
                className="w-64 rounded-lg shadow-card"
              />
            </div>

            <div className="flex-1 max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Tv className="w-5 h-5 text-primary" />
                <span className="text-primary font-medium">Série</span>
              </div>

              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-1 bg-primary/20 text-primary px-3 py-1 rounded-full">
                  <Star className="w-4 h-4 fill-primary" />
                  <span className="font-semibold">{show.vote_average?.toFixed(1)}</span>
                </div>
                {show.first_air_date && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(show.first_air_date).getFullYear()}</span>
                  </div>
                )}
                {show.number_of_seasons && (
                  <span className="text-muted-foreground">
                    {show.number_of_seasons} Temporadas
                  </span>
                )}
                <div className="flex items-center gap-1 bg-accent/20 text-accent px-3 py-1 rounded-full">
                  <Coins className="w-4 h-4" />
                  <span className="font-semibold">{EPISODE_COST} moedas/ep</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4">
                {(show.name || '').toUpperCase()}
              </h1>

              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {genres.map((g) => (
                    <span 
                      key={g} 
                      className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <div className="mb-6 p-4 bg-card rounded-lg">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Sua avaliação</p>
                    <RatingStars 
                      rating={userRating || 0} 
                      onRate={handleRating}
                      interactive={!!user}
                    />
                  </div>
                  {averageRating && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Avaliação dos usuários</p>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-primary text-primary" />
                        <span className="text-xl font-bold text-foreground">{averageRating}</span>
                        <span className="text-sm text-muted-foreground">({ratingCount} votos)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-lg text-foreground/80 mb-6 line-clamp-3">
                {show.overview || 'Descrição não disponível.'}
              </p>

              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="hero" 
                  size="xl" 
                  onClick={() => handleWatchEpisode(selectedEpisode)}
                >
                  <Play className="w-5 h-5 fill-primary-foreground" />
                  Assistir ({EPISODE_COST} moedas)
                </Button>
                {trailerKey && (
                  <Button 
                    variant="hero-outline" 
                    size="xl"
                    onClick={() => setShowTrailer(true)}
                  >
                    <Tv className="w-5 h-5" />
                    Trailer
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="xl"
                  onClick={handleDownload}
                >
                  <Download className="w-5 h-5" />
                  Baixar
                </Button>
                <Button 
                  variant={isFavorite ? "default" : "outline"} 
                  size="xl"
                  onClick={toggleFavorite}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Season & Episode Selector */}
      <section className="py-8 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display text-foreground mb-4">EPISÓDIOS</h2>
          
          <div className="flex gap-4 mb-6">
            <Select value={selectedSeason.toString()} onValueChange={(v) => setSelectedSeason(parseInt(v))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Temporada" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.season_number.toString()}>
                    Temporada {season.season_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {episodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => handleWatchEpisode(episode.episode_number)}
                className={`flex gap-4 p-4 rounded-lg transition-colors text-left ${
                  selectedEpisode === episode.episode_number 
                    ? 'bg-primary/20 border border-primary' 
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <div className="w-40 h-24 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                  {episode.still_path ? (
                    <img 
                      src={getImageUrl(episode.still_path, 'w300')}
                      alt={episode.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tv className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-primary font-medium">E{episode.episode_number}</span>
                    <h3 className="font-medium text-foreground">{episode.name}</h3>
                    <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      {EPISODE_COST}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{episode.overview}</p>
                  {episode.runtime && (
                    <span className="text-xs text-muted-foreground mt-2 block">{episode.runtime} min</span>
                  )}
                </div>
                <Play className="w-8 h-8 text-primary flex-shrink-0 self-center" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Cast */}
      {cast.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-display text-foreground mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              ELENCO
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {cast.map((actor) => (
                <div key={actor.id} className="text-center">
                  <div className="aspect-square rounded-full overflow-hidden mb-2 bg-secondary">
                    <img 
                      src={actor.profile_path ? getImageUrl(actor.profile_path, 'w200') : '/placeholder.svg'}
                      alt={actor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{actor.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Comments Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Comments mediaId={`tv-${show.id}`} mediaType="tv" />
        </div>
      </section>

      {/* Download Modal */}
      {show && (
        <DownloadModal
          isOpen={showDownload}
          onClose={() => setShowDownload(false)}
          mediaId={show.id}
          mediaType="tv"
          mediaTitle={show.name || ''}
          season={selectedSeason}
          episode={selectedEpisode}
        />
      )}
    </div>
  );
}
