FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies directly (no venv in container for simplicity)
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Default command (will be overridden by docker-compose)
CMD ["uvicorn", "app:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
