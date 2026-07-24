# Chitepo LMS — VPS Deployment (native, no Docker) — served at huku.tech/chitepo

Runs Chitepo as two Node processes under **PM2**, reverse-proxied by your existing
**Apache** under the `/chitepo` path of your current `huku.tech` site, using your
existing **MySQL**. It lives in its own folder and its own ports, alongside
whatever else the VPS already serves.

**Architecture**

```
Browser ──HTTPS──> Apache (huku.tech, your EXISTING vhost)
   ├── /chitepo/api/*     ─> 127.0.0.1:4001   NestJS backend   (PM2)
   ├── /chitepo/uploads/* ─> 127.0.0.1:4001   (backend static files)
   └── /chitepo/*         ─> 127.0.0.1:4000   Next.js frontend (PM2, basePath=/chitepo)
Backend ─> MySQL (127.0.0.1:3306, existing)  +  Redis (127.0.0.1:6379)
```

**Sub-path notes (already handled in the code):** `next.config.js` reads
`NEXT_PUBLIC_BASE_PATH` to set Next's `basePath`, a fetch shim in `_app.tsx`
rewrites raw `fetch('/api/...')` calls to include the prefix, and a `withBasePath()`
helper fixes the few hardcoded links/redirects. Because `NEXT_PUBLIC_BASE_PATH` is
baked in at build time, **you must rebuild the frontend if you ever change the path.**

Ports 4000/4001 are confirmed free on your box; change them in
`deploy/ecosystem.config.js` **and** `deploy/apache-chitepo.conf` if that ever changes.

---

## 1. System packages (run once)

```bash
# Node 20 LTS (satisfies the repo's Node >=18 requirement)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Redis (cache + background job queue) and PM2
sudo apt-get install -y redis-server
sudo npm install -g pm2

# Apache proxy modules (Apache itself is already installed)
sudo a2enmod proxy proxy_http headers
sudo systemctl reload apache2
```

> If you already run Redis for the other app and want isolation, run a second
> instance on another port and set `REDIS_PORT` to match. Sharing the default
> instance is fine to start.

> Building Next.js needs ~1.5 GB free RAM. On a small VPS add swap first:
> `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`

## 2. Put the code in its own folder

```bash
sudo mkdir -p /var/www/chitepo && sudo chown -R "$USER" /var/www/chitepo
git clone <your-repo-url> /var/www/chitepo      # or: scp -r ./chitepo user@vps:/var/www/chitepo
cd /var/www/chitepo
```

Apache here is a pure reverse proxy — it never reads files from this folder — so
it only needs to be owned by the user that runs the PM2 processes (no `www-data`
permissions required).

## 3. Database (on your existing MySQL)

Edit `deploy/setup-database.sql`, set a strong password, then:

```bash
sudo mysql < deploy/setup-database.sql
```

This creates a separate `chitepo` database and a `chitepo@localhost` user scoped
to it — your other databases are untouched.

## 4. Environment files

The `.env` files are intentionally NOT in the repo (they hold secrets and are
git-ignored), so they are absent after cloning/copying — you create them here.

**Easy path** — one helper does it all (generates secrets, prompts for the DB password):

```bash
./deploy/setup-env.sh
```

**Manual path**, if you prefer:

```bash
cp deploy/backend.env.production.example  backend/.env
cp deploy/frontend.env.production.example frontend/.env.production

openssl rand -hex 32   # -> JWT_SECRET
openssl rand -hex 32   # -> SESSION_SECRET
openssl rand -hex 32   # -> ENCRYPTION_KEY
```

Edit **`backend/.env`**: set `DATABASE_PASSWORD` (matching step 3) and paste the
three secrets. `FRONTEND_URL` is already `https://huku.tech/chitepo`.
**`frontend/.env.production`** already has `NEXT_PUBLIC_API_URL=https://huku.tech/chitepo`
and `NEXT_PUBLIC_BASE_PATH=/chitepo` — no edits needed unless the path changes.

The backend refuses to boot with a missing/weak `JWT_SECRET` or missing
`DATABASE_PASSWORD` / `SESSION_SECRET` / `ENCRYPTION_KEY` — that fail-fast check is
intentional.

## 5. Build + migrate

```bash
./deploy/deploy.sh
```

Installs all workspaces, builds shared → backend → frontend (with the sub-path
baked in), and runs the migrations (idempotent — safe to re-run).

**Optional, first deploy only** — demo courses + starter accounts:

```bash
npm run db:seed
```

⚠️ `db:seed` **deletes all users** and loads demo content. Fresh database only,
never again on live data. It creates default admin/instructor/learner accounts
(credentials defined in `backend/src/database/seeds/`). **Log in and change the
admin password immediately.**

## 6. Start under PM2

```bash
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup      # run the command it prints, so PM2 restarts on reboot
```

Check: `pm2 status`; logs: `pm2 logs chitepo-backend`.

## 7. Wire it into your existing Apache vhost

Open your current huku.tech HTTPS vhost (the one certbot manages, usually
`/etc/apache2/sites-available/huku.tech-le-ssl.conf` or similar):

```bash
sudo apache2ctl -S          # lists vhosts + their config files, to find the right one
sudo nano /etc/apache2/sites-available/<your-huku.tech-ssl>.conf
```

Copy the contents of `deploy/apache-chitepo.conf` **into that `<VirtualHost *:443>`
block**, above any existing `ProxyPass /` or `DocumentRoot` line. Then:

```bash
sudo apache2ctl configtest && sudo systemctl reload apache2
```

No new certificate is needed — you are reusing the existing huku.tech HTTPS vhost.
(If huku.tech is currently HTTP-only, run `sudo certbot --apache -d huku.tech`
first, then add the rules to the vhost certbot creates.)

Visit **https://huku.tech/chitepo**.

## 8. Firewall (recommended)

```bash
sudo ufw allow 'Apache Full'   # 80 + 443
sudo ufw allow OpenSSH
sudo ufw enable
```

Do **not** open 4000/4001 — Apache reaches them over localhost.

---

## Updating later

```bash
cd /var/www/chitepo
git pull
npm install
npm run build          # rebuilds the frontend with the baked-in sub-path
npm run db:migrate
pm2 restart chitepo-backend chitepo-frontend
```

## Troubleshooting

- **Assets 404 / page loads unstyled at /chitepo** — the frontend was built without
  `NEXT_PUBLIC_BASE_PATH`. Confirm it is set in `frontend/.env.production`, then
  `npm run build:frontend && pm2 restart chitepo-frontend`.
- **API calls 404 or hit the wrong site** — check the `/chitepo/api` ProxyPass is
  present and listed *before* the `/chitepo` catch-all in the vhost.
- **502 from Apache** — a PM2 app is down or on a different port. `pm2 status`; make
  sure ports match between `ecosystem.config.js` and the vhost rules.
- **Backend exits on boot** — almost always a missing secret or DB creds in
  `backend/.env`; check `pm2 logs chitepo-backend`.
- **Login redirect loop / lands at huku.tech root** — the frontend build predates the
  sub-path fixes; rebuild the frontend.
- **AI features** — off until you add `OPENAI_API_KEY` / `PINECONE_API_KEY` to
  `backend/.env` and restart the backend; the app degrades gracefully without them.
