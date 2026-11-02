Set-Location (Split-Path $PSScriptRoot -Parent)
docker compose --profile e2e stop backend_e2e
docker compose --profile e2e rm -f backend_e2e
docker exec land_db psql -U landuser -d postgres -c "DROP DATABASE IF EXISTS land_records_e2e WITH (FORCE)"
Remove-Item -Force -ErrorAction SilentlyContinue frontend/.env.e2e.local
Write-Host "E2E stack removed. land_records untouched."

