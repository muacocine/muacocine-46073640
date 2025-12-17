import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import MovieCard from '@/components/MovieCard';
import RatingStars from '@/components/RatingStars';
import { tmdbApi, TMDBMovie, getImageUrl, getBackdropUrl, getGenreNames } from '@/lib/tmdb';
import { 
  Play, 
  Heart, 
  ArrowLeft, 
  Star, 
  Clock, 
  Calendar,
  X,
  Users,
  Film
} from 'lucide-react';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [movie, setMovie] = useState<TMDBMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    async function fetchMovie() {
      if (!id) return;

      try {
        const movieData = await tmdbApi.getMovieDetails(parseInt(id));
        setMovie(movieData);

        if (user) {
          const { data: fav } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('movie_id', id)
            .maybeSingle();

          setIsFavorite(!!fav);

          const { data: rating } = await supabase
            .from('ratings')
            .select('rating')
            .eq('user_id', user.id)
            .eq('movie_id', id)
            .maybeSingle();

          if (rating) setUserRating(rating.rating);
        }

        const { data: ratings } = await supabase
          .from('ratings')
          .select('rating')
          .eq('movie_id', id);

        if (ratings && ratings.length > 0) {
          const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
          setAverageRating(Math.round(avg * 10) / 10);
          setRatingCount(ratings.length);
        }
      } catch (error) {
        console.error('Error fetching movie:', error);
        toast.error('Filme não encontrado');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    fetchMovie();
  }, [id, user, navigate]);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Faça login para adicionar aos favoritos');
      navigate('/auth');
      return;
    }

    if (!movie) return;

    if (isFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movie.id.toString());

      if (!error) {
        setIsFavorite(false);
        toast.success('Removido dos favoritos');
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, movie_id: movie.id.toString() });

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

    if (!movie) return;

    const { error } = await supabase
      .from('ratings')
      .upsert({ 
        user_id: user.id, 
        movie_id: movie.id.toString(), 
        rating,
        updated_at: new Date().toISOString()
      });

    if (!error) {
      setUserRating(rating);
      toast.success('Avaliação salva!');
      
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('movie_id', movie.id.toString());

      if (ratings && ratings.length > 0) {
        const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setRatingCount(ratings.length);
      }
    }
  };

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const getTrailerKey = () => {
    if (!movie?.videos?.results) return null;
    const trailer = movie.videos.results.find(
      v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    return trailer?.key || movie.videos.results[0]?.key;
  };

  const trailerKey = getTrailerKey();

  if (loading || !movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const genres = movie.genres?.map(g => g.name) || (movie.genre_ids ? getGenreNames(movie.genre_ids) : []);
  const director = movie.credits?.crew.find(c => c.job === 'Director');
  const cast = movie.credits?.cast.slice(0, 6) || [];
  const similarMovies = movie.similar?.results.slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Full Movie Player Modal */}
      {showPlayer && (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
          <button 
            onClick={() => setShowPlayer(false)}
            className="absolute top-6 right-6 text-foreground hover:text-primary transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="w-full h-full">
            <iframe
              src={`https://vidsrc.xyz/embed/movie/${movie.id}`}
              title={movie.title}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture"
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
              title={movie.title}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[80vh] w-full overflow-hidden pt-20">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${getBackdropUrl(movie.backdrop_path) || getImageUrl(movie.poster_path)})` }}
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
                src={getImageUrl(movie.poster_path, 'w500')} 
                alt={movie.title}
                className="w-64 rounded-lg shadow-card"
              />
            </div>

            <div className="flex-1 max-w-2xl">
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-1 bg-primary/20 text-primary px-3 py-1 rounded-full">
                  <Star className="w-4 h-4 fill-primary" />
                  <span className="font-semibold">{movie.vote_average?.toFixed(1)}</span>
                </div>
                {movie.release_date && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>
                )}
                {movie.runtime && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(movie.runtime)}</span>
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-6xl font-display text-foreground mb-4">
                {movie.title.toUpperCase()}
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

              <p className="text-lg text-foreground/80 mb-6">
                {movie.overview || 'Descrição não disponível.'}
              </p>

              {director && (
                <p className="text-muted-foreground mb-6">
                  <span className="text-foreground font-medium">Diretor:</span> {director.name}
                </p>
              )}

              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="hero" 
                  size="xl" 
                  onClick={() => setShowPlayer(true)}
                >
                  <Play className="w-5 h-5 fill-primary-foreground" />
                  Assistir Filme
                </Button>
                {trailerKey && (
                  <Button 
                    variant="hero-outline" 
                    size="xl"
                    onClick={() => setShowTrailer(true)}
                  >
                    <Film className="w-5 h-5" />
                    Ver Trailer
                  </Button>
                )}
                <Button 
                  variant={isFavorite ? "default" : "outline"} 
                  size="xl"
                  onClick={toggleFavorite}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Favoritado' : 'Favoritar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {similarMovies.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-display text-foreground mb-6">
              FILMES SEMELHANTES
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similarMovies.map((m, index) => (
                <MovieCard 
                  key={m.id} 
                  movie={{
                    id: m.id.toString(),
                    title: m.title,
                    poster_url: getImageUrl(m.poster_path),
                    release_year: m.release_date ? new Date(m.release_date).getFullYear() : null,
                    rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
                    genre: m.genre_ids ? getGenreNames(m.genre_ids) : [],
                  }} 
                  index={index} 
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
