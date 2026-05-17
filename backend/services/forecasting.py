from datetime import date
import pandas as pd
import numpy as np
from utils.logging import log
from services.config import TRAINING_CUTOFF, RAINY_DAY_THRESHOLD_MM
from services.transforms import clean_headline


def _build_prophet_df(df: pd.DataFrame, service: str) -> pd.DataFrame:
    prophet_df = df[["date", service]].rename(columns={"date": "ds", service: "y"})
    prophet_df = prophet_df.dropna(subset=["y"]).copy()
    prophet_df["ds"] = pd.to_datetime(prophet_df["ds"])
    return prophet_df


def _get_my_holidays():
    from prophet.make_holidays import make_holidays_df
    return make_holidays_df(year_list=list(range(2019, 2028)), country="MY")


def fit_prophet(
    train_df: pd.DataFrame,
    service: str,
    rain_df: pd.DataFrame | None = None,
) -> tuple:
    from prophet import Prophet

    prophet_df = _build_prophet_df(train_df, service)
    holidays = _get_my_holidays()

    model = Prophet(
        holidays=holidays,
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode="multiplicative",
        interval_width=0.95,
    )

    if rain_df is not None:
        model.add_regressor("is_rainy_day", standardize=False)
        prophet_df = prophet_df.merge(
            rain_df[["date", "is_rainy_day"]].rename(columns={"date": "ds"}),
            on="ds",
            how="left",
        )
        prophet_df["is_rainy_day"] = prophet_df["is_rainy_day"].fillna(False).astype(float)

    model.fit(prophet_df)
    return model, prophet_df


def make_forecast(
    df: pd.DataFrame,
    service: str,
    horizon: int,
    training_cutoff: date,
    rain_df: pd.DataFrame | None = None,
) -> dict:
    df = clean_headline(df)
    train_df = df[df["date"] <= str(training_cutoff)].copy()

    if len(train_df) < 30:
        raise ValueError(f"Not enough training data for {service} before {training_cutoff}")

    log.info("forecast_fitting", service=service, horizon=horizon, rows=len(train_df))
    model, fitted_df = fit_prophet(train_df, service, rain_df=rain_df)

    future = model.make_future_dataframe(periods=horizon, freq="D")

    if rain_df is not None:
        rain_df_ds = rain_df.rename(columns={"date": "ds"})
        future = future.merge(rain_df_ds[["ds", "is_rainy_day"]], on="ds", how="left")
        # For forecast period: use climatological daily average of rain (not future data)
        mean_rain = float(fitted_df["is_rainy_day"].mean()) if "is_rainy_day" in fitted_df.columns else 0.3
        future["is_rainy_day"] = future["is_rainy_day"].fillna(mean_rain)

    forecast = model.predict(future)

    result_cols = ["ds", "yhat", "yhat_lower", "yhat_upper"]
    forecast_out = forecast[result_cols].copy()
    forecast_out["ds"] = forecast_out["ds"].dt.date.astype(str)
    forecast_out = forecast_out.rename(columns={"ds": "date"})

    # Attach actual values where they exist
    actuals = df[["date", service]].copy()
    actuals["date"] = actuals["date"].dt.date.astype(str)
    merged = forecast_out.merge(actuals, on="date", how="left")
    merged = merged.rename(columns={service: "actual"})

    log.info("forecast_complete", service=service, forecast_rows=len(forecast_out))
    return {
        "data": merged.round(0).to_dict(orient="records"),
        "training_cutoff": training_cutoff.isoformat(),
        "horizon": horizon,
        "service": service,
        "use_rain": rain_df is not None,
    }
