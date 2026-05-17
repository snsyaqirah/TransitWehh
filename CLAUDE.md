# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**TransitWehh** — Production-quality Malaysian public transport analytics dashboard. FastAPI (Python 3.12) backend + Vite/React 18/TypeScript frontend. Live data from `api.data.gov.my`. No database — all data is fetched live with in-memory cache.

**Brand:** Primary `hsl(213 94% 45%)` | Background `hsl(210 20% 98%)` | Dark mode supported.

---

## Commands

### Backend

```bash
cd backend

# Create venv and install (Prophet/pystan requires C++ build — takes ~5 min first time)
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Run
uvicorn main:app --reload --port 8000

# Docker (recommended for Prophet — handles C++ build automatically)
docker build -t transitwehh-backend .
docker run -p 8000:8000 --env-file .env transitwehh-backend
```

Copy `.env.example` to `.env` — weather provider keys are optional (Open-Meteo is free, no key needed).

### Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
npm run build
npm run lint
```

Frontend `.env` requires `VITE_API_BASE_URL=http://localhost:8000`.

---

## Architecture

### Data Flow

```
data.gov.my API  →  FastAPI backend (pandas, Prophet, statsmodels)
                 ↓  in-memory aiocache (5-min ridership, 24h weather)
              React frontend (TanStack Query, Recharts)
                 ↕
         5-provider weather fallback chain
         (XWeather → Meteoblue → Tomorrow.io → Open-Meteo → WeatherAPI)
```

### Backend (`backend/`)

| File/Folder | Purpose |
|-------------|---------|
| `main.py` | FastAPI app, CORS (locked to `FRONTEND_URL`), rate limit handler |
| `startup.py` | Non-blocking backtest cache warm-up on boot |
| `services/config.py` | **All constants with rationale** — training cutoff, MAPE method, thresholds |
| `services/data_fetcher.py` | Schema-validated fetch from data.gov.my + stale-while-revalidate |
| `services/weather_fetcher.py` | 5-provider fallback chain + 24h cache |
| `services/transforms.py` | Forward-fill nulls, date features, rolling avg, YoY, heatmap |
| `services/forecasting.py` | Prophet + MY holidays + optional rain regressor |
| `services/backtesting.py` | Walk-forward backtest (leakage-free hard slice before features) |
| `services/anomaly.py` | IQR + z-score, weekday/weekend-aware, injects incident context |
| `services/event_study.py` | Welch t-test pre/post event, plain-English verdict |
| `services/nowcast.py` | DOW × hour density matrix, holiday-aware grey-out |
| `middleware/rate_limit.py` | Tiered slowapi: 60/30/10 req/min; `/api/health` EXEMPT |
| `utils/cache.py` | `fetch_with_stale_fallback()` — serves expired cache on upstream failure |
| `utils/logging.py` | structlog — JSON in prod (Railway), readable in dev |
| `data/` | `incidents.json` (disruptions → AnomalyFlag), `annotations.json` (events → chart ReferenceLine), `my50_fares.json` |

**Critical invariants:**
- `TRAINING_CUTOFF = 2022-07-01` — COVID data is structurally different, never train before this
- `NULL_STRATEGY = "forward_fill"` — brief outages are rare, ffill is conservative
- `MAPE_METHOD = "floored"` with `MIN_ACTUAL_FLOOR = 1000` — prevents MAPE explosion on holidays
- `training_cutoff` param is Pydantic-validated: `ge=2022-01-01`, `le=today-90d` — no URL param abuse
- `/api/health` has NO `@limiter.limit` decorator — Railway pings every 10-30s
- Walk-forward backtest: hard slice df BEFORE computing features — no leakage
- MRT PJY index base = `2023-04-01` (not Jan 2023) — service opened March 2023

### Frontend (`frontend/src/`)

Data flow: **Pages → hooks → `lib/api.ts` → FastAPI**. Components never call `api.ts` directly.

| Folder | Purpose |
|--------|---------|
| `lib/constants.ts` | `SERVICE_META`, `SERVICE_PRESETS`, `INDEX_BASE_DATES` |
| `lib/utils.ts` | `cn()`, `formatNumber()`, `toExportRow()` (human CSV names), `downloadCsv()` |
| `lib/api.ts` | All typed API fetch functions (axios) |
| `lib/theme.tsx` | `ThemeProvider` + `useTheme()` — dark mode toggle via localStorage |
| `hooks/` | TanStack Query wrappers — one hook per endpoint |
| `components/charts/` | Recharts-based chart components |
| `components/dashboard/` | KPI cards, service cards, badges, banners |
| `pages/` | Route-level components |

**Path alias:** `@/` → `src/`.

**Services and colors:** All service metadata (label, color, type, operator) is in `SERVICE_META`. Always look up `SERVICE_MAP[key]` for display names and colors — never hardcode.

**CSV export:** Always use `toExportRow()` — maps internal snake_case keys to human names ("MRT Kajang" not "rail_mrt_kajang").

**Chart anti-spaghetti:** Default view is `Top 4` preset. Preset tabs: Top 4, All Rail, KTMB, Bus, All.

---

## Known Data Quirks

- KTMB API returns months as `"2023-01"` (no day) — pad to `-01` in `_parse_ktmb_date()`
- `rail_mrt_pjy` has nulls before 2023-03-16 (service didn't exist)
- COVID period (2020-2021) shows massive dips — all forecasting starts from 2022-07-01
- `data.gov.my` occasionally returns 5xx — stale cache is served, `/api/health` shows `is_stale: true`
- `incidents.json` and `annotations.json` have different schemas and different consumers (don't merge them)
