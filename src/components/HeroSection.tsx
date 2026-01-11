import { useState, useEffect } from 'react';
import { Play, Plus, Star, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Movie {
  id: string;
  title: string;
  description: string | null;
  backdrop_url: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  rating: number | null;
  genre: string[] | null;
}

interface HeroSectionProps {
  movie: Movie;
}

export default function HeroSection({ movie }: HeroSectionProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <section className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
      {/* Background Image with gradient overlay */}
      <div className="absolute inset-0">
        {!imageLoaded && (
          <div className="w-full h-full shimmer" />
        )}
        <img
          src={movie.backdrop_url || ''}
          alt={movie.title}
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
      </div>
      
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-end pb-8 md:pb-12">
        <div className="max-w-lg animate-slide-up">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {movie.rating && (
              <div className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded-lg text-sm">
                <Star className="w-3 h-3 fill-primary" />
                <span className="font-semibold">{movie.rating}</span>
              </div>
            )}
            {movie.release_year && (
              <span className="bg-secondary/80 text-secondary-foreground px-2 py-1 rounded-lg text-sm">
                {movie.release_year}
              </span>
            )}
            {movie.duration_minutes && (
              <div className="flex items-center gap-1 bg-secondary/80 text-secondary-foreground px-2 py-1 rounded-lg text-sm">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(movie.duration_minutes)}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 leading-tight">
            {movie.title}
          </h1>

          {/* Genres */}
          {movie.genre && movie.genre.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {movie.genre.slice(0, 3).map((g) => (
                <span 
                  key={g} 
                  className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Description - hidden on mobile */}
          <p className="hidden md:block text-sm text-foreground/80 mb-4 line-clamp-2">
            {movie.description}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => navigate(`/movie/${movie.id}`)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
            >
              <Play className="w-4 h-4 mr-2 fill-primary-foreground" />
              Assistir
            </Button>
            <Button 
              variant="secondary"
              onClick={() => navigate(`/movie/${movie.id}`)}
              className="bg-secondary/80 backdrop-blur-sm"
            >
              <Info className="w-4 h-4 mr-2" />
              Detalhes
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
