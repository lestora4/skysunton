const { neon } = require("@neondatabase/serverless");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add it to your .env file (local) or Vercel Project Settings > Environment Variables (production)."
  );
}

// Neon's serverless HTTP driver - works great on Vercel serverless functions,
// no connection pooling headaches, one query = one HTTP call.
const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };
