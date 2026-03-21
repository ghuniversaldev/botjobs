@echo off
SET PROJECT=%~dp0

echo Starting BotJobs backend...
start "BotJobs Backend" cmd /k "cd /d "%PROJECT%src\backend" && .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo Starting BotJobs frontend...
start "BotJobs Frontend" cmd /k "cd /d "%PROJECT%src\frontend" && npm run dev"

echo.
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:3001
echo.
echo Beide Fenster oeffnen sich separat. Zum Stoppen die jeweiligen Fenster schliessen.
