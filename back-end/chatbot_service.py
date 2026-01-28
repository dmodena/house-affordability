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
        """Loads and prepares the data context for the chatbot, including forecasts + rental dataset."""
        try:
            base_dir = Path(__file__).resolve().parent

            # ---- MAIN MERGED DATA ----
            data_path = base_dir / "data" / "merged_final.xlsx"
            df = pd.read_excel(data_path, sheet_name="merged_annual_long")

            # Historical clean
            df["year"] = pd.to_numeric(df["year"], errors="coerce")
            df["house_price"] = pd.to_numeric(df["house_price"], errors="coerce")
            df["annual_income"] = pd.to_numeric(df["annual_income"], errors="coerce")
            df = df.dropna(subset=["year", "house_price", "annual_income"]).copy()
            df["year"] = df["year"].astype(int)

            df_sorted = df.sort_values(["Area", "year"])
            min_year = df["year"].min()
            max_year = df["year"].max()

            self.context = f"HISTORICAL DATA ({min_year}-{max_year}):\n"
            self.context += df_sorted[["year", "Area", "house_price", "annual_income"]].to_string(index=False)

            # Forecast
            self.context += "\n\nFORECAST DATA (London Average for next 4 years based on Prophet):\n"
            self.context += self._generate_london_forecast(df)

            # ---- RENTAL DATA ----
            rental_text = self._load_rental_context(base_dir)
            self.context += "\n\n" + rental_text

            print(f"Loaded data from {data_path}, generated forecasts, and loaded rental context.")

        except Exception as e:
            print(f"Error loading chatbot data: {e}")
            import traceback
            traceback.print_exc()
            self.context = "Data not available at the moment."

    def _load_rental_context(self, base_dir: Path) -> str:
        """
        Loads borough rental prices and returns a compact text block for model context.
        NOW CORRECTLY HANDLES THE EXACT EXCEL STRUCTURE FROM THE IMAGE.
        """
        # La ruta correcta ahora que lo moviste a la carpeta data/
        rental_path = base_dir / "data" / "rental_price_per_borough.xlsx"
        
        if not rental_path.exists():
            error_msg = f"RENTAL PRICES BY BOROUGH: File not found at {rental_path}"
            print(error_msg)
            # Intentar buscar en otras ubicaciones
            alt_paths = [
                base_dir / "rental_price_per_borough.xlsx",
                base_dir.parent / "rental_price_per_borough.xlsx",
            ]
            for alt in alt_paths:
                if alt.exists():
                    rental_path = alt
                    print(f"✓ Found at alternative location: {rental_path}")
                    break
            else:
                return error_msg

        try:
            # Leer el archivo Excel
            print(f"📂 Attempting to read: {rental_path}")
            rent_df = pd.read_excel(rental_path, header=0)  # header=0 para asegurar que la primera fila es el header
            
            print(f"✓ Loaded rental data: {rent_df.shape[0]} rows, {rent_df.shape[1]} columns")
            print(f"📋 Raw columns found: {list(rent_df.columns)}")

            # Limpiar nombres de columnas (quitar espacios extra, etc.)
            rent_df.columns = rent_df.columns.str.strip()
            
            print(f"📋 Cleaned columns: {list(rent_df.columns)}")

            # Verificar si las columnas esperadas existen (basado en tu imagen)
            expected_cols = {
                'Area code': 'area_code',
                'Area name': 'borough',
                'Rental price one bed': 'rent_1bed',
                'Rental price two bed': 'rent_2bed',
                'Rental price three bed': 'rent_3bed',
                'Rental price four or more bed': 'rent_4plus_bed',
                'Rental price': 'rent_avg'
            }
            
            # Identificar qué columnas realmente existen
            cols_found = {}
            cols_missing = []
            
            for expected_col, new_name in expected_cols.items():
                if expected_col in rent_df.columns:
                    cols_found[expected_col] = new_name
                    print(f"  ✓ Found: {expected_col}")
                else:
                    cols_missing.append(expected_col)
                    print(f"  ✗ Missing: {expected_col}")
            
            if 'Area name' not in cols_found:
                return f"ERROR: Critical column 'Area name' not found. Available columns: {list(rent_df.columns)}"
            
            # Seleccionar solo las columnas que existen
            cols_to_use = list(cols_found.keys())
            rent_df = rent_df[cols_to_use].copy()
            
            # Renombrar columnas
            rent_df = rent_df.rename(columns=cols_found)
            
            print(f"✓ Selected {len(cols_to_use)} columns: {list(rent_df.columns)}")

            # Convertir columnas de precios a numérico
            price_cols = [col for col in rent_df.columns if col.startswith('rent_')]
            for col in price_cols:
                rent_df[col] = pd.to_numeric(rent_df[col], errors='coerce')
                print(f"  → Converted {col} to numeric")
            
            # Eliminar filas sin nombre de borough
            before_rows = len(rent_df)
            rent_df = rent_df.dropna(subset=['borough'])
            after_rows = len(rent_df)
            print(f"✓ Cleaned data: {before_rows} → {after_rows} rows (removed {before_rows - after_rows} empty)")
            
            # Ordenar por borough alfabéticamente
            rent_df = rent_df.sort_values('borough').reset_index(drop=True)

            # Crear el contexto de texto para el modelo
            text = "=" * 100 + "\n"
            text += "RENTAL PRICES BY BOROUGH (Monthly Prices in £)\n"
            text += "=" * 100 + "\n\n"
            
            # Formatear cada fila de manera legible
            for idx, row in rent_df.iterrows():
                text += f"{row['borough']}:\n"
                
                if 'rent_1bed' in row and pd.notna(row['rent_1bed']):
                    text += f"  • 1 bed: £{int(row['rent_1bed'])}\n"
                if 'rent_2bed' in row and pd.notna(row['rent_2bed']):
                    text += f"  • 2 bed: £{int(row['rent_2bed'])}\n"
                if 'rent_3bed' in row and pd.notna(row['rent_3bed']):
                    text += f"  • 3 bed: £{int(row['rent_3bed'])}\n"
                if 'rent_4plus_bed' in row and pd.notna(row['rent_4plus_bed']):
                    text += f"  • 4+ bed: £{int(row['rent_4plus_bed'])}\n"
                if 'rent_avg' in row and pd.notna(row['rent_avg']):
                    text += f"  • Average: £{int(row['rent_avg'])}\n"
                
                text += "\n"
            
            text += "=" * 100 + "\n"
            text += f"Total boroughs: {len(rent_df)}\n"
            text += f"Data source: {rental_path.name}\n"
            text += "=" * 100
            
            print(f"✓ Successfully formatted rental context with {len(rent_df)} boroughs")
            return text

        except Exception as e:
            error_msg = f"ERROR loading rental data from {rental_path}:\n{str(e)}"
            print(error_msg)
            import traceback
            traceback.print_exc()
            return error_msg

    def _generate_london_forecast(self, df: pd.DataFrame) -> str:
        """Generates a text summary of London-wide forecasts."""
        try:
            yearly = (
                df.groupby("year", as_index=False)
                .agg(house_price=("house_price", "mean"))
                .sort_values("year")
            )

            hp_ts = prep_prophet_df(yearly, "house_price")
            fc = fit_forecast_prophet(hp_ts, years_ahead=3)

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

        system_prompt = """
You are an expert assistant specialized in housing affordability in London and nearby commuter areas.

PRIMARY BEHAVIOR (CRITICAL)
- Always use information already provided in the conversation.
- NEVER ask again for salary, budget, or income if the user already gave it.
- NEVER ask again for max price if the user already gave it.
- If the user repeats information, acknowledge it and move forward.
- Do NOT loop on the same generic advice.

TONE & STYLE
- Natural, concise, human.
- No robotic phrasing.
- No long explanations.
- 4–8 lines max in most replies.

CONTEXT HANDLING (INTERNAL — DO NOT DISPLAY)
Internally track:
- Salary / household income
- Max property price
- Budget constraints (e.g. 30%)
- Property type preference
- Commute needs

Once a value is known:
- Treat it as FACT.
- Do NOT ask for it again.
- Use it to give more specific recommendations.

WHEN USER PROVIDES:
Salary = £70,000
Max price = £400,000
→ You MUST stop asking for income or max price and give narrowed recommendations.

AFFORDABILITY CALC
Only run if salary + property price are both known.
Use:
- fee = salary * 0.3
- months = price * 1.045 / fee
- years = floor(months/12)
- remainingMonths = floor(months) - years*12
Present in one natural sentence.

NOT AFFORDABLE → RENTAL RECOMMENDATION (IMPORTANT)
If the affordability calc indicates it is not realistically affordable (e.g., years >= 12),
you MUST also recommend renting instead:
- Use the RENTAL PRICES BY BOROUGH context if the user mentions a borough or gives a shortlist.
- If no borough is specified, give a London-wide typical range using the context averages (or suggest 2–3 outer boroughs with lower rents).
- Mention the relevant bedroom category if known; otherwise default to 1-bed (or ask ONE question: "How many bedrooms do you need?").

IF YOU CAN'T GIVE A GOOD ANSWER
If you cannot produce a confident, helpful answer from the provided context, say:
"Please contact us — we'll be happy to help."

QUESTION RULE (VERY IMPORTANT)
- Ask at most ONE question.
- Only ask if it unlocks NEW information.
- Never ask for information already given.

DEFAULT OUTPUT SHAPE
- One sentence grounding in known facts
- 4–6 concrete suggestions
- 1 smart follow-up question (only if needed)

DATA CONTEXT:
"""

        full_prompt = f"{system_prompt}\n{self.context}\n\nUSER QUESTION: {user_message}"

        try:
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            print(f"Error generating response: {e}")
            return "I apologize, but I am having trouble processing your request right now. Please contact us — we'll be happy to help."