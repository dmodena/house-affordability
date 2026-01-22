# Gap-Chart - House Affordability Analysis

This component analyzes and forecasts house prices and annual income trends across London boroughs using Facebook Prophet for time-series forecasting and FastAPI for the backend.

## What This Does

-  Visualizes historical house prices and annual income data for London boroughs
-  Provides overview statistics across all boroughs
-  Forecasts future trends up to 5 years ahead using Facebook Prophet
-  Interactive web interface for data exploration

### 1. Clone the Repository

```bash
git clone https://github.com/dmodena/house-affordability
cd DSProject
```

### 2. Navigate to the Gap-Chart Directory

```bash
cd house-affordability\gap-chart
```

### 3. Create a Virtual Environment (This is not fully necesary, but if you want you could make it)

Creating a virtual environment isolates your project dependencies from other Python projects.

**On Windows:**
```bash
python -m venv venv
```

**On macOS/Linux:**
```bash
python3 -m venv venv
```

### 4. Activate the Virtual Environment

**On Windows (PowerShell):**
```bash
.\venv\Scripts\activate
```

**On Windows (Command Prompt):**
```bash
venv\Scripts\activate.bat
```

**On macOS/Linux:**
```bash
source venv/bin/activate
```

> **Note:** You should see `(venv)` appear at the beginning of your terminal prompt, indicating the virtual environment is active.

### 5. Install Required Dependencies

This will install all necessary Python packages including FastAPI, Prophet, Pandas, and Uvicorn.

```bash
pip install -r requirements.txt
```

> **Installation may take a few minutes** as Prophet and its dependencies are being installed.

### 6. Run the Application

Start the FastAPI development server with auto-reload enabled:

(remember you should be in the gap-chart folder)

```bash
uvicorn app:app --reload
```

You should see output similar to:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 7. Access the Application

Open your web browser and navigate to:

- **Main Interface:** `http://127.0.0.1:8000`
- **API Documentation (Swagger):** `http://127.0.0.1:8000/docs`
- **Alternative API Docs (ReDoc):** `http://127.0.0.1:8000/redoc`

## How to Use

Once the application is running:

1. **Open the main interface** at `http://127.0.0.1:8000`
2. **Search for a London borough** (e.g., "Westminster", "Camden", "Tower Hamlets")
3. **View historical data** and forecasted trends
4. **Explore the interactive API documentation** at `http://127.0.0.1:8000/docs`

## API Endpoints Overview

The application provides four main endpoints:

### 1. Home Page
**GET** `/` - Main web interface with borough search

### 2. Get All Boroughs
**GET** `/api/boroughs` - Returns list of all available London boroughs

### 3. London Overview
**GET** `/api/overview` - Returns mean house prices and income across all boroughs

### 4. Borough-Specific Data
**GET** `/api/series?borough={name}` - Returns historical data for a specific borough

Example:
```
http://127.0.0.1:8000/api/series?borough=Westminster
```

### 5. Forecast
**GET** `/api/forecast?borough={name}&years_ahead={years}` - Returns historical data and Prophet-based forecasts

Parameters:
- `borough` (required): Borough name
- `years_ahead` (optional): Number of years to forecast (1-20, default: 6)

Example:
```
http://127.0.0.1:8000/api/forecast?borough=Camden&years_ahead=5
```

## Project Structure

```
gap-chart/
├── app.py                 # Main FastAPI application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── data/                 # Data directory
│   └── merged_final.xlsx # Main data source (London boroughs data)
├── templates/            # HTML templates
│   └── index.html       # Main interface
└── static/              # Static assets (CSS, JS)
```

## Troubleshooting

### Port Already in Use
If you see an error that port 8000 is already in use, use a different port:
```bash
uvicorn app:app --reload --port 8001
```
Then access the app at `http://127.0.0.1:8001`

### Virtual Environment Not Activating (Windows)
If you get a PowerShell execution policy error, run:
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then try activating the virtual environment again.

### Prophet Installation Issues (Windows)
If Prophet fails to install:
1. Install Microsoft C++ Build Tools from [Visual Studio](https://visualstudio.microsoft.com/downloads/)
2. Or use conda instead: `conda install -c conda-forge prophet`

### Data File Not Found
Ensure `data/merged_final.xlsx` exists with the sheet named "merged_annual_long".

### Module Not Found Error
Make sure:
1. Your virtual environment is activated (you should see `(venv)` in your terminal)
2. All dependencies are installed: `pip install -r requirements.txt`

## Stopping the Application

Press `CTRL+C` in the terminal where uvicorn is running to stop the server.

To deactivate the virtual environment:
```bash
deactivate
```

## Additional Notes

- The data covers London boroughs with yearly house prices and annual income
- Forecasts are trend-based predictions and may not account for economic events
- The Prophet model requires at least 8 historical data points for forecasting
- Uncertainty in forecasts increases with longer time horizons

## Need Help?

- Check the **interactive API docs** at `http://127.0.0.1:8000/docs` for detailed endpoint information
- Review error messages in the terminal where uvicorn is running
- Ensure all installation steps were completed successfully

---

**Part of DSProject - House Affordability Analysis**

