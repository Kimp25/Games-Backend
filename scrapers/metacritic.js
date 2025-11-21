import { getBrowser, getContextConfig, _browserClosed } from "../utils/browser.cjs";

export async function scrapeMetacritic(gameName, platforms = [], slug = null) {
  let browser, page;
  try {
    browser = await getBrowser();
    const context = await browser.newContext(getContextConfig());
    page = await context.newPage();

    const query = encodeURIComponent(gameName.replace(/[()]/g, "").trim());
    const url = `https://www.metacritic.com/search/game/${query}/results`;

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // ❌ Evita timeout lanzando error
    const firstResult = await page.$('a[data-testid="search-result-item"]');
    if (!firstResult) {
      console.log(`⚠️ Metacritic: no encontrado para "${gameName}"`);
      await context.close();
      return null;
    }

    // ✅ Si hay resultados, extraemos info
    const results = await page.$$eval(
      'a[data-testid="search-result-item"]',
      (nodes, targetPlatforms) => {
        for (const node of nodes) {
          const title = node.querySelector('p[data-testid="product-title"]')?.textContent?.trim() || "";
          const scoreText = node.querySelector('div[data-testid="product-metascore"] span')?.textContent?.trim() || "";
          const platformText = node.querySelector('span[data-testid="product-platform"]')?.textContent?.toLowerCase() || "";

          if (
            targetPlatforms.length === 0 ||
            targetPlatforms.some((p) => platformText.includes(p))
          ) {
            const score = parseInt(scoreText, 10);
            if (!isNaN(score)) return { title, platform: platformText, score };
          }
        }
        return null;
      },
      (platforms || []).map(p => p.toLowerCase())
    );

    await context.close();
    return results;
  } catch (err) {
    console.log(`⚠️ Error Metacritic "${gameName}": ${err.message}`);
    return null;
  } finally {
    if (browser) _browserClosed();
  }
}
