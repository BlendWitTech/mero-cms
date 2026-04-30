# Warning handled by mero.js
Write-Host "!!! WARNING: This will delete dependencies, .env files, and reset the database !!!" -ForegroundColor Red
$confirm = Read-Host "Are you sure you want to proceed? (y/N)"

if ($confirm -ne "y") {
    Write-Host "Reset aborted."
    exit
}

Write-Host "`n[1/5] Cleaning root..." -ForegroundColor Gray
Remove-Item -Path "node_modules", "package-lock.json" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "[2/5] Cleaning backend..." -ForegroundColor Gray
Remove-Item -Path "backend/node_modules", "backend/dist", "backend/.env", "backend/prisma/migrations" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "[3/5] Cleaning frontend..." -ForegroundColor Gray
Remove-Item -Path "frontend/node_modules", "frontend/.next", "frontend/.env", "frontend/.env.local" -Recurse -Force -ErrorAction SilentlyContinue

# Themes live as standalone Next.js apps under themes/*/. Their node_modules
# and .next caches are independent of the root. If we leave a half-installed
# Next.js binary behind (a common cause of the
# "page-path/ensure-leading-slash" module-not-found error), the next
# dev:all round trips into Turbopack failure. Nuke them all.
Write-Host "[4/5] Cleaning themes..." -ForegroundColor Gray
if (Test-Path "themes") {
    Get-ChildItem "themes" -Directory | ForEach-Object {
        $themeDir = $_.FullName
        $themeName = $_.Name
        $paths = @(
            (Join-Path $themeDir "node_modules"),
            (Join-Path $themeDir ".next"),
            (Join-Path $themeDir "package-lock.json"),
            (Join-Path $themeDir ".env.local")
        )
        $cleaned = @()
        foreach ($p in $paths) {
            if (Test-Path $p) {
                Remove-Item $p -Recurse -Force -ErrorAction SilentlyContinue
                $cleaned += (Split-Path $p -Leaf)
            }
        }
        if ($cleaned.Count -gt 0) {
            Write-Host "  $themeName - removed $($cleaned -join ', ')" -ForegroundColor DarkGray
        }
    }
}

Write-Host "[5/5] Resetting database infrastructure..." -ForegroundColor Gray
if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
    Write-Host "Resetting Docker volumes..." -ForegroundColor Gray
    docker-compose down -v --remove-orphans 2>$null
}

# Optional: Hard wipe for non-docker environments
if (Test-Path "backend/prisma/schema.prisma") {
    $wipe = Read-Host "Wipe local database as well? (y/N)"
    if ($wipe -eq "y") {
        Write-Host "Pruning local database..." -ForegroundColor Yellow
        Set-Location backend
        npx prisma migrate reset --force
        Set-Location ..
    }
}

# Completion handled by mero.js
