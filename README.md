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
├── scripts/
│   └── clean.mjs              # Remove build artifacts (used by npm run clean)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (header, footer, metadata)
│   │   ├── page.tsx           # Home page
│   │   ├── [slug]/            # Section listing + project detail
│   │   ├── timeline/          # Cross-section timeline
│   │   ├── log/               # Log archive and entry pages
│   │   ├── admin/             # Admin dashboard and CRUD pages
│   │   └── api/               # Thin REST wrappers over src/lib
│   ├── components/            # React components (public + admin)
│   ├── generated/prisma/      # Generated Prisma client (do not edit)
│   ├── lib/                   # Data access, auth, validation, utilities
│   └── middleware.ts          # Admin page protection
├── .env.example               # Environment variable template
├── DEPLOY.md                  # Production deployment guide
└── package.json
```

### Architecture

Server pages and API routes share a single **lib-first** data layer:

- **`src/lib/*`** — queries, validation, CRUD, and response shaping (typed mappers like `toProjectWithMedia`, `toLogEntry`)
- **`src/app/api/*`** — thin route handlers that call lib functions and return JSON
- **`src/middleware.ts`** — protects `/admin` pages; mutation routes also call `requireAdmin()` from `admin.ts`

Admin UI forms call the API routes; public pages read data directly via lib functions in server components.

### Key directories

**`src/app/api/`** — REST endpoints for projects, sections, labels, log entries, comments, uploads, site settings, header links, and admin auth. Mutation routes require admin authentication.

**`src/lib/`** — Server-side logic:

| File | Purpose |
|------|---------|
| `db.ts` | Prisma client singleton |
| `auth.ts` / `admin.ts` | Password login, session cookies, `requireAdmin()` API guard |
| `projects.ts` | Project queries, CRUD, labels, featured/timeline |
| `log.ts` | Log entry queries and CRUD |
| `sections.ts` | Section queries and CRUD |
| `labels.ts` | Label management, system labels, usage counts |
| `comments.ts` | Shared comment CRUD for log entries and projects |
| `siteSettings.ts` | Site branding, comment toggles, upsert |
| `headerLinks.ts` | Header navigation links |
| `uploads.ts` | Upload storage, path safety, file cleanup |
| `media.ts` / `mediaSync.ts` | Cover image helpers, media replace-on-save |
| `slug.ts` / `links.ts` | Slug validation, `parseLinks` for project links JSON |
| `dates.ts` | Calendar date parsing and display formatting |
| `sectionValidation.ts` | Section slug/color validation |
| `apiRoute.ts` / `apiErrors.ts` | Shared API error handling |
| `clientUpload.ts` | Client-side upload helper for admin forms |
| `richText.ts` | Markdown link and URL parsing |
| `types.ts` | Shared TypeScript types |

**`src/components/`** — UI split between public views (`ProjectGrid`, `MediaCarousel`, `CommentsSection`, etc.) and admin forms (`AdminProjectForm`, `AdminSiteSettingsForm`, etc.). `CommentsSection` handles public and admin comment UI for both log entries and projects.

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
| `dev` | `prisma generate && next dev` | Development server at [http://localhost:3000](http://localhost:3000) |
| `build` | `prisma generate && next build` | Production build |
| `start` | `next start` | Run production server (after `build`; port 3000) |
| `clean` | `node scripts/clean.mjs` | Remove `.next/`, generated Prisma client, logs, and other build artifacts |
| `db:seed` | `tsx prisma/seed.ts` | Seed default sections, header links, and site settings |
| `lint` | `eslint` | Lint the codebase |

`postinstall` runs `prisma generate` automatically after `npm install`.

### Database commands

| Task | Command |
|------|---------|
| Apply migrations (dev) | `npx prisma migrate dev` |
| Apply migrations (production) | `npx prisma migrate deploy` |
| Regenerate Prisma client only | `npx prisma generate` |
| Seed defaults | `npm run db:seed` |
| Open Prisma Studio | `npx prisma studio` |

### Common workflows

**First-time setup**

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed    # optional — defaults are also created on first load
npm run dev
```

**After moving the project or a bad build**

```bash
npm run clean
npm install
npx prisma migrate dev
npm run dev
```

**Production**

```bash
npm run build
npm run start
```

See **[DEPLOY.md](./DEPLOY.md)** for full production deployment instructions.
