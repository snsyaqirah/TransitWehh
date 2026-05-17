from fastapi import APIRouter, Request
from services.data_fetcher import get_ktmb_df
from middleware.rate_limit import limiter, LIMIT_GENERAL

router = APIRouter(prefix="/api/ktmb", tags=["ktmb"])

_KTMB_COLS = [
    "intercity", "ets", "komuter", "komuter_utara", "tebrau",
]


@router.get("")
@limiter.limit(LIMIT_GENERAL)
async def get_ktmb(request: Request):
    df, is_stale = await get_ktmb_df()
    df = df.copy()
    df["date"] = df["date"].dt.date.astype(str)
    return {"data": df.to_dict(orient="records"), "is_stale": is_stale}


@router.get("/mom")
@limiter.limit(LIMIT_GENERAL)
async def get_ktmb_mom(request: Request):
    df, is_stale = await get_ktmb_df()
    df = df.copy().sort_values("date")

    result = []
    numeric_cols = [c for c in df.columns if c not in ("date",) and df[c].dtype in ("float64", "int64")]
    for col in numeric_cols:
        pct = df[col].pct_change() * 100
        result_col = df[["date"]].copy()
        result_col["date"] = result_col["date"].dt.date.astype(str)
        result_col["service"] = col
        result_col["value"] = df[col].round(0)
        result_col["mom_pct"] = pct.round(1)
        result.append(result_col.dropna(subset=["mom_pct"]))

    import pandas as pd
    combined = pd.concat(result, ignore_index=True) if result else pd.DataFrame()
    return {"data": combined.to_dict(orient="records"), "is_stale": is_stale}
