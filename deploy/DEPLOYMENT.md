# Chitepo LMS — VPS Deployment (native, no Docker)

Runs Chitepo as two Node processes managed by **PM2**, fronted by your existing
**Apache** as a new virtual host, using your existing **MySQL**. It lives in its
own folder and its own ports, so it sits alongside whatever else the VPS runs.

**Architecture**

```
Browser ──HTTPS──> Apache (chitepo.example.com)
                     ├── /api/*  ─> 127.0.0.1:4001   NestJS backend  (PM2)
                     └── /*      ─> 127.0.0.1:4000   Next.js frontend (PM2)
Backend ─> MySQL (127.0.0.1:3306, existing)  +  Redis (127.0.0.1:6379)
```

Before you start, replace two placeholders everywhere: `chitepo.example.com`
(your subdomain) and `CHANGE_ME_*` (passwords/secrets). Ports 4000/4001 are
arbitrary — change them in `deploy/ecosystem.config.js` **and**
`deploy/apache-chitepo.conf` if either is already in use.

---

## 0. DNS

Point an A record for your subdomain at the VPS public IP before requesting SSL:

```
chitepo.example.com.   A   <VPS_PUBLIC_IP>
```

## 1. System packages (run once)

```bash
# Node 20 LTS (satisfies the repo's Node >=18 requirement)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Redis (cache + background job queue) and PM2
sudo apt-get install -y redis-server
sudo npm install -g pm2

# Apache proxy modules + certbot (skip apache install if already present)
sudo a2enmod proxy proxy_http headers rewrite ssl
sudo apt-get install -y certbot python3-certbot-apache
```

> If you already run Redis for another app and want isolation, run a second
> instance on a different port and set `REDIS_PORT` accordingly. Sharing the
> default instance is fine for a first deploy.

> Building Next.js needs ~1.5 GB free RAM. On a small VPS add swap first:
> `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`

## 2. Get the code into its own folder

```bash
sudo mkdir -p /opt/chitepo && sudo chown "$USER" /opt/chitepo
# via git:
git clone <your-repo-url> /opt/chitepo
# ...or copy from your machine:
#   scp -r ./chitepo user@vps:/opt/chitepo
cd /opt/chitepo
```

## 3. Database (on your existing MySQL)

Edit `deploy/setup-database.sql` and set a strong password, then:

```bash
sudo mysql < deploy/setup-database.sql
```

This creates a separate `chitepo` database and a `chitepo@localhost` user with
rights to that database only.

## 4. Environment files

```bash
cp deploy/backend.env.production.example  backend/.env
cp deploy/frontend.env.production.example frontend/.env.production

# generate three distinct secrets:
openssl rand -hex 32   # -> JWT_SECRET
openssl rand -hex 32   # -> SESSION_SECRET
openssl rand -hex 32   # -> ENCRYPTION_KEY
```

Now edit **`backend/.env`**: set `DATABASE_PASSWORD` (matching step 3), paste the
three secrets, and set `FRONTEND_URL=https://chitepo.example.com`.
Edit **`frontend/.env.production`**: set `NEXT_PUBLIC_API_URL=https://chitepo.example.com`.

The backend refuses to boot with a missing/weak `JWT_SECRET` or missing
`DATABASE_PASSWORD` / `SESSION_SECRET` / `ENCRYPTION_KEY` — that fail-fast check is
intentional.

## 5. Build + migrate

```bash
./deploy/deploy.sh
```

This installs all workspaces, builds shared → backend → frontend, and runs the
database migrations. (Migrations are idempotent — safe to re-run.)

**Optional, first deploy only** — load demo courses and starter accounts:

```bash
npm run db:seed
```

⚠️ `db:seed` **deletes all users** and loads demo content. Run it only on a fresh
database, never again on live data. It creates default admin/instructor/learner
accounts — the credentials are defined in `backend/src/database/seeds/`. **Log in
and change the admin password immediately.**

## 6. Start under PM2

```bash
pm2 start deploy/ecosystem.config.js
pm2 save                       # persist the process list
pm2 startup                    # run the printed command so PM2 restarts on reboot
```

Check both are online: `pm2 status`, and tail logs with `pm2 logs chitepo-backend`.

## 7. Apache virtual host

```bash
sudo cp deploy/apache-chitepo.conf /etc/apache2/sites-available/chitepo.conf
sudo sed -i 's/chitepo.example.com/YOUR.SUBDOMAIN.com/g' \
     /etc/apache2/sites-available/chitepo.conf
sudo a2ensite chitepo
sudo apache2ctl configtest && sudo systemctl reload apache2
```

## 8. HTTPS

```bash
sudo certbot --apache -d YOUR.SUBDOMAIN.com
```

Certbot adds the `:443` vhost, installs the certificate, and sets up the HTTP→HTTPS
redirect and auto-renewal. Then visit `https://YOUR.SUBDOMAIN.com`.

## 9. Firewall (recommended)

Expose only web ports; the app ports stay private on localhost:

```bash
sudo ufw allow 'Apache Full'   # 80 + 443
sudo ufw allow OpenSSH
sudo ufw enable
```

Do **not** open 4000/4001 — Apache reaches them over localhost.

---

## Updating later

```bash
cd /opt/chitepo
git pull
npm install
npm run build
npm run db:migrate
pm2 restart chitepo-backend chitepo-frontend
```

## Troubleshooting

- **502 from Apache** — a PM2 app is down or on a different port. `pm2 status`,
  then confirm ports match between `ecosystem.config.js` and the vhost.
- **Backend exits on boot** — almost always a missing secret or DB creds in
  `backend/.env`; check `pm2 logs chitepo-backend`.
- **Login works but pages 404 / API blocked (CORS)** — `FRONTEND_URL` in
  `backend/.env` must equal the site URL, and `NEXT_PUBLIC_API_URL` in
  `frontend/.env.production` must be the same subdomain. Changing the latter
  requires a rebuild (`npm run build:frontend && pm2 restart chitepo-frontend`).
- **DB connection refused** — confirm the `chitepo` user/password and that MySQL
  listens on 127.0.0.1:3306.
- **AI features** — off until you add `OPENAI_API_KEY` / `PINECONE_API_KEY` to
  `backend/.env` and restart the backend; the app degrades gracefully without them.
