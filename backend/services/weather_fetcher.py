import os
from datetime import date
from abc import ABC, abstractmethod
import httpx
import pandas as pd
from utils.logging import log
from utils.cache import fetch_with_stale_fallback
from services.config import (
    RAINY_DAY_THRESHOLD_MM,
    CACHE_TTL_WEATHER,
    HTTPX_TIMEOUT,
    HTTPX_CONNECT_TIMEOUT,
)

_TIMEOUT = httpx.Timeout(HTTPX_TIMEOUT, connect=HTTPX_CONNECT_TIMEOUT)
# KL Sentral coordinates
_LAT, _LON = 3.1333, 101.6833


def _make_zero_rain_df(date_gte: date, date_lte: date) -> pd.DataFrame:
    dates = pd.date_range(date_gte, date_lte, freq="D")
    return pd.DataFrame({
        "date": dates,
        "precipitation_mm": 0.0,
        "is_rainy_day": False,
    })


def _normalize(df: pd.DataFrame) -> pd.DataFrame:
    df["date"] = pd.to_datetime(df["date"])
    df["is_rainy_day"] = df["precipitation_mm"] >= RAINY_DAY_THRESHOLD_MM
    return df[["date", "precipitation_mm", "is_rainy_day"]].copy()


class WeatherProvider(ABC):
    name: str

    @abstractmethod
    async def fetch(self, date_gte: date, date_lte: date) -> pd.DataFrame:
        ...


class OpenMeteoProvider(WeatherProvider):
    name = "Open-Meteo"

    async def fetch(self, date_gte: date, date_lte: date) -> pd.DataFrame:
        url = "https://archive-api.open-meteo.com/v1/archive"
        params = {
            "latitude": _LAT,
            "longitude": _LON,
            "start_date": date_gte.isoformat(),
            "end_date": date_lte.isoformat(),
            "daily": "precipitation_sum",
            "timezone": "Asia/Kuala_Lumpur",
        }
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
        data = resp.json()
        df = pd.DataFrame({
            "date": data["daily"]["time"],
            "precipitation_mm": data["daily"]["precipitation_sum"],
        })
        return _normalize(df)


class WeatherAPIProvider(WeatherProvider):
    name = "WeatherAPI"

    def __init__(self) -> None:
        self.api_key = os.getenv("WEATHERAPI_KEY", "")

    async def fetch(self, date_gte: date, date_lte: date) -> pd.DataFrame:
        if not self.api_key:
            raise ValueError("WEATHERAPI_KEY not configured")
        dates = pd.date_range(date_gte, date_lte, freq="D")
        rows = []
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            for d in dates:
                url = "https://api.weatherapi.com/v1/history.json"
                resp = await client.get(url, params={
                    "key": self.api_key,
                    "q": f"{_LAT},{_LON}",
                    "dt": d.strftime("%Y-%m-%d"),
                })
                resp.raise_for_status()
                day_data = resp.json()["forecast"]["forecastday"][0]["day"]
                rows.append({
                    "date": d.strftime("%Y-%m-%d"),
                    "precipitation_mm": day_data.get("totalprecip_mm", 0.0),
                })
        df = pd.DataFrame(rows)
        return _normalize(df)


class TomorrowIoProvider(WeatherProvider):
    name = "Tomorrow.io"

    def __init__(self) -> None:
        self.api_key = os.getenv("TOMORROW_KEY", "")

    async def fetch(self, date_gte: date, date_lte: date) -> pd.DataFrame:
        if not self.api_key:
            raise ValueError("TOMORROW_KEY not configured")
        url = "https://api.tomorrow.io/v4/historical"
        params = {
            "location": f"{_LAT},{_LON}",
            "fields": "precipitationAccumulation",
            "startTime": f"{date_gte}T00:00:00Z",
            "endTime": f"{date_lte}T23:59:59Z",
            "timesteps": "1d",
            "apikey": self.api_key,
        }
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
        rows = []
        for item in resp.json().get("data", {}).get("timelines", [{}])[0].get("intervals", []):
            rows.append({
                "date": item["startTime"][:10],
                "precipitation_mm": item["values"].get("precipitationAccumulation", 0.0),
            })
        df = pd.DataFrame(rows)
        return _normalize(df)


class MeteoblueProvider(WeatherProvider):
    name = "Meteoblue"

    def __init__(self) -> None:
        self.api_key = os.getenv("METEOBLUE_KEY", "")

    async def fetch(self, date_gte: date, date_lte: date) -> pd.DataFrame:
        if not self.api_key:
            raise ValueError("METEOBLUE_KEY not configured")
        url = "https://my.meteoblue.com/packages/basic-day"
        params = {
            "lat": _LAT,
            "lon": _LON,
            "apikey": self.api_key,
            "format": "json",
            "start_date": date_gte.isoformat(),
            "end_date": date_lte.isoformat(),
        }
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
        data = resp.json()
        df = pd.DataFrame({
            "date": data["data_day"]["time"],
            "precipitation_mm": data["data_day"].get("precipitation", [0.0] * len(data["data_day"]["time"])),
        })
        return _normalize(df)


class XWeatherProvider(WeatherProvider):
    name = "XWeather"

    def __init__(self) -> None:
        self.client_id = os.getenv("XWEATHER_CLIENT_ID", "")
        self.client_secret = os.getenv("XWEATHER_CLIENT_SECRET", "")

    async def fetch(self, date_gte: date, date_lte: date) -> pd.DataFrame:
        if not self.client_id or not self.client_secret:
            raise ValueError("XWeather credentials not configured")
        url = f"https://data.api.xweather.com/observations/archive/{_LAT},{_LON}"
        params = {
            "from": date_gte.isoformat(),
            "to": date_lte.isoformat(),
            "fields": "periods.dateTimeISO,periods.precipMM",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
        rows = []
        for period in resp.json().get("response", [{}])[0].get("periods", []):
            rows.append({
                "date": period["dateTimeISO"][:10],
                "precipitation_mm": period.get("precipMM", 0.0),
            })
        df = pd.DataFrame(rows)
        return _normalize(df)


# Ordered by preference — Open-Meteo first as it's free and reliable
_PROVIDERS: list[WeatherProvider] = [
    XWeatherProvider(),
    MeteoblueProvider(),
    TomorrowIoProvider(),
    OpenMeteoProvider(),
    WeatherAPIProvider(),
]


async def _fetch_kl_rain_raw(date_gte: date, date_lte: date) -> pd.DataFrame:
    for provider in _PROVIDERS:
        try:
            df = await provider.fetch(date_gte, date_lte)
            log.info("weather_fetched", provider=provider.name, rows=len(df))
            return df
        except Exception as e:
            log.warning("weather_provider_failed", provider=provider.name, reason=str(e))

    log.error("all_weather_providers_failed")
    return _make_zero_rain_df(date_gte, date_lte)


async def get_kl_rain(date_gte: date, date_lte: date) -> tuple[pd.DataFrame, bool]:
    cache_key = f"weather_{date_gte}_{date_lte}"

    async def fetch_fn() -> pd.DataFrame:
        return await _fetch_kl_rain_raw(date_gte, date_lte)

    return await fetch_with_stale_fallback(cache_key, fetch_fn, ttl=CACHE_TTL_WEATHER)


def get_active_weather_provider() -> str:
    for provider in _PROVIDERS:
        if isinstance(provider, OpenMeteoProvider):
            return provider.name  # always available
        has_creds = True
        if hasattr(provider, "api_key") and not provider.api_key:
            has_creds = False
        if hasattr(provider, "client_id") and not provider.client_id:
            has_creds = False
        if has_creds:
            return provider.name
    return "Open-Meteo"
