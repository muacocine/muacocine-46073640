// TMDB API Edge Function

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('TMDB_API_KEY');
    if (!apiKey) {
      console.error('TMDB_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'TMDB API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, params } = await req.json();
    console.log('TMDB Action:', action, 'Params:', params);

    let url = '';
    const language = 'pt-BR';

    switch (action) {
      case 'discover':
        const { page = 1, genre, sortBy = 'popularity.desc' } = params || {};
        url = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&language=${language}&sort_by=${sortBy}&include_adult=false&include_video=true&page=${page}${genre ? `&with_genres=${genre}` : ''}`;
        break;

      case 'trending':
        url = `${TMDB_BASE_URL}/trending/movie/week?api_key=${apiKey}&language=${language}`;
        break;

      case 'trending_tv':
        url = `${TMDB_BASE_URL}/trending/tv/week?api_key=${apiKey}&language=${language}`;
        break;

      case 'popular':
        const popularPage = params?.page || 1;
        url = `${TMDB_BASE_URL}/movie/popular?api_key=${apiKey}&language=${language}&page=${popularPage}`;
        break;

      case 'popular_tv':
        const popularTvPage = params?.page || 1;
        url = `${TMDB_BASE_URL}/tv/popular?api_key=${apiKey}&language=${language}&page=${popularTvPage}`;
        break;

      case 'top_rated':
        const topPage = params?.page || 1;
        url = `${TMDB_BASE_URL}/movie/top_rated?api_key=${apiKey}&language=${language}&page=${topPage}`;
        break;

      case 'top_rated_tv':
        const topTvPage = params?.page || 1;
        url = `${TMDB_BASE_URL}/tv/top_rated?api_key=${apiKey}&language=${language}&page=${topTvPage}`;
        break;

      case 'airing_today':
        const airingPage = params?.page || 1;
        url = `${TMDB_BASE_URL}/tv/airing_today?api_key=${apiKey}&language=${language}&page=${airingPage}`;
        break;

      case 'now_playing':
        const nowPage = params?.page || 1;
        url = `${TMDB_BASE_URL}/movie/now_playing?api_key=${apiKey}&language=${language}&page=${nowPage}`;
        break;

      case 'upcoming':
        const upcomingPage = params?.page || 1;
        url = `${TMDB_BASE_URL}/movie/upcoming?api_key=${apiKey}&language=${language}&page=${upcomingPage}`;
        break;

      case 'movie_details':
        const { movieId } = params;
        url = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${apiKey}&language=${language}&append_to_response=videos,credits,similar`;
        break;

      case 'tv_details':
        const { tvId } = params;
        url = `${TMDB_BASE_URL}/tv/${tvId}?api_key=${apiKey}&language=${language}&append_to_response=videos,credits,similar`;
        break;

      case 'tv_season':
        const { tvId: showId, seasonNumber } = params;
        url = `${TMDB_BASE_URL}/tv/${showId}/season/${seasonNumber}?api_key=${apiKey}&language=${language}`;
        break;

      case 'search':
        const { query, searchPage = 1 } = params;
        url = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&language=${language}&query=${encodeURIComponent(query)}&page=${searchPage}&include_adult=false`;
        break;

      case 'search_tv':
        const { query: tvQuery, searchPage: tvSearchPage = 1 } = params;
        url = `${TMDB_BASE_URL}/search/tv?api_key=${apiKey}&language=${language}&query=${encodeURIComponent(tvQuery)}&page=${tvSearchPage}&include_adult=false`;
        break;

      case 'genres':
        url = `${TMDB_BASE_URL}/genre/movie/list?api_key=${apiKey}&language=${language}`;
        break;

      case 'by_genre':
        const { genreId, genrePage = 1 } = params;
        url = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&language=${language}&with_genres=${genreId}&sort_by=popularity.desc&page=${genrePage}`;
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('Fetching TMDB URL:', url.replace(apiKey, '[HIDDEN]'));
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('TMDB API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.status_message || 'TMDB API error' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...data,
        image_base: TMDB_IMAGE_BASE
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch from TMDB';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
