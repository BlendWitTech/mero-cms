param (
    [string]$Mode = "PROMPT"
)

Write-Host "`n--- Blendwit CMS Setup ---" -ForegroundColor Blue

if ($Mode -eq "PROMPT") {
    $choice = Read-Host "Select Setup Mode: [1] Manual (Local DB), [2] Docker (Containerized DB)"
} else {
    $choice = $Mode
}

# 1. Root dependencies
Write-Host "`n[1/5] Installing root dependencies..." -ForegroundColor Gray
npm install

# 2. Environment Setup
Write-Host "[2/5] Setting up environment files..." -ForegroundColor Gray
if (-not (Test-Path "backend/.env")) {
    if (Test-Path "backend/.env.development.example") {
        Copy-Item "backend/.env.development.example" "backend/.env"
        Write-Host "Created backend/.env from development example." -ForegroundColor Green
    } elseif (Test-Path "backend/.env.example") {
        Copy-Item "backend/.env.example" "backend/.env"
        Write-Host "Created backend/.env from example." -ForegroundColor Green
    } else {
        @"
NODE_ENV=development
DATABASE_URL=postgresql://admin:password123@localhost:5432/mero_cms?schema=public
JWT_SECRET=dev-jwt-secret-change-in-production
PORT=3001
CORS_ORIGINS=http://localhost:3000
ENABLED_MODULES=
SETUP_COMPLETE=false
"@ | Out-File -FilePath "backend/.env" -Encoding utf8
        Write-Host "Generated default backend/.env." -ForegroundColor Yellow
    }
}
if (-not (Test-Path "frontend/.env.local")) {
    if (Test-Path "frontend/.env.development.example") {
        Copy-Item "frontend/.env.development.example" "frontend/.env.local"
        Write-Host "Created frontend/.env.local from development example." -ForegroundColor Green
    } else {
        "NEXT_PUBLIC_API_URL=http://localhost:3001" | Out-File -FilePath "frontend/.env.local" -Encoding utf8
        Write-Host "Created frontend/.env.local with default API URL." -ForegroundColor Green
    }
}

# Ensure root .env has JWT_SECRET for docker-compose variable interpolation
if (Test-Path ".env") {
    $rootEnv = Get-Content ".env" -Raw
    if ($rootEnv -notmatch "^JWT_SECRET=.+") {
        $backendJwt = if (Test-Path "backend/.env") {
            (Get-Content "backend/.env" | Where-Object { $_ -match "^JWT_SECRET=" } | Select-Object -First 1) -replace "^JWT_SECRET=", ""
        } else { "dev-jwt-secret-change-in-production-min-32-chars" }
        Add-Content ".env" "`nJWT_SECRET=$backendJwt"
        Write-Host "Synced JWT_SECRET to root .env for docker-compose." -ForegroundColor Green
    }
}

# 3. Database Infrastructure
if ($choice -eq "2") {
    Write-Host "[3/5] Starting Docker containers..." -ForegroundColor Gray
    docker-compose up -d db

    # Ensure backend/.env points to the Docker database, not a local one
    $dbUser = if ($env:DB_USER) { $env:DB_USER } else { "admin" }
    $dbPass = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "password123" }
    $dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "mero_cms" }
    $dockerDbUrl = "postgresql://${dbUser}:${dbPass}@localhost:5432/${dbName}"
    (Get-Content "backend/.env") -replace "^DATABASE_URL=.*", "DATABASE_URL=$dockerDbUrl" | Set-Content "backend/.env"
    Write-Host "Set DATABASE_URL → $dockerDbUrl" -ForegroundColor Green

    # Copy LICENSE_KEY from root .env into backend/.env if present
    $rootLicense = (Get-Content ".env" | Where-Object { $_ -match "^LICENSE_KEY=.+" } | Select-Object -First 1) -replace "^LICENSE_KEY=", ""
    if ($rootLicense) {
        $beContent = Get-Content "backend/.env" -Raw
        if ($beContent -match "^LICENSE_KEY=\s*$" -or $beContent -notmatch "^LICENSE_KEY=") {
            (Get-Content "backend/.env") -replace "^LICENSE_KEY=.*", "LICENSE_KEY=$rootLicense" | Set-Content "backend/.env"
            Write-Host "Synced LICENSE_KEY to backend/.env." -ForegroundColor Green
        }
    }

    Write-Host "Waiting for database to be ready..." -ForegroundColor Gray
    
    $max_retries = 30
    $retry_count = 0
    $db_ready = $false
    
    while (-not $db_ready -and $retry_count -lt $max_retries) {
        try {
            # Try to connect using prisma studio or just a simple check if the port is open and responding
            # A more reliable way is to use a small node script or just wait and check
            # For simplicity in PS, we'll try to use a TCP connection test
            $tcp = New-Object System.Net.Sockets.TcpClient
            $connect = $tcp.BeginConnect("127.0.0.1", 5432, $null, $null)
            $wait = $connect.AsyncWaitHandle.WaitOne(1000, $false)
            if ($wait) {
                $tcp.EndConnect($connect)
                $db_ready = $true
                Write-Host "Database is responding!" -ForegroundColor Green
            } else {
                Write-Host "." -NoNewline -ForegroundColor Gray
                $retry_count++
                Start-Sleep -s 1
            }
            $tcp.Close()
        } catch {
            Write-Host "." -NoNewline -ForegroundColor Gray
            $retry_count++
            Start-Sleep -s 1
        }
    }
    
    if (-not $db_ready) {
        Write-Host "`nWarning: Database did not respond within 30 seconds. Setup may fail during seeding." -ForegroundColor Yellow
    }
} else {
    Write-Host "[3/5] Skipping Docker. (Manual setup selected)" -ForegroundColor Gray
}

# 4. Database Initialization
Write-Host "[4/5] Initializing database..." -ForegroundColor Gray
node scripts/build-schema.js all
Set-Location backend
npx prisma generate
npx prisma db push
npm run seed
Set-Location ..

# 5. Build
Write-Host "[5/5] Finalizing setup..." -ForegroundColor Gray
npm run build

Write-Host "`nSetup Complete! Run 'npm run dev' to start the application." -ForegroundColor Green
Write-Host "`n--- NEXT STEPS ---" -ForegroundColor Cyan
Write-Host "1. Run:  npm run dev" -ForegroundColor White
Write-Host "2. Open: http://localhost:3000/setup" -ForegroundColor White
Write-Host "3. Complete the setup wizard to create your superadmin account and choose enabled modules." -ForegroundColor White
Write-Host "------------------" -ForegroundColor Cyan
