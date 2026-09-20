import fs from "node:fs";
import path from "node:path";

const base = path.resolve("official-2025/survivors-online");
const pairs = new Map();
for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const match = /^(.*)([12])$/.exec(entry.name);
  if (!match) continue;
  const [, name, suffix] = match;
  const pair = pairs.get(name) ?? [];
  pair[Number(suffix) - 1] = `../official-2025/survivors-online/${entry.name}`;
  pairs.set(name, pair);
}
const teams = [...pairs.entries()]
  .filter(([, pair]) => pair.length === 2 && pair.every(Boolean))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, warriors]) => ({ name, warriors }));

const poolCount = Math.ceil(teams.length / 8);
const pools = Array.from({ length: poolCount }, () => []);
teams.forEach((team, index) => pools[index % poolCount].push(team));

const outDir = path.resolve("pool-configs-2025");
fs.mkdirSync(outDir, { recursive: true });
pools.forEach((pool, index) => {
  const id = String(index + 1).padStart(2, "0");
  const config = {
    battles: 40,
    seed: `quick-2025-pool-${id}`,
    quiet: true,
    outputPath: `../experiments/2025-pool-${id}.json`,
    teams: pool,
    zombieDirectories: [{ path: "../official-2025/zombies-live" }],
  };
  fs.writeFileSync(path.join(outDir, `pool-${id}.json`), `${JSON.stringify(config, null, 2)}\n`);
});
console.log(JSON.stringify({ teams: teams.length, pools: pools.map((pool) => pool.map((team) => team.name)) }, null, 2));
