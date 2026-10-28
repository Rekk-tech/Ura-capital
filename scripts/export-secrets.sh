#!/usr/bin/env bash
# Aura Capital - Export & Encrypt .env Secrets to .env.vault using OpenSSL AES-256-CBC
set -euo pipefail

ENV_PATH="${1:-.env}"
VAULT_PATH="${2:-.env.vault}"

if [ ! -f "$ENV_PATH" ]; then
  echo "Error: $ENV_PATH does not exist!" >&2
  exit 1
fi

echo "=== Aura Capital Secret Vault Export ==="
echo "Encrypting $ENV_PATH into $VAULT_PATH..."
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -in "$ENV_PATH" -out "$VAULT_PATH"
echo "[SUCCESS] $ENV_PATH has been encrypted to $VAULT_PATH!"
echo "Keep your password safe for restoring on a new machine."

