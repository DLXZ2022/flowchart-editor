# Set output encoding to UTF-8
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

    Write-Host "Welcome to the Flowchart Editor Startup Script!"
    Write-Host "Checking environment..."

    # Check for Node.js
    $nodePath = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodePath) {
        Write-Host ""
        Write-Host "**************************************************" -ForegroundColor Red
        Write-Host " ERROR: Node.js not detected!" -ForegroundColor Red
        Write-Host " Please install Node.js first ( https://nodejs.org/ )" -ForegroundColor Yellow
        Write-Host " Re-run this script after installation." -ForegroundColor Yellow
        Write-Host "**************************************************" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }

    # Check for npm
    $npmPath = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $npmPath) {
        Write-Host ""
        Write-Host "**************************************************" -ForegroundColor Red
        Write-Host " ERROR: npm not detected!" -ForegroundColor Red
        Write-Host " Please ensure Node.js is installed correctly and includes npm." -ForegroundColor Yellow
        Write-Host "**************************************************" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }

    Write-Host "Node.js and npm checks passed." -ForegroundColor Green

    # --- Frontend Dependency Installation ---
    Write-Host ""
    Write-Host "Checking frontend dependencies..."
    if (-not (Test-Path "node_modules\react" -PathType Container)) {
        Write-Host "Frontend dependencies missing or incomplete, installing..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "**************************************************" -ForegroundColor Red
            Write-Host " ERROR: Frontend dependency installation failed!" -ForegroundColor Red
            Write-Host " Check network connection or run 'npm install' manually in the root directory." -ForegroundColor Yellow
            Write-Host "**************************************************" -ForegroundColor Red
            Write-Host ""
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Host "Frontend dependencies installed successfully." -ForegroundColor Green
    } else {
        Write-Host "Frontend dependencies already installed."
    }

    # --- Backend Dependency Installation ---
    $backendDepPath = "flowchart-backend\node_modules\express"
    Write-Host ""
    Write-Host "Checking backend dependencies..."
    if (-not (Test-Path $backendDepPath -PathType Container)) {
        Write-Host "Backend dependencies missing or incomplete, installing..." -ForegroundColor Yellow
        Push-Location "flowchart-backend"
        npm install
        $lastExitCodeNpmBackend = $LASTEXITCODE
        Pop-Location
        if ($lastExitCodeNpmBackend -ne 0) {
            Write-Host ""
            Write-Host "**************************************************" -ForegroundColor Red
            Write-Host " ERROR: Backend dependency installation failed!" -ForegroundColor Red
            Write-Host " Check network connection or run 'npm install' manually in 'flowchart-backend' directory." -ForegroundColor Yellow
            Write-Host "**************************************************" -ForegroundColor Red
            Write-Host ""
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Host "Backend dependencies installed successfully." -ForegroundColor Green
    } else {
        Write-Host "Backend dependencies already installed."
    }

    # --- Start Services ---
    Write-Host ""
    Write-Host "Starting backend server..."
    # Use Start-Process to launch in a new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Flowchart Backend'; Push-Location flowchart-backend; node src/server.js"

    Write-Host ""
    Write-Host "Starting frontend development server..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Flowchart Frontend'; npm run dev"

    Write-Host ""
    Write-Host "Backend and Frontend services are starting in separate windows..." -ForegroundColor Cyan
    Write-Host "You can close this window or press Enter after services have started." -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit this script window" 