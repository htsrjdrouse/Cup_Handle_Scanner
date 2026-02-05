# Cup & Handle Scanner V2 - Docker
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for matplotlib
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY cup_handle_scanner_2.py .

# Expose port
EXPOSE 5002

# Run with gunicorn for production
CMD ["python", "cup_handle_scanner_2.py"]
