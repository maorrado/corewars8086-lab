import fs from "node:fs";

// Pre-specified validation: regroup the 75 official 2025 opponents, then
// compare m050 and XOR-B on identical fresh seeds with/without Claude.
const baseline = JSON.parse(fs.readFileSync("config-m050-pointer-holdout-field-control.json", "utf8"));
const teams = baseline.cohorts.flatMap((cohort) => cohort.opponents);
if (teams.length !== 75 || new Set(teams.map((team) => team.name)).size !== 75) {
  throw new Error("Expected 75 distinct official opponent teams");
}

// Fixed reproducible Fisher-Yates shuffle; unrelated to battle seeds.
let state = 0x5a17cafe;
const next = () => {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state;
};
for (let i = teams.length - 1; i > 0; i--) {
  const j = next() % (i + 1);
  [teams[i], teams[j]] = [teams[j], teams[i]];
}

const claude = {
  name: "COD_claude_fixed_toggle",
  warriors: ["build/claude-fixed-toggle-2026-09-30/A", "build/claude-fixed-toggle-2026-09-30/B"],
};
const candidates = {
  control: ["build/m050-repro/ab_pad_a", "build/m050-repro/ab_pad_b"],
  xor_b: ["build/m050-pointer-operator/xor-b/A", "build/m050-pointer-operator/xor-b/B"],
};

for (const mode of ["official", "claude_mixed"]) {
  for (const [variant, warriors] of Object.entries(candidates)) {
    const config = structuredClone(baseline);
    config.experimentId = `m050-xorb-decision-${mode}-${variant}`;
    config.outputPath = `experiments/smart-counter-2026-09-30/xorb-decision/${mode}-${variant}.json`;
    config.runDirectory = `build/official-runs/smart-counter-2026-09-30/xorb-decision/${mode}-${variant}`;
    config.candidate = { name: "COD_m050_control", warriors };
    config.seeds = ["xorb-decision-20260930-delta", "xorb-decision-20260930-epsilon"];
    config.cohorts = Array.from({ length: 25 }, (_, index) => {
      const opponents = teams.slice(index * 3, index * 3 + 3).map((team) => structuredClone(team));
      if (mode === "claude_mixed") opponents[index % 3] = structuredClone(claude);
      return { id: `decision-${String(index + 1).padStart(2, "0")}`, opponents };
    });
    fs.writeFileSync(`config-m050-xorb-decision-${mode}-${variant}.json`, `${JSON.stringify(config, null, 2)}\n`);
  }
}
