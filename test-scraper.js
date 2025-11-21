const { searchSteam } = require("./scrapers/steam");

(async () => {
  const r = await searchSteam("Hades");
  console.log(r);
})();
