import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Movie {
  id: string;
  title: string;
  poster_url: string | null;
  release_year: number | null;
  rating: number | null;
  genre: string[] | null;
}

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const searchMovies = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .or(`title.ilike.%${query}%,genre.cs.{${query}}`)
        .limit(8);

      if (!error && data) {
        setResults(data);
      }
      setLoading(false);
    };

    const debounce = setTimeout(searchMovies, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (movieId: string) => {
    navigate(`/movie/${movieId}`);
    setQuery('');
    setResults([]);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="container mx-auto px-4 pt-24">
        {/* Search Input */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Buscar filmes por título ou gênero..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-16 pl-14 pr-14 text-lg bg-secondary border-border focus:border-primary rounded-xl"
          />
          <button 
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Results */}
        <div className="max-w-4xl mx-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Nenhum filme encontrado para "{query}"</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid gap-4">
              {results.map((movie, index) => (
                <button
                  key={movie.id}
                  onClick={() => handleSelect(movie.id)}
                  className="flex items-center gap-4 p-4 bg-card rounded-lg hover:bg-secondary transition-colors text-left animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <img 
                    src={movie.poster_url || '/placeholder.svg'} 
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-display text-xl text-foreground mb-1">
                      {movie.title.toUpperCase()}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {movie.rating && (
                        <span className="flex items-center gap-1 text-primary">
                          <Star className="w-4 h-4 fill-primary" />
                          {movie.rating}
                        </span>
                      )}
                      {movie.release_year && <span>{movie.release_year}</span>}
                      {movie.genre && movie.genre[0] && (
                        <>
                          <span>•</span>
                          <span>{movie.genre.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search hints */}
          {query.length < 2 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Digite pelo menos 2 caracteres para buscar</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {['Ação', 'Drama', 'Ficção Científica', 'Thriller'].map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setQuery(genre)}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
