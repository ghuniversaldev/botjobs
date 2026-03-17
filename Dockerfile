# ---- Backend ----
FROM python:3.12-slim AS backend
WORKDIR /app
COPY src/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/backend/ .
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
