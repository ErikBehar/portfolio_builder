# Deployment Guide

This app is a self-hosted Next.js application backed by a local SQLite database and filesystem uploads. It is designed to run on a **single persistent server** with a writable disk — not on ephemeral serverless platforms without additional storage configuration.

## Prerequisites

- **Node.js** 20 or later
- A server with persistent disk (VPS, dedicated host, or similar)
- A domain and HTTPS (recommended via a reverse proxy)

## What to back up

Two things must persist across deploys and restarts:

| Data | Location | Notes |
|------|----------|-------|
| SQLite database | Path from `DATABASE_URL` (default: `dev.db` in project root) | All content, settings, comments |
| Uploaded media | `public/uploads/` | Images and videos referenced by projects and log entries |

Back up both regularly. They are not included in git (see `.gitignore`).

## Environment setup

Create a `.env` file on the server (do not commit it):

```env
DATABASE_URL="file:./prod.db"
ADMIN_SECRET="use-a-long-random-secret-here"
```

| Variable | Production notes |
|----------|------------------|
| `DATABASE_URL` | Use an absolute path if the working directory may change, e.g. `file:/var/www/portfolio/data/prod.db`. Ensure the directory exists and is writable. |
| `ADMIN_SECRET` | Set a strong, unique value. This is both the login password and the HMAC signing key for admin sessions. |

In production, the admin session cookie is set with the `secure` flag (HTTPS only).

## Build and start

```bash
# 1. Install dependencies (runs prisma generate via postinstall)
npm ci

# 2. Apply database migrations
npx prisma migrate deploy

# 3. Seed defaults (optional — also created on first page load)
npm run db:seed

# 4. Build the app
npm run build

# 5. Start the production server
npm start
```

The app listens on port **3000** by default. Set `PORT` to override:

```bash
PORT=8080 npm start
```

## VPS deployment (recommended)

A typical setup on a Linux VPS:

```
Internet → Nginx/Caddy (HTTPS) → Node.js (npm start) → SQLite + public/uploads/
```

### 1. Clone and configure

```bash
git clone <your-repo-url> /var/www/portfolio
cd /var/www/portfolio
cp .env.example .env
# Edit .env with production values
```

### 2. Create data directories

```bash
mkdir -p public/uploads
# If using a custom database path:
mkdir -p /var/www/portfolio/data
```

### 3. Build

```bash
npm ci
npx prisma migrate deploy
npm run build
```

### 4. Run with a process manager

Using [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start npm --name portfolio -- start
pm2 save
pm2 startup    # enable restart on reboot
```

### 5. Reverse proxy (Nginx example)

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Uploaded files in `public/uploads/` are served directly by Next.js — no extra Nginx config needed for `/uploads/*`.

## Updating a running deployment

```bash
cd /var/www/portfolio
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart portfolio
```

Always run `prisma migrate deploy` before restarting if the schema has changed.

## Platform-specific notes

### Railway (recommended for GitHub deploy)

**Best fit for connect-repo-and-deploy** with persistent SQLite and uploads.

See **[RAILWAY.md](./RAILWAY.md)** for the full guide. Summary:

1. Connect GitHub repo in Railway
2. Add a volume mounted at `/data`
3. Set `ADMIN_SECRET` and `DATABASE_URL=file:/data/prod.db`
4. Push to deploy (uses included `Dockerfile` + `railway.toml`)

### Vercel / Netlify / serverless

**Not recommended out of the box.** This app relies on:

- A local SQLite file (ephemeral filesystem on serverless)
- Local file uploads in `public/uploads/` (not persistent across invocations)

To deploy on serverless you would need to replace SQLite with a hosted database (e.g. PostgreSQL via Turso, PlanetScale, or Supabase) and move uploads to object storage (S3, R2, etc.). That requires code changes beyond this guide.

### Docker (manual setup)

No Dockerfile is included in the repo. If containerizing:

- Mount a volume for the SQLite file
- Mount a volume for `public/uploads/`
- Pass `DATABASE_URL` and `ADMIN_SECRET` as environment variables
- Run `npx prisma migrate deploy` as part of your container start or entrypoint

## Security checklist

Before going live:

- [ ] Set a strong `ADMIN_SECRET` (not the default)
- [ ] Serve over HTTPS
- [ ] Back up the database and `public/uploads/` regularly
- [ ] Restrict server access (firewall, SSH keys)

### Authentication model

| Layer | Protection |
|-------|------------|
| Admin pages (`/admin/*`) | `middleware.ts` — redirects to login if session cookie is invalid |
| Admin API mutations | `requireAdmin()` in each route — checks the same session cookie |
| Public comment POST | Allowed without login; gated by site settings (`commentsEnabled`, `projectCommentsEnabled`) |

**Admin-only mutations** (require a valid admin session):

- `POST /api/upload`
- `POST`, `PUT`, `DELETE` on projects, sections, labels, header links, log entries, site settings
- `PUT`, `DELETE` on log/project comments (admin moderation)

**Intentionally public** (no admin session required):

- `POST /api/log/[id]/comments` — visitor comments on log entries (when enabled)
- `POST /api/projects/[id]/comments` — visitor comments on projects (when enabled)
- `POST /api/admin/auth` — login endpoint

`GET` API routes exist for some resources but are not used by the public UI (pages read via server components and `src/lib/*`). They return the same normalized shapes as the lib layer.

Set `ADMIN_SECRET` to a long random value before exposing the site to the internet.

## Troubleshooting

### "Failed to fetch" during navigation in dev

Restart the dev server after schema changes:

```bash
# Stop the current server (Ctrl+C), then:
npm run dev
```

If the port is stuck, kill the old process and restart.

### Database errors after pulling new code

Regenerate the Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

### Build or dev server issues after moving the project

Clear generated artifacts and reinstall:

```bash
npm run clean
npm install
npx prisma migrate deploy
npm run dev    # or npm run build for production
```

### Uploads not appearing

Confirm `public/uploads/` exists and is writable by the Node.js process. Check that uploaded file URLs in the database start with `/uploads/`.

### Admin login not working

Verify `ADMIN_SECRET` in `.env` matches the password you are entering. In production, admin login requires HTTPS (the session cookie uses the `secure` flag).
