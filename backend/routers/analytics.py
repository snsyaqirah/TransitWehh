from datetime import date
from fastapi import APIRouter, Request, Query, Depends
from services.data_fetcher import get_headline_df
from services.anomaly import detect_anomalies
from services.forecasting import make_forecast
from services.backtesting import run_backtest
from services.decomposition import run_stl
from services.event_study import run_event_study
from services.weather_fetcher import get_kl_rain
from services.transforms import clean_headline
from models.schemas import ForecastParams, AnomalyParams, BacktestParams, DecomposeParams
from middleware.rate_limit import limiter, LIMIT_GENERAL, LIMIT_MODERATE, LIMIT_HEAVY
from utils.cache import cache_get, cache_set
from services.config import CACHE_TTL_BACKTEST
import numpy as np

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/anomalies")
@limiter.limit(LIMIT_MODERATE)
async def get_anomalies(
    request: Request,
    service: str = Query(...),
    method: str = Query("iqr"),
    date_gte: date | None = Query(None),
    date_lte: date | None = Query(None),
):
    params = AnomalyParams(service=service, method=method, date_gte=date_gte, date_lte=date_lte)
    df, is_stale = await get_headline_df()
    anomalies = detect_anomalies(df, params.service, params.method, params.date_gte, params.date_lte)
    return {"data": anomalies, "service": service, "method": method, "is_stale": is_stale}


@router.get("/forecast")
@limiter.limit(LIMIT_HEAVY)
async def get_forecast(
    request: Request,
    service: str = Query(...),
    horizon: int = Query(30),
    use_rain: bool = Query(False),
    training_cutoff: date = Query(date(2022, 7, 1)),
):
    params = ForecastParams(
        service=service, horizon=horizon, use_rain=use_rain, training_cutoff=training_cutoff
    )
    df, is_stale = await get_headline_df()

    rain_df = None
    weather_stale = False
    if params.use_rain:
        train_start = date(2022, 1, 1)
        forecast_end = date.today().__class__.fromordinal(
            date.today().toordinal() + params.horizon
        )
        rain_df, weather_stale = await get_kl_rain(train_start, date.today())

    result = make_forecast(df, params.service, params.horizon, params.training_cutoff, rain_df)
    result["is_stale"] = is_stale or weather_stale
    return result


@router.get("/backtest")
@limiter.limit(LIMIT_HEAVY)
async def get_backtest(
    request: Request,
    service: str = Query(...),
    training_cutoff: date = Query(date(2022, 7, 1)),
):
    params = BacktestParams(service=service, training_cutoff=training_cutoff)
    cache_key = f"backtest_{params.service}_{params.training_cutoff}"

    cached = await cache_get(cache_key)
    if cached is not None:
        return cached

    df, is_stale = await get_headline_df()
    result = run_backtest(df, params.service, params.training_cutoff)
    result["is_stale"] = is_stale

    await cache_set(cache_key, result, ttl=CACHE_TTL_BACKTEST)
    return result


@router.get("/decompose")
@limiter.limit(LIMIT_MODERATE)
async def get_decompose(
    request: Request,
    service: str = Query(...),
    period: int = Query(365),
):
    params = DecomposeParams(service=service, period=period)
    df, is_stale = await get_headline_df()
    result = run_stl(df, params.service, params.period)
    result["is_stale"] = is_stale
    return result


@router.get("/event-study")
@limiter.limit(LIMIT_MODERATE)
async def get_event_study(
    request: Request,
    service: str = Query(...),
    event_date: date = Query(date(2023, 3, 16)),
    window_months: int = Query(6, ge=1, le=12),
):
    df, is_stale = await get_headline_df()
    result = run_event_study(df, service, event_date, window_months)
    result["is_stale"] = is_stale
    return result


@router.get("/rain-correlation")
@limiter.limit(LIMIT_MODERATE)
async def get_rain_correlation(
    request: Request,
    service: str = Query(...),
):
    df, is_stale = await get_headline_df()
    df = clean_headline(df)
    if service not in df.columns:
        return {"error": f"Unknown service: {service}"}

    rain_df, weather_stale = await get_kl_rain(
        date(2022, 7, 1), date.today()
    )

    rain_df_ds = rain_df.rename(columns={"date": "ds"})
    df_merged = df[["date", service]].copy()
    df_merged = df_merged.merge(
        rain_df[["date", "precipitation_mm", "is_rainy_day"]].rename(columns={"date": "date"}),
        on="date",
        how="inner",
    )
    df_merged = df_merged.dropna()

    if len(df_merged) < 30:
        return {"error": "Not enough overlapping data for correlation"}

    corr = float(df_merged[service].corr(df_merged["precipitation_mm"]))
    rainy_avg = float(df_merged[df_merged["is_rainy_day"]][service].mean())
    dry_avg = float(df_merged[~df_merged["is_rainy_day"]][service].mean())
    diff_pct = round((rainy_avg - dry_avg) / dry_avg * 100, 1) if dry_avg > 0 else 0

    chart_data = df_merged[["date", service, "precipitation_mm", "is_rainy_day"]].copy()
    chart_data["date"] = chart_data["date"].dt.date.astype(str)

    return {
        "data": chart_data.rename(columns={service: "ridership"}).to_dict(orient="records"),
        "pearson_r": round(corr, 3),
        "rainy_day_avg": round(rainy_avg, 0),
        "dry_day_avg": round(dry_avg, 0),
        "rainy_vs_dry_pct": diff_pct,
        "service": service,
        "is_stale": is_stale or weather_stale,
    }
