## Deployment Flow: React Frontend (magiegame.com)

The React frontend lives in the `MAGiE.React` repository and is deployed automatically via GitHub Actions.

### GitHub Actions Deployment
- Trigger: Push to the `main` branch
- Steps:
  - Install Node and dependencies
  - Set `VITE_MAGIE_PUZZLE_API` at build time
  - Build the project
  - `scp` the `dist/` directory to the server at `/var/www/magie-react`
  - Uses `~/.ssh/id_ed25519` for authentication

### Environment Variables
React uses `.env` files to define build-time environment variables. These should not be committed to version control. Instead:
- Add `.env`, `.env.prod`, and `.env.*` to `.gitignore`
- Maintain them locally or in your CI/CD workflow (e.g., GitHub Actions `env:` block)

In production, `VITE_MAGIE_PUZZLE_API` is set directly in the GitHub Actions workflow.

### Secrets
The GitHub Action uses the following GitHub Secrets:
- `LIGHTSAIL_KEY`: SSH private key for deployment
- `LIGHTSAIL_USER`: SSH username
- `LIGHTSAIL_HOST`: Public IP or hostname of the Lightsail server

No manual steps are required unless debugging or overriding the action.

---

## Deployment Flow: Django Backend (puzzles.magiegame.com)

The Django backend lives in the `puzzleeditor2020` repository and is deployed manually via SSH.

### 1. Pull latest code
```bash
cd /var/www/puzzleeditor2020
git pull origin main
```

### 2. Apply migrations
```bash
source venv/bin/activate
python manage.py migrate
```

### 3. Collect static files
```bash
python manage.py collectstatic
```

(Static files are served from `/static/`, aliased to `/var/www/puzzleeditor2020/static/` in NGINX)

> The production server uses the `lightsail.py` Django settings file.
> - Set in `venv/bin/activate` with:
>   ```bash
>   export DJANGO_SETTINGS_MODULE=magie_online.settings.lightsail
>   ```
> - Also declared in `/etc/systemd/system/gunicorn.service` as:
>   ```ini
>   Environment="DJANGO_SETTINGS_MODULE=magie_online.settings.lightsail"
>   ```

### 4. Restart Gunicorn (via systemd)
Gunicorn runs manually (not auto-started) using the following systemd unit:
```ini
ExecStart=/var/www/puzzleeditor2020/venv/bin/gunicorn \
  --access-logfile - \
  --workers 3 \
  --bind unix:/var/www/puzzleeditor2020/puzzleeditor2020.sock \
  magie_online.wsgi:application
```

To restart manually:
```bash
sudo systemctl restart gunicorn
```

### 5. (Optional) Restart NGINX if config changed
```bash
sudo systemctl restart nginx
```

---

## SSL Certificate Renewal

Amazon Linux includes Certbot for Let's Encrypt certificates. Set up a cron job to auto-renew:

```bash
sudo crontab -e
```

Add:
```cron
0 3 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

This checks daily at 3 AM and reloads NGINX only if renewal occurs.

> Note: Cert renewal is **time-based**, not deployment-based. No need to include it in your GitHub Actions.

