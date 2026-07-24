# deploy/ — Chitepo LMS deployment kit

Native (no-Docker) deployment for a shared VPS: two Node processes under PM2,
reverse-proxied by your existing Apache under **https://huku.tech/chitepo**, using
your existing MySQL. Start with `DEPLOYMENT.md`.

| File | Purpose |
|------|---------|
| `DEPLOYMENT.md` | The runbook — full step-by-step deploy, update, and troubleshooting guide. Read this first. |
| `deploy.sh` | One command to install workspaces, build shared→backend→frontend, and run DB migrations. |
| `setup-env.sh` | Creates `backend/.env` + `frontend/.env.production` from the templates, generates the secrets, and prompts for the DB password. |
| `ecosystem.config.js` | PM2 process definitions — backend on 127.0.0.1:4001, frontend on 127.0.0.1:4000. |
| `apache-chitepo.conf` | Proxy rules to paste **into your existing huku.tech HTTPS vhost** (not a new vhost). Routes `/chitepo/*` to the app. |
| `setup-database.sql` | Creates an isolated `chitepo` database + user on your existing MySQL. |
| `backend.env.production.example` | Template → copy to `backend/.env`; fill in DB password + the three generated secrets. |
| `frontend.env.production.example` | Template → copy to `frontend/.env.production`; carries the public URL + `/chitepo` base path (baked in at build). |

## Quick sequence (details in DEPLOYMENT.md)

```bash
cd /var/www/chitepo
sudo mysql < deploy/setup-database.sql
./deploy/setup-env.sh                                            # creates .env files + secrets
./deploy/deploy.sh
pm2 start deploy/ecosystem.config.js && pm2 save
# then paste deploy/apache-chitepo.conf into your huku.tech vhost, reload Apache
```

## Notes

- Ports 4000/4001 are localhost-only; Apache is the only public entry point.
- AI features (OpenAI/Pinecone) are off until you add keys to `backend/.env`.
- Changing the sub-path or public URL requires a frontend rebuild (values are baked in at build time).
