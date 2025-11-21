// scrapers/hltb.js
import fetch from "node-fetch";
import * as cheerio from "cheerio";

// ============================================
// Helpers
// ============================================

function parseHours(text) {
  if (!text) return null;
  let s = text.toLowerCase();

  // Fracciones Unicode
  let extra = 0;
  if (s.includes("½")) extra += 0.5;
  if (s.includes("¼")) extra += 0.25;
  if (s.includes("¾")) extra += 0.75;

  s = s.replace(/[½¼¾]/g, "").trim();
  const match = s.match(/([\d.,]+)/);
  if (!match) return null;

  let num = parseFloat(match[1].replace(",", "."));
  if (isNaN(num)) return null;

  num += extra;

  // Minutos → horas
  if (s.includes("min")) num = num / 60;

  return Number(num.toFixed(2));
}

// ============================================
// Scraper nuevo HLTB (2025)
// ============================================

async function fetchHLTBHtml(query) {
  const body = new URLSearchParams({
    queryString: query,
    t: "games",
  }).toString();

  const res = await fetch("https://howlongtobeat.com/search_results?page=1", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      Referer: "https://howlongtobeat.com/",
    },
    body,
  });

  if (!res.ok) return null;

  return await res.text();
}

function parseHLTB(html) {
  const $ = cheerio.load(html);

  const block = $(".search_list_image").first();
  if (!block || block.length === 0) return null;

  const rows = block.find(".search_list_tidbit");
  if (!rows || rows.length === 0) return null;

  let main = null;
  let extra = null;
  let comp = null;

  rows.each((i, el) => {
    const label = $(el).find("h5").text().trim().toLowerCase();
    const value = $(el).find(".shadow_text").text().trim();

    if (!value) return;

    if (label.includes("main story")) {
      main = parseHours(value);
    } else if (label.includes("main + extra")) {
      extra = parseHours(value);
    } else if (label.includes("completionist")) {
      comp = parseHours(value);
    }
  });

  if (!main && !extra && !comp) return null;

  return { main, mainExtra: extra, completionist: comp };
}

// ============================================
// Función principal
// ============================================

export async function scrapeHLTB(name, slug = null) {
  const queries = [
    name,
    name.replace(/[™®]/g, "").trim(),
    name.split(":")[0],
    slug?.replace(/-/g, " "),
  ].filter(Boolean);

  for (const q of queries) {
    try {
      const html = await fetchHLTBHtml(q);
      if (!html) continue;

      const result = parseHLTB(html);
      if (result) return result;
    } catch (e) {
      console.log("⚠️ HLTB error:", e.message);
    }
  }

  return null;
}
