# Creates / refreshes the isolated Playwright stack. NEVER touches land_records.
#   - database land_records_e2e   (restored copy of the demo DB, dropped & recreated on every run)
#   - container land_backend_e2e  (port 8001, DB_NAME=land_records_e2e)
#   - frontend/.env.e2e.local     (per-user RANDOM passwords + proxy target; gitignored via *.local)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

docker exec land_db psql -U landuser -d postgres -c "DROP DATABASE IF EXISTS land_records_e2e WITH (FORCE)"
docker exec land_db psql -U landuser -d postgres -c "CREATE DATABASE land_records_e2e"
docker exec land_db pg_dump -U landuser -Fc -f /tmp/e2e_seed.dump land_records
# pg_restore may print harmless warnings (extension already present); do not abort on them.
$ErrorActionPreference = 'Continue'
docker exec land_db pg_restore -U landuser -d land_records_e2e --no-owner /tmp/e2e_seed.dump 2>&1 | Out-Null
$ErrorActionPreference = 'Stop'
docker exec land_db rm -f /tmp/e2e_seed.dump

docker compose --profile e2e up -d backend_e2e
Start-Sleep -Seconds 6

# Hard safety check: the e2e container must point at the e2e database
$dbName = (docker exec land_backend_e2e printenv DB_NAME).Trim()
if ($dbName -ne 'land_records_e2e') { throw "land_backend_e2e is bound to '$dbName', refusing to continue." }

docker exec land_backend_e2e python manage.py migrate --noinput | Out-Null
docker exec land_backend_e2e python manage.py seed_demo_users --export-env /tmp/e2e_env.local | Out-Null
docker exec land_backend_e2e python manage.py axes_reset | Out-Null
docker cp land_backend_e2e:/tmp/e2e_env.local frontend/.env.e2e.local
docker exec land_backend_e2e rm -f /tmp/e2e_env.local
Add-Content -Path frontend/.env.e2e.local -Value "VITE_API_PROXY_TARGET=http://127.0.0.1:8001"

docker exec land_backend_e2e python manage.py seed_e2e_fixtures
Write-Host "E2E stack ready: backend http://127.0.0.1:8001 (DB land_records_e2e). Passwords are in frontend/.env.e2e.local (not printed)."

