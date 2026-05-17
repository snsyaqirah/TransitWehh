import asyncio
import os
from contextlib import asynccontextmanager
from datetime import date

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from middleware.rate_limit import limiter
from routers import headline, ktmb, analytics, nowcast, insights
from services.data_fetcher import get_headline_df, get_data_freshness_days
from services.weather_fetcher import get_active_weather_provider
from utils.cache import cache_get
from utils.logging import log
from services.config import DATA_FRESHNESS_WARNING_DAYS

import dotenv
dotenv.load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("transitwehh_startup")
    from startup import warm_backtest_cache
    asyncio.create_task(warm_backtest_cache())
    yield
    log.info("transitwehh_shutdown")


app = FastAPI(title="TransitWehh API", version="1.0.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_FRONTEND_URL],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(headline.router)
app.include_router(ktmb.router)
app.include_router(analytics.router)
app.include_router(nowcast.router)
app.include_router(insights.router)


# Health check — EXEMPT from rate limiting (Railway pings every 10-30s)
@app.get("/api/health")
async def health_check():
    schema_valid = True
    schema_error = None
    data_freshness_days: float | None = None
    is_stale = False

    try:
        df, is_stale = await get_headline_df()
        data_freshness_days = get_data_freshness_days(df)
    except Exception as e:
        schema_valid = False
        schema_error = str(e)

    backtest_cache_age = None
    from services.config import TRAINING_CUTOFF
    for svc in ["rail_mrt_kajang", "rail_lrt_kj"]:
        cached = await cache_get(f"backtest_{svc}_{TRAINING_CUTOFF}")
        if cached is not None:
            backtest_cache_age = "warm"
            break
    if backtest_cache_age is None:
        backtest_cache_age = "cold"

    return {
        "status": "ok",
        "schema_valid": schema_valid,
        "schema_error": schema_error,
        "data_freshness_days": round(data_freshness_days, 1) if data_freshness_days is not None else None,
        "data_fresh": (data_freshness_days or 999) <= DATA_FRESHNESS_WARNING_DAYS,
        "is_stale": is_stale,
        "weather_provider": get_active_weather_provider(),
        "backtest_cache": backtest_cache_age,
        "frontend_url": _FRONTEND_URL,
    }
