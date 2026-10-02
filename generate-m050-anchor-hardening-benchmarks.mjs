import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const all = JSON.parse(fs.readFileSync(path.join(root, "config-2025-all-template.json"), "utf8"));
const counter = JSON.parse(fs.readFileSync(path.join(root, "config-m050-control-anchor-counter.json"), "utf8"));

const variants = [
  { id: "control", name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "alias_zero", name: "COD_m050_alias_zero", warriors: ["build/chimera-anchor-hardening/alias_zero_a", "build/final/ChimeraB"] },
  { id: "alias_repeat", name: "COD_m050_alias_repeat", warriors: ["build/chimera-anchor-hardening/alias_repeat_a", "build/final/ChimeraB"] },
  { id: "disp0_zero", name: "COD_m050_disp0_zero", warriors: ["build/chimera-anchor-hardening/disp0_zero_a", "build/final/ChimeraB"] },
  { id: "dual_main_new", name: "COD_m050_dual_main_new", warriors: ["build/chimera-dual-anchor/dual_main_new_a", "build/final/ChimeraB"] },
  { id: "dual_captured_new", name: "COD_m050_dual_captured_new", warriors: ["build/chimera-dual-anchor/dual_captured_new_a", "build/final/ChimeraB"] },
  { id: "bp_exact", name: "COD_m050_bp_exact", warriors: ["build/chimera-bp-anchor/bp_exact_a", "build/final/ChimeraB"] },
  { id: "bp_common_3800", name: "COD_m050_bp_common_3800", warriors: ["build/chimera-bp-anchor/bp_common_3800_a", "build/final/ChimeraB"] },
  { id: "bp_common_3c00", name: "COD_m050_bp_common_3c00", warriors: ["build/chimera-bp-anchor/bp_common_3c00_a", "build/final/ChimeraB"] },
  { id: "alias_padded", name: "COD_m050_alias_padded", warriors: ["build/chimera-padded-alias/alias_padded_a", "build/final/ChimeraB"] },
  { id: "old_padded", name: "COD_m050_old_padded", warriors: ["build/chimera-padded-alias/old_padded_a", "build/final/ChimeraB"] },
  { id: "alias_simple", name: "COD_m050_alias_simple", warriors: ["build/chimera-anchor-alias/alias_a_a", "build/final/ChimeraB"] },
  { id: "lean_captured_branch", name: "COD_m050_lean_captured_branch", warriors: ["build/chimera-lean-split/lean_captured_branch_a", "build/final/ChimeraB"] },
  { id: "lean_captured_xor", name: "COD_m050_lean_captured_xor", warriors: ["build/chimera-lean-split/lean_captured_xor_a", "build/final/ChimeraB"] },
  { id: "lean_main_xor", name: "COD_m050_lean_main_xor", warriors: ["build/chimera-lean-split/lean_main_xor_a", "build/final/ChimeraB"] },
  { id: "alias_hls_counter", name: "COD_m050_alias_hls_counter", warriors: ["build/chimera-alias-hls-counter/alias_hls_counter_a", "build/final/ChimeraB"] },
  { id: "split_counters", name: "COD_m050_split_counters", warriors: ["build/chimera-split-counters/split_counters_a", "build/chimera-split-counters/split_counters_b"] },
  { id: "common_nop_rep", name: "COD_m050_common_nop_rep", warriors: ["build/chimera-common-counter/common_nop_rep_a", "build/final/ChimeraB"] },
  { id: "common_bp_nop", name: "COD_m050_common_bp_nop", warriors: ["build/chimera-common-counter/common_bp_nop_a", "build/final/ChimeraB"] },
  { id: "common_movax", name: "COD_m050_common_movax", warriors: ["build/chimera-common-counter/common_movax_a", "build/final/ChimeraB"] },
  { id: "main_counter_a", name: "COD_m050_main_counter_a", warriors: ["build/chimera-main-hls-counter/main_counter_a_a", "build/chimera-main-hls-counter/main_counter_a_b"] },
  { id: "main_counter_b", name: "COD_m050_main_counter_b", warriors: ["build/chimera-main-hls-counter/main_counter_b_a", "build/chimera-main-hls-counter/main_counter_b_b"] },
];

for (const variant of variants) {
  const experimentId = `m050-hard-${variant.id}-targeted`;
  const config = structuredClone(all);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 50;
  config.seeds = ["m050-hard-001", "m050-hard-002", "m050-hard-003", "m050-hard-004"];
  config.candidate = { name: variant.name, warriors: variant.warriors };
  config.cohorts = [
    structuredClone(all.cohorts.find((cohort) => cohort.id === "all-v1-18")),
    ...structuredClone(counter.cohorts),
  ];
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} paired targeted anchor-hardening configs`);
