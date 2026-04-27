@echo off
setlocal
echo ==========================================
echo   SALEM DISTRICT GEOMMAND CENTER v2.0
echo ==========================================
echo.

echo [1/4] Starting Docker Infrastructure...
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b
)

echo [2/4] Syncing Master Database...
timeout /t 5 /nobreak > nul
docker exec -i land_backend python manage.py migrate
docker exec -i land_backend python manage.py seed_data

echo [3/4] Launching Official Command Center (Admin)...
start "Official Dashboard" cmd /k "cd frontend && npm run dev"

echo [4/4] Launching Field Officer Native App (Flutter)...
start "Field Officer App" cmd /k "cd field_officer_app && flutter run -d chrome --web-port 5174"

echo [INFO] Starting AI Monitoring Node...
start "AI Command Center" cmd /k "python scripts/ai_simulation.py"

echo.
echo ==========================================
echo   SYSTEM ONLINE - SUCCESS
echo   - Admin Panel: http://localhost:5173
echo   - Field Officer App (Flutter Web): http://localhost:5174
echo   - Backend API: http://localhost:8000/admin/
echo ==========================================
echo.

echo Launching browser portals...
timeout /t 10 /nobreak > nul
start "" "http://localhost:5173"
start "" "http://localhost:5174"
start "" "http://localhost:8000/admin/"

echo Press any key to shutdown session monitor.
pause
