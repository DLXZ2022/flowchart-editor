#Requires -Version 5.1
<#
.SYNOPSIS
Installs all frontend (yarn) and backend (npm) dependencies for the Flowchart Editor project,
and installs the required Playwright browsers.

.DESCRIPTION
This script performs the following actions:
1. Checks if Yarn and npm are available.
2. Changes to the script's directory (project root).
3. Runs 'yarn install' in the root directory to install frontend dependencies.
4. Changes to the 'flowchart-backend' subdirectory.
5. Runs 'npm install' in the backend directory.
6. Runs 'npx playwright install --with-deps' to install necessary browsers.

.NOTES
- Requires PowerShell 5.1 or later.
- Ensure Node.js (with npm) and Yarn are installed and in the PATH.
- Run this script from the project root directory.
#>

param()

# Function to write informational messages
function Write-Info {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Message
    )
    Write-Host "INFO: $Message" -ForegroundColor Green
}

# Function to write error messages and exit
function Write-ErrorAndExit {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Message,
        [int]$ExitCode = 1
    )
    Write-Error "ERROR: $Message"
    exit $ExitCode
}

# Check if Yarn is available
Write-Info "正在检查 Yarn..."
if (-not (Get-Command yarn -ErrorAction SilentlyContinue)) {
    Write-ErrorAndExit "Yarn 未安装。请先使用 'npm install --global yarn' 安装 Yarn。"
}
Write-Info "Yarn 已找到。"

# Check if npm is available
Write-Info "正在检查 npm..."
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-ErrorAndExit "npm 未安装。请确保 Node.js 已正确安装并包含 npm。"
}
Write-Info "npm 已找到。"

# Get the script's directory (project root)
try {
    $ProjectRoot = Split-Path -Path $MyInvocation.MyCommand.Path -Parent -ErrorAction Stop
    Set-Location -Path $ProjectRoot -ErrorAction Stop
    Write-Info "当前目录: $($ProjectRoot)"
} catch {
    Write-ErrorAndExit "无法确定或切换到项目根目录: $($_.Exception.Message)"
}

# 1. Install Frontend Dependencies (Root Directory)
Write-Info "正在安装前端依赖 (yarn install)..."
try {
    yarn install *>&1 | Out-String # Capture all output
    if ($LASTEXITCODE -ne 0) {
        throw "Yarn install failed with exit code $LASTEXITCODE"
    }
    Write-Info "前端依赖安装完成。"
} catch {
    Write-ErrorAndExit "前端依赖安装失败 (yarn install)。请检查上面的错误信息。 Error: $($_.Exception.Message)"
}

# 2. Change to Backend Directory
$BackendDir = Join-Path -Path $ProjectRoot -ChildPath "flowchart-backend"
if (-not (Test-Path -Path $BackendDir -PathType Container)) {
    Write-ErrorAndExit "后端目录未找到: $BackendDir"
}

try {
    Set-Location -Path $BackendDir -ErrorAction Stop
    Write-Info "已进入后端目录: $(Get-Location)"
} catch {
    Write-ErrorAndExit "无法进入后端目录 '$BackendDir': $($_.Exception.Message)"
}

# 3. Install Backend Dependencies (flowchart-backend Directory)
Write-Info "正在安装后端依赖 (yarn install)..."
try {
    yarn install *>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        throw "yarn install failed with exit code $LASTEXITCODE"
    }
    Write-Info "后端依赖安装完成。"
} catch {
    Write-ErrorAndExit "后端依赖安装失败 (yarn install)。请检查上面的错误信息。 Error: $($_.Exception.Message)"
}

# 4. Install Playwright Browsers (flowchart-backend Directory)
Write-Info "正在安装 Playwright 浏览器 (npx playwright install --with-deps)..."
try {
    # Use Invoke-Expression to handle potential output stream complexities with npx
    Invoke-Expression "npx playwright install --with-deps" *>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        throw "npx playwright install failed with exit code $LASTEXITCODE"
    }
    Write-Info "Playwright 浏览器安装完成。"
} catch {
    Write-ErrorAndExit "Playwright 浏览器安装失败。请检查上面的错误信息。 Error: $($_.Exception.Message)"
}

# Return to project root (optional)
Set-Location -Path $ProjectRoot

Write-Info "所有依赖和浏览器安装成功完成！"
exit 0 