from datetime import date
from fastapi import APIRouter, Depends, Request, Query
from services.data_fetcher import get_headline_df, get_data_freshness_days
from services.transforms import (
    clean_headline,
    add_date_features,
    compute_rolling_avg,
    compute_yoy,
    compute_heatmap,
    compute_null_coverage,
)
from middleware.rate_limit import limiter, LIMIT_GENERAL

router = APIRouter(prefix="/api/headline", tags=["headline"])

_RIDERSHIP_COLS = [
    "bus_rkl", "bus_rkn", "bus_rpn",
    "rail_lrt_kj", "rail_lrt_ampang", "rail_mrt_kajang", "rail_mrt_pjy",
    "rail_monorail", "rail_komuter", "rail_komuter_utara",
    "rail_ets", "rail_tebrau", "rail_intercity",
]


@router.get("")
@limiter.limit(LIMIT_GENERAL)
async def get_headline(
    request: Request,
    date_gte: date | None = Query(None),
    date_lte: date | None = Query(None),
):
    df, is_stale = await get_headline_df()
    df = clean_headline(df)
    if date_gte:
        df = df[df["date"] >= str(date_gte)]
    if date_lte:
        df = df[df["date"] <= str(date_lte)]
    records = df.assign(date=df["date"].dt.date.astype(str)).to_dict(orient="records")
    return {"data": records, "is_stale": is_stale}


@router.get("/latest")
@limiter.limit(LIMIT_GENERAL)
async def get_headline_latest(request: Request):
    df, is_stale = await get_headline_df()
    df = clean_headline(df)
    df = df.tail(30)
    records = df.assign(date=df["date"].dt.date.astype(str)).to_dict(orient="records")
    return {"data": records, "is_stale": is_stale}


@router.get("/kpis")
@limiter.limit(LIMIT_GENERAL)
async def get_headline_kpis(request: Request):
    df, is_stale = await get_headline_df()
    df = clean_headline(df)
    freshness_days = get_data_freshness_days(df)

    latest_date = df["date"].max()
    this_month = df[df["date"].dt.month == latest_date.month]
    last_month = df[df["date"].dt.month == (latest_date.month - 1 or 12)]
    this_week = df[df["date"] >= latest_date - __import__("pandas").Timedelta(days=7)]

    rail_cols = [c for c in _RIDERSHIP_COLS if c.startswith("rail_")]
    bus_cols = [c for c in _RIDERSHIP_COLS if c.startswith("bus_")]

    def safe_sum(frame, cols):
        existing = [c for c in cols if c in frame.columns]
        return int(frame[existing].sum().sum()) if existing else 0

    total_today = {col: int(df.iloc[-1][col]) if col in df.columns else 0 for col in _RIDERSHIP_COLS}
    peak_service = max(total_today, key=lambda k: total_today[k])

    this_month_total = safe_sum(this_month, _RIDERSHIP_COLS)
    last_month_total = safe_sum(last_month, _RIDERSHIP_COLS)
    mom_pct = round((this_month_total - last_month_total) / last_month_total * 100, 1) if last_month_total > 0 else 0

    return {
        "total_this_week": safe_sum(this_week, _RIDERSHIP_COLS),
        "total_this_month": this_month_total,
        "mom_pct_change": mom_pct,
        "peak_service": peak_service,
        "latest_date": latest_date.date().isoformat(),
        "freshness_days": freshness_days,
        "is_stale": is_stale,
        "rail_share_pct": round(safe_sum(this_month, rail_cols) / this_month_total * 100, 1) if this_month_total > 0 else 0,
        "bus_share_pct": round(safe_sum(this_month, bus_cols) / this_month_total * 100, 1) if this_month_total > 0 else 0,
    }


@router.get("/rolling")
@limiter.limit(LIMIT_GENERAL)
async def get_headline_rolling(
    request: Request,
    service: str = Query(...),
    window: int = Query(7, ge=3, le=90),
):
    df, is_stale = await get_headline_df()
    df = clean_headline(df)
    if service not in df.columns:
        return {"error": f"Unknown service: {service}"}
    rolling = compute_rolling_avg(df[service], window=window)
    result = df[["date"]].assign(
        date=df["date"].dt.date.astype(str),
        rolling_avg=rolling.round(0),
        raw=df[service],
    ).to_dict(orient="records")
    return {"data": result, "window": window, "is_stale": is_stale}


@router.get("/yoy")
@limiter.limit(LIMIT_GENERAL)
async def get_headline_yoy(request: Request, service: str = Query(...)):
    df, is_stale = await get_headline_df()
    df = clean_headline(df)
    if service not in df.columns:
        return {"error": f"Unknown service: {service}"}
    pivoted = compute_yoy(df, service)
    return {
        "doy": pivoted.index.tolist(),
        "years": {str(y): pivoted[y].round(0).tolist() for y in pivoted.columns},
        "is_stale": is_stale,
    }


@router.get("/heatmap")
@limiter.limit(LIMIT_GENERAL)
async def get_headline_heatmap(request: Request, service: str = Query(...)):
    df, is_stale = await get_headline_df()
    df = clean_headline(df)
    if service not in df.columns:
        return {"error": f"Unknown service: {service}"}
    heatmap = compute_heatmap(df, service)
    return {**heatmap, "is_stale": is_stale}


@router.get("/completeness")
@limiter.limit(LIMIT_GENERAL)
async def get_headline_completeness(request: Request):
    df, is_stale = await get_headline_df()
    coverage = compute_null_coverage(df)
    return {"data": coverage, "is_stale": is_stale}
