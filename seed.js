import 'dotenv/config';
import admin from "firebase-admin";
import fs from "fs";

// Inicializar Firebase Admin con credenciales desde .env
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  ),
});

const db = admin.firestore();

async function seed() {
  // Leer archivo local
  const json = JSON.parse(fs.readFileSync("./games_base.json", "utf8"));

  for (const g of json) {
    const slug =
      g.slug ||
      g.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    await db.collection("games").doc(slug).set({
      name: g.name,
      slug,

      // 👇 FIX SUPER IMPORTANTE
      platforms: g.platforms && g.platforms.length > 0 ? g.platforms : ["PC"],
      suggested_price: g.suggested_price ?? null,
      genres: g.genres ?? [],
      release_date: g.release_date ?? null,
      metacritic_score: g.metacritic_score ?? null,
      description: g.description ?? null,
      image_url: g.image_url ?? null,
      howlongtobeat_hours: g.howlongtobeat_hours ?? null,
      price_min_usd: g.price_min_usd ?? null,
      price_store: g.price_store ?? null,
      source_urls: g.source_urls ?? {},
      last_updated: g.last_updated ?? null,
    });
  }

  console.log("🌱 Seed completed and platforms fixed.");
}

seed();
