// ================================================
//     worker/updateGames.js - BACKEND FINAL
// ================================================

import { db } from "../firebase.js";

// SCRAPERS
import { searchSteamApi } from "../scrapers/steam_api.js";
import { searchGOG } from "../scrapers/gog.js";
import { searchNintendo } from "../scrapers/nintendo.js";
import { scrapeMetacritic } from "../scrapers/metacritic.js";
import { scrapeHLTB } from "../scrapers/hltb.js";

// ------------------------------------------------
// Helper: timeout seguro
// ------------------------------------------------
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label}: TIMEOUT ${ms}ms`)), ms)
    ),
  ]);

// ------------------------------------------------
// Procesar un solo juego
// ------------------------------------------------
async function processOneGame(gameDoc) {
  const game = gameDoc.data();
  const ref = gameDoc.ref;

  console.log(`⏳ Procesando: ${game.name}`);

  // Llamadas paralelas
  const [steam, gog, nintendo, meta, hltb] = await Promise.allSettled([
    withTimeout(searchSteamApi(game.name, { cc: "mx" }), 12000, "Steam API"),
    withTimeout(searchGOG(game.name, { countryCode: "US", currency: "USD" }), 10000, "GOG"),
    withTimeout(searchNintendo(game.name), 10000, "Nintendo"),
    withTimeout(scrapeMetacritic(game.name, game.platforms || [], game.slug), 12000, "Metacritic"),
    withTimeout(scrapeHLTB(game.name, game.slug), 12000, "HLTB"),
  ]);


  // ------------------------------------------------
  // Normalización de tiendas
  // ------------------------------------------------
  const stores = [];

  // ⭐ STEAM API
  if (steam.status === "fulfilled" && steam.value && steam.value.price != null) {
    stores.push({
      store: "steam",
      price: steam.value.price,
      original: steam.value.original ?? steam.value.price,
      url: steam.value.url,
      image: steam.value.image,
    });
  }

  // ⭐ GOG
  if (gog.status === "fulfilled" && gog.value && gog.value.price != null) {
    stores.push({
      store: "gog",
      price: gog.value.price,
      original: gog.value.original ?? gog.value.price,
      url: gog.value.url,
      image: gog.value.image,
    });
  }
    // ⭐ NINTENDO
  if (nintendo.status === "fulfilled" && nintendo.value && nintendo.value.price != null) {
    stores.push({
      store: "nintendo",
      price: nintendo.value.price,
      original: nintendo.value.original ?? nintendo.value.price,
      url: nintendo.value.url,
      image: nintendo.value.image,
    });
  }


  // Seleccionar mejor oferta
  const bestStore =
    stores.length > 0
      ? stores.reduce((a, b) => (a.price < b.price ? a : b))
      : null;

  const bestPrice = bestStore?.price ?? null;
  const originalPrice = bestStore?.original ?? null;

  // Si existe suggested_price en el repo, úsalo si es mejor referencia
  const basePrice =
    originalPrice ??
    game.suggested_price ??
    null;

  const discountPercent =
    bestStore && basePrice && basePrice > 0
      ? Math.round(((basePrice - bestPrice) / basePrice) * 100)
      : 0;

  // ------------------------------------------------
  // HLTB / Metacritic
  // ------------------------------------------------
  const hltbHours =
    hltb.status === "fulfilled" && hltb.value
      ? hltb.value.main ?? null
      : null;

  const metacriticScore =
    meta.status === "fulfilled" && meta.value
      ? meta.value.score ?? null
      : null;

  // ------------------------------------------------
  // Guardar actualización
  // ------------------------------------------------
  await ref.update({
    description: steam.value?.description ?? game.description ?? null,
    genres: steam.value?.genres ?? game.genres ?? [],
    release_date: steam.value?.release_date ?? game.release_date ?? null,
    price_min_usd: bestPrice,
    original_price: originalPrice,
    discount_percent: discountPercent,
    price_store: bestStore?.store ?? null,
    store_url: bestStore?.url ?? null,

    // Imagen: tienda → fallback → anterior
    image_url: bestStore?.image ?? game.image_url ?? null,

    howlongtobeat_hours: hltbHours,
    metacritic_score: metacriticScore,
    last_updated: new Date(),
  });

  console.log(`✅ Listo: ${game.name}`);
}

// ------------------------------------------------
// Procesamiento en lotes
// ------------------------------------------------
async function processInBatches(games, batchSize = 8) {
  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);
    console.log(`⚡ Lote ${i / batchSize + 1}`);

    await Promise.all(
      batch.map((doc) =>
        processOneGame(doc).catch((err) => {
          console.log("⚠️ Error procesando juego:", err);
        })
      )
    );
  }
}

// ------------------------------------------------
// Entrada principal
// ------------------------------------------------
async function runScraper() {
  console.log(`
==============================
   🔥 INICIANDO SCRAPER 🔥
==============================
`);

  const snapshot = await db.collection("games").get();
  const games = snapshot.docs;

  console.log(`📌 Total juegos en repositorio: ${games.length}`);
  console.log(`⏳ Esto tardará unos minutos...\n`);

  await processInBatches(games, 8);

  console.log("\n🎉 SCRAPER COMPLETO 🎉\n");
}

runScraper().catch((err) => {
  console.error("❌ Error global:", err);
});
