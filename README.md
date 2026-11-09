# KRISHNA GARMENTS

Dark, luxury ready-to-wear brand. Next.js 15 + TypeScript + Tailwind CSS + Prisma + PostgreSQL.

Public storefront at `/`, owner business panel at `/owner`.

## Requirements

- Node 20+
- PostgreSQL 15+ (local via WSL, Docker, or a managed provider such as Supabase/Render)
- npm

## Install

```bash
npm ci
```

Copy the environment template and fill in a reachable PostgreSQL endpoint:

```bash
cp .env.example .env
```

Then edit `.env` and set:

```
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/krishna_garments?schema=public"
OWNER_USERNAME=krishna.garments@admin
OWNER_PASSWORD=your-secure-password
```

The owner credentials are NEVER committed; `.env` is gitignored.

Generate the Prisma client and boot the database:

```bash
npm run db:generate
npm run db:migrate
```

If you only have the schema and want to wipe and rebuild the database, use:

```bash
npm run db:reset
```

## Development

```bash
npm run dev
```

The dev server runs on `http://localhost:3000`. Owner panel: `http://localhost:3000/owner`.

Create the owner account (one-time):

```bash
npm run setup:owner
```

It reads `OWNER_USERNAME` / `OWNER_PASSWORD` from `.env`, hashes them with Argon2id, and sets `mustChangePassword` so the password must be changed on first login.

Seed a demo catalogue (15 products, never mixed with real data):

```bash
# Edit .env first
SAMPLE_DATA=true
```

```bash
npm run db:seed
```

Every seed record is flagged `isSample: true`, so the owner UI can isolate and delete it without touching live business data.

## Database

Commands:

- `npm run db:generate` - regenerate the Prisma client from the schema
- `npm run db:migrate` - apply schema changes to the configured PostgreSQL database
- `npm run db:deploy` - apply migrations on a server/production database
- `npm run db:studio` - open Prisma Studio GUI against the configured database
- `npm run db:seed` - populate the demo catalogue when `SAMPLE_DATA=true`
- `npm run db:reset` - wipe and re-migrate the database

The owner panel pages query Prisma directly from the server; there are no client-side database concerns.

## Deployment

1. Provision a PostgreSQL database from your hosting provider and copy its connection string into `DATABASE_URL`.
2. Install and build:

   ```bash
   npm ci
   npm run build
   ```

3. Apply migrations before starting the server:

   ```bash
   npm run db:deploy
   ```

4. Create the owner account from the production environment:

   ```bash
   OWNER_USERNAME=krishna.garments=@admin OWNER_PASSWORD=your-secure-password npm run setup:owner
   ```

   For infrastructure-as-code / secrets managers, you can pre-hash the password with the same Argon2id work factor and pass it verbatim:

   ```
   OWNER_PASSWORD=SET:<already-hashed-argon2id-value>
   ```

   When the value is prefixed with `SET:`, the platform skips hashing it and stores it directly.

5. Start the production server:

   ```bash
   npm start
   ```

   With a `.env` present, the same `npm run setup:owner` one-liner provisions the owner account.

## Owner credentials

The default bootstrap account is:

- Username: `krishna.garments=@admin`
- Email: `admin@garments.krishna`

Set `OWNER_PASSWORD` in `.env` and run `npm run setup:owner`. The plaintext password never appears in the repository and is stored as an Argon2id hash.

## Demo data

Run `npm run db:seed` with `SAMPLE_DATA=true` to load 15 placeholder products across the catalogue categories. All seed records carry `isSample: true` and can be removed from the owner panel without affecting real orders or customers.
