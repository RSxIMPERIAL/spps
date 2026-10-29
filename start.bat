@echo off
cd /d "%~dp0"
echo ========================================================
echo   SPPS - Study Plan Preparation System
echo   Launching server on http://localhost:3000
echo ========================================================
set ELECTRON_RUN_AS_NODE=1
"C:\Users\prade\AppData\Local\Programs\antigravity\Antigravity.exe" server\server.js
pause
