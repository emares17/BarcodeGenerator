FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    curl \
    wget \
    cabextract \
    fontconfig \
    fonts-dejavu-core \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Install MS Core Fonts (including Arial)
# Using timeout and retry for network reliability
RUN mkdir -p /tmp/msfonts && \
    cd /tmp/msfonts && \
    timeout 60 wget -q --tries=3 --no-check-certificate https://downloads.sourceforge.net/corefonts/arial32.exe && \
    timeout 60 wget -q --tries=3 --no-check-certificate https://downloads.sourceforge.net/corefonts/arialb32.exe && \
    cabextract -q *.exe && \
    mkdir -p /usr/share/fonts/truetype/msttcorefonts && \
    cp *.ttf *.TTF /usr/share/fonts/truetype/msttcorefonts/ 2>/dev/null || true && \
    chmod 644 /usr/share/fonts/truetype/msttcorefonts/* && \
    cd / && \
    rm -rf /tmp/msfonts && \
    fc-cache -f -v

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir numpy==1.24.3 && \
    pip install --no-cache-dir pandas==2.0.3 && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads images sheets logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/auth/status || exit 1

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "app:app"]