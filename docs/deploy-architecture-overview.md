# Deployment Architecture Overview (source: MAGiE / magiegame.com)

This documents the deployment pattern used for MAGiE, to be adapted for a new
Django + React app on its own Lightsail instance. It's a description of the
*system*, not a step-by-step runbook — use it to plan the new instance's setup.

## Stack

- **Frontend:** React (Vite build), static files served by NGINX
- **Backend:** Django, served by Gunicorn (systemd-managed) behind NGINX
- **DB:** PostgreSQL
- **Host:** AWS Lightsail, Amazon Linux
- **SSL:** Let's Encrypt via Certbot

## Repo layout

Two separate repos, deployed differently:
- Frontend repo → auto-deployed via GitHub Actions on push to `main`
- Backend repo → deployed manually via SSH (not automated yet)

## Frontend deploy (GitHub Actions)

Trigger: push to `main`. Workflow:
1. Install Node + deps
2. Set build-time env vars (e.g. `VITE_*` API URL) directly in the workflow
3. Build (`vite build` → `dist/`)
4. `scp` `dist/` to the server (e.g. `/var/www/<app>-react`)
5. Auth via SSH key stored as a GitHub Secret

**GitHub Secrets needed per project:**
- `LIGHTSAIL_KEY` — SSH private key
- `LIGHTSAIL_USER` — SSH username
- `LIGHTSAIL_HOST` — server IP/hostname

**Env var handling:** `.env*` files are gitignored; build-time values are injected via the Actions workflow, not committed.

## Backend deploy (manual SSH, for now)

1. `git pull origin main` in the app directory
2. `python manage.py migrate`
3. `python manage.py collectstatic` (served at `/static/`, aliased in NGINX)
4. Restart Gunicorn: `sudo systemctl restart gunicorn`
5. Restart NGINX only if config changed

**Django settings:** a dedicated settings module for the server environment (e.g. `settings.lightsail`), set via `DJANGO_SETTINGS_MODULE` in both the venv activation script and the systemd unit — so it's consistent whether you're at a manual shell or systemd's starting it.

**Gunicorn systemd unit** binds to a Unix socket (not a port), which NGINX proxies to. Not auto-started on boot by default — worth deciding if the new instance should change that.

## SSL renewal

Certbot cron job, independent of deploys:
```
0 3 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"
```
Time-based, not tied to CI — set once per instance and forget it.

## What's genuinely per-instance (will need new values)

- Lightsail instance + IP, DNS records
- SSH keypair + GitHub Secrets
- Repo names/paths on disk
- Django settings module name
- NGINX server blocks (domain names, static/proxy paths)
- systemd unit paths

## What's copy-paste reusable

- The overall shape of the GitHub Actions workflow
- The Gunicorn systemd unit template
- The Certbot renewal cron line
- The migrate → collectstatic → restart sequence

## Known gap / automation opportunity

Backend deploy is still manual SSH — no CI for it yet. That's the natural target for the automation work in the new project (e.g. mirror the frontend's Actions-based flow, or use SSH-based Actions deploy for the backend too).
