import fs from "node:fs";

// Pre-registered comparison: four independently shuffled partitions of all
// 75 official 2025 teams. Each team appears once per partition; the candidate
// faces exactly three teams per battle, as in the four-team competition.
const baseline = JSON.parse(fs.readFileSync("config-m050-pointer-holdout-field-control.json", "utf8"));
const teams = baseline.cohorts.flatMap((cohort) => cohort.opponents);
if (teams.length !== 75 || new Set(teams.map((team) => team.name)).size !== 75) {
  throw new Error("Expected 75 unique official 2025 teams");
}

const candidates = {
  control: ["build/m050-repro/ab_pad_a", "build/m050-repro/ab_pad_b"],
  xor_b: ["build/m050-pointer-operator/xor-b/A", "build/m050-pointer-operator/xor-b/B"],
};

for (let part = 0; part < 4; part++) {
  let state = (0x6c72a381 + Math.imul(part + 1, 0x9e3779b9)) >>> 0;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
  const shuffled = teams.map((team) => structuredClone(team));
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = next() % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  for (const [variant, warriors] of Object.entries(candidates)) {
    const config = structuredClone(baseline);
    const label = `part-${part + 1}-${variant}`;
    config.experimentId = `m050-xorb-competition-proxy-${label}`;
    config.outputPath = `experiments/smart-counter-2026-09-30/xorb-competition-proxy/${label}.json`;
    config.runDirectory = `build/official-runs/smart-counter-2026-09-30/xorb-competition-proxy/${label}`;
    config.battles = 100;
    config.threads = 4;
    config.seeds = [`xorb-competition-proxy-20260930-part-${part + 1}`];
    config.candidate = { name: "COD_m050_control", warriors };
    config.cohorts = Array.from({ length: 25 }, (_, index) => ({
      id: `proxy-${part + 1}-${String(index + 1).padStart(2, "0")}`,
      opponents: shuffled.slice(index * 3, index * 3 + 3),
    }));
    fs.writeFileSync(`config-m050-xorb-competition-proxy-${label}.json`, `${JSON.stringify(config, null, 2)}\n`);
  }
}
