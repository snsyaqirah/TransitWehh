import pandas as pd
import numpy as np
from services.transforms import clean_headline, add_date_features


def generate_insights(df: pd.DataFrame) -> list[dict]:
    df = clean_headline(df)
    df = add_date_features(df)
    insights = []

    ridership_cols = [c for c in df.columns if c.startswith(("rail_", "bus_"))]

    # 1. Fastest growing service (YoY last 12 months)
    recent = df[df["date"] >= df["date"].max() - pd.Timedelta(days=365)]
    prior = df[(df["date"] >= df["date"].max() - pd.Timedelta(days=730)) &
               (df["date"] < df["date"].max() - pd.Timedelta(days=365))]

    if not recent.empty and not prior.empty:
        growth = {}
        for col in ridership_cols:
            if col in df.columns:
                r_mean = recent[col].mean()
                p_mean = prior[col].mean()
                if p_mean and p_mean > 0:
                    growth[col] = (r_mean - p_mean) / p_mean * 100
        if growth:
            top = max(growth, key=lambda k: growth[k])
            pct = round(growth[top], 1)
            if pct > 5:
                insights.append({
                    "type": "growth",
                    "title": f"{_label(top)} growing fastest",
                    "body": f"{_label(top)} ridership grew {pct}% year-over-year — the highest growth among all tracked services.",
                    "service": top,
                    "value": pct,
                })

    # 2. Weekend vs weekday gap
    for col in ridership_cols[:3]:
        if col not in df.columns:
            continue
        weekend_avg = df[df["is_weekend"]][col].mean()
        weekday_avg = df[~df["is_weekend"]][col].mean()
        if weekday_avg > 0:
            gap = round((weekday_avg - weekend_avg) / weekday_avg * 100, 1)
            if gap > 20:
                insights.append({
                    "type": "pattern",
                    "title": f"{_label(col)} weekday dominance",
                    "body": f"Weekday ridership on {_label(col)} is {gap}% higher than weekends, suggesting strong commuter dependency.",
                    "service": col,
                    "value": gap,
                })
                break

    # 3. Most recent month surge / drop
    last_month = df[df["date"].dt.month == df["date"].dt.month.max()]
    prev_month = df[df["date"].dt.month == (df["date"].dt.month.max() - 1)]
    if not last_month.empty and not prev_month.empty:
        for col in ridership_cols:
            if col not in df.columns:
                continue
            lm = last_month[col].mean()
            pm = prev_month[col].mean()
            if pm and pm > 0:
                change = (lm - pm) / pm * 100
                if abs(change) > 15:
                    direction = "surged" if change > 0 else "dropped"
                    insights.append({
                        "type": "alert",
                        "title": f"{_label(col)} {direction} last month",
                        "body": f"{_label(col)} {direction} {abs(round(change, 1))}% month-over-month.",
                        "service": col,
                        "value": round(change, 1),
                    })

    # 4. Rail vs bus balance
    rail_total = df[[c for c in ridership_cols if c.startswith("rail_") and c in df.columns]].sum(axis=1).mean()
    bus_total = df[[c for c in ridership_cols if c.startswith("bus_") and c in df.columns]].sum(axis=1).mean()
    total = rail_total + bus_total
    if total > 0:
        rail_share = round(rail_total / total * 100, 1)
        insights.append({
            "type": "composition",
            "title": f"Rail carries {rail_share}% of ridership",
            "body": f"Rail services account for {rail_share}% of total tracked ridership, with bus making up the remaining {round(100-rail_share, 1)}%.",
            "service": None,
            "value": rail_share,
        })

    return insights[:6]  # cap at 6 insights


_LABELS = {
    "rail_lrt_kj": "LRT Kelana Jaya",
    "rail_lrt_ampang": "LRT Ampang",
    "rail_mrt_kajang": "MRT Kajang",
    "rail_mrt_pjy": "MRT Putrajaya",
    "rail_monorail": "KL Monorail",
    "rail_komuter": "KTM Komuter",
    "rail_komuter_utara": "KTM Komuter Utara",
    "rail_ets": "KTM ETS",
    "rail_tebrau": "KTM Tebrau",
    "rail_intercity": "KTM Intercity",
    "bus_rkl": "Rapid KL Bus",
    "bus_rkn": "Rapid Kuantan",
    "bus_rpn": "Rapid Penang",
}


def _label(col: str) -> str:
    return _LABELS.get(col, col)
