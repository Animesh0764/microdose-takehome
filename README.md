# Microdose Latency Demo

A Django API that fetches movies from TMDB, plus a static frontend that times
requests and lets you log/compare latency from different regions (via VPN).

## Project layout

- `server/server/` — Django project (manage.py lives here)
- `client/` — static frontend, no build step

## 1. Local setup (backend)

```
cd server
./env/Scripts/activate        # or: source env/bin/activate on Mac/Linux
pip install -r requirements.txt
cd server
copy .env.example .env         # or: cp .env.example .env
```

Edit `server/server/.env` and set `TMDB_API_KEY` (get a free key at
https://www.themoviedb.org/settings/api — takes ~2 minutes, no cost).

Then:

```
python manage.py migrate
python manage.py runserver
```

API is now at `http://localhost:8000/api/movie/`.

## 2. Local setup (frontend)

`client/config.js` already points at `http://localhost:8000`. Just open
`client/index.html` in a browser, or serve it:

```
cd client
python -m http.server 5500
```

Click **Test** — it fetches a movie, times the round trip, and logs the
result.

## 3. Deploy backend to Render

1. Push this repo to GitHub.
2. Render dashboard → New → Web Service → connect the repo.
3. Settings:
   - **Root Directory:** `server`
   - **Region:** Singapore (Render has no Mumbai/India region — Singapore is
     the closest available)
   - **Build Command:** `pip install -r requirements.txt && cd server && python manage.py collectstatic --noinput && python manage.py migrate`
   - **Start Command:** `gunicorn --chdir server server.wsgi:application --bind 0.0.0.0:$PORT`
4. Environment variables (Render dashboard → Environment):
   - `TMDB_API_KEY` = your key
   - `DJANGO_SECRET_KEY` = any long random string
   - `DJANGO_DEBUG` = `False`
   - `DJANGO_ALLOWED_HOSTS` = `your-service-name.onrender.com`
5. Deploy. Note the resulting URL, e.g. `https://microdose-api.onrender.com`.

## 4. Deploy frontend to Render

1. Update `client/config.js`:
   ```
   const API_BASE_URL = 'https://microdose-api.onrender.com';
   ```
2. Commit and push.
3. Render dashboard → New → Static Site → connect the repo.
   - **Root Directory:** `client`
   - **Build Command:** (leave empty)
   - **Publish Directory:** `.`
4. Deploy. You'll get a URL like `https://microdose-client.onrender.com`.

## 5. Testing latency from different regions

The backend is a single deployment in one region — there's no multi-region
infra here, by design (that's not what was asked). To compare latency:

1. Open the frontend URL with no VPN — type a region label ("India" / home
   network), click **Test**.
2. Connect a VPN to a server in another country (e.g. US), reload the page,
   type "US" as the label, click **Test** again.
3. Repeat for each region you want to compare (e.g. Russia).
4. The log table accumulates every run (persisted in the browser via
   localStorage). Use **Export CSV** to get a file with all runs for the
   walkthrough.

Each row shows:
- **Round-trip (ms):** total time the browser measured, VPN hop included
- **Server processing (ms):** time the Django server itself spent calling
  the TMDB API (isolates backend cost from network cost)
- **Est. network latency (ms):** round-trip minus server processing — a
  rough proxy for how much the VPN/geography added
