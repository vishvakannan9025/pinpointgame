@echo off
title PinPoint Buzzer Event Server Launcher
color 0b

echo ========================================================================
echo   🎯 PINPOINT COLLEGE BUZZER GAME - 1-CLICK LAUNCHER
echo ========================================================================
echo.

cd /d "%~dp0"

echo [1/3] Ensuring Admin Portal is built...
cd admin-portal
call npm run build
cd ..\server
if not exist "dist\server.js" (
    call npm run build
)
cd ..

echo [2/3] Starting Main Node.js Buzzer Game Server (Port 3000)...
start "🎯 PinPoint Game Server (Port 3000)" cmd /k "cd server && node dist/server.js"

echo [3/3] Starting Cloudflare 24/7 Internet Tunnel...
start "🌐 PinPoint Cloudflare Tunnel" cmd /k "cd server && node scripts/tunnel.js"

echo.
echo ========================================================================
echo  🚀 ALL SERVICES STARTED SUCCESSFULLY!
echo ========================================================================
echo  💻 Admin Portal:  http://localhost:3000/admin
echo  📱 Mobile App:     http://localhost:3000/#/join
echo  🌐 Cloudflare URL: Check the tunnel terminal window or public_url.txt
echo ========================================================================
echo.
timeout /t 3 >nul
start http://localhost:3000/admin

pause
