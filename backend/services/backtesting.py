from datetime import date
import numpy as np
import pandas as pd
from utils.logging import log
from services.config import BACKTEST_MONTHS, MAPE_METHOD, MIN_ACTUAL_FLOOR, TRAINING_CUTOFF
from services.transforms import clean_headline
from services.forecasting import fit_prophet


def _months_back(d: date, n: int) -> date:
    month = d.month - n
    year = d.year + month // 12
    month = month % 12
    if month <= 0:
        month += 12
        year -= 1
    return d.replace(year=year, month=month, day=1)


def _months_forward(d: date, n: int) -> date:
    month = d.month + n
    year = d.year + (month - 1) // 12
    month = (month - 1) % 12 + 1
    return d.replace(year=year, month=month, day=1)


def _mape(actual: np.ndarray, predicted: np.ndarray) -> float:
    if MAPE_METHOD == "smape":
        denom = (np.abs(actual) + np.abs(predicted)) / 2 + 1e-8
        return float(np.mean(np.abs(actual - predicted) / denom) * 100)
    else:  # floored
        denom = np.maximum(np.abs(actual), MIN_ACTUAL_FLOOR)
        return float(np.mean(np.abs(actual - predicted) / denom) * 100)


def _rmse(actual: np.ndarray, predicted: np.ndarray) -> float:
    return float(np.sqrt(np.mean((actual - predicted) ** 2)))


def run_backtest(
    df: pd.DataFrame,
    service: str,
    training_cutoff: date = TRAINING_CUTOFF,
    n_months: int = BACKTEST_MONTHS,
) -> dict:
    df = clean_headline(df)
    if service not in df.columns:
        raise ValueError(f"Unknown service: {service}")

    # Walk-forward windows: each window trains on data up to window_end,
    # tests on the following month. Hard slice FIRST to prevent leakage.
    scores = []
    for i in range(n_months):
        train_end = _months_back(training_cutoff, i)
        test_start = _months_forward(train_end, 1)
        test_end = _months_forward(train_end, 2)

        train_df = df[df["date"] <= str(train_end)].copy()
        test_df = df[(df["date"] >= str(test_start)) & (df["date"] < str(test_end))].copy()

        if len(train_df) < 30 or test_df.empty:
            continue

        try:
            model, _ = fit_prophet(train_df, service)
            future = model.make_future_dataframe(periods=len(test_df) + 5, freq="D")
            forecast = model.predict(future)

            test_dates = pd.to_datetime(test_df["date"])
            fc_slice = forecast[forecast["ds"].isin(test_dates)]
            if fc_slice.empty:
                continue

            actual = test_df.set_index("date")[service].values
            predicted = fc_slice["yhat"].values[:len(actual)]

            if len(actual) != len(predicted) or len(actual) == 0:
                continue

            mape = _mape(actual, predicted)
            rmse = _rmse(actual, predicted)

            scores.append({
                "window_end": train_end.isoformat(),
                "mape": round(mape, 2),
                "rmse": round(rmse, 0),
                "n_test_days": len(actual),
            })
            log.info("backtest_window", service=service, window_end=train_end.isoformat(), mape=round(mape, 2))
        except Exception as e:
            log.warning("backtest_window_failed", service=service, window=train_end.isoformat(), error=str(e))

    if not scores:
        return {"scores": [], "avg_mape": None, "avg_rmse": None, "service": service, "mape_method": MAPE_METHOD, "min_actual_floor": None, "n_windows": 0}

    avg_mape = round(float(np.mean([s["mape"] for s in scores])), 2)
    avg_rmse = round(float(np.mean([s["rmse"] for s in scores])), 0)

    return {
        "scores": scores,
        "avg_mape": avg_mape,
        "avg_rmse": avg_rmse,
        "service": service,
        "mape_method": MAPE_METHOD,
        "min_actual_floor": MIN_ACTUAL_FLOOR if MAPE_METHOD == "floored" else None,
        "n_windows": len(scores),
    }
