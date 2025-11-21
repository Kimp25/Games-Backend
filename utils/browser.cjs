const { chromium } = require("playwright");

// --- GLOBAL LIMITER (no tocar) ---
let activeBrowsers = 0;
const MAX_BROWSERS = 2;

exports.getBrowser = async () => {
  // Espera si hay demasiados navegadores
  while (activeBrowsers >= MAX_BROWSERS) {
    await new Promise((res) => setTimeout(res, 200));
  }

  activeBrowsers++;

  try {
    const browser = await chromium.launch({
      headless: true, // MUCHAS webs no funcionan con headless: true
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-gpu",
        "--disable-infobars",
        "--window-size=1366,768",
      ],
    });

    return browser;
  } catch (err) {
    activeBrowsers = Math.max(0, activeBrowsers - 1);
    throw err;
  }
};

// 🛡️ STEALTH + SPOOFING
exports.getContextConfig = () => ({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

  viewport: { width: 1366, height: 768 },
  locale: "en-US",
  timezoneId: "America/Chicago",

  bypassCSP: true, // permite que cargue Steam
  javaScriptEnabled: true,

  permissions: ["geolocation"],

  // Anti–Webdriver
  extraHTTPHeaders: {
    "Accept-Language": "en-US,en;q=0.9",
  },
});


// --- LLAMAR SIEMPRE CUANDO CIERRES EL BROWSER ---
exports._browserClosed = () => {
  activeBrowsers = Math.max(0, activeBrowsers - 1);
};
