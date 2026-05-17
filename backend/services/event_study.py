from datetime import date
from dateutil.relativedelta import relativedelta
import numpy as np
import pandas as pd
from scipy import stats  # scipy is a statsmodels transitive dep
from services.config import MRT_PJY_OPENING, EVENT_STUDY_WINDOW
from services.transforms import clean_headline


def run_event_study(
    df: pd.DataFrame,
    service: str,
    event_date: date = MRT_PJY_OPENING,
    window_months: int = EVENT_STUDY_WINDOW,
) -> dict:
    df = clean_headline(df)
    if service not in df.columns:
        raise ValueError(f"Unknown service: {service}")

    event_ts = pd.Timestamp(event_date)
    pre_start = event_ts - relativedelta(months=window_months)
    post_end = event_ts + relativedelta(months=window_months)

    pre = df[(df["date"] >= pre_start) & (df["date"] < event_ts)][service].dropna()
    post = df[(df["date"] >= event_ts) & (df["date"] <= post_end)][service].dropna()

    if len(pre) < 7 or len(post) < 7:
        return {
            "error": "Insufficient data around the event date",
            "service": service,
            "event_date": event_date.isoformat(),
        }

    t_stat, p_value = stats.ttest_ind(pre, post, equal_var=False)
    pre_mean = float(pre.mean())
    post_mean = float(post.mean())
    pct_change = round((post_mean - pre_mean) / pre_mean * 100, 1) if pre_mean > 0 else 0

    if p_value < 0.05:
        direction = "increased" if post_mean > pre_mean else "decreased"
        verdict = (
            f"Ridership {direction} by {abs(pct_change):.1f}% after the event "
            f"(statistically significant, p={p_value:.3f})"
        )
    else:
        verdict = (
            f"No statistically significant change detected around the event "
            f"(p={p_value:.3f}). Observed {abs(pct_change):.1f}% shift may be noise."
        )

    window_df = df[(df["date"] >= pre_start) & (df["date"] <= post_end)][["date", service]].copy()
    window_df["date"] = window_df["date"].dt.date.astype(str)

    return {
        "data": window_df.rename(columns={service: "value"}).to_dict(orient="records"),
        "pre_mean": round(pre_mean, 0),
        "post_mean": round(post_mean, 0),
        "pct_change": pct_change,
        "p_value": round(float(p_value), 4),
        "t_stat": round(float(t_stat), 3),
        "significant": bool(p_value < 0.05),
        "verdict": verdict,
        "event_date": event_date.isoformat(),
        "service": service,
        "window_months": window_months,
    }
