// scrapers/nintendo.js
import fetch from "node-fetch";

export async function searchNintendo(gameName) {
  if (!gameName) return null;

  try {
    // ⭐ API oficial europea (estable)
    const url =
      "https://searching.nintendo-europe.com/es/select?" +
      "q=" + encodeURIComponent(gameName) +
      "&rows=20&wt=json";

    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });

    if (!resp.ok) {
      console.log("⚠️ Nintendo API HTTP:", resp.status);
      return null;
    }

    const json = await resp.json();
    const docs = json?.response?.docs || [];

    if (!docs.length) return null;

    // Tomamos el más cercano
    const g = docs[0];

    // ⭐ Precios
    const price = g.price_regular_f ?? null;
    const sale = g.price_discounted_f ?? null;

    // ⭐ Imagen
    const image = g.image_url ?? null;

    // ⭐ URL
    const urlStore = g.url ?? null;

    // ⭐ Descripción
    const description = g.excerpt ?? null;

    // ⭐ Géneros
    const genres = Array.isArray(g.genre) ? g.genre : [];

    // ⭐ Fecha de salida
    const release_date = g.release_date ?? null;

    return {
      store: "nintendo",

      price: sale ?? price ?? null,
      original: price ?? sale ?? null,

      image,
      url: urlStore,

      description,
      genres,
      release_date,
    };

  } catch (err) {
    console.log("⚠️ Nintendo search error:", err.message);
    return null;
  }
}
