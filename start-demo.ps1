param(
    [int]$ApiPort = 8000,
    [int]$DashboardPort = 3000
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Dashboard = Join-Path $Root "dashboard"

Set-Location $Root
python seed_db.py

$ApiLog = Join-Path $Root "backend-server.log"
$DashboardLog = Join-Path $Dashboard "frontend-server.log"

Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "Set-Location -LiteralPath '$Root'; python -m uvicorn backend.api.app:app --host 0.0.0.0 --port $ApiPort *> '$ApiLog'" `
    -WorkingDirectory $Root `
    -WindowStyle Hidden

Start-Sleep -Seconds 4

Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "Set-Location -LiteralPath '$Dashboard'; `$env:BROWSER='none'; `$env:PORT='$DashboardPort'; npm start *> '$DashboardLog'" `
    -WorkingDirectory $Dashboard `
    -WindowStyle Hidden

Write-Host "MedAI Guardian demo is starting."
Write-Host "Dashboard: http://localhost:$DashboardPort"
Write-Host "API docs:   http://localhost:$ApiPort/docs"
Write-Host "Login:      demo@medai.com / demo123"
