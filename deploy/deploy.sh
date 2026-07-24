#!/usr/bin/env bash
# Chitepo LMS — build + migrate for a native (no-Docker) deploy.
# Run from the repo ROOT on the VPS, AFTER creating:
#   backend/.env             (from deploy/backend.env.production.example)
#   frontend/.env.production (from deploy/frontend.env.production.example)
set -euo pipefail

echo "==> [1/4] Installing dependencies (all workspaces)"
npm install

echo "==> [2/4] Building shared -> backend -> frontend"
npm run build

echo "==> [3/4] Running database migrations"
npm run db:migrate

echo "==> [4/4] Preparing log directory"
mkdir -p logs

cat <<'MSG'

Build complete.

Next:
  * FIRST deploy only, optional demo data + starter accounts:
        npm run db:seed
    WARNING: db:seed DELETES all users and loads demo content. Never re-run on live data.

  * Start / reload the app under PM2:
        pm2 start deploy/ecosystem.config.js && pm2 save

  * Redeploy after a code update:
        git pull && npm install && npm run build && npm run db:migrate \
          && pm2 restart chitepo-backend chitepo-frontend
MSG
