@echo off
setlocal
echo ==========================================
echo   SALEM DISTRICT GEOMMAND CENTER v2.5
echo   - TACTICAL OPERATIONS READY -
echo ==========================================
echo.

echo [1/5] Starting Docker Infrastructure...
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b
)

echo [2/5] Syncing Master Database...
timeout /t 5 /nobreak > nul
docker exec -i land_backend python manage.py migrate
docker exec -i land_backend python manage.py seed_data

echo [3/5] Launching Tactical Dashboard (React)...
start "Tactical Dashboard" cmd /k "cd frontend && npm run dev"

echo [4/5] Launching Field Officer App (Flutter)...
start "Field Officer App" cmd /k "cd field_officer_app && flutter run -d chrome --web-port 5174"

echo [5/5] Initializing AI Intelligence Node...
start "AI Command Center" cmd /k "python scripts/ai_simulation.py"

echo.
echo ==========================================
echo   SYSTEM ONLINE - MISSION READY
echo   - Tactical Dashboard: http://localhost:5173
echo   - Field Mission App:  http://localhost:5174
echo   - Command Backend:    http://localhost:8000/admin/
echo   - Spatial Engine:     http://localhost:8081/geoserver
echo ==========================================
echo.

set /p choice="Would you like to OPEN ALL COMMAND PORTALS now? (y/n): "

if /i "%choice%"=="y" (
    echo Opening all command portals...
    start "" "http://localhost:5173"
    start "" "http://localhost:5174"
    start "" "http://localhost:8000/admin/"
    start "" "http://localhost:8081/geoserver"
) else (
    echo.
    echo Portals not opened automatically. Access them manually via the links above.
)

echo.
echo System session active. Press any key to exit monitor.
pause
