# ML Training Pipeline Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy training scripts
COPY . .

# Create models directory
RUN mkdir -p /models

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run training scheduler
CMD ["python", "train_scheduler.py"]