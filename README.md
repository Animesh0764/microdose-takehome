# Microdose Latency Demo

Django API that fetches movies from TMDB, plus a static frontend that times
each request and logs latency across different network locations (tested via VPN).

## Live

- API: https://microdose-takehome.onrender.com/api/movie/
- Frontend: https://microdose-takehome-1.onrender.com/

## Project layout

- `server/server/` — Django project (`manage.py` lives here)
- `client/` — static frontend, no build step

## Local setup

Backend:

```
cd server
./env/Scripts/activate
pip install -r requirements.txt
cd server
copy .env.example .env
```

Fill in `TMDB_API_KEY` in `server/server/.env` (free key at
https://www.themoviedb.org/settings/api), then:

```
python manage.py migrate
python manage.py runserver
```

Frontend: open `client/index.html` directly, or serve it with
`python -m http.server 5500` from the `client/` folder. Point
`client/config.js` at `http://localhost:8000` for local testing, or at the
live Render API URL above.

## Redeploying

Backend (Render Web Service):
- Root Directory: `server`
- Region: Singapore (closest Render region to India)
- Build Command: `pip install -r requirements.txt && cd server && python manage.py collectstatic --noinput && python manage.py migrate`
- Start Command: `gunicorn --chdir server server.wsgi:application --bind 0.0.0.0:$PORT`
- Env vars: `TMDB_API_KEY`, `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS=<service>.onrender.com`

Frontend (Render Static Site):
- Root Directory: `client`, Publish Directory: `.`, no build command

## Latency testing methodology

The backend is a single deployment in one region — this isn't a multi-region
setup. To compare regions: connect to a VPN server in the target country,
open the frontend, type a region label, click **Test**. Repeat per region
(a few runs each — single samples are noisy). The log persists in the
browser across reloads.

Each row reports:
- **Round-trip (ms):** total time measured by the browser
- **Server processing (ms):** time the Django server spent calling TMDB
  (isolates backend cost from network cost)
- **Est. network latency (ms):** round-trip minus server processing —
  the portion attributable to distance/VPN routing

## Findings

_Fill in after running the VPN comparison:_

| Region | Round-trip (ms) | Server (ms) | Est. network (ms) |
|---|---|---|---|
| India (no VPN) | | | |
| US | | | |
| Russia | | | |
