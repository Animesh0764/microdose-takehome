import time
from datetime import datetime, timezone

import requests
from django.conf import settings
from django.http import JsonResponse
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

TMDB_POPULAR_URL = 'https://api.themoviedb.org/3/movie/popular'
TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342'

_session = requests.Session()
_retry = Retry(
    total=3,
    backoff_factor=0.5,
    status_forcelist=[502, 503, 504],
    allowed_methods=['GET'],
)
_session.mount('https://', HTTPAdapter(max_retries=_retry))


def movie_view(request):
    if not settings.TMDB_API_KEY:
        return JsonResponse(
            {'error': 'TMDB_API_KEY is not configured on the server'}, status=500
        )

    fetch_started = time.perf_counter()
    try:
        response = _session.get(
            TMDB_POPULAR_URL,
            params={'api_key': settings.TMDB_API_KEY, 'language': 'en-US', 'page': 1},
            timeout=10,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        return JsonResponse({'error': f'TMDB request failed: {exc}'}, status=502)
    tmdb_fetch_ms = round((time.perf_counter() - fetch_started) * 1000, 2)

    results = response.json().get('results', [])[:5]
    movies = [
        {
            'id': movie['id'],
            'title': movie.get('title'),
            'overview': movie.get('overview'),
            'release_date': movie.get('release_date'),
            'vote_average': movie.get('vote_average'),
            'poster_url': (
                TMDB_IMAGE_BASE + movie['poster_path'] if movie.get('poster_path') else None
            ),
        }
        for movie in results
    ]

    return JsonResponse(
        {
            'movies': movies,
            'meta': {
                'tmdb_fetch_ms': tmdb_fetch_ms,
                'server_time_utc': datetime.now(timezone.utc).isoformat(),
            },
        }
    )
