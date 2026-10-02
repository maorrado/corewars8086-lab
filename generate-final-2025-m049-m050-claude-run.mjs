import crypto from "node:crypto";
import fs from "node:fs";

const base = JSON.parse(fs.readFileSync("config-m050-zdi-control-all-field-h2.json", "utf8"));
const m049 = [
  "build/chimera-zero-di-elision/b_pad_a",
  "build/chimera-zero-di-elision/a_pad_b",
];
const m050 = ["build/final/ChimeraA", "build/final/ChimeraB"];
const claude = [
  "build/claude-fixed-toggle-2026-09-30/A",
  "build/claude-fixed-toggle-2026-09-30/B",
];
const expectedHashes = new Map([
  [m049[0], "106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973"],
  [m049[1], "7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77"],
  [m050[0], "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44"],
  [m050[1], "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
  [claude[0], "bea990bbf2c60cb4c39d80dd5b533f83a1eb62f1ad202020c6d4e93cbebc2747"],
  [claude[1], "9761054288100948cfcf3610c8d989f16eba68f0f501b90c21b7de9ead380c8f"],
]);
for (const [file, expected] of expectedHashes) {
  const actual = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  if (actual !== expected) throw new Error(`${file}: SHA-256 mismatch (${actual})`);
}

// Match the 75-cohort joint run's battle count and seed; rotate each of the
// three official opponents through the fourth team slot once per base cohort.
const cohorts = base.cohorts.flatMap((cohort) =>
  cohort.opponents.map((official, index) => ({
    id: `joint-claude-${cohort.id}-${index + 1}`,
    opponents: [
      { name: "COD_m049", warriors: m049 },
      { name: "CLAUDE_smart_fixed_toggle", warriors: claude },
      official,
    ],
  })),
);
if (base.cohorts.length !== 25 || cohorts.length !== 75) {
  throw new Error(`Unexpected cohort count: ${base.cohorts.length} base, ${cohorts.length} joint`);
}
const config = {
  experimentId: "requested-final-2025-m049-m050-claude-together-once-20260930",
  outputPath: "experiments/m050-search/requested-final-2025-m049-m050-claude-together-once-20260930.json",
  runDirectory: "build/official-runs/m050-search/requested-final-2025-m049-m050-claude-together-once-20260930",
  battles: 50,
  threads: 4,
  seeds: ["requested-2025-joint-20260930-v1"],
  candidate: { name: "COD_m050", warriors: m050 },
  cohorts,
  zombies: base.zombies,
};
const path = "config-final-2025-m049-m050-claude-together-once.json";
if (fs.existsSync(path)) throw new Error(`${path} already exists; refusing to overwrite`);
fs.writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`);
console.log(`${path}: ${cohorts.length} cohorts x ${config.battles} battles`);
