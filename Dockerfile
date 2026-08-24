# Use an official lightweight Python image
FROM python:3.10-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    HOME=/home/user

# Create a non-root user (Hugging Face Spaces runs as user 1000)
RUN useradd -m -u 1000 user

# Set working directory
WORKDIR $HOME/app

# Install system dependencies (curl for container health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first to leverage Docker layer caching
COPY --chown=user:user requirements.txt .

# Upgrade pip and install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application files and model
COPY --chown=user:user main.py .
COPY --chown=user:user Mental_Health_Model.pkl .

# Switch to non-root user for security
USER user

# Expose port 7860 (Hugging Face Spaces standard port)
EXPOSE 7860

# Health check to ensure the container is responsive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# Start the FastAPI server using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
