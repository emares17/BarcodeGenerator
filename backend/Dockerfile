FROM python:3.11-slim

# Set working directory
WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    curl \
    wget \
    cabextract \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

RUN echo "deb http://deb.debian.org/debian bookworm contrib" >> /etc/apt/sources.list && \
    apt-get update && \
    echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections && \
    apt-get install -y ttf-mscorefonts-installer && \
    rm -rf /var/lib/apt/lists/*

# Rebuild font cache
RUN fc-cache -fv

# Verify Arial is installed (for debugging)
RUN fc-list | grep -i arial || echo "Arial not found in font list"

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