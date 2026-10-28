<#
.SYNOPSIS
  Aura Capital - Export & Encrypt .env Secrets to .env.vault (AES-256-CBC with PBKDF2)
.DESCRIPTION
  Safely encrypts the local .env file so you can store it on a personal USB or private cloud drive.
  Never commit .env or .env.vault to GitHub!
#>

[CmdletBinding()]
param(
  [string]$EnvPath = ".env",
  [string]$VaultPath = ".env.vault"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvPath)) {
  Write-Error "File $EnvPath not found in current directory!"
  exit 1
}

Write-Host "=== Aura Capital Secret Vault Export ===" -ForegroundColor Cyan
Write-Host "Encrypting $EnvPath into $VaultPath..."

$Password = Read-Host "Enter encryption master password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

if ([string]::IsNullOrWhiteSpace($PlainPassword)) {
  Write-Error "Password cannot be empty!"
  exit 1
}

# Generate 16 bytes salt
$Salt = New-Object byte[] 16
$RNG = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$RNG.GetBytes($Salt)

# Derive Key (32 bytes) and IV (16 bytes) via PBKDF2 SHA256 (100,000 iterations)
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

$PlainBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $EnvPath))
$Encryptor = $Aes.CreateEncryptor()
$EncryptedBytes = $Encryptor.TransformFinalBlock($PlainBytes, 0, $PlainBytes.Length)

# Format: [Salt (16 bytes)] + [Ciphertext]
$OutStream = [System.IO.File]::Create((Join-Path (Get-Location) $VaultPath))
$OutStream.Write($Salt, 0, $Salt.Length)
$OutStream.Write($EncryptedBytes, 0, $EncryptedBytes.Length)
$OutStream.Close()

Write-Host "[SUCCESS] $EnvPath has been encrypted to $VaultPath!" -ForegroundColor Green
Write-Host "You can safely backup $VaultPath to a private secure drive." -ForegroundColor Yellow
Write-Host "Remember your password to decrypt on the new machine with scripts/setup-machine.ps1!" -ForegroundColor White

