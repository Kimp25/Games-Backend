// scrapers/gog.js
import fetch from "node-fetch";

/**
 * searchGOG(gameName, options)
 * Endpoint oficial moderno de GOG (v1/catalog).
 * Devuelve:
 *  price, original, description, genres, release_date, image, url
 */

export async function searchGOG(gameName, options = {}) {
  const country = options.countryCode || "US";
  const currency = options.currency || "USD";
  const lang = options.language || "en";

  if (!gameName) return null;

  try {
    // ⭐ API moderna de GOG
    const searchUrl = `https://catalog.gog.com/v1/catalog?search=${encodeURIComponent(
      gameName
    )}&countryCode=${country}&currencyCode=${currency}&locale=${lang}&limit=10`;

    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

    if (!res.ok) throw new Error("Bad status " + res.status);

    const json = await res.json();

    // ❌ Nada encontrado
    if (!json?.products?.length) return null;

    const p = json.products[0];

    // ============================
    // ⭐ Precio
    // ============================
    const priceObj = p.price ?? null;

    const price =
      priceObj?.finalAmount != null ? Number(priceObj.finalAmount) : null;

    const original =
      priceObj?.baseAmount != null
        ? Number(priceObj.baseAmount)
        : price;

    // ============================
    // ⭐ Descripción (summary)
    // ============================
    const description = p?.summary ?? null;

    // ============================
    // ⭐ Géneros
    // ============================
    const genres = Array.isArray(p?.genres) ? p.genres : [];

    // ============================
    // ⭐ Fecha de salida
    // ============================
    const release_date = p?.releaseDate ?? null; // viene como "2020-05-15T00:00:00Z"

    // ============================
    // ⭐ Imagen
    // ============================
    const image = p?.image ? "https:" + p.image : null;

    // ============================
    // ⭐ URL
    // ============================
    const url = p?.url ? "https://www.gog.com" + p.url : null;

    return {
      store: "gog",

      price,
      original,
      discount_percent:
        original && price ? Math.round(((original - price) / original) * 100) : 0,

      description,
      genres,
      release_date,
      image,
      url,
    };
  } catch (err) {
    console.log("⚠️ Error GOG:", err.message);
    return null;
  }
}
