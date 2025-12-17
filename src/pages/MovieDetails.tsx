import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import VideoPlayer from '@/components/VideoPlayer';
import MovieCard from '@/components/MovieCard';
import { 
  Play, 
  Heart, 
  ArrowLeft, 
  Star, 
  Clock, 
  Calendar,
  X
} from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  rating: number | null;
  genre: string[] | null;
  video_url: string | null;
}

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    async function fetchMovie() {
      if (!id) return;

      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        toast.error('Filme não encontrado');
        navigate('/');
        return;
      }

      setMovie(data);

      // Fetch related movies by genre
      if (data.genre && data.genre.length > 0) {
        const { data: related } = await supabase
          .from('movies')
          .select('*')
          .contains('genre', [data.genre[0]])
          .neq('id', id)
          .limit(6);

        if (related) setRelatedMovies(related);
      }

      // Check if favorite
      if (user) {
        const { data: fav } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('movie_id', id)
          .maybeSingle();

        setIsFavorite(!!fav);
      }

      setLoading(false);
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
        .eq('movie_id', movie.id);

      if (!error) {
        setIsFavorite(false);
        toast.success('Removido dos favoritos');
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, movie_id: movie.id });

      if (!error) {
        setIsFavorite(true);
        toast.success('Adicionado aos favoritos');
      }
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  if (loading || !movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Video Player Modal */}
      {showPlayer && (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center">
          <button 
            onClick={() => setShowPlayer(false)}
            className="absolute top-6 right-6 text-foreground hover:text-primary transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="w-full max-w-5xl px-4">
            <VideoPlayer 
              videoUrl={movie.video_url} 
              posterUrl={movie.backdrop_url}
              title={movie.title}
            />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[70vh] w-full overflow-hidden pt-20">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${movie.backdrop_url || movie.poster_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-hero-bottom" />
        <div className="absolute inset-0 bg-background/40" />

        <div className="relative h-full container mx-auto px-4 flex items-center py-16">
          {/* Back button */}
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start animate-slide-up">
            {/* Poster */}
            <div className="flex-shrink-0">
              <img 
                src={movie.poster_url || '/placeholder.svg'} 
                alt={movie.title}
                className="w-64 rounded-lg shadow-card"
              />
            </div>

            {/* Info */}
            <div className="flex-1 max-w-2xl">
              {/* Metadata */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                {movie.rating && (
                  <div className="flex items-center gap-1 bg-primary/20 text-primary px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-primary" />
                    <span className="font-semibold">{movie.rating}</span>
                  </div>
                )}
                {movie.release_year && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{movie.release_year}</span>
                  </div>
                )}
                {movie.duration_minutes && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(movie.duration_minutes)}</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-display text-foreground mb-4">
                {movie.title.toUpperCase()}
              </h1>

              {/* Genres */}
              {movie.genre && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.genre.map((g) => (
                    <span 
                      key={g} 
                      className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <p className="text-lg text-foreground/80 mb-8">
                {movie.description}
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button variant="hero" size="xl" onClick={() => setShowPlayer(true)}>
                  <Play className="w-5 h-5 fill-primary-foreground" />
                  Assistir Agora
                </Button>
                <Button 
                  variant={isFavorite ? "default" : "hero-outline"} 
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

      {/* Related Movies */}
      {relatedMovies.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-display text-foreground mb-6">
              FILMES RELACIONADOS
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedMovies.map((m, index) => (
                <MovieCard key={m.id} movie={m} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
