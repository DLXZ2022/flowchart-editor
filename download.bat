@echo off
:: Batch script to download and install all prerequisites for the Flowchart Editor project.

echo.
echo Starting prerequisite download and installation...
echo Please ensure you have an active internet connection.
echo.

:: 1. Check for Node.js and npm
echo Checking for Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo **************************************************
    echo  ERROR: Node.js not detected!
    echo  Please install Node.js first ( includes npm ) from: https://nodejs.org/
    echo  Re-run this script after Node.js installation.
    echo **************************************************
    echo.
    pause
    exit /b 1
)
echo Node.js found.

echo Checking for npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo **************************************************
    echo  ERROR: npm not detected!
    echo  This usually comes with Node.js. Please ensure Node.js is installed correctly.
    echo **************************************************
    echo.
    pause
    exit /b 1
)
echo npm found.

:: 2. Install Frontend Dependencies
echo.
echo Checking frontend dependencies (root directory)...
if not exist "node_modules\react" (
    echo Frontend dependencies missing or incomplete. Installing...
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo **************************************************
        echo  ERROR: Frontend dependency installation failed!
        echo  Please check your internet connection and try running 'npm install' manually in the root directory.
        echo **************************************************
        echo.
        pause
        exit /b 1
    )
    echo Frontend dependencies installed successfully.
) else (
    echo Frontend dependencies seem to be installed already.
)

:: 3. Install Backend Dependencies
echo.
echo Checking backend dependencies (flowchart-backend directory)...
if not exist "flowchart-backend\node_modules\express" (
    echo Backend dependencies missing or incomplete. Installing...
    cd flowchart-backend
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo **************************************************
        echo  ERROR: Backend dependency installation failed!
        echo  Please check your internet connection and try running 'npm install' manually in the 'flowchart-backend' directory.
        echo **************************************************
        echo.
        pause
        cd ..
        exit /b 1
    )
    cd ..
    echo Backend dependencies installed successfully.
) else (
    echo Backend dependencies seem to be installed already.
)

:: 4. Install Playwright Browsers
echo.
echo Installing Playwright browsers for the backend...
cd flowchart-backend
npx playwright install
if %errorlevel% neq 0 (
    echo.
    echo **************************************************
    echo  WARNING: Playwright browser installation failed or was interrupted.
    echo  Crawling might not work correctly.
    echo  You can try running 'npx playwright install' manually in the 'flowchart-backend' directory later.
    echo **************************************************
    echo.
    :: Don't exit here, maybe the user wants to proceed anyway or already has browsers.
) else (
    echo Playwright browsers installed successfully.
)
cd ..

:: --- Completion ---
echo.
echo **************************************************
echo  Prerequisite installation process completed.
 echo  You should now be able to run the application using 'start.ps1'.
echo **************************************************
echo.
pause 