import * as mc from "./scrapers/metacritic.cjs";

async function main() {
  console.log("🔍 Probando METACRITIC...");
  const result = await mc.searchMetacritic("Hades");
  console.log(result);
}

main();
