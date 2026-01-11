import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Tv, Flame } from 'lucide-react';
import MovieCard from './MovieCard';

interface Movie {
  id: string;
  title: string;
  poster_url: string | null;
  release_year: number | null;
  rating: number | null;
  genre: string[] | null;
  isTV?: boolean;
}

interface MovieRowProps {
  title: string;
  movies: Movie[];
  isTV?: boolean;
  showTrending?: boolean;
  onViewAll?: () => void;
}

export default function MovieRow({ title, movies, isTV = false, showTrending = false, onViewAll }: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  if (movies.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.offsetWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-4 md:py-6">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {showTrending && <Flame className="w-5 h-5 text-primary" />}
            {isTV && <Tv className="w-5 h-5 text-primary" />}
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              {title}
            </h2>
          </div>
          
          <button 
            onClick={onViewAll}
            className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
          >
            Todos
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable row with navigation */}
        <div className="relative group">
          {/* Left scroll button */}
          <button
            onClick={() => scroll('left')}
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/95 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right scroll button */}
          <button
            onClick={() => scroll('right')}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/95 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Movies scroll container */}
          <div 
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
          >
            {movies.slice(0, 20).map((movie, index) => (
              <div 
                key={movie.id} 
                className="flex-shrink-0 w-[140px] sm:w-[150px] md:w-[160px] lg:w-[170px]"
              >
                <MovieCard 
                  movie={movie} 
                  index={index} 
                  isTV={isTV || movie.isTV}
                  showDownload
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
