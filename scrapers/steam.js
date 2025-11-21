// scrapers/steam.js
import { getBrowser, getContextConfig } from "../utils/browser.cjs";
import { cleanPrice } from "../utils/helpers.cjs";

export async function searchSteam(gameName, directUrl = null) {
  let browser;
  let context;
  let page;

  try {
    browser = await getBrowser();
    context = await browser.newContext(getContextConfig());
    page = await context.newPage();

    const searchUrl =
      directUrl ||
      "https://store.steampowered.com/search/?term=" +
        encodeURIComponent(gameName);

    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    // ⚠️ FIX CRÍTICO: Steam no muestra precios hasta 1–2s después
    await page.waitForTimeout(1800);

    await page.waitForSelector(".search_result_row", { timeout: 8000 });

    const result = await page.evaluate(() => {
      const item = document.querySelector(".search_result_row");
      if (!item) return null;

      const final =
        item.querySelector(".discount_final_price")?.innerText?.trim() ||
        item.querySelector(".search_price")?.innerText?.trim() ||
        null;

      const original =
        item.querySelector(".discount_original_price")?.innerText?.trim() ||
        null;

      const img =
        item.querySelector(".search_capsule img")?.src ||
        null;

      const url = item.href;

      return { final, original, img, url };
    });

    if (!result || !result.final) return null;

    return {
      price: cleanPrice(result.final),
      original: cleanPrice(result.original) ?? null,
      image: result.img,
      url: result.url,
    };
  } catch (err) {
    console.log("⚠️ Steam scraper error:", err.message);
    return null;
  } finally {
    try { page && await page.close(); } catch {}
    try { context && await context.close(); } catch {}
  }
}
