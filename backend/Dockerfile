FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create non-root user with UID 5001 (to match host requirement)
RUN addgroup --gid 5001 appuser \
    && adduser --uid 5001 --gid 5001 --disabled-password --gecos "" appuser \
    && mkdir -p /data \
    && chown -R appuser:appuser /app /data

USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
