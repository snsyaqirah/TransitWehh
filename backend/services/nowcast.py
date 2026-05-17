from datetime import date, datetime
import numpy as np
import pandas as pd
from utils.holidays import is_public_holiday
from services.transforms import clean_headline, add_date_features

# DOW × hour density weights (0=Mon, 6=Sun).
# Derived from general KL rush hour patterns.
_DOW_HOUR_WEIGHTS = {
    0: {7: 0.6, 8: 1.0, 9: 0.8, 17: 0.9, 18: 1.0, 19: 0.7},  # Mon
    1: {7: 0.6, 8: 1.0, 9: 0.8, 17: 0.9, 18: 1.0, 19: 0.7},  # Tue
    2: {7: 0.6, 8: 1.0, 9: 0.8, 17: 0.9, 18: 1.0, 19: 0.7},  # Wed
    3: {7: 0.6, 8: 1.0, 9: 0.8, 17: 0.9, 18: 1.0, 19: 0.7},  # Thu
    4: {7: 0.5, 8: 0.9, 9: 0.7, 13: 0.5, 17: 1.0, 18: 0.9},  # Fri (Jumu'ah dip + early leave)
    5: {10: 0.3, 11: 0.4, 14: 0.4, 15: 0.4},                  # Sat
    6: {10: 0.2, 11: 0.3, 14: 0.3, 15: 0.3},                  # Sun
}


def _get_hour_weight(dow: int, hour: int) -> float:
    weights = _DOW_HOUR_WEIGHTS.get(dow, {})
    if not weights:
        return 0.1
    if hour in weights:
        return weights[hour]
    # Interpolate between known points
    known_hours = sorted(weights.keys())
    before = [h for h in known_hours if h <= hour]
    after = [h for h in known_hours if h > hour]
    if before and after:
        h0, h1 = before[-1], after[0]
        w0, w1 = weights[h0], weights[h1]
        return w0 + (w1 - w0) * (hour - h0) / (h1 - h0)
    if before:
        return weights[before[-1]] * max(0, 1 - (hour - before[-1]) * 0.1)
    if after:
        return weights[after[0]] * max(0, 1 - (after[0] - hour) * 0.1)
    return 0.05


def get_nowcast(
    df: pd.DataFrame,
    service: str,
    at: datetime | None = None,
) -> dict:
    if at is None:
        at = datetime.now()

    today = at.date()
    dow = at.weekday()
    hour = at.hour

    holiday = is_public_holiday(today)
    if holiday:
        return {
            "is_holiday": True,
            "holiday_name": holiday if isinstance(holiday, str) else "Public Holiday",
            "warning": "Public holiday — crowd estimate unreliable",
            "density_level": None,
            "density_label": None,
            "hour_weight": None,
        }

    df = clean_headline(df)
    df = add_date_features(df)

    # Get average ridership for this DOW
    dow_avg = df[df["dow"] == dow][service].dropna()
    if dow_avg.empty or service not in df.columns:
        return {"error": f"No data for {service}"}

    avg = float(dow_avg.mean())
    hour_weight = _get_hour_weight(dow, hour)
    estimated_hourly = avg * hour_weight / 16  # distribute across ~16 operating hours

    # Normalize to 0–1 density
    max_weight = max(w for h_weights in _DOW_HOUR_WEIGHTS.values() for w in h_weights.values())
    density_raw = hour_weight / max_weight

    if density_raw >= 0.75:
        density_level = "high"
        density_label = "Peak — expect crowds"
    elif density_raw >= 0.40:
        density_level = "medium"
        density_label = "Moderate — some crowds"
    else:
        density_level = "low"
        density_label = "Off-peak — comfortable"

    return {
        "is_holiday": False,
        "service": service,
        "at": at.isoformat(),
        "dow": dow,
        "hour": hour,
        "hour_weight": round(hour_weight, 2),
        "estimated_hourly_ridership": round(estimated_hourly, 0),
        "density_level": density_level,
        "density_label": density_label,
        "density_normalized": round(density_raw, 2),
    }
