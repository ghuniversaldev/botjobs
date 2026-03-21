#!/usr/bin/env bash
# BotJobs.ch — Local dev starter
# Usage: bash start.sh

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting BotJobs backend + frontend..."

# Backend
bash -c "
  cd '$PROJECT_DIR/src/backend'
  source .venv/Scripts/activate
  echo '[backend] Starting on http://localhost:8000'
  uvicorn app.main:app --reload --port 8000
" &
BACKEND_PID=$!

# Give backend a moment to initialize
sleep 2

# Frontend
bash -c "
  cd '$PROJECT_DIR/src/frontend'
  echo '[frontend] Starting on http://localhost:3001'
  npm run dev
" &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:8000/docs"
echo "  Frontend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both."

# Stop both on Ctrl+C
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
