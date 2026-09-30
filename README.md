# Sunna Seed Project 🌱

**Plant the Sunnah. Grow the Ummah.**

A responsive Islamic educational publishing platform with a Little Seeds learning experience and a protected, source-conscious CMS foundation.

## Repository map

```text
.
├── src/                  React public site, children’s experience and Admin OS
├── server/
│   ├── index.js          REST API and protected CMS endpoints
│   ├── auth.js           password hashing and signed sessions
│   ├── rbac.js           role/permission enforcement
│   ├── content.js        religious metadata and workflow validation
│   └── store.js          atomic local development repository
├── db/schema.sql         normalized PostgreSQL production schema
├── docs/ARCHITECTURE.md  security, workflow and deployment guidance
├── .env.example          safe configuration template
└── vite.config.js        web development server and API proxy
```

## Start locally

```bash
npm install
cp .env.example .env
npm run dev
```

- Website: `http://localhost:5173`
- API health: `http://localhost:5173/api/health`
- Admin interface: `http://localhost:5173/admin`

The default local administrator is controlled by `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Change both values before using the API. The local JSON repository is ignored by Git and is for development only.

## Quality commands

```bash
npm run check       # syntax check and production build
npm run format      # format source files
```

## Implemented safeguards

- JWT authentication with bcrypt password hashing
- explicit role-based permissions
- API rate limiting, security headers, payload limits and CORS
- server-side Hadith and Qur’an source-field validation
- publication warnings and workflow enforcement
- immutable-style version increments and audit events
- atomic development persistence
- normalized PostgreSQL production model
- responsive and reduced-motion interfaces

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before deployment. The current file-backed repository must be replaced by PostgreSQL and production-grade object storage before public launch.
