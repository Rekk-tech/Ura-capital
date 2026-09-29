#!/bin/sh
set -e

echo "================================================================================"
echo "AURA CAPITAL — PRODUCTION API DEPLOYMENT ENTRYPOINT"
echo "================================================================================"

echo "[DEPLOY] Step 1/3: Applying PostgreSQL Database Migrations (prisma migrate deploy)..."
npx prisma migrate deploy

echo "[DEPLOY] Step 2/3: Applying Idempotent Demo Seed Pack..."
npm run seed:demo

echo "[DEPLOY] Step 3/3: Starting Production Express Server (Node.js)..."
exec node dist/server.js
