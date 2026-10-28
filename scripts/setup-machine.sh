#!/usr/bin/env bash
# Aura Capital - 1-Command Development Setup & Environment Restorer (Linux / macOS)
set -euo pipefail

echo "=========================================================="
echo "    AURA CAPITAL - 1-COMMAND DEVELOPMENT SETUP           "
echo "=========================================================="

# 1. Environment file restoration (.env)
if [ ! -f ".env" ]; then
  if [ -f ".env.vault" ]; then
    echo "[1/5] Restoring .env from encrypted .env.vault..."
    openssl enc -d -aes-256-cbc -salt -pbkdf2 -iter 100000 -in .env.vault -out .env
    echo "[OK] .env restored successfully from vault!"
  else
    echo "[1/5] Creating default .env from .env.example..."
    cp .env.example .env
    echo "[OK] .env created from .env.example."
  fi
else
  echo "[1/5] .env file already exists. Skipping."
fi

# 2. Dependencies
echo "[2/5] Installing project dependencies..."
npm install
echo "[OK] Node dependencies installed."

# 3. Prisma Client
echo "[3/5] Generating Prisma client..."
npx prisma generate --schema=apps/api/prisma/schema.prisma
echo "[OK] Prisma client generated."

# 4. Docker services
echo "[4/5] Starting Docker Compose services (Postgres & Redis)..."
docker compose up -d postgres redis || echo "Warning: Docker compose failed or Docker not running."

# 5. Database migrations
echo "[5/5] Applying Prisma migrations & dev seed..."
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma || true
npm run seed:dev || true

echo "=========================================================="
echo "    SETUP COMPLETE! Run 'npm run dev' to start.          "
echo "=========================================================="

