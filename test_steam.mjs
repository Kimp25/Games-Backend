import * as steamModule from "./scrapers/steam.cjs";

async function main() {
  console.log("🔍 Probando STEAM...");
  const result = await steamModule.searchSteam("Hades");
  console.log(result);
}

main();
