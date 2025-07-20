FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies including fonts
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    curl \
    fonts-dejavu-core \
    fonts-dejavu-extra \
    fonts-liberation \
    fonts-liberation2 \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Rebuild font cache
RUN fc-cache -fv

# List available fonts for debugging
RUN fc-list | grep -i "dejavu\|liberation" || true

# Set font configuration to prefer Liberation Sans, then DejaVu Sans
RUN echo '<?xml version="1.0"?>' > /etc/fonts/local.conf && \
    echo '<!DOCTYPE fontconfig SYSTEM "fonts.dtd">' >> /etc/fonts/local.conf && \
    echo '<fontconfig>' >> /etc/fonts/local.conf && \
    echo '  <alias>' >> /etc/fonts/local.conf && \
    echo '    <family>sans-serif</family>' >> /etc/fonts/local.conf && \
    echo '    <prefer>' >> /etc/fonts/local.conf && \
    echo '      <family>Liberation Sans</family>' >> /etc/fonts/local.conf && \
    echo '      <family>DejaVu Sans</family>' >> /etc/fonts/local.conf && \
    echo '    </prefer>' >> /etc/fonts/local.conf && \
    echo '  </alias>' >> /etc/fonts/local.conf && \
    echo '  <alias>' >> /etc/fonts/local.conf && \
    echo '    <family>Arial</family>' >> /etc/fonts/local.conf && \
    echo '    <prefer>' >> /etc/fonts/local.conf && \
    echo '      <family>Liberation Sans</family>' >> /etc/fonts/local.conf && \
    echo '      <family>DejaVu Sans</family>' >> /etc/fonts/local.conf && \
    echo '    </prefer>' >> /etc/fonts/local.conf && \
    echo '  </alias>' >> /etc/fonts/local.conf && \
    echo '</fontconfig>' >> /etc/fonts/local.conf && \
    fc-cache -fv

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

# Expose port (will use $PORT env variable)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/auth/status || exit 1

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "app:app"]