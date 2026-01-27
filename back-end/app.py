from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
import pandas as pd
from pathlib import Path
from prophet import Prophet
import numpy as np
from pydantic import BaseModel
from chatbot_service import ChatbotService
from forecast_model import prep_prophet_df, fit_forecast_prophet

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4205", "http://localhost:4200"],  # Angular dev servers
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "merged_final.xlsx"
DATA_SHEET = "merged_annual_long"

templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# Load once
# -------------------------
df = pd.read_excel(DATA_FILE, sheet_name=DATA_SHEET)
chatbot_service = ChatbotService()

df["year"] = pd.to_numeric(df["year"], errors="coerce")
df["Area"] = df["Area"].astype(str).str.strip()
df["house_price"] = pd.to_numeric(df["house_price"], errors="coerce")
df["annual_income"] = pd.to_numeric(df["annual_income"], errors="coerce")

df = df.dropna(subset=["year", "Area", "house_price", "annual_income"]).copy()
df["year"] = df["year"].astype(int)

boroughs = sorted(df["Area"].unique().tolist())
borough_map = {b.lower(): b for b in boroughs}  # exact lookup (case-insensitive)


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    # Provide list for datalist autocomplete
    return templates.TemplateResponse("index.html", {"request": request, "boroughs": boroughs})


@app.get("/api/boroughs")
def get_boroughs():
    return {"boroughs": boroughs}


# ----------------------------
# Overview: mean per year across ALL boroughs
# ----------------------------
@app.get("/api/overview")
def overview():
    yearly = (
        df.groupby("year", as_index=False)
        .agg(
            house_price=("house_price", "mean"),
            annual_income=("annual_income", "mean"),
        )
        .sort_values("year")
    )

    return {
        "title": "London overview (mean across boroughs)",
        "years": yearly["year"].tolist(),
        "house_price": yearly["house_price"].round(0).tolist(),
        "annual_income": yearly["annual_income"].round(0).tolist(),
    }


# ----------------------------
# Overview Forecast: London average with Prophet predictions
# ----------------------------
@app.get("/api/overview-forecast")
def overview_forecast(years_ahead: int = Query(6, ge=1, le=20)):
    """Forecast London-wide averages (mean across all boroughs)."""
    # Calculate yearly averages
    yearly = (
        df.groupby("year", as_index=False)
        .agg(
            house_price=("house_price", "mean"),
            annual_income=("annual_income", "mean"),
        )
        .sort_values("year")
    )
    
    # Prepare for Prophet
    hp_ts = prep_prophet_df(yearly, "house_price")
    hp_fc = fit_forecast_prophet(hp_ts, years_ahead=years_ahead)
    
    inc_ts = prep_prophet_df(yearly, "annual_income")
    inc_fc = fit_forecast_prophet(inc_ts, years_ahead=years_ahead)
    
    # Convert ds -> year for frontend
    hp_fc["year"] = hp_fc["ds"].dt.year
    inc_fc["year"] = inc_fc["ds"].dt.year
    
    # Historical data
    hist_years = yearly["year"].tolist()
    hist_hp = yearly["house_price"].round(0).tolist()
    hist_inc = yearly["annual_income"].round(0).tolist()
    
    # Forecast data
    hp_out = hp_fc.sort_values("year")
    inc_out = inc_fc.sort_values("year")
    
    return {
        "title": "London overview forecast (mean across boroughs)",
        "history": {
            "years": hist_years,
            "house_price": hist_hp,
            "annual_income": hist_inc,
        },
        "forecast": {
            "years": hp_out["year"].tolist(),
            "house_price": {
                "yhat": hp_out["yhat"].round(0).tolist(),
                "lower": hp_out["yhat_lower"].round(0).tolist(),
                "upper": hp_out["yhat_upper"].round(0).tolist(),
            },
            "annual_income": {
                "yhat": inc_out["yhat"].round(0).tolist(),
                "lower": inc_out["yhat_lower"].round(0).tolist(),
                "upper": inc_out["yhat_upper"].round(0).tolist(),
            },
        },
        "meta": {
            "years_ahead": years_ahead,
            "note": "Projections are trend-based (Prophet on log-scale). Not causal; uncertainty grows with horizon."
        }
    }


# ----------------------------
# Borough series: exact per-year values for selected borough
# - supports exact match and partial match (e.g., "Westminster")
# ----------------------------
@app.get("/api/series")
def series(borough: str = Query(...)):
    key = borough.strip().lower()
    if not key:
        raise HTTPException(status_code=400, detail="Empty borough")

    # 1) exact match
    if key in borough_map:
        bname = borough_map[key]
    else:
        # 2) partial match
        matches = [b for b in boroughs if key in b.lower()]
        if not matches:
            raise HTTPException(status_code=404, detail="Borough not found")

        # If multiple matches, choose the shortest (often the most specific)
        # You can change this behavior if you want.
        matches = sorted(matches, key=len)
        bname = matches[0]

    d = df[df["Area"] == bname].sort_values("year")

    return {
        "title": bname,
        "years": d["year"].tolist(),
        "house_price": d["house_price"].round(0).tolist(),
        "annual_income": d["annual_income"].round(0).tolist(),
    }


@app.get("/api/forecast")
def forecast(borough: str = Query(...), years_ahead: int = Query(6, ge=1, le=20)):
    key = borough.strip().lower()
    if not key:
        raise HTTPException(status_code=400, detail="Empty borough")

    # Reusar tu lógica de match
    if key in borough_map:
        bname = borough_map[key]
    else:
        matches = [b for b in boroughs if key in b.lower()]
        if not matches:
            raise HTTPException(status_code=404, detail="Borough not found")
        matches = sorted(matches, key=len)
        bname = matches[0]

    d = df[df["Area"] == bname].sort_values("year").copy()

    # --- Precio ---
    hp_ts = prep_prophet_df(d, "house_price")
    hp_fc = fit_forecast_prophet(hp_ts, years_ahead=years_ahead)

    # --- Income ---
    inc_ts = prep_prophet_df(d, "annual_income")
    inc_fc = fit_forecast_prophet(inc_ts, years_ahead=years_ahead)

    # Convertir ds -> year para el front
    hp_fc["year"] = hp_fc["ds"].dt.year
    inc_fc["year"] = inc_fc["ds"].dt.year

    # Histórico (en escala original)
    hist_years = d["year"].tolist()
    hist_hp = d["house_price"].round(0).tolist()
    hist_inc = d["annual_income"].round(0).tolist()

    # Forecast (redondeado para UI)
    hp_out = hp_fc.sort_values("year")
    inc_out = inc_fc.sort_values("year")

    return {
        "title": f"{bname} forecast",
        "history": {
            "years": hist_years,
            "house_price": hist_hp,
            "annual_income": hist_inc,
        },
        "forecast": {
            "years": hp_out["year"].tolist(),  # mismo eje temporal
            "house_price": {
                "yhat": hp_out["yhat"].round(0).tolist(),
                "lower": hp_out["yhat_lower"].round(0).tolist(),
                "upper": hp_out["yhat_upper"].round(0).tolist(),
            },
            "annual_income": {
                "yhat": inc_out["yhat"].round(0).tolist(),
                "lower": inc_out["yhat_lower"].round(0).tolist(),
                "upper": inc_out["yhat_upper"].round(0).tolist(),
            },
        },
        "meta": {
            "years_ahead": years_ahead,
            "note": "Projections are trend-based (Prophet on log-scale). Not causal; uncertainty grows with horizon."
        }
    }


class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
def chat(request: ChatRequest):
    response = chatbot_service.get_response(request.message)
    return {"response": response}


