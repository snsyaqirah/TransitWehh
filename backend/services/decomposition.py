import pandas as pd
from statsmodels.tsa.seasonal import STL
from services.transforms import clean_headline


def run_stl(df: pd.DataFrame, service: str, period: int = 365) -> dict:
    df = clean_headline(df)
    if service not in df.columns:
        raise ValueError(f"Unknown service: {service}")

    series = df.set_index("date")[service].dropna()
    series.index = pd.DatetimeIndex(series.index, freq="D")
    series = series.asfreq("D").ffill()

    if len(series) < period * 2:
        raise ValueError(f"Not enough data for STL with period={period} (need {period*2} rows, got {len(series)})")

    stl = STL(series, period=period, robust=True)
    result = stl.fit()

    out = pd.DataFrame({
        "date": series.index.strftime("%Y-%m-%d"),
        "observed": series.values.round(0),
        "trend": result.trend.round(0),
        "seasonal": result.seasonal.round(0),
        "residual": result.resid.round(0),
    })

    return {
        "data": out.to_dict(orient="records"),
        "service": service,
        "period": period,
    }
