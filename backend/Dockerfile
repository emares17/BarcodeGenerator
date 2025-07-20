FROM python:3.11-slim

# Set working directory
WORKDIR /app

COPY arial.ttf /usr/share/fonts/truetype/arial.ttf

# Install system dependencies for pandas/PIL
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    fonts-dejavu-core \
    fonts-liberation \
    fontconfig \
    && fc-cache -fv \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies in specific order
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir numpy==1.24.3
RUN pip install --no-cache-dir pandas==2.0.3
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

RUN fc-cache -fv

# Create necessary directories
RUN mkdir -p uploads images sheets logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/auth/status || exit 1

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "app:app"]