@echo off
setlocal EnableDelayedExpansion
echo ==========================================
echo   TAMIL NADU STATEWIDE GEOMMAND CENTER v2.5
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

REM ── 1/5 DOCKER INFRASTRUCTURE ────────────────────────────────────────────────
echo [1/5] Starting Docker Infrastructure...
docker compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo [FATAL ERROR] Docker failed to start infrastructure. Please verify Docker Desktop is running.
    pause
    exit /b %ERRORLEVEL%
)

REM ── 2/5 MASTER DATABASE MIGRATION & DEMO PROVISIONING ─────────────────────────
echo [2/5] Syncing Master Database and Seeding Demo Roles...
timeout /t 3 /nobreak > nul

REM Apply schema migrations first
echo Applying database migrations...
docker exec -e GEOMMAND_ENV=demo -i land_backend python manage.py migrate
if %ERRORLEVEL% NEQ 0 (
    echo [FATAL ERROR] Database migration failed with exit code %ERRORLEVEL%!
    echo Startup halted to protect data integrity. Inspect backend container logs.
    pause
    exit /b %ERRORLEVEL%
)

REM Provision multi-district demonstration users
echo Provisioning demonstration officer accounts...
docker exec -e GEOMMAND_ENV=demo -i land_backend python manage.py seed_demo_users
if %ERRORLEVEL% NEQ 0 (
    echo [FATAL ERROR] Demo user provisioning failed with exit code %ERRORLEVEL%!
    pause
    exit /b %ERRORLEVEL%
)

REM ── 3/5 TACTICAL DASHBOARD ───────────────────────────────────────────────────
echo [3/5] Launching Tactical Dashboard (React)...
start "Tactical Dashboard" cmd /k "cd frontend && npm run dev"

REM ── 4/5 FIELD OFFICER APP ────────────────────────────────────────────────────
echo [4/5] Launching Field Officer App (Flutter)...
start "Field Officer App" cmd /k "cd field_officer_app && flutter run -d chrome --web-port 5174"

REM ── 5/5 AI SATELLITE NODE ────────────────────────────────────────────────────
echo [5/5] Initializing AI Intelligence Node...
start "AI Command Center" cmd /k "set GEOMMAND_ENV=demo&& python scripts/ai_simulation.py"

echo.
echo ==========================================
echo   SYSTEM ONLINE - MISSION READY
echo.
echo   Tactical Dashboard: http://localhost:5173
echo   Field Mission App:  http://localhost:5174
echo   Command Backend:    http://localhost:8000/admin-secure-portal/
echo   Spatial Engine:     http://localhost:8081/geoserver
echo.
echo   DEMO CREDENTIALS:
echo   - Collector Salem:       collector_salem / DemoAdmin@2026!
echo   - Collector Coimbatore:  collector_coimbatore / DemoAdmin@2026!
echo   - State Apex Officer:    state_apex_officer / DemoAdmin@2026!
echo   - Field VAO:             vao_kannankurichi / DemoAdmin@2026!
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
    start "" "http://localhost:8000/admin-secure-portal/"
    start "" "http://localhost:8081/geoserver"
) else (
    echo.
    echo Portals not opened automatically. Access them manually via the links above.
)

echo.
echo System session active. Press any key to exit monitor.
pause
