# Aura Capital MVP — Zero-Cost Cloud Deployment Runbook (Solution B)

## Overview & Architecture Topology

This guide details the step-by-step procedure to deploy the Aura Capital MVP for client demonstration completely free of charge without requiring a credit card:

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT BROWSER                       │
│    (Desktop / Tablet / Mobile Viewport responsive)     │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
      Direct SPA Assets            Authoritative API
   (Vite / React 19 Bundle)    (JWT + Argon2 + JSON Body)
               │                          │
               ▼                          ▼
┌─────────────────────────────┐ ┌────────────────────────────────────────┐
│   CLOUDFLARE PAGES / RENDER │ │         RENDER WEB SERVICE             │
│        (Card-Free Static)   │ │          aura-capital-api              │
│       aura-capital.pages.dev│ │     aura-capital-api.onrender.com      │
│  - SPA Fallback (_redirects)│ │  - Node.js 20 LTS                      │
│  - Edge Global CDN          │ │  - Automatic DB Migration & Seeding    │
│  - VITE_API_URL configured  │ │  - Health Probes (/health/readiness)   │
└─────────────────────────────┘ └───────────┬──────────────┬─────────────┘
                                            │              │
                                     Pooled SQL      Redis In-Memory
                                      (Port 5432)     (Port 6379)
                                            │              │
                                            ▼              ▼
                                ┌────────────────┐ ┌─────────────────────┐
                                │ RENDER POSTGRES│ │    RENDER REDIS     │
                                │ aura-capital-db│ │  aura-capital-redis │
                                │ (Free 1GB tier)│ │  (Free 25MB tier)   │
                                └────────────────┘ └─────────────────────┘
```

---

## Step 1: Deploy Backend Stack via Render Blueprint

Render Blueprints provision all backend infrastructure (PostgreSQL database, Redis cache, and Node.js Web API) in a single coordinated declaration:

1. **Sign in to Render**: Navigate to [render.com](https://render.com) and log in with your GitHub account (zero credit card required).
2. **Create New Blueprint Instance**:
   - From the Render Dashboard, click **New +** -> **Blueprint**.
   - Connect your GitHub repository: `Rekk-tech/Ura-capital` (or your fork).
   - Select branch: `feat/FEAT-081-render-cloudflare-deployment` (or merged master).
3. **Review Resources**:
   Render automatically reads [`render.yaml`](file:///d:/project/ura-capital/.tmp/phase9-planning/render.yaml) and displays the components to be provisioned:
   - `aura-capital-db` (PostgreSQL Database, Free Tier, Oregon)
   - `aura-capital-redis` (Redis Instance, Free Tier, Oregon)
   - `aura-capital-api` (Node.js Web Service, Free Tier, Oregon)
   - `aura-capital-web` (Static Site, Free Tier, fallback hosting)
4. **Apply Blueprint**:
   - Click **Apply**.
   - Render automatically provisions the database and Redis, links `DATABASE_URL` and `REDIS_URL`, auto-generates high-entropy secrets (`JWT_SECRET`, `AUTH_ACCESS_TOKEN_SECRET`, etc.), runs `prisma migrate deploy`, executes `seed:dev`, and starts the API service.
5. **Note Backend URL**:
   Once deployed, note your public API URL, e.g.:
   `https://aura-capital-api.onrender.com`

---

## Step 2: Deploy Frontend to Cloudflare Pages (Card-Free Static Hosting)

Cloudflare Pages provides zero-cost, blazing-fast edge static delivery with unlimited bandwidth:

1. **Sign in to Cloudflare**: Navigate to [dash.cloudflare.com](https://dash.cloudflare.com) and go to **Workers & Pages** -> **Overview**.
2. **Create Application**:
   - Click **Create application** -> **Pages** tab -> **Connect to Git**.
   - Select repository: `Rekk-tech/Ura-capital`.
3. **Configure Build Settings**:
   - **Project Name**: `aura-capital`
   - **Production Branch**: `feat/FEAT-081-render-cloudflare-deployment` (or master).
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
4. **Configure Environment Variables**:
   Under **Environment Variables (Advanced)**, add:
   - `VITE_API_URL`: Set to your Render API URL (e.g. `https://aura-capital-api.onrender.com`).
   - `NODE_VERSION`: `20`
5. **Deploy**:
   - Click **Save and Deploy**.
   - Cloudflare Pages will build the Vite bundle, verify static assets, and deploy to a public URL (e.g., `https://aura-capital.pages.dev`).
   - The included [`_redirects`](file:///d:/project/ura-capital/.tmp/phase9-planning/apps/web/public/_redirects) automatically ensures SPA deep-linking and client navigation work without 404 errors.

---

## Step 3: Link CORS Security in Render API

To allow the Cloudflare Pages frontend to securely communicate with the Render API with credentials (`HttpOnly` cookies and Authorization headers):

1. Go to your Render Dashboard -> **Services** -> `aura-capital-api` -> **Environment**.
2. Locate `CORS_ORIGIN`.
3. Update `CORS_ORIGIN` with your Cloudflare Pages URL:
   ```text
   CORS_ORIGIN = https://aura-capital.pages.dev
   ```
4. Click **Save Changes**. Render will automatically redeploy the API service with updated CORS policies.

---

## Step 4: Client Demonstration Walkthrough & Default Credentials

The automated pre-deploy step (`npm run seed:dev`) populates the database with realistic demonstration accounts and course content immediately upon launch:

### Demo User Accounts

| Persona | Email | Default Password | Role | Access Scope |
|---|---|---|---|---|
| **Demo Learner** | `alex.demo2026@aura.internal` | `DevSeedPassword123!` | `USER` | Full Academy, Simulation Desk, Portfolio, Community Discussions |
| **System Admin** | `admin.aura2026@aura.internal` | `DevSeedPassword123!` | `ADMIN` | Full Platform + Administrative Control Desk (`/admin`) |
| **Community Peer 1** | `dev.user1@aura.internal` | `DevSeedPassword123!` | `USER` | Active discussion contributor |
| **Community Peer 2** | `dev.user2@aura.internal` | `DevSeedPassword123!` | `USER` | Active discussion contributor |

> [!TIP]
> Custom registration is also fully functional. New client visitors can register freely at `/register` and explore onboarding, learning paths, and simulation trading with zero friction.

### Guided Demonstration Flow for Clients

1. **Platform Home & Navigation**:
   - Open `https://aura-capital.pages.dev/`.
   - Experience the modern dark financial design system, interactive value propositions, and regulatory disclosures.
2. **Sign In**:
   - Navigate to `/login` and sign in with `alex.demo2026@aura.internal` / `DevSeedPassword123!`.
   - Notice instant session initiation with zero token exposure in browser storage (memory-only token lifecycle).
3. **Academy Learning Hub**:
   - Explore Course Catalog at `/academy`: Stock Investing 101 and Options & Derivatives Trading.
   - Enter lesson player (`/academy/courses/investing-101/player/market-basics`), review flashcards, and track XP progression.
4. **Real-Time Simulation Trading**:
   - Access the Trading Desk at `/simulation`.
   - View real-time asset pricing (`AURA`, `AAPL`, `MSFT`, `NVDA`), place market or limit orders, and observe instant cash and position balance recalculations under server authority.
5. **Portfolio Valuation & Analytics**:
   - Visit `/portfolio` to inspect total portfolio value, PnL metrics, asset allocation breakdowns, and historical milestone tracking.
6. **Community Forums**:
   - Navigate to `/community` to view interactive discussions, publish new topics, and like community commentary.
7. **Administrative Desk**:
   - Sign in as `admin.aura2026@aura.internal` and navigate to `/admin` to verify strict RBAC protection, review platform metrics, and manage user statuses.

---

## Operational Runbook & Maintenance

### Checking Service Health

- **Process Liveness**:
  ```bash
  curl -i https://aura-capital-api.onrender.com/health/liveness
  # Returns: {"status":"healthy","service":"aura-api","timestamp":"..."}
  ```
- **Readiness Probe**:
  ```bash
  curl -i https://aura-capital-api.onrender.com/health/readiness
  # Returns: {"status":"ready","service":"aura-api","checks":{"database":"healthy","redis":"healthy"},"timestamp":"..."}
  ```

### Re-running Database Migrations & Seeds

If database schema needs re-syncing:
1. Open Render Web Shell on `aura-capital-api`.
2. Run:
   ```bash
   npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
   npm run seed:dev
   ```
   All seeds are completely idempotent and safe to run on an existing database without duplicating records.
