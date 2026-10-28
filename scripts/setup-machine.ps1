<#
.SYNOPSIS
  Aura Capital - 1-Command Machine Setup & Environment Restorer
.DESCRIPTION
  Automates environment initialization on a new development machine:
  1. Restores .env from .env.vault (AES-256 decryption) or copies .env.example
  2. Installs npm dependencies
  3. Generates Prisma Client
  4. Starts local Docker infrastructure (Postgres + Redis)
  5. Applies Prisma database migrations & dev seeds
#>

[CmdletBinding()]
param(
  [switch]$SkipDocker,
  [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    AURA CAPITAL - 1-COMMAND DEVELOPMENT SETUP           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Environment file restoration (.env)
if (-not (Test-Path ".env")) {
  if (Test-Path ".env.vault") {
    Write-Host "[1/5] Restoring .env from encrypted .env.vault..." -ForegroundColor Yellow
    $Password = Read-Host "Enter encryption master password for .env.vault" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
    $PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

    $VaultBytes = [System.IO.File]::ReadAllBytes((Resolve-Path ".env.vault"))
    if ($VaultBytes.Length -lt 32) {
      Write-Error "Invalid vault file format!"
      exit 1
    }

    $Salt = New-Object byte[] 16
    [System.Array]::Copy($VaultBytes, 0, $Salt, 0, 16)

    $CipherBytes = New-Object byte[] ($VaultBytes.Length - 16)
    [System.Array]::Copy($VaultBytes, 16, $CipherBytes, 0, $CipherBytes.Length)

    $Kdf = New-Object System.Security.Cryptography.Rfc2898DeriveBytes(
      $PlainPassword,
      $Salt,
      100000,
      [System.Security.Cryptography.HashAlgorithmName]::SHA256
    )
    $Key = $Kdf.GetBytes(32)
    $IV = $Kdf.GetBytes(16)

    $Aes = [System.Security.Cryptography.Aes]::Create()
    $Aes.Key = $Key
    $Aes.IV = $IV
    $Aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
    $Aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7

    try {
      $Decryptor = $Aes.CreateDecryptor()
      $PlainBytes = $Decryptor.TransformFinalBlock($CipherBytes, 0, $CipherBytes.Length)
      [System.IO.File]::WriteAllBytes((Join-Path (Get-Location) ".env"), $PlainBytes)
      Write-Host "[OK] .env restored successfully from vault!" -ForegroundColor Green
    } catch {
      Write-Error "Failed to decrypt .env.vault! Incorrect password."
      exit 1
    }
  } else {
    Write-Host "[1/5] Creating default .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] .env created from .env.example. Remember to customize keys if needed." -ForegroundColor Green
  }
} else {
  Write-Host "[1/5] .env file already exists. Skipping restoration." -ForegroundColor Green
}

# 2. NPM dependencies installation
Write-Host "[2/5] Installing project dependencies..." -ForegroundColor Yellow
npm install
Write-Host "[OK] Node dependencies installed." -ForegroundColor Green

# 3. Generate Prisma client
Write-Host "[3/5] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate --schema=apps/api/prisma/schema.prisma
Write-Host "[OK] Prisma client generated." -ForegroundColor Green

# 4. Local Docker infrastructure (Postgres + Redis)
if (-not $SkipDocker) {
  Write-Host "[4/5] Checking Docker Compose services (Postgres & Redis)..." -ForegroundColor Yellow
  try {
    docker compose up -d postgres redis
    Write-Host "[OK] Postgres (5432) and Redis (6379) are active." -ForegroundColor Green
    Start-Sleep -Seconds 3
  } catch {
    Write-Warning "Docker command failed or Docker is not running. Please start Postgres and Redis manually."
  }
} else {
  Write-Host "[4/5] Docker step skipped by user parameter." -ForegroundColor Gray
}

# 5. Database migrations and initial seed
if (-not $SkipSeed) {
  Write-Host "[5/5] Applying Prisma migrations & dev seed..." -ForegroundColor Yellow
  try {
    npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
    npm run seed:dev
    Write-Host "[OK] Database migrations and seed completed." -ForegroundColor Green
  } catch {
    Write-Warning "Database migration/seed skipped or failed. Check if PostgreSQL is accessible."
  }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    SETUP COMPLETE! Ready to start developing.           " -ForegroundColor Green
Write-Host "    Run 'npm run dev' to launch web & api services.       " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

