import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import MovieCard from '@/components/MovieCard';
import { Button } from '@/components/ui/button';
import { Heart, Film } from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  poster_url: string | null;
  release_year: number | null;
  rating: number | null;
  genre: string[] | null;
}

export default function Favorites() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    async function fetchFavorites() {
      if (!user) return;

      const { data: favorites, error } = await supabase
        .from('favorites')
        .select('movie_id')
        .eq('user_id', user.id);

      if (error || !favorites || favorites.length === 0) {
        setLoading(false);
        return;
      }

      const movieIds = favorites.map(f => f.movie_id);
      
      const { data: moviesData } = await supabase
        .from('movies')
        .select('*')
        .in('id', movieIds);

      if (moviesData) {
        setMovies(moviesData);
      }
      setLoading(false);
    }

    if (user) {
      fetchFavorites();
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-primary fill-primary" />
          <h1 className="text-4xl font-display text-foreground">MEUS FAVORITOS</h1>
        </div>

        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Film className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-display text-foreground mb-2">NENHUM FAVORITO AINDA</h2>
            <p className="text-muted-foreground mb-6">Comece a adicionar filmes à sua lista!</p>
            <Button onClick={() => navigate('/')}>
              Explorar Filmes
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie, index) => (
              <MovieCard key={movie.id} movie={movie} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
