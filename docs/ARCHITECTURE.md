# Architecture

## Current implementation

The repository now contains two runnable applications:

- `src/`: responsive React public site, Little Seeds experience, and CMS interface.
- `server/`: secured REST API with authentication, RBAC, validation, workflow enforcement, audit logging, search, and file-backed development persistence.
- `db/schema.sql`: normalized PostgreSQL target schema for production migration.

## Security boundaries

The browser never receives database or signing secrets. Admin endpoints require a signed bearer token and an explicit RBAC permission. Religious content validation is performed on the server. Production startup fails when the development JWT secret remains configured.

The JSON store is intended for local evaluation only. Production deployment should replace `server/store.js` with a PostgreSQL repository implementing the same operations, store uploaded media in object storage, and use an HttpOnly/SameSite cookie or a hardened identity provider.

## Content workflow

`DRAFT → EDITORIAL_REVIEW → ISLAMIC_SOURCE_REVIEW → VISUAL_REVIEW → APPROVED → SCHEDULED → PUBLISHED`

Hadith and Qur’an records are blocked from leaving draft when mandatory source fields are absent. Publication is blocked without reviewer approval. Every create/update operation records previous and new values.

## Deployment checklist

1. Provision PostgreSQL and apply `db/schema.sql` through migrations.
2. Configure secrets from a secret manager, never from frontend environment variables.
3. Replace the development JSON repository with PostgreSQL.
4. Configure private object storage, file scanning, signed downloads, backups and restore tests.
5. Connect an approved email/identity provider and require MFA for privileged roles.
6. Add qualified Islamic reviewers and document source policy before publishing content.
7. Add automated accessibility, API integration, authorization and browser tests to CI.
