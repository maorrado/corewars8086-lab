import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const official = (name) => ({
  name,
  warriors: [
    `official-2025/survivors-online/${name}1`,
    `official-2025/survivors-online/${name}2`,
  ],
});
const teams = {
  bytes: official("GSA_TheBytes"),
  opcode: official("GGN_OpcodeHunter"),
  advanced: official("HRZ_ADDvanced"),
  team2b2: official("TOM_2B2Team"),
  ghost: official("GSA_GhostBytes_0x"),
};
const cohorts = [
  { id: "anchor-target-01", opponents: [teams.bytes, teams.opcode, teams.advanced] },
  { id: "anchor-target-02", opponents: [teams.team2b2, teams.ghost, teams.bytes] },
  { id: "anchor-target-03", opponents: [teams.opcode, teams.team2b2, teams.ghost] },
  { id: "anchor-target-04", opponents: [teams.advanced, teams.team2b2, teams.bytes] },
];
const seeds = [
  "m050-anchor-counter-001",
  "m050-anchor-counter-002",
  "m050-anchor-counter-003",
  "m050-anchor-counter-004",
];

for (const variant of [
  { id: "control", name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "alias-a", name: "COD_m050_alias_a", warriors: ["build/chimera-anchor-alias/alias_a_a", "build/final/ChimeraB"] },
]) {
  const experimentId = `m050-${variant.id}-anchor-counter`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 50;
  config.threads = 4;
  config.seeds = seeds;
  config.cohorts = cohorts;
  config.candidate = { name: variant.name, warriors: variant.warriors };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log("generated paired official anchor-counter configs");
