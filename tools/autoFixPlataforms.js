import fs from "fs";

const PLATFORM_RULES = [
  // Nintendo Switch exclusives
  { keywords: ["zelda", "mario", "kirby", "metroid", "pokemon", "switch"], platforms: ["Nintendo Switch"] },

  // PlayStation exclusives
  { keywords: ["god of war", "uncharted", "ratchet", "horizon zero", "last of us", "ghost of tsushima", "bloodborne"], platforms: ["PlayStation"] },

  // Xbox exclusives
  { keywords: ["halo", "forza", "gears of war", "fable"], platforms: ["Xbox"] },

  // Multiplatform patterns
  { keywords: ["assassin", "ac origins", "ac odyssey", "elden ring", "doom", "hades", "cuphead"], platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"] },

  // PC-only patterns
  { keywords: ["counter strike", "csgo", "valorant", "world of warcraft", "starcraft", "dota", "lol"], platforms: ["PC"] },
];

// función principal: detecta plataforma por nombre del juego
function detectPlatforms(gameName) {
  const name = gameName.toLowerCase();

  for (const rule of PLATFORM_RULES) {
    if (rule.keywords.some((kw) => name.includes(kw))) {
      return rule.platforms;
    }
  }

  // fallback: PC
  return ["PC"];
}

const games = JSON.parse(fs.readFileSync("./games_base.json", "utf8"));

const updated = games.map((g) => {
  g.platforms = detectPlatforms(g.name);
  return g;
});

fs.writeFileSync("./games_base.fixed.json", JSON.stringify(updated, null, 2));

console.log("✔ Archivo generado: games_base.fixed.json");
