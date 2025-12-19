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
      // Fetch multiple pages to get more movies
      const [
        trendingData,
        popularData1,
        popularData2,
        popularData3,
        popularData4,
        popularData5,
        topRatedData1,
        topRatedData2,
        topRatedData3,
        nowPlayingData1,
        nowPlayingData2,
        nowPlayingData3,
        upcomingData1,
        upcomingData2,
        trendingTVData,
        popularTVData1,
        popularTVData2,
        actionData1,
        actionData2,
        actionData3,
        comedyData1,
        comedyData2,
        horrorData1,
        horrorData2,
        scifiData1,
        scifiData2,
        dramaData1,
        dramaData2,
        romanceData1,
        animationData1
      ] = await Promise.all([
        tmdbApi.getTrending(),
        tmdbApi.getPopular(1),
        tmdbApi.getPopular(2),
        tmdbApi.getPopular(3),
        tmdbApi.getPopular(4),
        tmdbApi.getPopular(5),
        tmdbApi.getTopRated(1),
        tmdbApi.getTopRated(2),
        tmdbApi.getTopRated(3),
        tmdbApi.getNowPlaying(1),
        tmdbApi.getNowPlaying(2),
        tmdbApi.getNowPlaying(3),
        tmdbApi.getUpcoming(1),
        tmdbApi.getUpcoming(2),
        tmdbApi.getTrendingTV(),
        tmdbApi.getPopularTV(1),
        tmdbApi.getPopularTV(2),
        tmdbApi.getByGenre(28, 1),
        tmdbApi.getByGenre(28, 2),
        tmdbApi.getByGenre(28, 3),
        tmdbApi.getByGenre(35, 1),
        tmdbApi.getByGenre(35, 2),
        tmdbApi.getByGenre(27, 1),
        tmdbApi.getByGenre(27, 2),
        tmdbApi.getByGenre(878, 1),
        tmdbApi.getByGenre(878, 2),
        tmdbApi.getByGenre(18, 1),
        tmdbApi.getByGenre(18, 2),
        tmdbApi.getByGenre(10749, 1),
        tmdbApi.getByGenre(16, 1),
      ]);

      setTrending(trendingData);
      setPopular([...popularData1.movies, ...popularData2.movies, ...popularData3.movies, ...popularData4.movies, ...popularData5.movies]);
      setTopRated([...topRatedData1.movies, ...topRatedData2.movies, ...topRatedData3.movies]);
      setNowPlaying([...nowPlayingData1.movies, ...nowPlayingData2.movies, ...nowPlayingData3.movies]);
      setUpcoming([...upcomingData1.movies, ...upcomingData2.movies]);
      setTrendingTV(trendingTVData);
      setPopularTV([...popularTVData1.movies, ...popularTVData2.movies]);
      setActionMovies([...actionData1.movies, ...actionData2.movies, ...actionData3.movies]);
      setComedyMovies([...comedyData1.movies, ...comedyData2.movies]);
      setHorrorMovies([...horrorData1.movies, ...horrorData2.movies]);
      setScifiMovies([...scifiData1.movies, ...scifiData2.movies]);
      setDramaMovies([...dramaData1.movies, ...dramaData2.movies]);
      setRomanceMovies(romanceData1.movies);
      setAnimationMovies(animationData1.movies);
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
