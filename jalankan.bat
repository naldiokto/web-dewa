@echo off
title DEWA Smart Fan Web App
cd /d "%~dp0"

echo ========================================================
echo   MENJALANKAN DEWA SMART FAN WEB APP
echo ========================================================
echo.

set PATH=C:\Program Files\nodejs;%PATH%

if exist "C:\Program Files\nodejs\npm.cmd" (
    "C:\Program Files\nodejs\npm.cmd" run dev
) else (
    npm run dev
)

pause
