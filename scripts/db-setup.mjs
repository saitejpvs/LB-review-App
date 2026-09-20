import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    "Missing DATABASE_URL. Paste your Neon connection string into .env.local, then run npm run db:setup again."
  );
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const schema = fs.readFileSync(path.join(root, "db", "schema.sql"), "utf8");

async function main() {
  // Re-runnable: clear the old tables first so the seed below is always exact.
  await sql`DROP TABLE IF EXISTS reviews`;
  await sql`DROP TABLE IF EXISTS restaurants`;

  for (const statement of schema.split(";")) {
    const trimmed = statement.trim();
    if (!trimmed) continue;
    await sql.query(trimmed);
  }

  const restaurants = await sql`
    INSERT INTO restaurants (name, cuisine, area)
    VALUES ('Ludhiana Burrito', 'Indian', 'Sector 32')
    RETURNING id, name, cuisine, area
  `;
  const restaurantId = restaurants[0].id;

  const reviews = await sql`
    INSERT INTO reviews (restaurant_id, rating, comment, created_at)
    VALUES
      (${restaurantId}, 5, 'Paneer burrito is unreal', NOW() - INTERVAL '8 days'),
      (${restaurantId}, 4, 'Good, but slow service', NOW() - INTERVAL '6 days'),
      (${restaurantId}, 4, 'Solid. Would repeat.', NOW() - INTERVAL '2 days')
    RETURNING id, restaurant_id, rating, comment, created_at
  `;

  console.log("restaurants:");
  console.table(restaurants);
  console.log("reviews:");
  console.table(reviews);
  console.log(`\nDone. Restaurant id=${restaurantId} with ${reviews.length} reviews.`);
}

main().catch((err) => {
  console.error("db:setup failed:", err.message ?? err);
  process.exit(1);
});