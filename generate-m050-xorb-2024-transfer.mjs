import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const baseline = JSON.parse(fs.readFileSync("config-m050-pointer-holdout-field-control.json", "utf8"));
const finalistDir = "repos/corewars8086-survivors/cgx2024/03-live";
const sha = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const seen2025 = new Set(baseline.cohorts.flatMap((cohort) => cohort.opponents)
  .flatMap((team) => team.warriors).map(sha));
const entries = fs.readdirSync(finalistDir);
const teams = [];
for (const file of entries) {
  if (!file.endsWith("1")) continue;
  const peer = `${file.slice(0, -1)}2`;
  if (!entries.includes(peer)) continue;
  const warriors = [path.posix.join(finalistDir, file), path.posix.join(finalistDir, peer)];
  if (warriors.some((warrior) => fs.statSync(warrior).size > 256)) continue;
  if (warriors.some((warrior) => seen2025.has(sha(warrior)))) continue;
  teams.push({ name: `C24_${file.slice(0, -1)}`, warriors });
}
if (teams.length < 20) throw new Error(`Expected at least 20 eligible 2024 teams, found ${teams.length}`);

let state = 0x2024babe;
const next = () => {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state;
};
for (let i = teams.length - 1; i > 0; i--) {
  const j = next() % (i + 1);
  [teams[i], teams[j]] = [teams[j], teams[i]];
}

const candidates = {
  control: ["build/m050-repro/ab_pad_a", "build/m050-repro/ab_pad_b"],
  xor_b: ["build/m050-pointer-operator/xor-b/A", "build/m050-pointer-operator/xor-b/B"],
};
for (const [variant, warriors] of Object.entries(candidates)) {
  const config = structuredClone(baseline);
  config.experimentId = `m050-xorb-2024-transfer-${variant}`;
  config.outputPath = `experiments/smart-counter-2026-09-30/xorb-decision/transfer-2024-${variant}.json`;
  config.runDirectory = `build/official-runs/smart-counter-2026-09-30/xorb-decision/transfer-2024-${variant}`;
  config.candidate = { name: "COD_m050_control", warriors };
  config.seeds = ["xorb-transfer-2024-20260930-alpha", "xorb-transfer-2024-20260930-beta"];
  config.cohorts = Array.from({ length: Math.ceil(teams.length / 2) }, (_, index) => ({
    id: `transfer-${String(index + 1).padStart(2, "0")}`,
    opponents: [teams[index * 2], teams[(index * 2 + 1) % teams.length], teams[(index * 2 + 9) % teams.length]],
  }));
  fs.writeFileSync(`config-m050-xorb-2024-transfer-${variant}.json`, `${JSON.stringify(config, null, 2)}\n`);
}
console.log(`Using ${teams.length} disjoint 2024 teams in ${Math.ceil(teams.length / 2)} cohorts`);
