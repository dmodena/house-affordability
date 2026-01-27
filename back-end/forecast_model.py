import pandas as pd
import numpy as np
from prophet import Prophet
from fastapi import HTTPException

#Prophet model 

def prep_prophet_df(d: pd.DataFrame, value_col: str) -> pd.DataFrame:
    """Prepare data for Prophet with validation and outlier handling."""
    out = d[["year", value_col]].copy()
    out["ds"] = pd.to_datetime(out["year"].astype(str) + "-01-01")
    out["y"] = pd.to_numeric(out[value_col], errors="coerce")
    out = out.dropna(subset=["ds", "y"]).sort_values("ds")
    
    # Validate positive values for log transform
    if (out["y"] <= 0).any():
        raise HTTPException(status_code=400, detail="Cannot log-transform non-positive values")
    
    # Optional: Remove outliers using IQR method (commented out for now)
    # q1, q3 = out["y"].quantile([0.25, 0.75])
    # iqr = q3 - q1
    # out = out[(out["y"] >= q1 - 1.5*iqr) & (out["y"] <= q3 + 1.5*iqr)]
    
    # Log transform for exponential growth modeling
    out["y"] = np.log(out["y"])
    return out[["ds", "y"]]


def fit_forecast_prophet(df_ts: pd.DataFrame, years_ahead: int = 6):
    """Fit Prophet model with improved configuration for housing data."""
    if len(df_ts) < 8:
        raise HTTPException(status_code=400, detail="Not enough data points for forecasting")

    m = Prophet(
        yearly_seasonality=False,
        weekly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.25,  # More responsive to trend changes (improved from 0.1)
        changepoint_range=0.9,  # Allow changepoints in 90% of history
        interval_width=0.80
    )
    m.fit(df_ts)

    # freq='YS' = Year Start (01-01)
    future = m.make_future_dataframe(periods=years_ahead, freq="YS")
    fc = m.predict(future)

    # Convert back from log scale to original scale
    fc["yhat"] = np.exp(fc["yhat"])
    fc["yhat_lower"] = np.exp(fc["yhat_lower"])
    fc["yhat_upper"] = np.exp(fc["yhat_upper"])

    return fc[["ds", "yhat", "yhat_lower", "yhat_upper"]]
