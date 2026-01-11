import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import HeroSection from '@/components/HeroSection';
import MovieRow from '@/components/MovieRow';
import CategoryPills from '@/components/CategoryPills';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { tmdbApi, TMDBMovie, getImageUrl, getBackdropUrl, getGenreNames } from '@/lib/tmdb';
import { toast } from 'sonner';
import { Instagram, Heart, Flame, Tv, Film, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Tendendo', 'Filme', 'TV', 'Anime', 'Ação', 'Drama', 'Comédia'];

export default function Index() {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<TMDBMovie[]>([]);
  const [popular, setPopular] = useState<TMDBMovie[]>([]);
  const [topRated, setTopRated] = useState<TMDBMovie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<TMDBMovie[]>([]);
  const [trendingTV, setTrendingTV] = useState<TMDBMovie[]>([]);
  const [popularTV, setPopularTV] = useState<TMDBMovie[]>([]);
  const [actionMovies, setActionMovies] = useState<TMDBMovie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<TMDBMovie[]>([]);
  const [dramaMovies, setDramaMovies] = useState<TMDBMovie[]>([]);
  const [animationMovies, setAnimationMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tendendo');
  const { user } = useAuth();

  const fetchMovies = useCallback(async () => {
    try {
      const fetchPages = async (fetchFn: (page: number) => Promise<any>, pages: number[]) => {
        const results = await Promise.all(pages.map(page => fetchFn(page)));
        return results.flatMap(r => r.movies || r || []);
      };

      const [
        trendingData,
        popularMovies,
        topRatedMovies,
        nowPlayingMovies,
        trendingTVData,
        popularTVMovies,
        actionMoviesData,
        comedyMoviesData,
        dramaMoviesData,
        animationMoviesData,
      ] = await Promise.all([
        tmdbApi.getTrending(),
        fetchPages(tmdbApi.getPopular, [1, 2, 3, 4, 5]),
        fetchPages(tmdbApi.getTopRated, [1, 2, 3, 4, 5]),
        fetchPages(tmdbApi.getNowPlaying, [1, 2, 3]),
        tmdbApi.getTrendingTV(),
        fetchPages(tmdbApi.getPopularTV, [1, 2, 3, 4, 5]),
        fetchPages((p) => tmdbApi.getByGenre(28, p), [1, 2, 3, 4, 5]),
        fetchPages((p) => tmdbApi.getByGenre(35, p), [1, 2, 3, 4]),
        fetchPages((p) => tmdbApi.getByGenre(18, p), [1, 2, 3, 4, 5]),
        fetchPages((p) => tmdbApi.getByGenre(16, p), [1, 2, 3, 4]),
      ]);

      setTrending(trendingData);
      setPopular(popularMovies);
      setTopRated(topRatedMovies);
      setNowPlaying(nowPlayingMovies);
      setTrendingTV(trendingTVData);
      setPopularTV(popularTVMovies);
      setActionMovies(actionMoviesData);
      setComedyMovies(comedyMoviesData);
      setDramaMovies(dramaMoviesData);
      setAnimationMovies(animationMoviesData);
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Erro ao carregar conteúdo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const transformMovie = (movie: TMDBMovie) => ({
    id: movie.id.toString(),
    title: movie.title || movie.name || '',
    poster_url: getImageUrl(movie.poster_path),
    backdrop_url: getBackdropUrl(movie.backdrop_path),
    release_year: (movie.release_date || movie.first_air_date) 
      ? new Date(movie.release_date || movie.first_air_date || '').getFullYear() 
      : null,
    rating: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : null,
    genre: movie.genre_ids ? getGenreNames(movie.genre_ids) : [],
    description: movie.overview,
    duration_minutes: movie.runtime || null,
  });

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

  const featuredMovie = trending[0] ? transformMovie(trending[0]) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16">
          <Skeleton className="h-[50vh] w-full" />
          <div className="container mx-auto px-4 py-6">
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
              ))}
            </div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="flex gap-3 overflow-x-auto">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="w-[150px] aspect-[2/3] rounded-xl flex-shrink-0" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />
      
      <main className="pt-16">
        {/* Hero Section */}
        {featuredMovie && <HeroSection movie={featuredMovie} />}

        {/* Category Pills */}
        <div className="container mx-auto px-4 py-4">
          <CategoryPills 
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Content Rows */}
        <MovieRow 
          title="Trending Now 🔥" 
          movies={trending.slice(0, 20).map(transformMovie)} 
          showTrending
        />
        
        <MovieRow 
          title="Populares" 
          movies={popular.slice(0, 20).map(transformMovie)} 
        />

        <MovieRow 
          title="Séries em Alta"
          movies={trendingTV.slice(0, 20).map(transformTV)}
          isTV
        />

        <MovieRow 
          title="Séries Populares"
          movies={popularTV.slice(0, 20).map(transformTV)}
          isTV
        />

        <MovieRow 
          title="Mais Bem Avaliados" 
          movies={topRated.slice(0, 20).map(transformMovie)} 
        />

        <MovieRow 
          title="Em Cartaz" 
          movies={nowPlaying.slice(0, 20).map(transformMovie)} 
        />

        <MovieRow 
          title="Ação" 
          movies={actionMovies.slice(0, 20).map(transformMovie)} 
        />

        <MovieRow 
          title="Comédia" 
          movies={comedyMovies.slice(0, 20).map(transformMovie)} 
        />

        <MovieRow 
          title="Drama" 
          movies={dramaMovies.slice(0, 20).map(transformMovie)} 
        />

        <MovieRow 
          title="Animação" 
          movies={animationMovies.slice(0, 20).map(transformMovie)} 
        />

        {/* Footer */}
        <footer className="py-8 border-t border-border mt-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Muaco Cine" className="w-8 h-8" />
                <span className="text-lg font-bold text-gradient">MUACO CINE</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Heart className="w-4 h-4 text-primary fill-primary" />
                <span>Criado por <strong className="text-foreground">Isaac Muaco</strong></span>
              </div>
              
              <a 
                href="https://www.instagram.com/isaaccunhapinto_official"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline text-sm"
              >
                <Instagram className="w-4 h-4" />
                @isaaccunhapinto_official
              </a>

              <p className="text-muted-foreground text-xs">
                © 2024 Muaco Cine. Dados TMDB.
              </p>
            </div>
          </div>
        </footer>
      </main>

      <BottomNav />
    </div>
  );
}
