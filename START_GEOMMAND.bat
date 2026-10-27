@echo off
setlocal EnableDelayedExpansion
echo ==========================================
echo   SALEM DISTRICT GEOMMAND CENTER v2.5
echo   - TACTICAL OPERATIONS READY -
echo ==========================================
echo.

REM ── AUTO-DETECT CURRENT WI-FI IP ─────────────────────────────────────────────
set WIFI_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address" ^| findstr /V "172\. 169\."') do (
    set IP_RAW=%%a
    set IP_RAW=!IP_RAW: =!
    if not defined WIFI_IP set WIFI_IP=!IP_RAW!
)

if not defined WIFI_IP set WIFI_IP=127.0.0.1

echo  ** CURRENT PC Wi-Fi IP: %WIFI_IP% **
echo  ** Mobile App Backend: http://%WIFI_IP%:8000 **
echo  ** Use this IP in the app if it shows "Cannot connect" **
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
echo.
echo   Tactical Dashboard: http://localhost:5173
echo   Field Mission App:  http://localhost:5174
echo   Command Backend:    http://localhost:8000/admin/
echo   Spatial Engine:     http://localhost:8081/geoserver
echo.
echo   MOBILE APK BACKEND: http://%WIFI_IP%:8000
echo   ^(Use the IP above in the Flutter app's "Configure Backend IP" dialog^)
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
