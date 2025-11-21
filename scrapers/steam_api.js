// scrapers/steam_api.js
import fetch from "node-fetch";

/**
 * searchSteamApi(gameName, options)
 * - Busca el juego por nombre usando storesearch y luego obtiene detalles del appid vía appdetails.
 * - Retorna { price, original, discount_percent, currency, image, url } o null si no encuentra.
 *
 * Opciones:
 *  - cc: country code para precios (default 'us')
 *  - lang: idioma (default 'en')
 *  - timeoutMs: timeout para fetch en ms (default 10000)
 */
export async function searchSteamApi(gameName, options = {}) {
  const cc = options.cc || "us";
  const lang = options.lang || "en";
  const timeoutMs = options.timeoutMs || 10000;

  if (!gameName || typeof gameName !== "string") return null;

  try {
    // 1) Buscar appid vía storesearch
    const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
      gameName
    )}&cc=${cc}&l=${lang}`;

    const searchResp = await fetchWithTimeout(searchUrl, timeoutMs);
    if (!searchResp.ok) return null;
    const searchJson = await searchResp.json();

    if (!searchJson || !Array.isArray(searchJson.items) || searchJson.items.length === 0)
      return null;

    // Tomar el primer resultado más relevante
    const first = searchJson.items[0];
    const appid = first.id;
    const nameFound = first.name || null;
    const storeUrl = first.url || `https://store.steampowered.com/app/${appid}/`;

    // 2) Obtener detalles via appdetails
    const detailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${cc}&l=${lang}`;
    const detailsResp = await fetchWithTimeout(detailsUrl, timeoutMs);
    if (!detailsResp.ok) return null;
    const detailsJson = await detailsResp.json();

    const detailObj = detailsJson?.[appid]?.data;
    if (!detailObj) return null;

    // Si es free-to-play o free, price_overview puede no existir
    const is_free = !!detailObj.is_free;

    let price = null;
    let original = null;
    let discount_percent = 0;
    let currency = null;

    if (is_free) {
      price = 0;
      original = 0;
      discount_percent = 0;
      currency = "USD";
    } else if (detailObj.price_overview) {
      // price_overview: { currency, initial, final, discount_percent, ... } (values en centavos típicamente)
      const pov = detailObj.price_overview;
      currency = pov.currency || cc.toUpperCase();
      // Steam returns price in cents (e.g. 4999) depending on cc; normalizamos a unidades (USD)
      const finalVal = typeof pov.final === "number" ? pov.final : parseFloat(pov.final) || null;
      const initialVal = typeof pov.initial === "number" ? pov.initial : parseFloat(pov.initial) || null;

      price = finalVal != null ? finalVal / 100.0 : null;
      original = initialVal != null ? initialVal / 100.0 : (price != null ? price : null);
      discount_percent = pov.discount_percent ?? 0;
    } else {
      // Fallback: si no hay price_overview pero hay 'price' u otros campos, intenta leerlos
      price = null;
      original = null;
      discount_percent = 0;
    }

    const image = detailObj.header_image || (detailObj?.screenshots?.[0]?.path_full ?? null);

    return {
      store: "steam",
      appid,
      name: nameFound,
      price,
      original,
      discount_percent,
      currency,
      image,
      url: storeUrl,
      description: detailObj.short_description ?? null,
      genres: detailObj.genres?.map(g => g.description) ?? [],
      release_date:
      detailObj.release_date?.release_date
      ? detailObj.release_date.release_date
      :null,
      raw: detailObj, // opcional: el objeto crudo por si quieres más datos (metacritic, release_date, etc.)
    };
  } catch (err) {
    console.log("⚠️ Steam API scraper error:", err.message);
    return null;
  }
}

// Helper: fetch con timeout pequeño
async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(id);
  }
}
