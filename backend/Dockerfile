FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for ffmpeg (required by spotdl and yt-dlp)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Expose the API port
EXPOSE 5000

# Run the application
CMD ["python", "app.py"]
