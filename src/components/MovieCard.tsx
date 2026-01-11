import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Star, Tv, Download } from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  poster_url: string | null;
  release_year: number | null;
  rating: number | null;
  genre: string[] | null;
  isTV?: boolean;
}

interface MovieCardProps {
  movie: Movie;
  index?: number;
  isTV?: boolean;
  showDownload?: boolean;
}

export default function MovieCard({ movie, index = 0, isTV = false, showDownload = false }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    const path = isTV || movie.isTV ? `/tv/${movie.id}` : `/movie/${movie.id}`;
    navigate(path);
  };

  return (
    <div
      className="relative group cursor-pointer movie-card"
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted shadow-soft">
        {/* Loading shimmer */}
        {!imageLoaded && (
          <div className="absolute inset-0 shimmer" />
        )}
        
        <img
          src={movie.poster_url || '/placeholder.svg'}
          alt={movie.title}
          className={`w-full h-full object-cover transition-all duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${isHovered ? 'scale-110' : 'scale-100'}`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          {movie.rating && movie.rating > 0 && (
            <div className="flex items-center gap-1 bg-background/90 backdrop-blur-sm text-foreground px-2 py-1 rounded-lg">
              <Star className="w-3 h-3 text-primary fill-primary" />
              <span className="text-xs font-semibold">{movie.rating.toFixed(1)}</span>
            </div>
          )}
          
          {(isTV || movie.isTV) && (
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg ml-auto">
              <Tv className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Download icon (like in the reference) */}
        {showDownload && (
          <button 
            className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              // Handle download
            }}
          >
            <Download className="w-4 h-4 text-foreground" />
          </button>
        )}

        {/* Hover overlay */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent transition-opacity duration-300 flex items-end ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="p-3 w-full">
            {/* Play button */}
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-glow">
                <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title and meta below card */}
      <div className="mt-2 px-1">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1">
          {movie.title}
        </h3>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          {(isTV || movie.isTV) && <Tv className="w-3 h-3" />}
          {movie.release_year && <span>{movie.release_year}</span>}
          {movie.genre && movie.genre[0] && (
            <>
              <span>•</span>
              <span className="line-clamp-1">{movie.genre[0]}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
