import * as epicModule from "./scrapers/epic.cjs";

async function main() {
  console.log("🔍 Probando EPIC...");
  const result = await epicModule.searchEpic("Hades");
  console.log(result);
}

main();
