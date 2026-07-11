# Portfolio Website

A configurable portfolio site with section-based project navigation, a project timeline, featured carousel, blog-style log entries, visitor comments, and a password-protected admin area for managing all content.

## Features

### Public site

| Area | Route | Description |
|------|-------|-------------|
| Home | `/` | Latest log preview, featured projects carousel, section navigation, timeline link |
| Portfolio sections | `/{section}` | Project grid with label filtering (default: `show` label) and optional category grouping |
| Project detail | `/{section}/{project}` | Description, labels, external links, media carousel, visitor comments |
| Timeline | `/timeline` | All visible projects ordered by date, with label filter and section color legend |
| Log archive | `/log/archive` | List of all log entries |
| Log entry | `/log/{slug}` | Full entry with media carousel and visitor comments |

**Labels** control project visibility:

- **`show`** — project appears on section pages (default filter) and the timeline
- **`featured`** — project appears in the home carousel (must also have `show`)

Filter projects by label via URL: `?labels=show,featured` or `?labels=none`.

**Comments** — visitors can post comments on log entries and project pages using a name and message. Each type can be toggled independently in site settings. Existing comments remain visible when posting is disabled.

**Rich text** — project descriptions support markdown links `[text](url)` and auto-linked URLs.

### Admin

Access via the **gear icon** in the header, or navigate directly to `/admin` (redirects to login if not authenticated). Sessions last 7 days.

| Area | Route | Capabilities |
|------|-------|--------------|
| Dashboard | `/admin` | Overview and links to all admin sections |
| Log | `/admin/log` | Create, edit, delete log entries; manage media and comments |
| Sections | `/admin/sections` | Manage portfolio sections (slug, title, color, categories) |
| Projects | `/admin/{section}` | Create, edit, delete projects per section; media, labels, links |
| Labels | `/admin/labels` | Manage shared label pool (`show` label cannot be deleted) |
| Header links | `/admin/header-links` | Nav buttons in the header (email, CV, social, etc.) |
| Site settings | `/admin/site-settings` | Site title, description, footer, colors, comment toggles |

## Stack

| Library | Version | Role |
|---------|---------|------|
| [Next.js](https://nextjs.org/) | 16 | App Router, server components, API routes |
| [React](https://react.dev/) | 19 | UI |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Styling |
| [Prisma](https://www.prisma.io/) | 7 | ORM and migrations |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | 12 | SQLite driver (via `@prisma/adapter-better-sqlite3`) |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Type safety |
| [ESLint](https://eslint.org/) | 9 | Linting (`eslint-config-next`) |
| [tsx](https://github.com/privatenumber/tsx) | 4 | Run seed script |
| [dotenv](https://github.com/motdotla/dotenv) | 17 | Environment variable loading |

## Project structure

```
portfolio_website/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # SQLite migration history
│   └── seed.ts                # Default sections, header links, site settings
├── public/
│   └── uploads/               # User-uploaded images and videos
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (header, footer, metadata)
│   │   ├── page.tsx           # Home page
│   │   ├── [slug]/            # Section listing + project detail
│   │   ├── timeline/          # Cross-section timeline
│   │   ├── log/               # Log archive and entry pages
│   │   ├── admin/             # Admin dashboard and CRUD pages
│   │   └── api/               # REST API routes
│   ├── components/            # React components (public + admin)
│   ├── generated/prisma/      # Generated Prisma client (do not edit)
│   ├── lib/                   # Data access, auth, validation, utilities
│   └── middleware.ts          # Admin route protection
├── .env.example               # Environment variable template
├── DEPLOY.md                  # Production deployment guide
└── package.json
```

### Key directories

**`src/app/api/`** — REST endpoints for projects, sections, labels, log entries, comments, uploads, site settings, header links, and admin auth.

**`src/lib/`** — Server-side logic:

| File | Purpose |
|------|---------|
| `db.ts` | Prisma client, slugify, link parsing |
| `auth.ts` / `admin.ts` | Password login, session cookies, API auth guard |
| `projects.ts` | Project queries, labels, featured/timeline |
| `log.ts` | Log entry queries |
| `sections.ts` | Section CRUD and category parsing |
| `labels.ts` | Label management and system labels |
| `siteSettings.ts` | Site branding and comment toggles |
| `headerLinks.ts` | Header navigation links |
| `uploads.ts` | Upload path helpers and file cleanup |
| `media.ts` | Project cover image resolution |
| `richText.ts` | Markdown link and URL parsing |
| `types.ts` | Shared TypeScript types |

**`src/components/`** — UI split between public views (`ProjectGrid`, `MediaCarousel`, `ProjectComments`, etc.) and admin forms (`AdminProjectForm`, `AdminSiteSettingsForm`, etc.).

### Data model

```
PortfolioSection (standalone)
SiteSettings       (singleton)
HeaderLink         (standalone)
Label ←── ProjectLabel ──→ Project
                             ├── Media (images/videos)
                             ├── ProjectComment
                             └── coverMedia → Media
LogEntry
  ├── LogMedia
  └── Comment
```

SQLite stores JSON fields as strings: `Project.links` and `PortfolioSection.categories`.

## Getting started

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed    # optional — defaults are also created on first load
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env`:

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | SQLite database path (relative to project root) |
| `ADMIN_SECRET` | `change-me-in-production` | Admin login password and session signing key |

Default site title, description, footer text, and header buttons are created by `npm run db:seed` or on first site load. Edit them in admin at `/admin/site-settings` and `/admin/header-links`.

## npm scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `prisma generate && next dev` | Development server |
| `build` | `prisma generate && next build` | Production build |
| `start` | `next start` | Run production server (port 3000) |
| `db:seed` | `tsx prisma/seed.ts` | Seed default sections, header links, site settings |
| `lint` | `eslint` | Lint the codebase |

Database migrations are run manually:

```bash
npx prisma migrate dev      # development
npx prisma migrate deploy   # production
```

## Deployment

See **[DEPLOY.md](./DEPLOY.md)** for production deployment instructions, including database setup, persistent storage, and security considerations.
