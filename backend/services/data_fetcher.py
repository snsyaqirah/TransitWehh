import os
from datetime import date
import httpx
import pandas as pd
from utils.logging import log
from utils.cache import fetch_with_stale_fallback
from services.config import (
    DATA_GOV_MY_BASE,
    EXPECTED_HEADLINE_COLUMNS,
    CACHE_TTL_RIDERSHIP,
    HTTPX_TIMEOUT,
    HTTPX_CONNECT_TIMEOUT,
)

_BASE = os.getenv("DATA_GOV_MY_BASE_URL", DATA_GOV_MY_BASE)
_TIMEOUT = httpx.Timeout(HTTPX_TIMEOUT, connect=HTTPX_CONNECT_TIMEOUT)


class SchemaError(Exception):
    pass


def _validate_schema(df: pd.DataFrame, expected: set[str]) -> None:
    missing = expected - set(df.columns)
    if missing:
        log.error("schema_drift", missing=sorted(missing))
        raise SchemaError(f"Schema drift detected: missing columns {sorted(missing)}")


async def _fetch_headline_raw() -> pd.DataFrame:
    url = f"{_BASE}?id=ridership_headline&limit=3000&sort=-date"
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(url)
        resp.raise_for_status()
    data = resp.json()
    records = data if isinstance(data, list) else data.get("data", data)
    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    _validate_schema(df, EXPECTED_HEADLINE_COLUMNS)
    log.info("headline_fetched", rows=len(df))
    return df


async def get_headline_df() -> tuple[pd.DataFrame, bool]:
    return await fetch_with_stale_fallback(
        cache_key="ridership_headline",
        fetch_fn=_fetch_headline_raw,
        ttl=CACHE_TTL_RIDERSHIP,
    )


async def _fetch_ktmb_raw() -> pd.DataFrame:
    url = f"{_BASE}?id=ridership_ktmb_monthly&limit=500&sort=-date"
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(url)
        resp.raise_for_status()
    data = resp.json()
    records = data if isinstance(data, list) else data.get("data", data)
    df = pd.DataFrame(records)
    df["date"] = df["date"].apply(_parse_ktmb_date)
    df = df.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)
    log.info("ktmb_fetched", rows=len(df))
    return df


def _parse_ktmb_date(raw: str) -> pd.Timestamp | None:
    try:
        # API returns "2023-01" — pad to first day of month
        return pd.Timestamp(raw.strip() + "-01")
    except Exception as e:
        log.warning("ktmb_bad_date", raw=raw, error=str(e))
        return None


async def get_ktmb_df() -> tuple[pd.DataFrame, bool]:
    return await fetch_with_stale_fallback(
        cache_key="ridership_ktmb",
        fetch_fn=_fetch_ktmb_raw,
        ttl=CACHE_TTL_RIDERSHIP,
    )


def get_data_freshness_days(df: pd.DataFrame) -> float:
    if df.empty or "date" not in df.columns:
        return float("inf")
    latest = pd.to_datetime(df["date"]).max()
    return (pd.Timestamp.now() - latest).days
