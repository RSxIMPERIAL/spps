Set-Location $PSScriptRoot
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SPPS - Study Plan Preparation System" -ForegroundColor Green
Write-Host "  Launching server on http://localhost:3000" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
$env:ELECTRON_RUN_AS_NODE = "1"
& "C:\Users\prade\AppData\Local\Programs\antigravity\Antigravity.exe" "$PSScriptRoot\server\server.js"
