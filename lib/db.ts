import { neon } from "@neondatabase/serverless";

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL. Add it to .env.local (local) and to Vercel project settings (production)."
    );
  }
  return neon(url);
}