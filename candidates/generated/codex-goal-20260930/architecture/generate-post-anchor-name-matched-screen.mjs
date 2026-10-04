import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const names = ["m050_control", "zombie_bomb_post_anchor_mem"];
const source = names.map((name) => JSON.parse(fs.readFileSync(path.join(here, `${name}-post_anchor_screen.json`), "utf8")));
const [control, variant] = source;
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
if (!equal(control.cohorts, variant.cohorts) || !equal(control.seeds, variant.seeds) || !equal(control.zombies, variant.zombies)) {
  throw new Error("post-anchor source cohorts, seeds, or Zombies differ");
}
if (control.cohorts.length !== 25 || control.seeds.length !== 1 || control.battles !== 20 || variant.battles !== 20) {
  throw new Error("expected 25 cohorts × one seed × 20 battles");
}
const teams = control.cohorts.flatMap((cohort) => cohort.opponents);
if (teams.length !== 75 || new Set(teams.map((team) => team.name)).size !== 75) {
  throw new Error("expected exactly 75 unique official teams");
}
for (let i = 0; i < names.length; i++) {
  const name = names[i];
  const config = structuredClone(source[i]);
  const suffix = "post_anchor_mem_name_matched_screen_v1";
  config.experimentId = `codex-goal-20260930-${name}-${suffix}`;
  config.candidate.name = "COD_pair";
  config.threads = 1;
  config.outputPath = `../../../../experiments/codex-goal-20260930-architecture/${name}-${suffix}.json`;
  config.runDirectory = `../../../../build/official-runs/codex-goal-20260930-architecture/${name}-${suffix}`;
  const destination = path.join(here, `${name}-${suffix}.json`);
  if (fs.existsSync(destination)) throw new Error(`refusing to overwrite ${destination}`);
  fs.writeFileSync(destination, `${JSON.stringify(config, null, 2)}\n`);
  console.log(JSON.stringify({ destination, experimentId: config.experimentId, name: config.candidate.name, battles: 500 }));
}
