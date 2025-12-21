import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import MovieRow from '@/components/MovieRow';
import CategorySection from '@/components/CategorySection';
import CreatorBanner from '@/components/CreatorBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { tmdbApi, TMDBMovie, getImageUrl, getBackdropUrl, getGenreNames } from '@/lib/tmdb';
import { toast } from 'sonner';
import { Instagram, Heart } from 'lucide-react';

export default function Index() {
  const [trending, setTrending] = useState<TMDBMovie[]>([]);
  const [popular, setPopular] = useState<TMDBMovie[]>([]);
  const [topRated, setTopRated] = useState<TMDBMovie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<TMDBMovie[]>([]);
  const [upcoming, setUpcoming] = useState<TMDBMovie[]>([]);
  const [trendingTV, setTrendingTV] = useState<TMDBMovie[]>([]);
  const [popularTV, setPopularTV] = useState<TMDBMovie[]>([]);
  const [actionMovies, setActionMovies] = useState<TMDBMovie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<TMDBMovie[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<TMDBMovie[]>([]);
  const [scifiMovies, setScifiMovies] = useState<TMDBMovie[]>([]);
  const [dramaMovies, setDramaMovies] = useState<TMDBMovie[]>([]);
  const [romanceMovies, setRomanceMovies] = useState<TMDBMovie[]>([]);
  const [animationMovies, setAnimationMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMovies = useCallback(async () => {
    try {
      // Fetch many pages to get maximum content
      const fetchPages = async (fetchFn: (page: number) => Promise<any>, pages: number[]) => {
        const results = await Promise.all(pages.map(page => fetchFn(page)));
        return results.flatMap(r => r.movies || r || []);
      };

      const [
        trendingData,
        popularMovies,
        topRatedMovies,
        nowPlayingMovies,
        upcomingMovies,
        trendingTVData,
        popularTVMovies,
        topRatedTVMovies,
        actionMovies,
        comedyMoviesData,
        horrorMoviesData,
        scifiMoviesData,
        dramaMoviesData,
        romanceMoviesData,
        animationMoviesData,
        thrillerMoviesData,
        adventureMoviesData,
        fantasyMoviesData,
        crimeMoviesData,
        documentaryMoviesData,
      ] = await Promise.all([
        tmdbApi.getTrending(),
        fetchPages(tmdbApi.getPopular, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        fetchPages(tmdbApi.getTopRated, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        fetchPages(tmdbApi.getNowPlaying, [1, 2, 3, 4, 5]),
        fetchPages(tmdbApi.getUpcoming, [1, 2, 3, 4, 5]),
        tmdbApi.getTrendingTV(),
        fetchPages(tmdbApi.getPopularTV, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        fetchPages(tmdbApi.getTopRatedTV, [1, 2, 3, 4, 5]),
        fetchPages((p) => tmdbApi.getByGenre(28, p), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        fetchPages((p) => tmdbApi.getByGenre(35, p), [1, 2, 3, 4, 5, 6, 7, 8]),
        fetchPages((p) => tmdbApi.getByGenre(27, p), [1, 2, 3, 4, 5, 6, 7, 8]),
        fetchPages((p) => tmdbApi.getByGenre(878, p), [1, 2, 3, 4, 5, 6, 7, 8]),
        fetchPages((p) => tmdbApi.getByGenre(18, p), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        fetchPages((p) => tmdbApi.getByGenre(10749, p), [1, 2, 3, 4, 5, 6]),
        fetchPages((p) => tmdbApi.getByGenre(16, p), [1, 2, 3, 4, 5, 6, 7, 8]),
        fetchPages((p) => tmdbApi.getByGenre(53, p), [1, 2, 3, 4, 5, 6, 7, 8]),
        fetchPages((p) => tmdbApi.getByGenre(12, p), [1, 2, 3, 4, 5, 6, 7, 8]),
        fetchPages((p) => tmdbApi.getByGenre(14, p), [1, 2, 3, 4, 5, 6, 7, 8]),
        fetchPages((p) => tmdbApi.getByGenre(80, p), [1, 2, 3, 4, 5, 6]),
        fetchPages((p) => tmdbApi.getByGenre(99, p), [1, 2, 3, 4, 5]),
      ]);

      setTrending(trendingData);
      setPopular(popularMovies);
      setTopRated(topRatedMovies);
      setNowPlaying(nowPlayingMovies);
      setUpcoming(upcomingMovies);
      setTrendingTV(trendingTVData);
      setPopularTV([...popularTVMovies, ...topRatedTVMovies]);
      setActionMovies(actionMovies);
      setComedyMovies(comedyMoviesData);
      setHorrorMovies(horrorMoviesData);
      setScifiMovies(scifiMoviesData);
      setDramaMovies(dramaMoviesData);
      setRomanceMovies(romanceMoviesData);
      setAnimationMovies([...animationMoviesData, ...fantasyMoviesData]);
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Erro ao carregar conteúdo. Verifique a API key do TMDB.');
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
      
      {featuredMovie && <HeroSection movie={featuredMovie} />}

      <CreatorBanner />

      <div className="-mt-20 relative z-10">
        <MovieRow 
          title="Em Alta Agora" 
          movies={trending.slice(0, 20).map(transformMovie)} 
        />
        
        <MovieRow 
          title="Populares" 
          movies={popular.slice(0, 40).map(transformMovie)} 
        />

        {/* TV Shows Section */}
        <MovieRow 
          title="Séries em Alta"
          movies={trendingTV.slice(0, 20).map(transformTV)}
          isTV
        />

        <MovieRow 
          title="Séries Populares"
          movies={popularTV.slice(0, 40).map(transformTV)}
          isTV
        />

        <MovieRow 
          title="Mais Bem Avaliados" 
          movies={topRated.slice(0, 60).map(transformMovie)} 
        />

        <MovieRow 
          title="Em Cartaz" 
          movies={nowPlaying.slice(0, 60).map(transformMovie)} 
        />

        <CategorySection />

        <MovieRow 
          title="Em Breve" 
          movies={upcoming.slice(0, 40).map(transformMovie)} 
        />

        <MovieRow 
          title="Ação" 
          movies={actionMovies.slice(0, 60).map(transformMovie)} 
        />

        <MovieRow 
          title="Comédia" 
          movies={comedyMovies.slice(0, 40).map(transformMovie)} 
        />

        <MovieRow 
          title="Terror" 
          movies={horrorMovies.slice(0, 40).map(transformMovie)} 
        />

        <MovieRow 
          title="Ficção Científica" 
          movies={scifiMovies.slice(0, 40).map(transformMovie)} 
        />

        <MovieRow 
          title="Drama" 
          movies={dramaMovies.slice(0, 40).map(transformMovie)} 
        />

        <MovieRow 
          title="Romance" 
          movies={romanceMovies.slice(0, 20).map(transformMovie)} 
        />

        <MovieRow 
          title="Animação" 
          movies={animationMovies.slice(0, 20).map(transformMovie)} 
        />
      </div>

      <footer className="py-12 border-t border-border mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-display text-gradient-gold">MUACO CINE</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="w-4 h-4 text-primary fill-primary" />
                <span>Criado por <strong className="text-foreground">Isaac Muaco</strong></span>
              </div>
              <a 
                href="https://www.instagram.com/isaaccunhapinto_official?igsh=MnhjZmE1MGcydnBq"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Instagram className="w-4 h-4" />
                Siga no Instagram
              </a>
            </div>

            <p className="text-muted-foreground text-sm text-center md:text-right">
              © 2024 Muaco Cine. Dados fornecidos por TMDB.<br />
              +500 mil filmes e séries disponíveis.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
