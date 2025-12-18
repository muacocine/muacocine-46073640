import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import MovieRow from '@/components/MovieRow';
import { Skeleton } from '@/components/ui/skeleton';
import { tmdbApi, TMDBMovie, getImageUrl, getBackdropUrl, getGenreNames } from '@/lib/tmdb';
import { toast } from 'sonner';
import { Tv, Play, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Series() {
  const navigate = useNavigate();
  const [trendingTV, setTrendingTV] = useState<TMDBMovie[]>([]);
  const [popularTV, setPopularTV] = useState<TMDBMovie[]>([]);
  const [topRatedTV, setTopRatedTV] = useState<TMDBMovie[]>([]);
  const [airingToday, setAiringToday] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredShow, setFeaturedShow] = useState<TMDBMovie | null>(null);

  const fetchSeries = useCallback(async () => {
    try {
      const [trendingData, popularData, topRatedData, airingData] = await Promise.all([
        tmdbApi.getTrendingTV(),
        tmdbApi.getPopularTV(),
        tmdbApi.getTopRatedTV(),
        tmdbApi.getAiringToday(),
      ]);

      setTrendingTV(trendingData);
      setPopularTV(popularData.movies);
      setTopRatedTV(topRatedData.movies);
      setAiringToday(airingData.movies);
      
      if (trendingData.length > 0) {
        setFeaturedShow(trendingData[0]);
      }
    } catch (error) {
      console.error('Error fetching series:', error);
      toast.error('Erro ao carregar séries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const transformTV = (show: TMDBMovie) => ({
    id: show.id.toString(),
    title: show.name || show.title || '',
    poster_url: getImageUrl(show.poster_path),
    backdrop_url: getBackdropUrl(show.backdrop_path),
    release_year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
    rating: show.vote_average ? Math.round(show.vote_average * 10) / 10 : null,
    genre: show.genre_ids ? getGenreNames(show.genre_ids) : [],
    description: show.overview,
    duration_minutes: null,
    isTV: true,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20">
          <Skeleton className="h-[60vh] w-full" />
          <div className="container mx-auto px-4 py-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="mb-8">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="flex gap-4 overflow-hidden">
                  {[...Array(6)].map((_, j) => (
                    <Skeleton key={j} className="w-40 h-60 flex-shrink-0 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      {featuredShow && (
        <section className="relative h-[60vh] w-full overflow-hidden pt-20">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${getBackdropUrl(featuredShow.backdrop_path)})` }}
          />
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute inset-0 bg-gradient-hero-bottom" />
          <div className="absolute inset-0 bg-background/40" />

          <div className="relative h-full container mx-auto px-4 flex items-end pb-16">
            <div className="max-w-2xl animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <Tv className="w-5 h-5 text-primary" />
                <span className="text-primary font-medium">Série em Destaque</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-display text-foreground mb-4">
                {featuredShow.name?.toUpperCase()}
              </h1>

              <div className="flex items-center gap-4 mb-4">
                {featuredShow.vote_average && (
                  <div className="flex items-center gap-1 text-primary">
                    <Star className="w-4 h-4 fill-primary" />
                    <span className="font-semibold">{featuredShow.vote_average.toFixed(1)}</span>
                  </div>
                )}
                {featuredShow.first_air_date && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(featuredShow.first_air_date).getFullYear()}</span>
                  </div>
                )}
              </div>

              <p className="text-foreground/80 mb-6 line-clamp-3">
                {featuredShow.overview}
              </p>

              <Button 
                variant="hero" 
                size="xl"
                onClick={() => navigate(`/tv/${featuredShow.id}`)}
              >
                <Play className="w-5 h-5 fill-primary-foreground" />
                Assistir Agora
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Series Rows */}
      <div className="-mt-20 relative z-10">
        <MovieRow 
          title="Séries em Alta"
          movies={trendingTV.map(transformTV)}
          isTV
        />

        <MovieRow 
          title="Populares"
          movies={popularTV.map(transformTV)}
          isTV
        />

        <MovieRow 
          title="Mais Bem Avaliadas"
          movies={topRatedTV.map(transformTV)}
          isTV
        />

        <MovieRow 
          title="No Ar Hoje"
          movies={airingToday.map(transformTV)}
          isTV
        />
      </div>

      <footer className="py-12 border-t border-border mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-display text-gradient-gold">MUACO CINE</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 Muaco Cine. Dados fornecidos por TMDB.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
