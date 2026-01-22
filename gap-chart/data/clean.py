import pandas as pd
from pathlib import Path
import re

# ============================
# FILES
# ============================
PRICE_FILE = Path("cleaned_data.xlsx")                 # UK HPI (monthly)
INCOME_FILE = Path("earnings-residence-borough.xlsx") # Income workbook
OUT_FILE = Path("merged_annual_with_wide_views.xlsx")  # Final output (multi-sheet)

INCOME_SHEET = "Total, weekly"

START_YEAR = 2002
END_YEAR = 2024

DROP_AREAS = {"City of London"}  # set() if you want to keep it


# ============================
# HELPERS
# ============================
def normalize_area(s: str) -> str:
    """Normalize borough names so both datasets match."""
    if pd.isna(s):
        return ""
    s = str(s).lower().strip()
    s = s.replace("&", "and")
    s = re.sub(r"[’']", "", s)
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


# ============================
# 1) HOUSE PRICES (monthly -> annual MEAN)
# ============================
price_raw = pd.read_excel(PRICE_FILE, header=None)

# Borough names are in row 0, from col 1 onward
boroughs = price_raw.iloc[0, 1:].astype(str).str.strip().tolist()

price = price_raw.iloc[2:, :].copy()
price.columns = ["date"] + boroughs
price["date"] = pd.to_datetime(price["date"], errors="coerce")

for b in boroughs:
    price[b] = pd.to_numeric(price[b], errors="coerce")

price["year"] = price["date"].dt.year
price = price[(price["year"] >= START_YEAR) & (price["year"] <= END_YEAR)].copy()

# Monthly long
price_long = price.melt(
    id_vars=["year"],
    value_vars=boroughs,
    var_name="Area",
    value_name="house_price"
).dropna(subset=["house_price"])

price_long["Area"] = price_long["Area"].astype(str).str.strip()
price_long = price_long[~price_long["Area"].isin(DROP_AREAS)].copy()
price_long["area_norm"] = price_long["Area"].apply(normalize_area)

# Annual mean per borough-year
price_annual = (
    price_long
    .groupby(["area_norm", "Area", "year"], as_index=False)
    .agg(house_price=("house_price", "mean"))
)

# ============================
# 2) INCOME (weekly -> annual)
# ============================
income_raw = pd.read_excel(INCOME_FILE, sheet_name=INCOME_SHEET, header=[0, 1])

# First two columns = Code, Area
income_meta = income_raw.iloc[:, :2].copy()
income_meta.columns = ["Code", "Area"]

# Only Pay columns (ignore conf %)
pay_cols = [
    c for c in income_raw.columns
    if isinstance(c, tuple) and str(c[1]).strip().lower().startswith("pay")
]

if not pay_cols:
    raise ValueError("No Pay columns found (Pay (£)). Check your income sheet headers.")

income = pd.concat([income_meta, income_raw[pay_cols]], axis=1)

income["Code"] = income["Code"].astype(str).str.strip()
income["Area"] = income["Area"].astype(str).str.strip()

# Only borough rows (codes like 00AA)
income = income[income["Code"].str.match(r"^00[A-Z0-9]{2}$", na=False)].copy()
income = income[~income["Area"].isin(DROP_AREAS)].copy()

# Convert to numeric (comma decimals, !/#)
for c in pay_cols:
    income[c] = (
        income[c]
        .astype(str)
        .str.replace(",", ".", regex=False)
        .replace({"!": None, "#": None})
    )
    income[c] = pd.to_numeric(income[c], errors="coerce")

# Wide -> long annual
income_long = income.melt(
    id_vars=["Area"],
    value_vars=pay_cols,
    var_name="year_pay",
    value_name="weekly_income"
).dropna(subset=["weekly_income"])

income_long["year"] = income_long["year_pay"].apply(lambda t: int(t[0]))
income_long = income_long[(income_long["year"] >= START_YEAR) & (income_long["year"] <= END_YEAR)].copy()

income_long["area_norm"] = income_long["Area"].apply(normalize_area)
income_long["annual_income"] = income_long["weekly_income"] * 52
income_long["monthly_income"] = income_long["annual_income"] / 12

income_annual = income_long[["area_norm", "year", "annual_income", "monthly_income"]].copy()

# ============================
# 3) MERGE + RATIO
# ============================
merged = price_annual.merge(
    income_annual,
    on=["area_norm", "year"],
    how="inner"
)

merged["price_to_income_ratio"] = merged["house_price"] / merged["annual_income"]

# Clean, readable rounding (optional but recommended)
merged["house_price"] = merged["house_price"].round(0)
merged["annual_income"] = merged["annual_income"].round(0)
merged["monthly_income"] = merged["monthly_income"].round(0)
merged["price_to_income_ratio"] = merged["price_to_income_ratio"].round(2)

# Keep a nice long-format table
merged_long = merged[[
    "year", "Area", "house_price", "annual_income", "monthly_income", "price_to_income_ratio"
]].sort_values(["Area", "year"]).copy()

# ============================
# 4) WIDE VIEWS (compact)
# ============================
ratio_wide = merged_long.pivot(index="year", columns="Area", values="price_to_income_ratio").sort_index()
price_wide = merged_long.pivot(index="year", columns="Area", values="house_price").sort_index()
income_wide = merged_long.pivot(index="year", columns="Area", values="annual_income").sort_index()

# ============================
# 5) SAVE (multi-sheet Excel)
# ============================
with pd.ExcelWriter(OUT_FILE, engine="xlsxwriter") as writer:
    merged_long.to_excel(writer, index=False, sheet_name="merged_annual_long")
    ratio_wide.to_excel(writer, sheet_name="ratio_annual_wide")
    price_wide.to_excel(writer, sheet_name="house_price_annual_wide")
    income_wide.to_excel(writer, sheet_name="annual_income_wide")

print("✅ Saved:", OUT_FILE)
print("Long rows:", len(merged_long))
print("Years x Boroughs (ratio wide):", ratio_wide.shape)
