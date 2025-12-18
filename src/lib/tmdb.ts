import { supabase } from '@/integrations/supabase/client';

const IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
  id: number;
  title: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  videos?: {
    results: {
      key: string;
      site: string;
      type: string;
      name: string;
    }[];
  };
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string }[];
  };
  similar?: {
    results: TMDBMovie[];
  };
  seasons?: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    poster_path: string | null;
  }[];
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export const getImageUrl = (path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'original' = 'w500') => {
  if (!path) return '/placeholder.svg';
  return `${IMAGE_BASE}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null) => {
  if (!path) return null;
  return `${IMAGE_BASE}/original${path}`;
};

export const tmdbApi = {
  async getTrending(): Promise<TMDBMovie[]> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'trending' }
    });
    if (error) throw error;
    return data.results || [];
  },

  async getPopular(page = 1): Promise<{ movies: TMDBMovie[]; totalPages: number }> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'popular', params: { page } }
    });
    if (error) throw error;
    return { movies: data.results || [], totalPages: data.total_pages };
  },

  async getTopRated(page = 1): Promise<{ movies: TMDBMovie[]; totalPages: number }> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'top_rated', params: { page } }
    });
    if (error) throw error;
    return { movies: data.results || [], totalPages: data.total_pages };
  },

  async getNowPlaying(page = 1): Promise<{ movies: TMDBMovie[]; totalPages: number }> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'now_playing', params: { page } }
    });
    if (error) throw error;
    return { movies: data.results || [], totalPages: data.total_pages };
  },

  async getUpcoming(page = 1): Promise<{ movies: TMDBMovie[]; totalPages: number }> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'upcoming', params: { page } }
    });
    if (error) throw error;
    return { movies: data.results || [], totalPages: data.total_pages };
  },

  async getMovieDetails(movieId: number): Promise<TMDBMovie> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'movie_details', params: { movieId } }
    });
    if (error) throw error;
    return data;
  },

  async searchMovies(query: string, page = 1): Promise<{ movies: TMDBMovie[]; totalPages: number }> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'search', params: { query, searchPage: page } }
    });
    if (error) throw error;
    return { movies: data.results || [], totalPages: data.total_pages };
  },

  async getGenres(): Promise<TMDBGenre[]> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'genres' }
    });
    if (error) throw error;
    return data.genres || [];
  },

  async getByGenre(genreId: number, page = 1): Promise<{ movies: TMDBMovie[]; totalPages: number }> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'by_genre', params: { genreId, genrePage: page } }
    });
    if (error) throw error;
    return { movies: data.results || [], totalPages: data.total_pages };
  },

  // TV Shows
  async getTrendingTV(): Promise<TMDBMovie[]> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'trending_tv' }
    });
    if (error) throw error;
    return data.results || [];
  },

  async getPopularTV(page = 1): Promise<{ movies: TMDBMovie[]; totalPages: number }> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'popular_tv', params: { page } }
    });
    if (error) throw error;
    return { movies: data.results || [], totalPages: data.total_pages };
  },

  async getTopRatedTV(page = 1): Promise<{ movies: TMDBMovie[]; totalPages: number }> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'top_rated_tv', params: { page } }
    });
    if (error) throw error;
    return { movies: data.results || [], totalPages: data.total_pages };
  },

  async getAiringToday(page = 1): Promise<{ movies: TMDBMovie[]; totalPages: number }> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'airing_today', params: { page } }
    });
    if (error) throw error;
    return { movies: data.results || [], totalPages: data.total_pages };
  },

  async getTVDetails(tvId: number): Promise<TMDBMovie> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'tv_details', params: { tvId } }
    });
    if (error) throw error;
    return data;
  },

  async searchTVShows(query: string, page = 1): Promise<{ movies: TMDBMovie[]; totalPages: number }> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'search_tv', params: { query, searchPage: page } }
    });
    if (error) throw error;
    return { movies: data.results || [], totalPages: data.total_pages };
  },

  async getTVSeasonEpisodes(tvId: number, seasonNumber: number): Promise<any> {
    const { data, error } = await supabase.functions.invoke('tmdb-api', {
      body: { action: 'tv_season', params: { tvId, seasonNumber } }
    });
    if (error) throw error;
    return data;
  }
};

// Genre ID mapping
export const GENRE_MAP: Record<number, string> = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  14: 'Fantasia',
  36: 'História',
  27: 'Terror',
  10402: 'Música',
  9648: 'Mistério',
  10749: 'Romance',
  878: 'Ficção Científica',
  10770: 'Cinema TV',
  53: 'Thriller',
  10752: 'Guerra',
  37: 'Faroeste',
  // TV Genres
  10759: 'Ação & Aventura',
  10762: 'Kids',
  10763: 'Notícias',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasia',
  10766: 'Novela',
  10767: 'Talk Show',
  10768: 'Guerra & Política'
};

export const getGenreNames = (genreIds: number[]): string[] => {
  return genreIds.map(id => GENRE_MAP[id]).filter(Boolean);
};
