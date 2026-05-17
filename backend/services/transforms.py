import pandas as pd
import numpy as np
from services.config import NULL_STRATEGY, ROLLING_AVG_MIN_PERIODS

_RIDERSHIP_COLS = [
    "bus_rkl", "bus_rkn", "bus_rpn",
    "rail_lrt_kj", "rail_lrt_ampang", "rail_mrt_kajang", "rail_mrt_pjy",
    "rail_monorail", "rail_komuter", "rail_komuter_utara",
    "rail_ets", "rail_tebrau", "rail_intercity",
]


def clean_headline(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in _RIDERSHIP_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    if NULL_STRATEGY == "forward_fill":
        # ffill first (carry last known value), then bfill for leading nulls
        df[_RIDERSHIP_COLS] = (
            df[_RIDERSHIP_COLS]
            .ffill()
            .bfill()
        )

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    return df


def add_date_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month
    df["dow"] = df["date"].dt.dayofweek   # 0=Mon, 6=Sun
    df["is_weekend"] = df["dow"] >= 5
    return df


def compute_rolling_avg(series: pd.Series, window: int = 7) -> pd.Series:
    return series.rolling(window, min_periods=ROLLING_AVG_MIN_PERIODS).mean()


def compute_yoy(df: pd.DataFrame, col: str) -> pd.DataFrame:
    df = df.copy()
    df["year"] = df["date"].dt.year
    df["doy"] = df["date"].dt.dayofyear
    pivoted = df.pivot_table(index="doy", columns="year", values=col, aggfunc="mean")
    return pivoted


def compute_heatmap(df: pd.DataFrame, col: str) -> dict:
    df = add_date_features(df.copy())
    # DOW x Month matrix of average ridership
    pivot = df.pivot_table(index="dow", columns="month", values=col, aggfunc="mean")
    pivot = pivot.round(0).fillna(0)
    return {
        "dow": pivot.index.tolist(),
        "months": pivot.columns.tolist(),
        "values": pivot.values.tolist(),
    }


def compute_null_coverage(df: pd.DataFrame) -> dict:
    result = {}
    for col in _RIDERSHIP_COLS:
        if col not in df.columns:
            continue
        total = len(df)
        null_count = df[col].isna().sum()
        first_valid = df.loc[df[col].notna(), "date"].min()
        result[col] = {
            "total_rows": total,
            "null_count": int(null_count),
            "coverage_pct": round((1 - null_count / total) * 100, 1) if total > 0 else 0,
            "first_valid_date": first_valid.date().isoformat() if pd.notna(first_valid) else None,
        }
    return result
