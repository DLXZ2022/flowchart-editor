# PowerShell script to download and install all prerequisites for the Flowchart Editor project.

# Set output encoding to UTF-8 for better character display
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "Starting prerequisite download and installation..." -ForegroundColor Cyan
Write-Host "Please ensure you have an active internet connection."
Write-Host ""

# --- 1. Check for Node.js and npm ---
Write-Host "Checking for Node.js..."
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host ""
    Write-Host "**************************************************" -ForegroundColor Red
    Write-Host " ERROR: Node.js not detected!" -ForegroundColor Red
    Write-Host " Please install Node.js first (includes npm) from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host " Re-run this script after Node.js installation." -ForegroundColor Yellow
    Write-Host "**************************************************" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Node.js found: $($nodePath.Source)" -ForegroundColor Green

Write-Host "Checking for npm..."
$npmPath = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmPath) {
    Write-Host ""
    Write-Host "**************************************************" -ForegroundColor Red
    Write-Host " ERROR: npm not detected!" -ForegroundColor Red
    Write-Host " This usually comes with Node.js. Please ensure Node.js is installed correctly." -ForegroundColor Yellow
    Write-Host "**************************************************" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "npm found: $($npmPath.Source)" -ForegroundColor Green

# --- 2. Install Frontend Dependencies ---
Write-Host ""
Write-Host "Checking frontend dependencies (root directory)..."
if (-not (Test-Path "node_modules\react" -PathType Container)) {
    Write-Host "Frontend dependencies missing or incomplete. Installing..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "**************************************************" -ForegroundColor Red
        Write-Host " ERROR: Frontend dependency installation failed!" -ForegroundColor Red
        Write-Host " Please check your internet connection and try running 'npm install' manually in the root directory." -ForegroundColor Yellow
        Write-Host "**************************************************" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "Frontend dependencies installed successfully." -ForegroundColor Green
} else {
    Write-Host "Frontend dependencies seem to be installed already."
}

# --- 3. Install Backend Dependencies ---
Write-Host ""
Write-Host "Checking backend dependencies (flowchart-backend directory)..."
$backendDepPath = "flowchart-backend\node_modules\express"
if (-not (Test-Path $backendDepPath -PathType Container)) {
    Write-Host "Backend dependencies missing or incomplete. Installing..." -ForegroundColor Yellow
    Push-Location "flowchart-backend"
    npm install
    $lastExitCodeNpmBackend = $LASTEXITCODE # Capture exit code before changing directory
    Pop-Location
    if ($lastExitCodeNpmBackend -ne 0) {
        Write-Host ""
        Write-Host "**************************************************" -ForegroundColor Red
        Write-Host " ERROR: Backend dependency installation failed!" -ForegroundColor Red
        Write-Host " Please check your internet connection and try running 'npm install' manually in the 'flowchart-backend' directory." -ForegroundColor Yellow
        Write-Host "**************************************************" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "Backend dependencies installed successfully." -ForegroundColor Green
} else {
    Write-Host "Backend dependencies seem to be installed already."
}

# --- 4. Install Playwright Browsers ---
Write-Host ""
Write-Host "Installing Playwright browsers for the backend..."
Push-Location "flowchart-backend"
Write-Host "Running 'npx playwright install'. This might take a while..." -ForegroundColor Yellow
npx playwright install
$lastExitCodePlaywright = $LASTEXITCODE # Capture exit code
Pop-Location

if ($lastExitCodePlaywright -ne 0) {
    Write-Host ""
    Write-Host "**************************************************" -ForegroundColor Yellow
    Write-Host " WARNING: Playwright browser installation failed or was interrupted." -ForegroundColor Yellow
    Write-Host " Crawling might not work correctly." -ForegroundColor Yellow
    Write-Host " You can try running 'npx playwright install' manually in the 'flowchart-backend' directory later." -ForegroundColor Yellow
    Write-Host "**************************************************" -ForegroundColor Yellow
    Write-Host ""
    # Continue the script even if playwright install fails
} else {
    Write-Host "Playwright browsers installed successfully." -ForegroundColor Green
}

# --- Completion ---
Write-Host ""
Write-Host "**************************************************" -ForegroundColor Cyan
Write-Host " Prerequisite installation process completed." -ForegroundColor Cyan
Write-Host " You should now be able to run the application using 'start.ps1'." -ForegroundColor Cyan
Write-Host "**************************************************" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit this script window" 