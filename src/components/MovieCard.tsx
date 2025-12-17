import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Star, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Movie {
  id: string;
  title: string;
  poster_url: string | null;
  release_year: number | null;
  rating: number | null;
  genre: string[] | null;
}

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

export default function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/movie/${movie.id}`);
  };

  return (
    <div
      className="relative group cursor-pointer animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Card */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-card transition-all duration-300 group-hover:scale-105 group-hover:shadow-gold">
        {/* Poster */}
        <img
          src={movie.poster_url || '/placeholder.svg'}
          alt={movie.title}
          className="w-full h-full object-cover"
        />

        {/* Rating Badge */}
        {movie.rating && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-background/80 backdrop-blur-sm text-primary px-2 py-1 rounded-md">
            <Star className="w-3 h-3 fill-primary" />
            <span className="text-xs font-semibold">{movie.rating}</span>
          </div>
        )}

        {/* Hover Overlay */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display text-xl text-foreground mb-1 line-clamp-2">
              {movie.title.toUpperCase()}
            </h3>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              {movie.release_year && <span>{movie.release_year}</span>}
              {movie.genre && movie.genre[0] && (
                <>
                  <span>•</span>
                  <span>{movie.genre[0]}</span>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-9">
                <Play className="w-4 h-4 fill-primary-foreground" />
                Assistir
              </Button>
              <Button 
                size="icon" 
                variant="outline" 
                className="h-9 w-9"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/movie/${movie.id}`);
                }}
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
