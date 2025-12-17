import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import MovieRow from '@/components/MovieRow';
import CategorySection from '@/components/CategorySection';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { tmdbApi, TMDBMovie, getImageUrl, getBackdropUrl, getGenreNames } from '@/lib/tmdb';
import { toast } from 'sonner';

export default function Index() {
  const [trending, setTrending] = useState<TMDBMovie[]>([]);
  const [popular, setPopular] = useState<TMDBMovie[]>([]);
  const [topRated, setTopRated] = useState<TMDBMovie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<TMDBMovie[]>([]);
  const [upcoming, setUpcoming] = useState<TMDBMovie[]>([]);
  const [actionMovies, setActionMovies] = useState<TMDBMovie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<TMDBMovie[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<TMDBMovie[]>([]);
  const [scifiMovies, setScifiMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMovies = useCallback(async () => {
    try {
      const [
        trendingData,
        popularData,
        topRatedData,
        nowPlayingData,
        upcomingData,
        actionData,
        comedyData,
        horrorData,
        scifiData
      ] = await Promise.all([
        tmdbApi.getTrending(),
        tmdbApi.getPopular(),
        tmdbApi.getTopRated(),
        tmdbApi.getNowPlaying(),
        tmdbApi.getUpcoming(),
        tmdbApi.getByGenre(28), // Action
        tmdbApi.getByGenre(35), // Comedy
        tmdbApi.getByGenre(27), // Horror
        tmdbApi.getByGenre(878), // Sci-Fi
      ]);

      setTrending(trendingData);
      setPopular(popularData.movies);
      setTopRated(topRatedData.movies);
      setNowPlaying(nowPlayingData.movies);
      setUpcoming(upcomingData.movies);
      setActionMovies(actionData.movies);
      setComedyMovies(comedyData.movies);
      setHorrorMovies(horrorData.movies);
      setScifiMovies(scifiData.movies);
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Erro ao carregar filmes. Verifique a API key do TMDB.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const transformMovie = (movie: TMDBMovie) => ({
    id: movie.id.toString(),
    title: movie.title,
    poster_url: getImageUrl(movie.poster_path),
    backdrop_url: getBackdropUrl(movie.backdrop_path),
    release_year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
    rating: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : null,
    genre: movie.genre_ids ? getGenreNames(movie.genre_ids) : [],
    description: movie.overview,
    duration_minutes: movie.runtime || null,
  });

  const featuredMovie = trending[0] ? transformMovie(trending[0]) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20">
          <Skeleton className="h-[85vh] w-full" />
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      {featuredMovie && <HeroSection movie={featuredMovie} />}

      {/* Movie Rows */}
      <div className="-mt-20 relative z-10">
        <MovieRow 
          title="Em Alta Agora" 
          movies={trending.slice(0, 10).map(transformMovie)} 
        />
        
        <MovieRow 
          title="Populares" 
          movies={popular.slice(0, 10).map(transformMovie)} 
        />

        <MovieRow 
          title="Mais Bem Avaliados" 
          movies={topRated.slice(0, 10).map(transformMovie)} 
        />

        <MovieRow 
          title="Em Cartaz" 
          movies={nowPlaying.slice(0, 10).map(transformMovie)} 
        />

        <MovieRow 
          title="Em Breve" 
          movies={upcoming.slice(0, 10).map(transformMovie)} 
        />

        <CategorySection />

        <MovieRow 
          title="Ação" 
          movies={actionMovies.slice(0, 10).map(transformMovie)} 
        />

        <MovieRow 
          title="Comédia" 
          movies={comedyMovies.slice(0, 10).map(transformMovie)} 
        />

        <MovieRow 
          title="Terror" 
          movies={horrorMovies.slice(0, 10).map(transformMovie)} 
        />

        <MovieRow 
          title="Ficção Científica" 
          movies={scifiMovies.slice(0, 10).map(transformMovie)} 
        />
      </div>

      {/* Footer */}
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
