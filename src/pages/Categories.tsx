import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tmdbApi, TMDBMovie, TMDBGenre, getImageUrl, getGenreNames } from '@/lib/tmdb';
import Navbar from '@/components/Navbar';
import MovieCard from '@/components/MovieCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ChevronLeft, ChevronRight, Filter, X, Film, Tv, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

export default function Categories() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [tvShows, setTVShows] = useState<TMDBMovie[]>([]);
  const [genres, setGenres] = useState<TMDBGenre[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>(
    (searchParams.get('type') as 'movie' | 'tv') || 'movie'
  );
  const [selectedGenre, setSelectedGenre] = useState<string>(
    searchParams.get('genre') || 'all'
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    searchParams.get('year') || 'all'
  );
  const [minRating, setMinRating] = useState<number>(
    Number(searchParams.get('rating')) || 0
  );
  const [showFilters, setShowFilters] = useState(false);

  // Fetch genres
  useEffect(() => {
    tmdbApi.getGenres().then(setGenres).catch(console.error);
  }, []);

  // Fetch content with filters
  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      let allResults: TMDBMovie[] = [];
      let maxPages = 1;

      if (selectedGenre !== 'all') {
        const data = await tmdbApi.getByGenre(parseInt(selectedGenre), page);
        allResults = data.movies;
        maxPages = Math.min(data.totalPages, 100);
      } else {
        if (mediaType === 'movie') {
          const data = await tmdbApi.getPopular(page);
          allResults = data.movies;
          maxPages = Math.min(data.totalPages, 100);
        } else {
          const data = await tmdbApi.getPopularTV(page);
          allResults = data.movies;
          maxPages = Math.min(data.totalPages, 100);
        }
      }

      // Apply client-side filters
      let filtered = allResults;

      if (selectedYear !== 'all') {
        filtered = filtered.filter(item => {
          const date = mediaType === 'movie' ? item.release_date : item.first_air_date;
          return date && new Date(date).getFullYear() === parseInt(selectedYear);
        });
      }

      if (minRating > 0) {
        filtered = filtered.filter(item => item.vote_average >= minRating);
      }

      if (mediaType === 'movie') {
        setMovies(filtered);
        setTVShows([]);
      } else {
        setTVShows(filtered);
        setMovies([]);
      }
      
      setTotalPages(maxPages);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }, [mediaType, selectedGenre, selectedYear, minRating, page]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (mediaType !== 'movie') params.set('type', mediaType);
    if (selectedGenre !== 'all') params.set('genre', selectedGenre);
    if (selectedYear !== 'all') params.set('year', selectedYear);
    if (minRating > 0) params.set('rating', minRating.toString());
    setSearchParams(params);
  }, [mediaType, selectedGenre, selectedYear, minRating, setSearchParams]);

  const transformItem = (item: TMDBMovie) => ({
    id: item.id.toString(),
    title: item.title || item.name || '',
    poster_url: getImageUrl(item.poster_path),
    release_year: (item.release_date || item.first_air_date) 
      ? new Date(item.release_date || item.first_air_date!).getFullYear() 
      : null,
    rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
    genre: item.genre_ids ? getGenreNames(item.genre_ids) : [],
    isTV: mediaType === 'tv',
  });

  const clearFilters = () => {
    setSelectedGenre('all');
    setSelectedYear('all');
    setMinRating(0);
    setPage(1);
  };

  const hasActiveFilters = selectedGenre !== 'all' || selectedYear !== 'all' || minRating > 0;
  const content = mediaType === 'movie' ? movies : tvShows;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-display text-foreground mb-2">
              CATEGORIAS
            </h1>
            <p className="text-muted-foreground">
              Explore milhares de filmes e séries com filtros avançados
            </p>
          </div>
          
          <Button
            variant="outline"
            className="md:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {[selectedGenre !== 'all', selectedYear !== 'all', minRating > 0].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Media Type Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={mediaType === 'movie' ? 'default' : 'outline'}
            onClick={() => { setMediaType('movie'); setPage(1); }}
            className="flex-1 md:flex-none"
          >
            <Film className="w-4 h-4 mr-2" />
            Filmes
          </Button>
          <Button
            variant={mediaType === 'tv' ? 'default' : 'outline'}
            onClick={() => { setMediaType('tv'); setPage(1); }}
            className="flex-1 md:flex-none"
          >
            <Tv className="w-4 h-4 mr-2" />
            Séries
          </Button>
        </div>

        {/* Filters */}
        <div className={`bg-card border border-border rounded-xl p-4 mb-8 transition-all ${
          showFilters ? 'block' : 'hidden md:block'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Filtros Avançados</span>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Genre Filter */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Gênero</label>
              <Select value={selectedGenre} onValueChange={(v) => { setSelectedGenre(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os gêneros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os gêneros</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre.id} value={genre.id.toString()}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Ano</label>
              <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating Filter */}
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground mb-2 block">
                Avaliação mínima: {minRating.toFixed(1)}
              </label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[minRating]}
                  onValueChange={(v) => { setMinRating(v[0]); setPage(1); }}
                  min={0}
                  max={10}
                  step={0.5}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-8">10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-20">
            <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum resultado encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros para ver mais conteúdo
            </p>
            <Button onClick={clearFilters}>Limpar Filtros</Button>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground mb-4">
              {content.length} resultados encontrados
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 mb-8">
              {content.map((item, index) => (
                <MovieCard 
                  key={item.id} 
                  movie={transformItem(item)} 
                  index={index}
                  isTV={mediaType === 'tv'}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Anterior</span>
              </Button>
              
              <div className="flex items-center gap-1">
                {page > 2 && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setPage(1)}>1</Button>
                    {page > 3 && <span className="text-muted-foreground">...</span>}
                  </>
                )}
                
                {page > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => setPage(page - 1)}>
                    {page - 1}
                  </Button>
                )}
                
                <Button variant="default" size="sm">{page}</Button>
                
                {page < totalPages && (
                  <Button variant="ghost" size="sm" onClick={() => setPage(page + 1)}>
                    {page + 1}
                  </Button>
                )}
                
                {page < totalPages - 1 && (
                  <>
                    {page < totalPages - 2 && <span className="text-muted-foreground">...</span>}
                    <Button variant="ghost" size="sm" onClick={() => setPage(totalPages)}>
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <span className="hidden sm:inline mr-1">Próxima</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
