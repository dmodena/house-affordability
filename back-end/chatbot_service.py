import google.generativeai as genai
import pandas as pd
import numpy as np
import os
from pathlib import Path
from dotenv import load_dotenv
from forecast_model import prep_prophet_df, fit_forecast_prophet

# Load environment variables
load_dotenv()

class ChatbotService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("WARNING: GEMINI_API_KEY not found in environment variables.")
        else:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        self.context = ""
        self._load_data()

    def _load_data(self):
        """Loads and prepares the data context for the chatbot, including forecasts."""
        try:
            base_dir = Path(__file__).resolve().parent
            data_path = base_dir / "data" / "merged_final.xlsx"
            
            df = pd.read_excel(data_path, sheet_name="merged_annual_long")
            
            # 1. Historical Data Clean
            df["year"] = pd.to_numeric(df["year"], errors="coerce")
            df["house_price"] = pd.to_numeric(df["house_price"], errors="coerce")
            df["annual_income"] = pd.to_numeric(df["annual_income"], errors="coerce")
            df = df.dropna(subset=["year", "house_price", "annual_income"]).copy()
            df["year"] = df["year"].astype(int)
            
            # FULL HISTORICAL DATA (2002-2024)
            # Sorting by Area then Year for clarity
            df_sorted = df.sort_values(["Area", "year"])
            
            min_year = df["year"].min()
            max_year = df["year"].max()
            
            self.context = f"HISTORICAL DATA ({min_year}-{max_year}):\n"
            # Include Year, Area, Price, Income. 
            self.context += df_sorted[["year", "Area", "house_price", "annual_income"]].to_string(index=False)
            
            # 2. Generate Trend Forecast (London Average)
            self.context += "\n\nFORECAST DATA (London Average for next 3 years based on Prophet):\n"
            forecast_text = self._generate_london_forecast(df)
            self.context += forecast_text

            print(f"Loaded data from {data_path} and generated forecasts.")
            
        except Exception as e:
            print(f"Error loading chatbot data: {e}")
            self.context = "Data not available at the moment."

    def _generate_london_forecast(self, df: pd.DataFrame) -> str:
        """Generates a text summary of London-wide forecasts."""
        try:
            # Group by year for London average
            yearly = (
                df.groupby("year", as_index=False)
                .agg(house_price=("house_price", "mean"))
                .sort_values("year")
            )
            
            # Use shared forecast model
            # 1. Prepare Data
            hp_ts = prep_prophet_df(yearly, "house_price")
            
            # 2. Fit and Forecast (3 years ahead)
            # Note: fit_forecast_prophet returns a dataframe with 'ds', 'yhat', 'yhat_lower', 'yhat_upper'
            fc = fit_forecast_prophet(hp_ts, years_ahead=3)
            
            # Extract future years
            last_hist_year = yearly["year"].max()
            fc["year"] = fc["ds"].dt.year
            future_fc = fc[fc["year"] > last_hist_year].copy()
            
            summary = ""
            for _, row in future_fc.iterrows():
                summary += f"Year {row['year']}: Predicted Mean House Price £{row['yhat']:,.0f}\n"
            
            return summary
        except Exception as e:
            return f"Could not generate forecast: {e}"

    def get_response(self, user_message: str) -> str:
        if not self.api_key:
            return "Error: Gemini API Key is missing. Please configure the backend."

        system_prompt = """You are an expert assistant specialized in housing affordability in London.

You must follow these instructions:
1. **Short and Concise**: Give answers that are brief and to the point. Avoid lengthy explanations unless asked.
2. **Prophet Forecasts**: When asked about the future, explicitly state that predictions are based on the "Prophet forecasting model" provided in the context.
3. **Data-Driven**: Use the provided HISTORICAL DATA and FORECAST DATA. Do not hallucinate numbers.
4. **Tone**: Professional, neutral, and helpful.

DATA CONTEXT:
"""
        
        full_prompt = f"{system_prompt}\n{self.context}\n\nUSER QUESTION: {user_message}"
        
        try:
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            print(f"Error generating response: {e}")
            return "I apologize, but I am having trouble processing your request right now."
