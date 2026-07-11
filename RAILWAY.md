# Deploy to Railway

This guide deploys the portfolio site to [Railway](https://railway.app) from GitHub with persistent storage for the SQLite database and uploaded media.

Railway runs the included `Dockerfile` and `scripts/railway-start.mjs`, which:

1. Mounts persistent data under `/data` (via a Railway volume)
2. Symlinks `public/uploads` → `/data/uploads` so Next.js can serve media
3. Runs `prisma migrate deploy`
4. Starts the app with `npm start`

## Prerequisites

- GitHub repo with this project pushed
- [Railway account](https://railway.app)
- Node.js 20+ only needed for local development (Railway builds in Docker)

## One-time setup

### 1. Create a Railway project

1. Go to [railway.app/new](https://railway.app/new)
2. Choose **Deploy from GitHub repo**
3. Select your `portfolio_builder` repository
4. Railway detects `railway.toml` and builds with the `Dockerfile`

### 2. Add a persistent volume

The app stores its database and uploads on disk. Without a volume, data is lost on redeploy.

1. In your Railway service, open **Volumes**
2. Click **Add Volume**
3. Mount path: `/data`
4. Size: 1 GB is enough to start (increase if you upload lots of media)

The start script uses `/data` by default:

| Path | Purpose |
|------|---------|
| `/data/prod.db` | SQLite database |
| `/data/uploads/` | Images and videos |

### 3. Set environment variables

In the Railway service → **Variables**:

| Variable | Value | Required |
|----------|-------|----------|
| `ADMIN_SECRET` | A long random string (your admin password) | Yes |
| `DATABASE_URL` | `file:/data/prod.db` | Recommended |
| `DATA_DIR` | `/data` | Optional (this is the default) |
| `RAILWAY_RUN_SEED` | `true` | Optional — seed defaults on first deploy only, then remove |

Example:

```env
ADMIN_SECRET=your-long-random-secret-here
DATABASE_URL=file:/data/prod.db
```

Do **not** commit `.env` to git. Set variables in the Railway dashboard only.

### 4. Deploy

Railway deploys automatically when you push to the connected branch.

First deploy may take a few minutes (Docker build + `better-sqlite3` native compile).

### 5. Open the site

1. Railway service → **Settings** → **Networking** → **Generate Domain**
2. Visit the `*.up.railway.app` URL
3. Admin login: `https://your-app.up.railway.app/admin`
4. Use the password you set in `ADMIN_SECRET`

HTTPS is provided by Railway. Admin sessions require HTTPS in production.

### 6. Custom domain (optional)

1. Service → **Settings** → **Networking** → **Custom Domain**
2. Add your domain and configure DNS as Railway instructs

## How it works

```
GitHub push
    ↓
Railway builds Dockerfile
    ↓
Container starts → scripts/railway-start.mjs
    ↓
/data/prod.db          (SQLite, on volume)
/data/uploads/       (media, on volume)
public/uploads → symlink to /data/uploads
    ↓
prisma migrate deploy → npm start
```

### Files involved

| File | Role |
|------|------|
| `Dockerfile` | Production image (Node 20, native deps for SQLite) |
| `railway.toml` | Tells Railway to use the Dockerfile and health check `/` |
| `scripts/railway-start.mjs` | Volume setup, migrations, start server |
| `.dockerignore` | Keeps image builds fast |

### npm scripts

```bash
npm run start:railway   # Same startup logic as Railway (for local testing)
```

## Updating after code changes

Push to GitHub. Railway rebuilds and redeploys automatically.

On restart, `railway-start.mjs` runs migrations before starting — no manual step needed for schema changes.

Manual redeploy: Railway dashboard → service → **Deploy** → **Redeploy**.

## Backups

Back up the Railway volume contents regularly:

- `/data/prod.db` — all content
- `/data/uploads/` — all media

Railway volume snapshots or periodic download via `railway ssh` / volume export.

## Troubleshooting

### Build fails on `better-sqlite3`

The `Dockerfile` installs `python3`, `make`, and `g++` for native module compilation. If build still fails, check Railway build logs for missing system packages.

### Admin login fails

- Confirm `ADMIN_SECRET` is set in Railway variables
- Use the exact value as the password
- Site must be served over HTTPS (Railway provides this)

### Uploads disappear after redeploy

The volume is not mounted at `/data`, or the volume was not created. Add a volume with mount path `/data`.

### Database empty after redeploy

Same as uploads — volume missing or `DATABASE_URL` points outside `/data` (e.g. `file:./prod.db` on ephemeral disk). Use `file:/data/prod.db`.

### Check logs

Railway dashboard → service → **Deployments** → select deploy → **View logs**

Look for:

```
DATA_DIR=/data
DATABASE_URL=file:/data/prod.db
UPLOAD_STORE=/data/uploads
```

### Test locally with Docker (optional)

```bash
docker build -t portfolio .
docker run --rm -p 3000:3000 \
  -e ADMIN_SECRET=test-secret \
  -e DATABASE_URL=file:/data/prod.db \
  -v portfolio-data:/data \
  portfolio
```

Open http://localhost:3000

## Cost notes

Railway pricing varies. You need at least:

- A running **service** (compute)
- A **volume** (persistent disk)

Check [railway.app/pricing](https://railway.app/pricing) for current plans.

## See also

- [DEPLOY.md](./DEPLOY.md) — VPS deployment, security checklist, general production notes
- [README.md](./README.md) — Development setup and architecture
