import json
import os
from datetime import date
import numpy as np
import pandas as pd
from services.config import ANOMALY_FENCE, ZSCORE_THRESHOLD
from services.transforms import clean_headline, add_date_features

_INCIDENTS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "incidents.json")


def _load_incidents() -> list[dict]:
    try:
        with open(_INCIDENTS_PATH) as f:
            return json.load(f)
    except Exception:
        return []


def detect_anomalies(
    df: pd.DataFrame,
    service: str,
    method: str = "iqr",
    date_gte: date | None = None,
    date_lte: date | None = None,
) -> list[dict]:
    df = clean_headline(df)
    df = add_date_features(df)

    if service not in df.columns:
        return []

    if date_gte:
        df = df[df["date"] >= str(date_gte)]
    if date_lte:
        df = df[df["date"] <= str(date_lte)]

    anomalies = []
    incidents = _load_incidents()

    for is_weekend in [False, True]:
        subset = df[df["is_weekend"] == is_weekend].copy()
        values = subset[service].dropna()

        if method == "iqr":
            q1 = values.quantile(0.25)
            q3 = values.quantile(0.75)
            iqr = q3 - q1
            lower = q1 - ANOMALY_FENCE * iqr
            upper = q3 + ANOMALY_FENCE * iqr
            is_anomaly = (subset[service] < lower) | (subset[service] > upper)
        else:  # zscore
            mean = values.mean()
            std = values.std()
            if std == 0:
                continue
            z = (subset[service] - mean) / std
            is_anomaly = z.abs() > ZSCORE_THRESHOLD

        anomaly_rows = subset[is_anomaly]
        for _, row in anomaly_rows.iterrows():
            d = row["date"].date()
            incident_match = next(
                (inc for inc in incidents
                 if inc["date"] == d.isoformat()
                 and (inc["service"] == service or inc["service"] == "all")),
                None,
            )
            anomalies.append({
                "date": d.isoformat(),
                "value": row[service],
                "is_weekend": bool(is_weekend),
                "incident": incident_match,
            })

    anomalies.sort(key=lambda x: x["date"])
    return anomalies
