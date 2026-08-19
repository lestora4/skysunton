# Sky Sunton Website — Node.js + Neon + Vercel

Converted from the static Webflow export into a Node.js (Express) site with:

- Newsletter signup saved to Neon Postgres
- Email + phone + password signup/login (JWT session cookie)
- Header shows the logged-in user's name (derived from their email) + a Logout link, on every page
- `/dashboard` — simple page listing the logged-in user's saved favorite products
- Clean URLs (`/about` instead of `/about.html`, etc.) — old links 301-redirect automatically
- Ready to deploy to Vercel as a serverless Express app

Everything below is done from the Command Prompt.

---

## 1. Install Node.js (skip if already installed)

Download and install the LTS version from https://nodejs.org, then confirm:

```
node --version
npm --version
```

## 2. Open a terminal in the project folder

```
cd path\to\skysunton-web
npm install
```

## 3. Set up your Neon database

**⚠️ Important:** the Neon connection string you pasted earlier is now visible in this chat. Before going live, regenerate/reset the password for that database role in the Neon dashboard (Project → Connection Details → Reset password), then use the new string everywhere below.

Create a file named `.env` in the project root (same folder as `package.json`):

```
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-flat-glade-axk5pchq-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=paste-a-long-random-string-here
NODE_ENV=development
PORT=3000
```

Generate a random JWT_SECRET from the command line:

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the output into `JWT_SECRET` above.

### Create the database tables

Run the migration script — it connects to Neon and creates the 3 tables needed:

```
npm run db:migrate
```

You should see:
```
Migration complete. Tables ready: users, favorites, newsletter_subscribers
```

**If you'd rather run the SQL yourself** (Neon dashboard → SQL Editor, or `psql`), here it is:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT,
  product_image TEXT,
  product_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

To run that SQL file directly with `psql` instead (if you have it installed):

```
psql "postgresql://neondb_owner:YOUR_PASSWORD@ep-flat-glade-axk5pchq-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require" -f schema.sql
```

(`schema.sql` containing the SQL above is included in this zip.)

## 4. Run it locally

```
npm start
```

Open http://localhost:3000 — try signing up at `/signup`, logging in at `/login`, favoriting a product from the shop or a product page, and checking `/dashboard`.

Stop the server with `Ctrl+C`.

---

## 5. Deploy to Vercel (clean URLs included)

### Install the Vercel CLI and log in

```
npm install -g vercel
vercel login
```

### From the project folder, link/deploy the project

```
cd path\to\skysunton-web
vercel
```

Answer the prompts (set up and deploy → yes, link to existing project → no, project name → accept default or type one, directory → `.`, override settings → no).

This creates a **preview** deployment.

### Add your environment variables to the Vercel project

```
vercel env add DATABASE_URL production
```
(paste your Neon connection string when prompted)

```
vercel env add JWT_SECRET production
```
(paste your generated random secret when prompted)

Repeat both commands with `preview` and `development` instead of `production` if you want the same values available in preview deployments too:

```
vercel env add DATABASE_URL preview
vercel env add JWT_SECRET preview
```

### Deploy to production

```
vercel --prod
```

Vercel prints your live URL (e.g. `https://skysunton-web.vercel.app`). Clean URLs (`/about`, `/shop`, `/product?id=...`, `/login`, `/signup`, `/dashboard`) work automatically because of `vercel.json` + `src/server.js`.

### Connect your own domain (optional)

```
vercel domains add skysunton.com
vercel alias set skysunton-web.vercel.app skysunton.com
```
Then update your domain's DNS as instructed by the CLI output (or in the Vercel dashboard under the project's Domains tab).

---

## Notes / assumptions

- **No name field at signup** (as requested) — the header displays a name derived from the part of the email before the `@` (e.g. `john@example.com` → "Hi, John"). If you'd rather show the raw email, or add a real name field later, that's a small change in `src/routes/auth.js`.
- Sessions are stored in an **httpOnly JWT cookie** (30-day expiry) — no separate session table needed.
- Favorites are matched by product slug, so they stay linked correctly even if you reorder or re-filter the shop grid.
- The dashboard is intentionally minimal, per your request — just the list of favorited products with a "Remove" and "View" action on each.

## Project structure

```
skysunton-web/
├── api/index.js          # Vercel serverless entry point
├── src/
│   ├── server.js         # Express app (routes, static files, clean URLs)
│   ├── db.js              # Neon connection
│   ├── migrate.js         # Creates DB tables
│   ├── middleware/auth.js
│   └── routes/
│       ├── auth.js        # signup / login / logout / me
│       ├── favorites.js   # list / toggle favorites
│       └── newsletter.js  # subscribe
├── public/                 # all site pages, css, images, js (served statically)
├── schema.sql
├── vercel.json
├── package.json
└── .env.example
```
