@echo off
:: Backup startup script using Windows Batch.
:: NOTE: start.ps1 is the recommended script due to better error handling and encoding support.

:: Attempt to set code page to UTF-8 for potential output improvement, suppress output
chcp 65001 > nul

echo.
echo Starting Flowchart Editor (Batch Mode - Backup)...
echo If you encounter issues, please use start.ps1 instead.
echo.

:: 1. Check for Node.js and npm
echo Checking for Node.js and npm...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo **************************************************
    echo  ERROR: Node.js not detected! Install from https://nodejs.org/
    echo **************************************************
    echo.
    pause
    exit /b 1
)
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo **************************************************
    echo  ERROR: npm not detected! Ensure Node.js installed correctly.
    echo **************************************************
    echo.
    pause
    exit /b 1
)
echo Node.js and npm found.

:: Basic check for frontend dependencies (less robust than ps1)
echo Checking basic frontend dependencies...
if not exist "node_modules\react\package.json" (
    echo.
    echo **************************************************
    echo  WARNING: Frontend dependencies might be missing.
    echo  Please run download.ps1 or download.bat first.
    echo **************************************************
    echo.
    pause
    :: Continue anyway, maybe they are installed
)

:: Basic check for backend dependencies (less robust than ps1)
echo Checking basic backend dependencies...
if not exist "flowchart-backend\node_modules\express\package.json" (
    echo.
    echo **************************************************
    echo  WARNING: Backend dependencies might be missing.
    echo  Please run download.ps1 or download.bat first.
    echo **************************************************
    echo.
    pause
    :: Continue anyway
)

:: --- Start Services ---
echo.
echo Starting backend server...
if exist "flowchart-backend\src\server.js" (
    cd flowchart-backend
    start "Flowchart Backend (BAT)" cmd /c "title Flowchart Backend (BAT) && node src/server.js"
    cd ..
) else (
    echo ERROR: Cannot find flowchart-backend\src\server.js
)

echo.
echo Starting frontend development server...
start "Flowchart Frontend (BAT)" cmd /c "title Flowchart Frontend (BAT) && npm run dev"

echo.
echo Backend and Frontend services are attempting to start in separate windows...
echo Check the new windows for status or errors.
echo.
pause 